const { Pool } = require('pg');
let pool;
function getPool(){
  if(!pool){
    const conn = process.env.NEON_DB_URL;
    if(!conn) throw new Error('NEON_DB_URL environment variable is required');
    pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}
function corsHeaders(){
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };
}

exports.handler = async (event) => {
  if(event.httpMethod === 'OPTIONS') return { statusCode:200, headers: corsHeaders(), body: '' };
  if(event.httpMethod !== 'POST') return { statusCode:405, headers: corsHeaders(), body: JSON.stringify({ error:'method not allowed' }) };
  try{
    const { code, newDebtChange } = JSON.parse(event.body || '{}');
    if(!code || typeof newDebtChange === 'undefined') return { statusCode:400, headers: corsHeaders(), body: JSON.stringify({ error:'missing' }) };
    const pool = getPool();
    const r = await pool.query('SELECT debt FROM user_accounts WHERE code=$1',[code]);
    if(r.rowCount===0) return { statusCode:404, headers: corsHeaders(), body: JSON.stringify({ error:'not found' }) };
    const current = Number(r.rows[0].debt||0);
    const newDebt = current + Number(newDebtChange);
    await pool.query('UPDATE user_accounts SET debt=$1 WHERE code=$2',[newDebt, code]);
    return { statusCode:200, headers: corsHeaders(), body: JSON.stringify({ debt: newDebt }) };
  }catch(err){
    console.error(err);
    return { statusCode:500, headers: corsHeaders(), body: JSON.stringify({ error: err.message }) };
  }
};
