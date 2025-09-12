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
    const { code } = JSON.parse(event.body || '{}');
    if(!code) return { statusCode:400, headers: corsHeaders(), body: JSON.stringify({ error:'missing' }) };
    const pool = getPool();
    const r = await pool.query('SELECT spin_count FROM user_accounts WHERE code=$1',[code]);
    if(r.rowCount===0) return { statusCode:404, headers: corsHeaders(), body: JSON.stringify({ error:'not found' }) };
    let sc = Number(r.rows[0].spin_count||0) + 1;
    if(sc >= 2){
      await pool.query('UPDATE user_accounts SET spin_count=0, lastspin=NOW() WHERE code=$1',[code]);
      sc = 0;
    } else {
      await pool.query('UPDATE user_accounts SET spin_count=$1 WHERE code=$2',[sc, code]);
    }
    return { statusCode:200, headers: corsHeaders(), body: JSON.stringify({ spin_count: sc }) };
  }catch(err){
    console.error(err);
    return { statusCode:500, headers: corsHeaders(), body: JSON.stringify({ error: err.message }) };
  }
};
