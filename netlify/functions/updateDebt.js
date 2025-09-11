const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_DB_URL, ssl: { rejectUnauthorized: false } });

exports.handler = async (event) => {
  try {
    const { code, newDebtChange } = JSON.parse(event.body);
    const res = await pool.query('SELECT debt FROM user_accounts WHERE code=$1', [code]);
    if (res.rows.length === 0) return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };

    let newDebt = Number(res.rows[0].debt) + Number(newDebtChange);
    await pool.query('UPDATE user_accounts SET debt=$1 WHERE code=$2', [newDebt, code]);

    return { statusCode: 200, body: JSON.stringify({ debt: newDebt }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
