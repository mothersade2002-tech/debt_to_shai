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
  try{
    const pool = getPool();
    const r = await pool.query('SELECT code,debt,title FROM user_accounts ORDER BY debt DESC LIMIT 50');
    return { statusCode:200, headers: corsHeaders(), body: JSON.stringify(r.rows) };
  }catch(err){
    console.error(err);
    return { statusCode:500, headers: corsHeaders(), body: JSON.stringify({ error: err.message }) };
  }
};
