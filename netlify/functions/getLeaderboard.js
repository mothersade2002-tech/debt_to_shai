const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
exports.handler = async () => {
  try{
    const r = await pool.query('SELECT code,debt,title FROM user_accounts ORDER BY debt DESC LIMIT 50');
    return { statusCode:200, body: JSON.stringify(r.rows) };
  }catch(err){ console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};