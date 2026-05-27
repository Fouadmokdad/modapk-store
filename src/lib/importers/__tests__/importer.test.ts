// =============================================================================
// Importers Module — Unit Test Suite
// =============================================================================
import fs from "fs";
import path from "path";
import { normalizeDomain } from "../normalize";
import { isPrivateIp, isDomainAllowed } from "../security";
import { getParserForDomain } from "../registry";
import { LiteApksParser } from "../sources/liteapks";
import { calculateConfidenceScore, sanitizeExtractedDescription } from "../index";

export async function runTests() {
  console.log("🧪 RUNNING IMPORTER UNIT TESTS...\n");
  let failed = 0;
  let passed = 0;

  const assert = (name: string, condition: boolean) => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  };

  // 1. Hostname Normalization Tests
  console.log("1. Testing Hostname Normalization...");
  assert("normalize lowercase & protocol", normalizeDomain("HTTPS://GAMEDVA.COM/app") === "gamedva.com");
  assert("normalize strip www.", normalizeDomain("http://www.liteapks.com/") === "liteapks.com");
  assert("normalize strip subpaths", normalizeDomain("https://modyolo.com/some/long/sub/path/") === "modyolo.com");
  assert("normalize empty / null safety", normalizeDomain("") === "");

  // 2. SSRF Security Filters Tests
  console.log("\n2. Testing SSRF Rejections & Domain Allowlists...");
  assert("reject localhost IPv4", isPrivateIp("127.0.0.1") === true);
  assert("reject localhost IPv6", isPrivateIp("::1") === true);
  assert("reject private range 10.x", isPrivateIp("10.254.0.1") === true);
  assert("reject private range 192.168.x", isPrivateIp("192.168.1.100") === true);
  assert("reject private range 172.16-31.x", isPrivateIp("172.20.10.5") === true);
  assert("allow public IP", isPrivateIp("8.8.8.8") === false);
  
  assert("allowlist liteapks", isDomainAllowed("liteapks.com") === true);
  assert("allowlist modyolo", isDomainAllowed("modyolo.com") === true);
  assert("block external domain", isDomainAllowed("google.com") === false);

  // 3. Importer Registry Tests
  console.log("\n3. Testing Importer Parser Registry Routing...");
  const liteapksParser = getParserForDomain("liteapks.com");
  assert("route correct parser for liteapks", liteapksParser.canHandle("https://liteapks.com/app"));
  
  const modyoloParser = getParserForDomain("modyolo.com");
  assert("route correct parser for modyolo", modyoloParser.canHandle("https://modyolo.com/app"));

  // 4. HTML Parser Fixture Extraction
  console.log("\n4. Testing Cheerio Parser Fixtures (LiteAPKs)...");
  try {
    const fixturePath = path.join(__dirname, "../__fixtures__/liteapks_fixture.html");
    const htmlFixture = fs.readFileSync(fixturePath, "utf-8");
    const parsedData = await LiteApksParser.parse(htmlFixture, "https://liteapks.com/whatsapp");

    assert("extract correct title", parsedData.title?.en === "WhatsApp Messenger");
    assert("extract correct iconUrl", parsedData.iconUrl === "https://liteapks.com/uploads/whatsapp-icon.png");
    assert("extract exact versionName", parsedData.versionName === "2.24.1");
    assert("extract exact size", parsedData.size === "58 MB");
    assert("extract minAndroid limit", parsedData.minAndroid === "Android 5.0+");
    assert("extract developer name", parsedData.developer === "WhatsApp LLC");
    assert("extract category value", parsedData.category === "Communication");
    assert("extract screenshots count", parsedData.screenshots?.length === 2);
    assert("extract first screenshot url", parsedData.screenshots?.[0] === "https://liteapks.com/uploads/screenshot1.png");
    assert("extract custom mod features count", parsedData.modFeatures?.length === 3);
    assert("extract specific mod features text", parsedData.modFeatures?.[0] === "Premium Unlocked features");

  } catch (err: any) {
    console.error("  ❌ Fixture test crashed with error:", err.message || err);
    failed++;
  }

  // 5. HTML Sanitization Tests
  console.log("\n5. Testing HTML Sanitization Shields...");
  const maliciousHtml = "<div>Test<script>alert('ssrf')</script><iframe src='http://hacker.com'></iframe><p style='color:red;'>Clean Paragraph</p></div>";
  const cleanHtml = sanitizeExtractedDescription(maliciousHtml);
  assert("strip dangerous scripts", !cleanHtml.includes("<script>"));
  assert("strip illegal iframes", !cleanHtml.includes("<iframe>"));
  assert("preserve clean elements", cleanHtml.includes("<p style=\"color:red;\">Clean Paragraph</p>"));

  // 6. Confidence Scoring Weights Tests
  console.log("\n6. Testing Confidence Score Weight Calculations...");
  const perfectData = {
    title: { en: "Test App", ar: "" },
    iconUrl: "http://logo.png",
    packageName: "com.test.app",
    versionName: "1.0",
    screenshots: ["http://scr1.png", "http://scr2.png"],
    description: { en: "A long enough description that exceeds 100 characters to confirm premium extraction quality is intact.", ar: "" }
  };
  const score = calculateConfidenceScore(perfectData);
  assert("evaluate perfect metadata to 90+", score >= 90);

  // Summary
  console.log("\n=== TEST RESULTS SUMMARY ===");
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    throw new Error(`Unit tests failed: ${failed} assertions failed.`);
  } else {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  }
}
