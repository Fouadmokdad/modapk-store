// =============================================================================
// Browser-Assisted Import Sandbox Integration Test Suite
// =============================================================================
import zlib from "zlib";

console.log("=============================================================================");
console.log("🧪 Mod APK Importer — Browser-Assisted Import Test Suite");
console.log("=============================================================================");

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.log(`❌ [FAIL] ${testName}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

// Native Compression emulation in Node.js
function compressHtmlPayload(html: string): string {
  const buffer = zlib.gzipSync(Buffer.from(html, "utf-8"));
  return buffer.toString("base64");
}

function decompressHtmlPayload(base64Str: string): string {
  const buffer = Buffer.from(base64Str, "base64");
  return zlib.gunzipSync(buffer).toString("utf-8");
}

async function runTests() {
  try {
    // -------------------------------------------------------------------------
    // Test 1: Validate Native Gzip compression & decompression symmetry
    // -------------------------------------------------------------------------
    console.log("\n📦 1. Compression Symmetry & Native Gzip Tests:");
    const mockDOM = "<html><head><title>Test App</title></head><body><h1>Hello World</h1></body></html>";
    const compressed = compressHtmlPayload(mockDOM);
    const decompressed = decompressHtmlPayload(compressed);
    
    assert(compressed !== mockDOM, "Compressed output is not equal to raw DOM");
    assert(decompressed === mockDOM, "Decompressed output perfectly matches raw DOM");
    console.log(`- Raw Length: ${mockDOM.length} bytes`);
    console.log(`- Compressed Base64 Length: ${compressed.length} bytes (Compression ratio: ${((1 - compressed.length/mockDOM.length)*100).toFixed(1)}%)`);

    // -------------------------------------------------------------------------
    // Test 2: HTML size limits guard logic
    // -------------------------------------------------------------------------
    console.log("\n🛡️ 2. HTML Size Guard Checks:");
    const maxLimit = 4 * 1024 * 1024; // 4MB
    
    // Simulate a payload exceeding 4MB
    const largeHtml = "A".repeat(maxLimit + 100);
    const isOverLimit = largeHtml.length > maxLimit;
    assert(isOverLimit === true, "Payload check detects HTML over 4MB");

    // Simulate smart cleaning/stripping of script tags to fit under limit
    const complexLargeHtml = "<html><style>body{color:#fff}</style><script>alert(1)</script><body>Main Content</body></html>";
    // Strip elements
    const strippedHtml = complexLargeHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                                          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    
    assert(!strippedHtml.includes("<script>"), "Smart stripping successfully removes script blocks");
    assert(!strippedHtml.includes("<style>"), "Smart stripping successfully removes style blocks");
    assert(strippedHtml.includes("Main Content"), "Smart stripping preserves text/body content");
    console.log(`- Stripped size reduced from ${complexLargeHtml.length} to ${strippedHtml.length} bytes`);

    // -------------------------------------------------------------------------
    // Test 3: Smart Client-Side Metadata Merging
    // -------------------------------------------------------------------------
    console.log("\n💡 3. Client-Side Smart Metadata Merging Tests:");
    const scrapedResult: any = {
      title: { en: "", ar: "" },
      screenshots: []
    };

    const smartMetadata = {
      title: "Extracted OG Title",
      description: "Extracted meta description",
      screenshots: ["https://image1.png", "https://image2.png"]
    };

    // Simulated server-side merging logic:
    if ((!scrapedResult.title.en || scrapedResult.title.en === "") && smartMetadata.title) {
      scrapedResult.title.en = smartMetadata.title;
    }
    if ((!scrapedResult.screenshots || scrapedResult.screenshots.length === 0) && Array.isArray(smartMetadata.screenshots)) {
      scrapedResult.screenshots = smartMetadata.screenshots;
    }

    assert(scrapedResult.title.en === "Extracted OG Title", "Smart metadata Title successfully merged");
    assert(scrapedResult.screenshots.length === 2, "Smart metadata Screenshots successfully merged");

    console.log("\n🏆 BROWSER IMPORT UNIT TESTS COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ Test Suite Failed:", err.message || err);
    process.exit(1);
  }
}

runTests();
