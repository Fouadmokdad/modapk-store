import { runTests } from "../src/lib/importers/__tests__/importer.test";

async function main() {
  try {
    await runTests();
  } catch (err: any) {
    console.error("❌ Test execution failed:", err.message || err);
    process.exit(1);
  }
}

main();
