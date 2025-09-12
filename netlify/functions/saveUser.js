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
  if(event.httpMethod !== 'POST') return { statusCode:405, headers: corsHeaders(), body: JSON.stringify({ error: 'method not allowed' }) };
  try{
    const p = JSON.parse(event.body || '{}');
    const { email, code, createdAt, debt, title } = p;
    if(!code) return { statusCode:400, headers: corsHeaders(), body: JSON.stringify({ error: 'missing code' }) };
    const pool = getPool();
    await pool.query(
      `INSERT INTO user_accounts (email, code, createdat, debt, title) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (code) DO UPDATE SET email=EXCLUDED.email, createdat=EXCLUDED.createdat, debt=EXCLUDED.debt, title=EXCLUDED.title`,
      [email||null, code, createdAt||new Date().toISOString(), debt||0, title||'Worm']
    );
    // ensure default tasks exist
    const defaults = ['Apply to serve','Send initial tribute'];
    for(const tname of defaults){
      const r = await pool.query('SELECT id FROM tasks WHERE code=$1 AND task_name=$2',[code,tname]);
      if(r.rowCount === 0){
        await pool.query('INSERT INTO tasks (code, task_name) VALUES ($1,$2)',[code,tname]);
      }
    }
    return { statusCode:200, headers: corsHeaders(), body: JSON.stringify({ success:true, code }) };
  }catch(err){
    console.error(err);
    return { statusCode:500, headers: corsHeaders(), body: JSON.stringify({ error: err.message }) };
  }
};
