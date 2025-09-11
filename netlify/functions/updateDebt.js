import { Client } from "pg";

export async function handler(event){
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Method Not Allowed' };
  const { code, newDebt, newDebtChange } = JSON.parse(event.body || '{}');
  if(!code) return { statusCode:400, body:'Missing code' };

  const client = new Client({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
  try{
    await client.connect();
    if(typeof newDebtChange !== 'undefined'){
      await client.query(`UPDATE user_accounts SET debt = debt + $1 WHERE code=$2`, [newDebtChange, code]);
    } else {
      await client.query(`UPDATE user_accounts SET debt = $1 WHERE code=$2`, [newDebt, code]);
    }
    const r = await client.query(`SELECT debt FROM user_accounts WHERE code=$1`, [code]);
    await client.end();
    return { statusCode:200, body: JSON.stringify({ success:true, debt: r.rows[0].debt }) };
  }catch(err){
    console.error('DB error updateDebt', err);
    try{ await client.end(); }catch(e){}
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}
