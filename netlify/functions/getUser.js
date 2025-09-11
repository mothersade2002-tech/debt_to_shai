const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl: { rejectUnauthorized: false } });

exports.handler = async (event) => {
  try {
    const code = event.queryStringParameters.code;
    const result = await pool.query('SELECT * FROM user_accounts WHERE code = $1', [code]);
    if (result.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
    }
    return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
