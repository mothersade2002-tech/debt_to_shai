import { Client } from "pg";

export async function handler(event){
  if(event.httpMethod !== 'POST') return { statusCode:405, body:'Method Not Allowed' };
  const { code, proof_filename, proof_size } = JSON.parse(event.body || '{}');
  if(!code) return { statusCode:400, body: JSON.stringify({ error:'Missing code' }) };
  if(!proof_filename || !proof_size) return { statusCode:400, body: JSON.stringify({ error:'Missing proof' }) };
  if(proof_size > 100*1024*1024) return { statusCode:400, body: JSON.stringify({ error:'File too large' }) };

  const client = new Client({ connectionString: process.env.NEON_DB_URL, ssl:{ rejectUnauthorized:false } });
  try{
    await client.connect();
    const uRes = await client.query(`SELECT currenttask, hastask FROM user_accounts WHERE code=$1`, [code]);
    if(uRes.rows.length === 0){ await client.end(); return { statusCode:404, body: JSON.stringify({ error:'User not found' }) }; }
    const user = uRes.rows[0];
    if(!user.hastask || !user.currenttask){ await client.end(); return { statusCode:400, body: JSON.stringify({ error:'No active task' }) }; }

    const tRes = await client.query(`SELECT reward FROM tasks WHERE id=$1`, [user.currenttask]);
    const reward = (tRes.rows[0] && Number(tRes.rows[0].reward||0)) || 0;

    const ut = await client.query(`SELECT id FROM user_tasks WHERE user_code=$1 AND task_id=$2 AND completedat IS NULL ORDER BY assignedat DESC LIMIT 1`, [code, user.currenttask]);
    if(ut.rows.length > 0){
      const utid = ut.rows[0].id;
      await client.query(`UPDATE user_tasks SET completedat=now(), proof_filename=$1, proof_size=$2, reward=$3 WHERE id=$4`, [proof_filename, proof_size, reward, utid]);
    } else {
      await client.query(`INSERT INTO user_tasks (user_code, task_id, assignedat, completedat, proof_filename, proof_size, reward) VALUES ($1,$2,now(),now(),$3,$4,$5)`, [code, user.currenttask, proof_filename, proof_size, reward]);
    }

    await client.query(`UPDATE user_accounts SET debt = debt - $1, currenttask = NULL, hastask=false WHERE code=$2`, [reward, code]);

    const newD = await client.query(`SELECT debt FROM user_accounts WHERE code=$1`, [code]);
    const newDebt = newD.rows[0] ? Number(newD.rows[0].debt||0) : null;

    await client.end();
    return { statusCode:200, body: JSON.stringify({ success:true, newDebt }) };
  }catch(err){
    console.error('DB error submitTask', err);
    try{ await client.end(); }catch(e){}
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}

