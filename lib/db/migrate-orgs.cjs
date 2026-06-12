const { Pool } = require("pg");

const DATABASE_URL = "postgresql://postgres:vhcduYq58%23um%21bU@db.qdoblyedcycmtxjfwbtp.supabase.co:5432/postgres";

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("organizations table created");

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
    `);
    console.log("organization_id column added to users");

    const res = await pool.query(`SELECT id FROM organizations WHERE name = 'La Polla de la IA'`);
    if (res.rows.length === 0) {
      await pool.query(`INSERT INTO organizations (name) VALUES ('La Polla de la IA'), ('MH Autopartes')`);
      console.log("organizations seeded");
    } else {
      console.log("organizations already exist");
    }

    const orgRes = await pool.query(`SELECT id FROM organizations WHERE name = 'La Polla de la IA'`);
    if (orgRes.rows.length > 0) {
      const orgId = orgRes.rows[0].id;
      await pool.query(`UPDATE users SET organization_id = $1 WHERE organization_id IS NULL`, [orgId]);
      console.log(`all users assigned to organization ${orgId}`);
    }

    console.log("Migration complete!");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
}

run();
