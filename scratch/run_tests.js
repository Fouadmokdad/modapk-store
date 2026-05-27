require("ts-node").register({
  compilerOptions: {
    module: "commonjs"
  }
});

// Configure dotenv if .env exists
require("dotenv").config();

// Resolve paths using tsconfig-paths if needed, or require directly
const { runTests } = require("../src/lib/importers/__tests__/importer.test");

async function main() {
  try {
    await runTests();
  } catch (err) {
    console.error("❌ Test run failed:", err);
    process.exit(1);
  }
}

main();
