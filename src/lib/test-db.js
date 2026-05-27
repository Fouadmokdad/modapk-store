const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

// Parse .env manually
const dotenv = fs.readFileSync('.env', 'utf8');
dotenv.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    const key = parts[0].trim();
    const val = parts[1].trim().replace(/^\"|\"$/g, '');
    process.env[key] = val;
  }
});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.admin.findMany()
  .then(res => {
    console.log('SUCCESS:');
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
  });
