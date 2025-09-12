const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
exports.handler = async (event) => {
  try{
    const code = event.queryStringParameters?.code;
    if(!code) return { statusCode:400, body: JSON.stringify({ error:'missing code' }) };
    const r = await pool.query('SELECT note,amount,platform,createdat FROM relapses WHERE code=$1 ORDER BY createdat DESC',[code]);
    return { statusCode:200, body: JSON.stringify(r.rows) };
  }catch(err){ console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};