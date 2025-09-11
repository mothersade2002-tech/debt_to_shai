const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl: { rejectUnauthorized: false } });

exports.handler = async () => {
  try {
    const result = await pool.query('SELECT code, debt, email FROM user_accounts ORDER BY debt DESC LIMIT 20');
    return { statusCode: 200, body: JSON.stringify(result.rows) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
