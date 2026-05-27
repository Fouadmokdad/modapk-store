// =============================================================================
// Importer Hardening Verification Sandbox Test Suite
// =============================================================================
import { isPrivateIp, checkRateLimit, isDomainAllowed } from "../src/lib/importers/security";
import { classifyDownloadLink, calculateConfidenceScore } from "../src/lib/importers/index";
import { ImporterProtectedSourceError } from "../src/lib/importers/types";

console.log("=============================================================================");
console.log("🧪 Mod APK Importer Hardening & Safety Sandbox Suite");
console.log("=============================================================================");

let passedTestsCount = 0;
let totalTestsCount = 0;

function assert(condition: boolean, testName: string) {
  totalTestsCount++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTestsCount++;
  } else {
    console.log(`❌ [FAIL] ${testName}`);
  }
}

// -----------------------------------------------------------------------------
// 1. SSRF Private IP Checking Tests (Hardening Requirement 1)
// -----------------------------------------------------------------------------
console.log("\n📡 1. SSRF & Private IP Validation Tests:");

// IPv4 Localhost/Loopback
assert(isPrivateIp("127.0.0.1"), "IPv4 standard localhost loopback");
assert(isPrivateIp("127.0.0.254"), "IPv4 subnet loopback 127.0.0.0/8");

// IPv4 Private Subnets
assert(isPrivateIp("10.0.0.1"), "IPv4 10.0.0.0/8 private network address");
assert(isPrivateIp("192.168.1.15"), "IPv4 192.168.0.0/16 private network address");
assert(isPrivateIp("172.16.0.1"), "IPv4 172.16.0.0/12 bottom range");
assert(isPrivateIp("172.31.255.255"), "IPv4 172.16.0.0/12 top range");
assert(isPrivateIp("100.64.0.1"), "IPv4 100.64.0.0/10 carrier-grade NAT private");
assert(!isPrivateIp("172.15.255.255"), "IPv4 public address boundary lower check");
assert(!isPrivateIp("172.32.0.1"), "IPv4 public address boundary upper check");

// IPv4 Link-Local & Broadcast/Multicast
assert(isPrivateIp("169.254.1.1"), "IPv4 Link-Local address (169.254.0.0/16)");
assert(isPrivateIp("224.0.0.1"), "IPv4 Multicast address (224.0.0.0/4)");
assert(isPrivateIp("245.0.0.1"), "IPv4 Reserved address range (240.0.0.0/4)");
assert(isPrivateIp("0.0.0.0"), "IPv4 Local identification (0.0.0.0/8)");

// IPv6 Loopback & Local addresses
assert(isPrivateIp("::1"), "IPv6 localhost loopback address (::1)");
assert(isPrivateIp("0:0:0:0:0:0:0:1"), "IPv6 fully-expanded localhost address");
assert(isPrivateIp("::"), "IPv6 unspecified address");
assert(isPrivateIp("fc00::"), "IPv6 Unique Local fc00::/7 boundary lower");
assert(isPrivateIp("fdff:ffff:ffff::"), "IPv6 Unique Local fc00::/7 boundary upper");
assert(isPrivateIp("fe80::1"), "IPv6 Link-Local fe80::/10 boundary");
assert(isPrivateIp("fec0::1"), "IPv6 Deprecated Site-Local fec0::/10 boundary");
assert(isPrivateIp("ff02::1"), "IPv6 Multicast ff00::/8 boundary");

// IPv4-mapped IPv6 Address checks
assert(isPrivateIp("::ffff:127.0.0.1"), "IPv4-mapped IPv6 loopback (::ffff:127.0.0.1)");
assert(isPrivateIp("::ffff:192.168.10.2"), "IPv4-mapped IPv6 private (::ffff:192.168.10.2)");
assert(!isPrivateIp("::ffff:8.8.8.8"), "IPv4-mapped IPv6 public DNS (::ffff:8.8.8.8)");

// Public addresses (should return false)
assert(!isPrivateIp("8.8.8.8"), "Public IPv4 Google DNS");
assert(!isPrivateIp("1.1.1.1"), "Public IPv4 Cloudflare DNS");
assert(!isPrivateIp("2606:4700:4700::1111"), "Public IPv6 Cloudflare DNS");

// -----------------------------------------------------------------------------
// 2. Protocol Validation & Domain Checks
// -----------------------------------------------------------------------------
console.log("\n🛡️ 2. Domain Allowlist & Protocol Safety Checks:");
assert(isDomainAllowed("liteapks.com"), "Allow host liteapks.com");
assert(isDomainAllowed("modyolo.com"), "Allow host modyolo.com");
assert(!isDomainAllowed("maliciousdomain.com"), "Deny untrusted scraper targets");

// -----------------------------------------------------------------------------
// 3. Link Classification Tests (Hardening Requirement 7)
// -----------------------------------------------------------------------------
console.log("\n🔗 3. Download Link Classification Tests:");
assert(classifyDownloadLink("https://liteapks.com/download") === "trusted", "Classify LiteAPKs link as trusted");
assert(classifyDownloadLink("https://mediafire.com/file/xyz/app.apk") === "mirror", "Classify MediaFire mirror link");
assert(classifyDownloadLink("https://mega.nz/#!abc") === "mirror", "Classify Mega.nz mirror link");
assert(classifyDownloadLink("https://unknownhost.com/apk") === "unknown", "Classify unverified host link");
assert(classifyDownloadLink("http://127.0.0.1/app.apk") === "suspicious", "Classify loopback download mirror as suspicious");
assert(classifyDownloadLink("javascript:alert(1)") === "suspicious", "Classify javascript: protocol as suspicious");
assert(classifyDownloadLink("file:///etc/passwd") === "suspicious", "Classify file: protocol as suspicious");

// -----------------------------------------------------------------------------
// 4. Scraper Confidence Calculation Tests (Hardening Requirement 6)
// -----------------------------------------------------------------------------
console.log("\n⭐ 4. Confidence Rating Tests:");
const richData = {
  title: { en: "WhatsApp Messenger", ar: "" },
  iconUrl: "https://example.com/icon.png",
  packageName: "com.whatsapp",
  versionName: "2.24.5",
  screenshots: ["https://example.com/s1.jpg", "https://example.com/s2.jpg"],
  description: { en: "A highly comprehensive, long description of WhatsApp messenger features that has more than three hundred characters to prove that our description quality score matches the specifications...", ar: "" }
};
const richScore = calculateConfidenceScore(richData, true);
assert(richScore >= 90, `Rich data with JSON-LD structured data rating: ${richScore}%`);

const poorData = {
  title: { en: "WhatsApp", ar: "" },
  description: { en: "Short desc", ar: "" }
};
const poorScore = calculateConfidenceScore(poorData, false);
assert(poorScore < 40, `Sparse and poor data rating: ${poorScore}% (Triggers warning lock)`);

// -----------------------------------------------------------------------------
// 5. Rate Limiter Tests (Hardening Requirement 10)
// -----------------------------------------------------------------------------
console.log("\n⏱️ 5. Administrative Rate Limiting Checks:");
const testIp = "192.168.10.50";
let allowedCount = 0;
for (let i = 0; i < 20; i++) {
  const check = checkRateLimit(testIp, 5, 5000); // 5 calls in 5 seconds window
  if (check.allowed) allowedCount++;
}
assert(allowedCount === 5, `Sliding rate limiter allows exactly 5 out of 20 rapid bursts (Count: ${allowedCount})`);

// -----------------------------------------------------------------------------
// 6. Importer Protected Source Error Tests (Protected Source Requirement 2)
// -----------------------------------------------------------------------------
console.log("\n🛡️ 6. Protected Source Custom Error Tests:");
const testErr = new ImporterProtectedSourceError(
  "liteapks.com",
  403,
  "Cloudflare ray id block detected.",
  "Check another mirror or type manually."
);
assert(testErr.sourceName === "liteapks.com", "Custom error has sourceName field");
assert(testErr.statusCode === 403, "Custom error has statusCode field");
assert(testErr.reason === "Cloudflare ray id block detected.", "Custom error has reason field");
assert(testErr.suggestion === "Check another mirror or type manually.", "Custom error has suggestion field");
assert(testErr.name === "ImporterProtectedSourceError", "Custom error name matches ImporterProtectedSourceError");

console.log("\n=============================================================================");
console.log(`📊 Test Results: ${passedTestsCount} / ${totalTestsCount} assertions PASSED`);
console.log("=============================================================================");
if (passedTestsCount === totalTestsCount) {
  console.log("🏆 IMPORTER HARDENING SECURITY TESTS COMPLETED SUCCESSFULLY");
} else {
  console.log("🚨 VERIFICATION SUITE DISCOVERED ANOMALIES. AUDITING RECOMMENDED.");
}
