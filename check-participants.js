const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkParticipants() {
  try {
    console.log("\n📊 Checking participants in database...\n");

    // Check total users
    const totalUsers = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log(`✅ Total users: ${totalUsers.rows[0].count}`);

    // Check breakdown by role
    const byRole = await pool.query(`
      SELECT role, COUNT(*) as count FROM users GROUP BY role
    `);
    console.log("\n📋 Users by role:");
    byRole.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count}`);
    });

    // Check participants by category
    const participants = await pool.query(`
      SELECT category, affiliation, COUNT(*) as count
      FROM users WHERE role = 'participant'
      GROUP BY category, affiliation
    `);
    console.log("\n👥 Participants by category/affiliation:");
    if (participants.rows.length === 0) {
      console.log("  ⚠️  NO PARTICIPANTS FOUND!");
    } else {
      participants.rows.forEach(row => {
        console.log(`  ${row.category}_${row.affiliation}: ${row.count}`);
      });
    }

    // Check total participants
    const totalParticipants = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'participant'"
    );
    console.log(`\n✅ Total participants: ${totalParticipants.rows[0].count}`);

    // Show sample participants
    const samples = await pool.query(`
      SELECT id, full_name, email, role, category, affiliation, payment_status
      FROM users WHERE role = 'participant'
      LIMIT 5
    `);
    if (samples.rows.length > 0) {
      console.log("\n📝 Sample participants:");
      samples.rows.forEach(row => {
        console.log(`  - ${row.full_name} (${row.category}_${row.affiliation}) - Payment: ${row.payment_status}`);
      });
    }

    console.log("\n✅ Done!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkParticipants();
