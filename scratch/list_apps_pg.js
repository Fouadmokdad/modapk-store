const pg = require("pg");

async function main() {
  const pool = new pg.Pool({
    connectionString: "postgresql://modapk_admin:modapk_secret_2024@localhost:5432/modapk_store?schema=public",
  });
  
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, title, slug, status FROM apps');
    console.log("=== EXISTING APPS IN DB ===");
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
