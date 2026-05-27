// =============================================================================
// SEO Module — AI SEO Content Generator Engine
// =============================================================================
import { slugify } from "../utils";

export interface SEOInputData {
  title: { en: string; ar?: string };
  versionName: string;
  developer: string;
  category: string;
  modFeatures: string[];
  packageName: string;
  type: "APP" | "GAME";
}

export interface SEOGeneratedPayload {
  title: { en: string; ar: string };
  shortDescription: { en: string; ar: string };
  description: { en: string; ar: string };
  seoTitle: { en: string; ar: string };
  metaDescription: { en: string; ar: string };
  tags: string[];
}

/**
 * Automates bilingual high-converting description files, safety notices, Installation steps,
 * and FAQ grids tailored for search bots and human conversions.
 */
export function generateAISeoContent(app: SEOInputData): SEOGeneratedPayload {
  const tEn = app.title.en || "App";
  const tAr = app.title.ar || `${tEn} مهكر`;
  const ver = app.versionName || "v1.0";
  const dev = app.developer || "Android Developer";
  const cat = app.category || "Utility";
  const pkg = app.packageName || "com.android.app";
  const typeLabel = app.type === "GAME" ? "game" : "app";
  const typeLabelAr = app.type === "GAME" ? "لعبة" : "تطبيق";

  const modFeatJoined = app.modFeatures.length > 0 
    ? app.modFeatures.join(", ") 
    : "Premium Unlocked, Unlimited Money, Ad-Free";

  const modFeatJoinedAr = app.modFeatures.length > 0 
    ? app.modFeatures.join(" - ") 
    : "ميزات بريميوم مفتوحة، أموال غير محدودة، بدون إعلانات";

  // ----------------------------------------------------
  // English Content Sections
  // ----------------------------------------------------
  const shortDescEn = `Download ${tEn} MOD APK ${ver} for Android. Enjoy full access to premium attributes, including ${modFeatJoined} with safe, direct link mirrors.`;
  
  const articleContentEn = `### Description of ${tEn} Pro MOD APK
  
**${tEn}** is a popular Android **${typeLabel}** in the **${cat}** category created by **${dev}**. The app provides optimized layouts and high-tier capabilities that usually require expensive sub-tier models. By installing our modified APK file, you get immediate access to all features for free.

---

### Unlocked MOD Features:
${app.modFeatures.length > 0 
  ? app.modFeatures.map(f => `- **${f}:** Enjoy unrestricted activation.`).join("\n") 
  : `- **✨ VIP Access Unlocked:** All store features opened.\n- **🚫 Ads Removed:** Smooth ad-free navigation.\n- **⚡ High Performance:** Extra core speed adjustments.`
}

---

### Step-by-Step Installation Guide:
1. **Remove Old Version:** Uninstall any official version of ${tEn} on your Android device.
2. **Allow Unknown Sources:** Go to Settings > Security > Enable "Unknown Sources".
3. **Download APK File:** Get the verified package coordinates from our mirrors below.
4. **Install and Launch:** Locate the downloaded package and tap to install it. Enjoy the mod!

---

### Frequently Asked Questions (FAQs):
* **Is this ${tEn} MOD file safe?**  
  Yes, all uploads are verified and scanned for malware prior to deployment.
* **Will this mod get my account banned?**  
  Our mods feature anti-ban patches to secure device sessions.
* **Does this mod require root access?**  
  No, you can install this mod on standard, non-rooted devices.

---

### Safety Disclaimer:
*This modified version is created for education and backup purposes. We are not associated with ${dev}. Support developer efforts by purchasing original licenses.*`;

  // ----------------------------------------------------
  // Arabic Content Sections
  // ----------------------------------------------------
  const shortDescAr = `تحميل ${tAr} MOD APK ${ver} مهكر للأندرويد بروابط سريعة وآمنة. استمتع بكافة الخصائص المدفوعة مفتوحة بالكامل: ${modFeatJoinedAr} وبدون إعلانات.`;

  const articleContentAr = `### وصف تطبيق ${tAr} مهكر للأندرويد

تعتبر **${tAr}** واحدة من أشهر الـ **${typeLabelAr}** في قسم **${cat}**، من تطوير المطور الشهير **${dev}**. تقدم النسخة الأصلية تجربة متكاملة ولكنها تفرض قيوداً تتطلب اشتراكات مدفوعة. من خلال هذا التعديل الاحترافي (MOD APK)، أصبح بإمكانك استخدام كافة الميزات مجاناً وبكل سهولة.

---

### خصائص ومميزات التهكير:
${app.modFeatures.length > 0 
  ? app.modFeatures.map(f => `- **${f}:** تفعيل كامل وحصري للميزات.`).join("\n")
  : `- **✨ فتح عضوية VIP بالكامل:** جميع الأدوات المدفوعة مفتوحة مجاناً.\n- **🚫 بدون إعلانات نهائياً:** تصفح نظيف وخالي من النوافذ المنبثقة المزعجة.\n- **⚡ سرعة وأداء مستقر:** تم تعديل الكود ليعمل بسلاسة فائقة.`
}

---

### طريقة التثبيت والتشغيل:
1. **حذف النسخة السابقة:** قم بإلغاء تثبيت النسخة الرسمية من جهازك.
2. **تفعيل مصادر غير معروفة:** توجه إلى الإعدادات > الأمان > فعل خيار "تثبيت من مصادر مجهولة".
3. **تحميل الملف:** قم بتحميل ملف الـ APK المهكر من روابط التنزيل في الأسفل.
4. **التثبيت:** انقر على الملف المحمل واضغط تثبيت ثم ابدأ الاستمتاع بالخصائص مفتوحة مجاناً.

---

### الأسئلة الشائعة (FAQs):
* **هل ملف الـ APK المهكر آمن لجهازي؟**  
  بالتأكيد، يتم فحص وتجربة جميع الملفات بدقة للتأكد من خلوها من أي برمجيات خبيثة.
* **هل أحتاج لعمل روت (Root) لجهازي؟**  
  لا، النسخة المهكرة تعمل بشكل ممتاز على الهواتف العادية دون الحاجة لصلاحيات الروت.
* **هل يدعم التحديثات التلقائية؟**  
  لا، يجب عليك تحميل التحديثات يدوياً من موقعنا عند صدور إصدارات جديدة.

---

### إخلاء المسؤولية القانونية:
*هذه النسخة المعدلة مخصصة لأغراض الحفظ والتعليم فقط. موقعنا غير مسؤول عن أي سوء استخدام للملفات. ندعم المطورين الأصليين وننصح بشراء النسخ الأصلية.*`;

  // ----------------------------------------------------
  // Metadata Generation
  // ----------------------------------------------------
  const seoTitleEn = `${tEn} MOD APK ${ver} (${app.modFeatures[0] || "Premium Unlocked"}) Download`;
  const seoTitleAr = `تحميل ${tAr} مهكر بأحدث إصدار للأندرويد ${ver} برابط مباشر`;

  const metaDescEn = `Download ${tEn} MOD APK ${ver} for Android device. Enjoy ${modFeatJoined} for free. 100% safe, verified download mirrors.`;
  const metaDescAr = `تحميل ${tAr} مهكر ${ver} للأندرويد مجاناً. الميزات المغلقة مفتوحة بالكامل بدون إعلانات مع روابط فحص الحماية المباشرة.`;

  // Tags generation
  const tagList = [
    tEn.toLowerCase(),
    `${tEn.toLowerCase()}-mod`,
    `${tEn.toLowerCase()}-apk`,
    `${tEn.toLowerCase()}-${ver}`,
    slugify(cat),
    slugify(dev),
    pkg
  ];

  return {
    title: { en: `${tEn} MOD`, ar: `${tAr} مهكر` },
    shortDescription: { en: shortDescEn, ar: shortDescAr },
    description: { en: articleContentEn, ar: articleContentAr },
    seoTitle: { en: seoTitleEn, ar: seoTitleAr },
    metaDescription: { en: metaDescEn, ar: metaDescAr },
    tags: tagList
  };
}
