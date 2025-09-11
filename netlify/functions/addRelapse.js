import { Client } from "pg";

export async function handler(event){
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Method Not Allowed' };
  const { code, entries } = JSON.parse(event.body || '{}');
  if(!code || !Array.isArray(entries) || entries.length === 0) return { statusCode:400, body: JSON.stringify({ error:'Invalid payload' }) };

  const client = new Client({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
  try{
    await client.connect();
    let total = 0;
    for(const e of entries){
      const note = e.note || '';
      const amount = Number(e.amount||0);
      const platform = e.platform || '';
      if(!note || !amount || !platform) continue;
      await client.query(`INSERT INTO relapse_entries (user_code, note, amount, platform) VALUES ($1,$2,$3,$4)`, [code, note, amount, platform]);
      total += amount;
    }
    if(total > 0) {
      await client.query(`UPDATE user_accounts SET debt = debt - $1 WHERE code=$2`, [total, code]);
    }
    await client.end();
    return { statusCode:200, body: JSON.stringify({ success:true, reduced: total }) };
  }catch(err){
    console.error('DB error addRelapse', err);
    try{ await client.end(); }catch(e){}
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}
