import { Client } from "pg";

export async function handler(event){
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Method Not Allowed' };
  const payload = JSON.parse(event.body || '{}');
  const { height=0, weight=0, money=0, email=null, code, createdAt=null, debt=0 } = payload;
  if(!code || !/^\d{6}$/.test(code)) return { statusCode:400, body: JSON.stringify({ error:'Invalid code' }) };

  const client = new Client({ connectionString: process.env.NEON_DB_URL, ssl: { rejectUnauthorized:false } });
  try{
    await client.connect();
    const insert = `
      INSERT INTO user_accounts (code, height, weight, money, email, createdat, debt, logincount, hastask)
      VALUES ($1,$2,$3,$4,$5,$6,$7,0,false)
      ON CONFLICT (code) DO NOTHING
      RETURNING code
    `;
    const r = await client.query(insert, [code, height, weight, money, email, createdAt, debt]);
    await client.end();
    if(r.rowCount === 0) return { statusCode:409, body: JSON.stringify({ error:'Code exists' }) };
    return { statusCode:200, body: JSON.stringify({ message:'Saved', code }) };
  }catch(err){
    console.error('DB error saveUser', err);
    try{ await client.end(); }catch(e){}
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}
