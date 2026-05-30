import { fetchAppFromPlayStore } from "../src/lib/playstore";

async function main() {
  const packageName = "com.p1.chompsms";
  console.log(`Running fetchAppFromPlayStore for ${packageName}...`);
  try {
    const data = await fetchAppFromPlayStore(packageName);
    console.log("SUCCESS!");
    console.log(`App Title: "${data.title}"`);
    console.log(`Extracted Size: "${data.size}"`);
    console.log(`Version: "${data.version}"`);
  } catch (err: any) {
    console.error("fetchAppFromPlayStore failed:", err.message || err);
  }
}

main();
