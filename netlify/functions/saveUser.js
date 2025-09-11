const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });

exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return { statusCode:405, body: 'method not allowed' };
  try{
    const p = JSON.parse(event.body || '{}');
    const { email, code, height, weight, age, fantasy, devotion, money, createdAt, debt } = p;
    await pool.query(`INSERT INTO user_accounts (email, code, height, weight, createdat, debt, title) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (code) DO UPDATE SET email=$1, height=$3, weight=$4, createdat=$5, debt=$6`, [email, code, height, weight, createdAt, debt, 'worm']);
    const r1 = await pool.query('SELECT id FROM tasks WHERE code=$1 AND task_name=$2', [code, 'apply to serve']);
    if(r1.rowCount === 0) await pool.query('INSERT INTO tasks (code, task_name) VALUES ($1,$2)', [code, 'apply to serve']);
    const r2 = await pool.query('SELECT id FROM tasks WHERE code=$1 AND task_name=$2', [code, 'send initial tribute']);
    if(r2.rowCount === 0) await pool.query('INSERT INTO tasks (code, task_name) VALUES ($1,$2)', [code, 'send initial tribute']);
    return { statusCode:200, body: JSON.stringify({ success:true, code }) };
  }catch(err){ console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};