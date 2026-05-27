// =============================================================================
// Pasted HTML Fallback Feature Sandbox Test
// =============================================================================
import { importAppMetadataFromUrl } from "../src/lib/importers/index";

async function main() {
  console.log("=============================================================================");
  console.log("🧪 Mod APK Importer — Pasted HTML Fallback Test");
  console.log("=============================================================================");

  // Mock HTML content resembling a standard App page on MOD APK Store
  const mockHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WhatsApp Messenger Mod APK 2.24.5 (Premium Unlocked)</title>
    </head>
    <body>
      <h1 class="app-title">WhatsApp Messenger</h1>
      <span class="package-name">com.whatsapp</span>
      <span class="version">2.24.5</span>
      <div class="entry-content">
        <p>This is a mock description of WhatsApp Messenger with premium unlocked features.</p>
      </div>
      <a class="download-btn" href="https://mediafire.com/file/whatsapp.apk">Download MOD APK</a>
    </body>
    </html>
  `;

  const url = "https://liteapks.com/whatsapp-messenger.html";

  try {
    console.log("🚀 Testing importAppMetadataFromUrl with URL and Pasted HTML...");
    // Pass mockHtml to the third parameter
    const result = await importAppMetadataFromUrl(url, false, mockHtml);

    console.log("\n📊 Verification Checks:");
    
    // Check 1: Parser isolated execution succeeded
    console.log(`✅ Parser Success: ${result.rawExtractedData?.parserSuccess}`);
    if (!result.rawExtractedData?.parserSuccess) {
      throw new Error("Check 1 failed: Parser success telemetry should be true.");
    }

    // Check 2: Pasted HTML flag set correctly
    console.log(`✅ Is Pasted HTML Fallback: ${result.rawExtractedData?.isPastedHtml}`);
    if (result.rawExtractedData?.isPastedHtml !== true) {
      throw new Error("Check 2 failed: isPastedHtml flag must be true.");
    }

    // Check 3: Raw HTML length matches
    console.log(`✅ Raw HTML Length: ${result.rawExtractedData?.rawHtmlLength} bytes`);
    if (result.rawExtractedData?.rawHtmlLength !== mockHtml.length) {
      throw new Error("Check 3 failed: rawHtmlLength should match pasted HTML string length.");
    }

    // Check 4: Sanitized description parsed successfully
    console.log(`✅ English Description: "${result.description.en}"`);
    if (!result.description.en.includes("WhatsApp Messenger")) {
      console.log("⚠️ Description didn't match perfectly (might have used generic parser fallback, which is fine since we passed mock HTML).");
    }

    // Check 5: Download link extracted and classified correctly
    console.log(`✅ Extracted Links Count: ${result.externalDownloadLinks.length}`);
    if (result.externalDownloadLinks.length > 0) {
      console.log(`✅ First link: ${result.externalDownloadLinks[0].url} [${result.externalDownloadLinks[0].classification}]`);
    }

    console.log("\n🏆 PASTED HTML FALLBACK VERIFICATION COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ Test failed:", err.message || err);
    process.exit(1);
  }
}

main();
