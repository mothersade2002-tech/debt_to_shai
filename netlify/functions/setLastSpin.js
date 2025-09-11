const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl: { rejectUnauthorized: false } });

exports.handler = async (event) => {
  try {
    const { code } = JSON.parse(event.body);
    await pool.query('UPDATE user_accounts SET lastspin=NOW() WHERE code=$1', [code]);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

