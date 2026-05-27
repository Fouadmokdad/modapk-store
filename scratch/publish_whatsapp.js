const pg = require("pg");

async function main() {
  const pool = new pg.Pool({
    connectionString: "postgresql://modapk_admin:modapk_secret_2024@localhost:5432/modapk_store?schema=public",
  });
  
  const client = await pool.connect();
  try {
    const res = await client.query("UPDATE apps SET status = 'PUBLISHED' WHERE slug = 'whatsapp-messenger'");
    console.log("=== PUBLISHED WHATSAPP ===");
    console.log(res);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
