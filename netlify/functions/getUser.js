import { Client } from "pg";

/**
 * GET ?code=123456
 * increments login count, assigns task on second login if needed
 */
export async function handler(event){
  const code = event.queryStringParameters?.code;
  if(!code) return { statusCode:400, body: JSON.stringify({ error:'Missing code' }) };

  const client = new Client({ connectionString: process.env.NEON_DB_URL, ssl: { rejectUnauthorized:false } });
  try{
    await client.connect();
    const uRes = await client.query(`SELECT code, height, weight, money, email, createdat, lastlogin, logincount, currenttask, hastask, debt, level, title FROM user_accounts WHERE code=$1`, [code]);
    if(uRes.rows.length === 0){ await client.end(); return { statusCode:404, body: JSON.stringify({ error:'Not found' }) }; }
    let user = uRes.rows[0];

    // increment login & set lastlogin
    await client.query(`UPDATE user_accounts SET logincount = logincount + 1, lastlogin = now() WHERE code=$1`, [code]);
    const up = await client.query(`SELECT code, height, weight, money, email, createdat, lastlogin, logincount, currenttask, hastask, debt, level, title FROM user_accounts WHERE code=$1`, [code]);
    user = up.rows[0];

    // if second login and no task, assign randomly
    if((user.logincount >= 2) && (!user.hastask)){
      const t = await client.query(`SELECT id, description, reward FROM tasks ORDER BY random() LIMIT 1`);
      if(t.rows.length > 0){
        const task = t.rows[0];
        await client.query(`UPDATE user_accounts SET currenttask=$1, hastask=true WHERE code=$2`, [task.id, code]);
        await client.query(`INSERT INTO user_tasks (user_code, task_id, assignedat, reward) VALUES ($1,$2,now(),$3)`, [code, task.id, task.reward]);
        user.currenttask = task.id; user.hastask = true;
      }
    }

    // read task desc
    let currenttaskdesc = null; let currenttaskreward = 0;
    if(user.currenttask){
      const t2 = await client.query(`SELECT id, description, reward FROM tasks WHERE id=$1`, [user.currenttask]);
      if(t2.rows.length>0){ currenttaskdesc = t2.rows[0].description; currenttaskreward = Number(t2.rows[0].reward||0); }
    }

    await client.end();

    return {
      statusCode:200,
      body: JSON.stringify({
        code: user.code,
        height: Number(user.height||0),
        weight: Number(user.weight||0),
        money: Number(user.money||0),
        email: user.email||null,
        createdat: user.createdat,
        lastlogin: user.lastlogin,
        logincount: user.logincount,
        currenttask: user.currenttask,
        currenttaskdesc,
        currenttaskreward,
        hastask: user.hastask,
        debt: Number(user.debt||0),
        level: user.level || 1,
        title: user.title || 'worm'
      })
    };

  }catch(err){
    console.error('DB error getUser', err);
    try{ await client.end(); }catch(e){}
    return { statusCode:500, body: JSON.stringify({ error: err.message }) };
  }
}
