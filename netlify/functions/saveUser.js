const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl: { rejectUnauthorized: false } });

exports.handler = async (event) => {
  try {
    const { height, weight, money, email, code, createdAt, debt } = JSON.parse(event.body);

    await pool.query(
      `INSERT INTO user_accounts (height, weight, money, email, code, createdat, debt, logincount, tasks)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8)`,
      [height, weight, money, email, code, createdAt, debt, JSON.stringify([
        { task: "Apply to serve", completed: false },
        { task: "Send tribute", completed: false }
      ])]
    );

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
