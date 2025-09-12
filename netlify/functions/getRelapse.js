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
    const code = event.queryStringParameters?.code;
    if(!code) return { statusCode:400, headers: corsHeaders(), body: JSON.stringify({ error:'missing code' }) };
    const pool = getPool();
    const r = await pool.query('SELECT id,note,amount,platform,approved,createdat FROM relapses WHERE code=$1 ORDER BY createdat DESC',[code]);
    return { statusCode:200, headers: corsHeaders(), body: JSON.stringify(r.rows) };
  }catch(err){
    console.error(err);
    return { statusCode:500, headers: corsHeaders(), body: JSON.stringify({ error: err.message }) };
  }
};
