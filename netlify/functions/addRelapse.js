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
    const { code, entries } = JSON.parse(event.body || '{}');
    if(!code || !Array.isArray(entries) || entries.length===0) return { statusCode:400, headers: corsHeaders(), body: JSON.stringify({ error:'invalid' }) };
    const pool = getPool();
    // enforce single pending relapse per user
    const pending = await pool.query('SELECT COUNT(*)::int as c FROM relapses WHERE code=$1 AND approved=false',[code]);
    if(pending.rows[0].c > 0){
      return { statusCode:409, headers: corsHeaders(), body: JSON.stringify({ error:'existing pending relapse. wait for approval before submitting another.' }) };
    }
    for(const e of entries){
      await pool.query('INSERT INTO relapses (code,note,amount,platform,approved,createdat) VALUES ($1,$2,$3,$4,false,NOW())',[code,e.note,e.amount,e.platform]);
    }
    return { statusCode:200, headers: corsHeaders(), body: JSON.stringify({ success:true }) };
  }catch(err){
    console.error(err);
    return { statusCode:500, headers: corsHeaders(), body: JSON.stringify({ error: err.message }) };
  }
};
