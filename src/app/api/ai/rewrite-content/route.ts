import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Simple in-memory rate limiting map
// Key: Admin Email / IP Address, Value: Timestamp of last request
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 3000; // 3 seconds cooldown between generations per admin

export async function POST(request: NextRequest) {
  try {
    // 1. Authorize Admin
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmail = session.user?.email || "unknown_admin";

    // 2. Rate Limiting Check
    const now = Date.now();
    const lastRequestTime = rateLimitMap.get(adminEmail);
    if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_COOLDOWN_MS) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please wait a few seconds between AI operations.",
        },
        { status: 429 }
      );
    }
    rateLimitMap.set(adminEmail, now);

    // 3. Parse and Validate Request Body
    const body = await request.json();
    const {
      title,
      shortDescription,
      fullDescription,
      releaseType,
      category,
      modFeatures,
      action = "rewrite", // rewrite, rewrite-short, rewrite-full, translate-ar, meta-desc
    } = body;

    // Normalize inputs, handle empty/missing values safely
    const appTitleEn = title?.en || title?.ar || "Android App";
    const appTitleAr = title?.ar || title?.en || `${appTitleEn} مهكر`;
    const relType = releaseType || "MOD";
    const catName = category || "Utility";
    const features = Array.isArray(modFeatures) ? modFeatures.filter(Boolean) : [];
    
    const currentShortEn = shortDescription?.en || "";
    const currentShortAr = shortDescription?.ar || "";
    const currentFullEn = fullDescription?.en || "";
    const currentFullAr = fullDescription?.ar || "";

    const apiKey = process.env.OPENAI_API_KEY;

    const cleanOutputString = (str: string): string => {
      if (!str) return "";
      return str
        .replace(/^```[a-zA-Z]*\n/g, "")
        .replace(/\n```$/g, "")
        .replace(/```/g, "")
        .trim();
    };

    if (apiKey) {
      // --- OPENAI INTEGRATION ---
      const prompt = `
You are a professional mobile app review editor and SEO copywriter for a premium Android store like APKPure, LiteAPKs, or APKMODY.
Your goal is to write long-form, editorial-grade, human-written content for the app/game described below.

App Context:
- Title (English): ${appTitleEn}
- Title (Arabic): ${appTitleAr}
- Category: ${catName}
- Release Type: ${relType} (ORIGINAL means official official app; MOD means modified with premium features; BETA means early access pre-release)
- MOD Features: ${features.join(", ") || "None specified"}

Current Content:
- Short Description (English): ${currentShortEn}
- Short Description (Arabic): ${currentShortAr}
- Full Description (English): ${currentFullEn}
- Full Description (Arabic): ${currentFullAr}

Requested Action: ${action}
(Available actions:
- "rewrite": Rewrite both English and Arabic versions of short and full descriptions.
- "rewrite-short": Rewrite only the short descriptions.
- "rewrite-full": Rewrite only the full descriptions.
- "translate-ar": Translate the English short/full descriptions into high-quality, professional Arabic.
- "meta-desc": Optimize or generate a SEO meta description.
)

AI WRITING & QUALITY RULES:
1. Tone & Style: Natural, engaging, premium, polished, and authoritative. Avoid robotic AI tone, keyword stuffing, repetitive "MOD APK" phrases, fake hype, or cringe marketing. It should feel like it was written by an expert technology writer.
2. Short Description:
   - Must be between 140 and 220 characters.
   - Sounds premium and SEO optimized. Focuses on core utility or gameplay (e.g. "Download WhatsApp Messenger APK for Android with fast messaging, crystal-clear calls, encrypted chats, and smooth cross-device communication.").
3. Full Description (LONG-FORM):
   - Must be between 600 and 1200 words.
   - Use headings, bullet lists, spacing, and markdown-safe formatting.
   - Do NOT generate markdown code fences (like \`\`\`markdown) or weird symbols spam inside the text values.
   - Must contain the following exact Markdown headers:
     # Introduction
     (Provide an engaging intro paragraph explaining the app/game purpose and why users seek it.)

     # Features
     (Detailed bullet features with premium formatting and real, helpful explanations.)

     ${relType === "MOD" ? `# MOD Features\n(Clearly separated section detailing the modifications like Premium Unlocked, No Ads, etc. Explain each feature professionally.)` : ""}

     # Gameplay / Usage Experience
     (A realistic explanation and immersive breakdown of playing the game or utilizing the app.)

     # Performance
     (Technical optimization and performance notes, memory footprint, battery consumption.)

     # Why Download This Version
     (Explain the benefits of this specific package naturally.)

     # Installation Guide
     (Step-by-step installation instructions.)

     # Final Verdict
     (An editorial-style conclusion and final verdict.)

4. Release Type Handling:
   - ORIGINAL: Do NOT mention hacks, mods, or cheats. Write clean official-style APK content.
   - BETA: Explicitly mention early access, experimental features, testing phase, and possible instability.
   - MOD: Focus on premium unlocked aspects, ad-free experience, and modified features.
5. Arabic Quality: Output native-sounding Arabic with proper RTL formatting. Do NOT use direct machine translation.
6. JSON Schema:
   Output strictly a single JSON object with this exact structure, with no wrapper text:
   {
     "shortDescription": {
       "en": "string",
       "ar": "string"
     },
     "fullDescription": {
       "en": "string",
       "ar": "string"
     }
   }
`;

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "You are a JSON-only generating assistant that returns app descriptions in bilingual formats.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 4000,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData?.error?.message || `OpenAI returned status ${response.status}`);
        }

        const data = await response.json();
        const contentStr = data?.choices?.[0]?.message?.content;
        const result = JSON.parse(contentStr);

        return NextResponse.json({
          success: true,
          shortDescription: {
            en: cleanOutputString(result?.shortDescription?.en || currentShortEn),
            ar: cleanOutputString(result?.shortDescription?.ar || currentShortAr),
          },
          fullDescription: {
            en: cleanOutputString(result?.fullDescription?.en || currentFullEn),
            ar: cleanOutputString(result?.fullDescription?.ar || currentFullAr),
          },
        });
      } catch (err: any) {
        console.error("OpenAI API call failed, falling back to local engine:", err);
      }
    }

    // --- HIGH-QUALITY EDITORIAL LOCAL BACKUP REWRITE ENGINE ---
    const modFeaturesListEn = features.length > 0 ? features : ["Premium Unlocked", "No Ads", "Unlimited Resources", "Anti-Ban", "Speed Boost"];
    const modFeaturesListAr = features.length > 0 ? features : ["بريميوم مفتوح", "بدون إعلانات", "موارد غير محدودة", "مقاوم للحظر", "تحسين الأداء"];

    const modFeaturesEnStr = modFeaturesListEn.join(", ");
    const modFeaturesArStr = modFeaturesListAr.join(" - ");

    let rewrittenShortEn = currentShortEn;
    let rewrittenShortAr = currentShortAr;
    let rewrittenFullEn = currentFullEn;
    let rewrittenFullAr = currentFullAr;

    // 1. Short Description Generator (140-220 characters, premium, SEO optimized)
    if (action === "rewrite" || action === "rewrite-short" || action === "meta-desc") {
      if (relType === "MOD") {
        rewrittenShortEn = `Download ${appTitleEn} MOD APK for Android to access premium unlocked features, ad-free usage, and exclusive ${modFeaturesListEn[0]} enhancements instantly.`;
        rewrittenShortAr = `تحميل ${appTitleAr} مهكر للأندرويد برابط مباشر للاستمتاع بكافة مميزات النسخة المدفوعة بدون إعلانات وبشكل مجاني بالكامل.`;
      } else if (relType === "BETA") {
        rewrittenShortEn = `Download ${appTitleEn} Beta APK for Android to test experimental updates, early access features, and upcoming options before the official release.`;
        rewrittenShortAr = `تحميل النسخة التجريبية ${appTitleAr} Beta للأندرويد لتجربة المزايا والخيارات المستقبلية قيد التطوير قبل الجميع.`;
      } else {
        rewrittenShortEn = `Download ${appTitleEn} official APK for Android with secure installation, official Play Store build parameters, and complete device safety.`;
        rewrittenShortAr = `تحميل ${appTitleAr} الأصلي للأندرويد بأحدث إصدار رسمي آمن وخالٍ من الفيروسات مباشرة من خوادم التنزيل السريعة.`;
      }
      
      // Strict character bounds check
      if (rewrittenShortEn.length > 220) rewrittenShortEn = rewrittenShortEn.substring(0, 217) + "...";
      if (rewrittenShortAr.length > 220) rewrittenShortAr = rewrittenShortAr.substring(0, 217) + "...";
    }

    // 2. Full Description Generator (600-1200 words, highly structured)
    if (action === "rewrite" || action === "rewrite-full" || action === "translate-ar") {
      const isBeta = relType === "BETA";
      const isMod = relType === "MOD";

      // English Content Generation
      const introEn = isMod
        ? `Welcome to our detailed editorial review of **${appTitleEn} Pro MOD APK**, one of the most sought-after releases in the **${catName}** segment. Developed to eliminate common subscription walls and pop-up ads, this premium modified package offers Android users direct access to all professional settings at no cost. Whether you want to customize themes, bypass background tracking, or accelerate your day-to-day productivity, this mod is designed to deliver a high-end mobile experience. We analyze its features, gameplay flow, battery impact, and layout structures to show you why it is a superior choice.`
        : isBeta
        ? `Welcome to our comprehensive review of **${appTitleEn} Beta APK**, the official early-access testing version in the **${catName}** category. Created by the official developer team, this beta release allows power users and developers to test new features, experimental APIs, and interface layouts before they roll out to the public. Because this is an active development build, it features cutting-edge features but may present occasional stability issues, making it ideal for testing purposes. We explore the new additions and technical aspects below.`
        : `Welcome to our detailed review of the official **${appTitleEn} APK** release, a benchmark utility in the **${catName}** category. Sourced directly from verified developer platforms, this unmodified package ensures 100% security, signature safety, and seamless integration with Google Play Services. For users who prioritize data safety, regular developer updates, and clean untouched operation, the official APK is the absolute standard. Read on for our comprehensive review, performance insights, and installation guide.`;

      const featuresEn = `Every major update to **${appTitleEn}** expands its functional design. Here is a professional breakdown of the core features included in this build:
- **Premium Interface Customization:** Tailor every aspect of the app's visuals, including theme accents, font scales, notification styles, and layout density.
- **High-Performance Core Engine:** Utilizes optimized native libraries to execute calculations instantly, ensuring minimal screen latency and smooth animations.
- **Advanced Telemetry Controls:** Granting you complete authority over data sharing, local database encryption, and privacy settings.
- **Multi-Device Synchronization:** Seamlessly sync your personal settings, user profiles, and active files across all registered Android devices.
- **Offline Functionality:** Continue working on essential tasks and workflows without internet connectivity, with auto-syncing once a connection is established.`;

      const modFeaturesEn = isMod
        ? `By deploying this modified package, you unlock structural adjustments designed to streamline operation and remove paywalls:
${modFeaturesListEn.map(f => `- **${f}:** Fully unlocked and optimized. Bypasses subscription checks and grants instant access to premium toolsets.\n- **Description of ${f}:** This modification restructures the application's verification routines, ensuring the selected feature operates natively without verifying online credentials.`).join("\n")}`
        : "";

      const experienceEn = isBeta
        ? `Navigating the ${appTitleEn} Beta interface offers an exciting glimpse into the platform's future. The application feels dynamic and feature-rich, highlighting the developers' new design directions. While most core functions operate with minimal friction, users may encounter minor UI glitches or API delays, which is typical for pre-release software. Feedback tools are integrated, enabling testers to report bugs directly to developers, contributing to a more stable public release.`
        : `Operating ${appTitleEn} is a smooth, user-focused experience. The interface is built around semantic clarity, ensuring that even complex workflows can be completed in a few taps. From startup to completion, animations remain fluid, options are clearly labeled, and tools perform predictably. Under daily testing scenarios, the app integrates cleanly with standard Android file handlers and notification hubs.`;

      const performanceEn = `From a technical standpoint, the developers have optimized memory layout rules. The software operates efficiently on midrange devices, consuming a minimal RAM footprint (typically under 120MB in active states). CPU usage remains low, preventing device heating during long usage. On-device battery utilization is optimized, with background threads entering low-power states immediately when the application is minimized.`;

      const whyDownloadEn = isMod
        ? `Unlike other modified packages that contain bloated code or adware, this clean release of **${appTitleEn} MOD APK** guarantees ad-free navigation, verified signature integrity, and full database access. It bypasses online licensing constraints, enabling offline premium usage securely.`
        : isBeta
        ? `Downloading the **Beta version** is highly recommended if you are eager to test new functions, examine layout changes, or require early access to specific features. It lets you participate in the active development lifecycle of ${appTitleEn}.`
        : `Choosing the **official APK** guarantees maximum security, complete compliance with Android play policies, clean background threads, and direct automated updates from Google Play. It is the safest choice for enterprise and personal utility.`;

      const guideEn = `Follow these steps to safely deploy the application:
1. **Backup Data:** Back up any local files and uninstall any previous versions of this app.
2. **Configure Settings:** Navigate to your Android device's Settings > Security and enable "Install from Unknown Sources".
3. **Download Package:** Click our verified download mirrors to retrieve the clean APK file.
4. **Initiate Installer:** Locate the file in your storage explorer, tap it, and authorize the system installation prompt.
5. **Launch App:** Open the app, set your startup preferences, and enjoy the updated environment.`;

      const verdictEn = `Ultimately, **${appTitleEn}** remains a leading solution in its class. With its robust architecture, customizable layouts, and efficient resource handling, it is an essential addition to any Android device. Depending on your needs, choose the official release for absolute safety, or the MOD package for complete feature access.`;

      rewrittenFullEn = `# Introduction
${introEn}

# Features
${featuresEn}
${isMod ? `\n# MOD Features\n${modFeaturesEn}` : ""}

# Gameplay / Usage Experience
${experienceEn}

# Performance
${performanceEn}

# Why Download This Version
${whyDownloadEn}

# Installation Guide
${guideEn}

# Final Verdict
${verdictEn}`;

      // Arabic Content Generation (Native sounding, RTL friendly, high quality)
      const introAr = isMod
        ? `مرحباً بكم في مراجعتنا المفصلة لتطبيق **${appTitleAr} مهكر (Pro MOD APK)**، أحد أكثر التطبيقات طلباً وتحميلاً في قسم **${catName}**. تم تصميم هذه النسخة المعدلة والاحترافية لتجاوز جدران الاشتراك المزعجة وإزالة الإعلانات المنبثقة بالكامل، مما يمنح مستخدمي الأندرويد وصولاً فورياً لكافة الأدوات المدفوعة مجاناً وبلا حدود. وسواء كنت تسعى لتعديل السمات المرئية، أو إيقاف أدوات التتبع في الخلفية، أو تسريع إنتاجيتك اليومية، فإن هذا التعديل يمنحك تجربة استخدام راقية ومستقرة. سنستعرض تفاصيل مميزات هذا الإصدار وهيكل عمله لنبين لك لماذا يعد الخيار الأفضل لتلبية احتياجاتك.`
        : isBeta
        ? `مرحباً بكم في مراجعتنا التقنية الشاملة لإصدار **${appTitleAr} Beta APK**، النسخة التجريبية الرسمية وذات الوصول المبكر في قسم **${catName}**. تم إعداد هذا الإصدار التجريبي بواسطة المطورين الرسميين لتمكين المستخدمين المتقدمين والمطورين من تجربة المميزات والخيارات المستقبلية والواجهات التجريبية قبل إطلاقها رسمياً للجمهور. ونظراً لأن هذا الإصدار لا يزال قيد التطوير النشط، فإنه يوفر مزايا متطورة للغاية ولكنه قد يعاني أحياناً من بعض المشاكل الطفيفة في الاستقرار، مما يجعله مثالياً للاختبار والمراجعة.`
        : `مرحباً بكم في المراجعة التفصيلية للإصدار الرسمي من تطبيق **${appTitleAr} APK**، الأداة الرائدة والمعيارية في فئة **${catName}**. تم الحصول على هذا الملف مباشرة من منصات المطور الرسمية والمعتمدة، مما يضمن أماناً بنسبة 100%، وسلامة تامة للتواقيع الرقمية، وتوافقاً كاملاً مع خدمات جوجل بلاي. للمستخدمين الذين يضعون أمان البيانات الشخصية والتحديثات الدورية الرسمية في مقدمة أولوياتهم، فإن ملف APK الرسمي يمثل المعيار الذهبي. تابعوا القراءة للتعرف على مراجعتنا الشاملة وأداء التطبيق وطريقة تثبيته.`;

      const featuresAr = `كل تحديث رئيسي لتطبيق **${appTitleAr}** يجلب معه تطوراً ملحوظاً في الخصائص التشغيلية. إليك مراجعة مهنية لأهم المزايا المتاحة في هذا الإصدار:
- **تخصيص كامل لواجهة الاستخدام:** إمكانية تعديل كافة تفاصيل المظهر بما في ذلك سمات الألوان، أحجام الخطوط، وتخطيط القوائم.
- **محرك تشغيل فائق الأداء:** يعتمد على مكتبات برمجية مخصصة لمعالجة الأوامر فورياً وضمان تنقل سلس وسريع للغاية بدون أي بطء.
- **خيارات متقدمة للخصوصية والتحكم:** تحكم كامل في البيانات المشتركة، وتشفير قواعد البيانات المحلية، وإعدادات الأمان الخاصة بك.
- **مزامنة ذكية عبر الأجهزة المتعددة:** يمكنك مزامنة إعداداتك وملفاتك الشخصية تلقائياً بين هواتف الأندرويد المختلفة المسجلة بحسابك.
- **العمل في وضع عدم الاتصال بالشبكة:** استمر في إنجاز مهامك الأساسية دون الحاجة لاتصال بالإنترنت، مع مزامنة عملك تلقائياً فور معاودة الاتصال.`;

      const modFeaturesAr = isMod
        ? `من خلال استخدام هذا الإصدار المعدل، يمكنك الاستمتاع بتعديلات هيكلية تهدف لتسهيل تشغيل التطبيق وإلغاء الرسوم:
${modFeaturesListAr.map(f => `- **${f}:** مفتوح وجاهز للاستخدام الفوري. يتيح لك الاستفادة من الخصائص الاحترافية دون قيود.\n- **وصف ميزة ${f}:** يعمل هذا التعديل على إعادة هيكلة عمليات التحقق في التطبيق، مما يسمح للخاصية المحددة بالعمل محلياً بشكل كامل دون الحاجة للاتصال بخوادم التحقق.`).join("\n")}`
        : "";

      const experienceAr = isBeta
        ? `تمنحك تجربة استخدام ${appTitleAr} Beta نظرة مشوقة على مستقبل التطبيق. تبدو الواجهة ديناميكية ومليئة بالأدوات الجديدة، مما يعكس توجهات المطورين المستقبلية في التصميم. ورغم أن معظم الوظائف الأساسية تعمل بكفاءة، قد تواجه بعض المشاكل الطفيفة أو التأخير في استجابة بعض النوافذ، وهو أمر طبيعي في النسخ التجريبية. تم تضمين أدوات إرسال التقارير لمساعدة المطورين على معالجة هذه الأخطاء قبل الإطلاق الرسمي.`
        : `تعتبر تجربة تشغيل ${appTitleAr} نموذجاً لسهولة الاستخدام والتركيز على راحة المستخدم. تم تصميم الواجهة لتوفر وضوحاً كاملاً في القوائم، مما يسمح بإنجاز أصعب المهام بلمسات معدودة. من لحظة التشغيل وحتى الإغلاق، تظل الحركات انسيابية، والخيارات واضحة، والأدوات تعمل بدقة بالغة وتوافق تام مع نظام تنبيهات الأندرويد.`;

      const performanceAr = `من الناحية التقنية، تم تحسين استخدام الذاكرة بشكل ممتاز. يعمل التطبيق بكفاءة عالية على الأجهزة المتوسطة والاقتصادية دون استهلاك مفرط للذاكرة العشوائية (غالباً أقل من 120 ميجابايت في وضع التشغيل النشط). كما يظل استهلاك المعالج منخفضاً، مما يمنع ارتفاع حرارة الهاتف أثناء الاستخدام الطويل، مع الحفاظ على بطارية الهاتف بفضل وضع الاستعداد الذكي للعمليات الخلفية.`;

      const whyDownloadAr = isMod
        ? `على عكس الملفات المعدلة الأخرى التي تحتوي على كود برمجيات إعلانية خبيثة، فإن هذا الإصدار النظيف من **${appTitleAr} مهكر** يضمن لك تصفحاً خالياً تماماً من الإعلانات المزعجة، مع سلامة تامة للملف، والقدرة على استخدام المزايا المدفوعة محلياً بأمان.`
        : isBeta
        ? `يُنصح بشدة بتحميل **النسخة التجريبية (Beta)** إذا كنت متحمساً لاختبار المزايا الجديدة قبل الجميع والمساهمة في تقديم الملاحظات للمطورين، أو إذا كنت بحاجة ماسة لاستخدام أداة جديدة قيد الاختبار حالياً.`
        : `يضمن لك اختيار **الملف الرسمي الأصلي** الحصول على أعلى مستويات الأمان والتوافق التام مع سياسات أندرويد وتلقي التحديثات الدورية المباشرة والتلقائية فور صدورها، وهو الخيار الأنسب للأعمال والاستخدام الشخصي الحساس.`;

      const guideAr = `يرجى اتباع الخطوات التالية لتثبيت التطبيق بنجاح:
1. **نسخ احتياطي للبيانات:** احفظ بياناتك الهامة وقم بإلغاء تثبيت أي نسخة سابقة من التطبيق على هاتفك.
2. **إعدادات الأمان:** انتقل إلى إعدادات الهاتف > الأمان > وقم بتفعيل خيار "تثبيت التطبيقات من مصادر غير معروفة".
3. **تحميل الملف:** اضغط على روابط التحميل الموثوقة لدينا للحصول على ملف الـ APK النظيف.
4. **تثبيت التطبيق:** افتح مدير الملفات، وابحث عن الملف الذي قمت بتحميله واضغط عليه لبدء التثبيت.
5. **تشغيل التطبيق:** افتح التطبيق، واضبط خيارات التشغيل الأولى وابدأ الاستمتاع بالتجربة المحدثة.`;

      const verdictAr = `في النهاية، يظل تطبيق **${appTitleAr}** الحل الأبرز في فئته بفضل بنيته البرمجية القوية، وخيارات التخصيص المرنة، والاستهلاك المتوازن لموارد الهاتف. اعتماداً على حاجتك، يمكنك اختيار النسخة الرسمية للأمان المطلق، أو النسخة المهكرة للاستفادة الكاملة من الخصائص الاحترافية مجاناً.`;

      rewrittenFullAr = `# Introduction
${introAr}

# Features
${featuresAr}
${isMod ? `\n# MOD Features\n${modFeaturesAr}` : ""}

# Gameplay / Usage Experience
${experienceAr}

# Performance
${performanceAr}

# Why Download This Version
${whyDownloadAr}

# Installation Guide
${guideAr}

# Final Verdict
${verdictAr}`;
    }

    if (action === "meta-desc") {
      rewrittenShortEn = `Download ${appTitleEn} ${relType} APK. ${modFeaturesEnStr}. 100% safe, verified download mirrors.`;
      rewrittenShortAr = `تحميل ${appTitleAr} ${relType === "MOD" ? "مهكر" : "الأصلي"} بأحدث إصدار. ميزات مفتوحة بالكامل بدون إعلانات مع روابط فحص الحماية المباشرة.`;
    }

    return NextResponse.json({
      success: true,
      shortDescription: {
        en: rewrittenShortEn || currentShortEn,
        ar: rewrittenShortAr || currentShortAr,
      },
      fullDescription: {
        en: rewrittenFullEn || currentFullEn,
        ar: rewrittenFullAr || currentFullAr,
      },
    });
  } catch (error) {
    console.error("AI_REWRITE_CONTENT_ERROR", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to rewrite content",
      },
      { status: 500 }
    );
  }
}
