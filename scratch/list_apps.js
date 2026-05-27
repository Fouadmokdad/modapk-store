const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const apps = await db.app.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
  });
  console.log("=== EXISTING APPS IN DB ===");
  console.log(JSON.stringify(apps, null, 2));
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
