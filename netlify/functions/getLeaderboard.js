import { Client } from "pg";

export async function handler(){
  const client = new Client({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
  try{
    await client.connect();
    const res = await client.query(`SELECT code, debt, title FROM user_accounts ORDER BY debt DESC LIMIT 20`);
    await client.end();
    return { statusCode:200, body: JSON.stringify(res.rows) };
  }catch(err){
    console.error('DB error leaderboard', err);
    try{ await client.end(); }catch(e){}
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}
