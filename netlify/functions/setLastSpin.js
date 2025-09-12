const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'method not allowed' };
  try{
    const { code } = JSON.parse(event.body || '{}');
    if(!code) return { statusCode:400, body: JSON.stringify({ error:'missing' }) };
    await pool.query('UPDATE user_accounts SET lastspin=NOW() WHERE code=$1',[code]);
    return { statusCode:200, body: JSON.stringify({ success:true }) };
  }catch(err){ console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};