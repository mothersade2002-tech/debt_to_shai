const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl: { rejectUnauthorized: false } });

exports.handler = async (event) => {
  try {
    const { code, entries } = JSON.parse(event.body);
    for (let e of entries) {
      await pool.query(
        `INSERT INTO relapses (code, note, amount, platform, createdat) VALUES ($1,$2,$3,$4,NOW())`,
        [code, e.note, e.amount, e.platform]
      );
      await pool.query(`UPDATE user_accounts SET debt = debt - $1 WHERE code=$2`, [e.amount, code]);
    }
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
