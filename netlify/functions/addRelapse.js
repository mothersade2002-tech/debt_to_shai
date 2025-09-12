const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'method not allowed' };
  try{
    const { code, entries } = JSON.parse(event.body || '{}');
    if(!code || !Array.isArray(entries)) return { statusCode:400, body: JSON.stringify({ error:'invalid' }) };
    let total = 0;
    for(const e of entries){
      await pool.query('INSERT INTO relapses (code,note,amount,platform,createdat) VALUES ($1,$2,$3,$4,NOW())',[code,e.note,e.amount,e.platform]);
      total += Number(e.amount||0);
    }
    if(total>0) await pool.query('UPDATE user_accounts SET debt = debt - $1 WHERE code=$2',[total, code]);
    return { statusCode:200, body: JSON.stringify({ success:true, reduced: total }) };
  }catch(err){ console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};