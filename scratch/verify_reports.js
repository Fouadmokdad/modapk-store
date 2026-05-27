const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  console.log("=== STARTING REPORTS VERIFICATION PASS ===");

  // 1. Get an existing published app to test with
  const app = await db.app.findFirst({
    where: { status: "PUBLISHED" },
  });

  if (!app) {
    console.error("❌ No published apps found to test with. Run db seed first.");
    process.exit(1);
  }

  console.log(`✅ Using published app: "${app.title.en}" (ID: ${app.id})`);

  // 2. Validate a broken link report submission
  console.log("\n1. Testing BROKEN_LINK report creation...");
  const report1 = await db.report.create({
    data: {
      appId: app.id,
      type: "BROKEN_LINK",
      reporterName: "Test QA Tester",
      reporterEmail: "qa@example.com",
      message: "The primary mirror download link for this version returns a 404 error.",
    }
  });
  console.log(`✅ Created broken link report in DB! ID: ${report1.id}`);

  // 3. Validate a copyright report submission
  console.log("\n2. Testing COPYRIGHT report creation...");
  const report2 = await db.report.create({
    data: {
      appId: app.id,
      type: "COPYRIGHT",
      reporterName: "IP Owner Representative",
      reporterEmail: "ip-legal@brandowner.com",
      message: "This modded version infringes on our registered trademarks and copyright assets.",
    }
  });
  console.log(`✅ Created copyright report in DB! ID: ${report2.id}`);

  // 4. Confirm reports appear in the DB list
  console.log("\n3. Testing Reports retrieval from DB...");
  const reportsList = await db.report.findMany({
    where: { appId: app.id },
    orderBy: { createdAt: "desc" },
  });

  console.log(`✅ Retrieved ${reportsList.length} reports for app from DB!`);
  if (reportsList.length < 2) {
    throw new Error("Missing reports in database query!");
  }

  // 5. Test patching status and notes
  console.log("\n4. Testing Report Status PATCH (change to RESOLVED with notes)...");
  const updatedReport = await db.report.update({
    where: { id: report1.id },
    data: {
      status: "RESOLVED",
      adminNotes: "Investigated mirror link. Replaced link to mirror v2. Verified active.",
    },
  });

  console.log(`✅ Updated report in DB! Status: ${updatedReport.status}`);
  console.log(`✅ Admin notes saved: "${updatedReport.adminNotes}"`);

  // Clean up test reports to keep database neat
  await db.report.deleteMany({
    where: {
      id: { in: [report1.id, report2.id] },
    },
  });
  console.log("\n🧹 Cleaned up verification reports from the database.");
  console.log("=== REPORTS VERIFICATION PASS COMPLETED WITH 100% SUCCESS ===");
}

main()
  .catch((err) => {
    console.error("❌ Verification pass failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
