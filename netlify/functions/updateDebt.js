const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'method not allowed' };
  try{
    const { code, newDebtChange } = JSON.parse(event.body || '{}');
    if(!code) return { statusCode:400, body: JSON.stringify({ error:'missing code' }) };
    const r = await pool.query('SELECT debt FROM user_accounts WHERE code=$1',[code]);
    if(r.rowCount===0) return { statusCode:404, body: JSON.stringify({ error:'not found' }) };
    const newDebt = Number(r.rows[0].debt||0) + Number(newDebtChange||0);
    await pool.query('UPDATE user_accounts SET debt=$1 WHERE code=$2',[newDebt, code]);
    return { statusCode:200, body: JSON.stringify({ debt:newDebt }) };
  }catch(err){ console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};