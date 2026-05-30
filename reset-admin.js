const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');

const pool = new pg.Pool({
  connectionString: "postgresql://modapk_admin:modapk_secret_2024@localhost:5432/modapk_store?schema=public",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetAdmin() {
  try {
    const email = process.argv[2] || "fouad@modapkstore.pro";
    const password = process.argv[3] || "Admin123!";
    console.log(`Upserting admin account: ${email} with password: ${password}...`);

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
      create: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: email.split('@')[0],
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log("Successfully created/reset admin account:", {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
    });
  } catch (error) {
    console.error("Error running admin reset script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
