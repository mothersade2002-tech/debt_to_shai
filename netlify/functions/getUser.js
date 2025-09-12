const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
exports.handler = async (event) => {
  try{
    const code = event.queryStringParameters?.code;
    if(!code) return { statusCode:400, body: JSON.stringify({ error:'missing code' }) };
    const r = await pool.query('SELECT code,email,createdat,debt,lastspin,title FROM user_accounts WHERE code=$1',[code]);
    if(r.rowCount===0) return { statusCode:404, body: JSON.stringify({ error:'not found' }) };
    return { statusCode:200, body: JSON.stringify(r.rows[0]) };
  }catch(err){ console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};