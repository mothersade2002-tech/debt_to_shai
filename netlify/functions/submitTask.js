const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'method not allowed' };
  try{
    const { code, taskId, proof_filename, proof_size } = JSON.parse(event.body || '{}');
    if(!code || !taskId) return { statusCode:400, body: JSON.stringify({ error:'missing' }) };
    await pool.query('UPDATE tasks SET completed=true, proof_filename=$1, proof_size=$2 WHERE id=$3 AND code=$4',[proof_filename, proof_size, taskId, code]);
    return { statusCode:200, body: JSON.stringify({ success:true }) };
  }catch(err){ console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};