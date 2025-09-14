const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, code, debt } = body;

    if (!email || !code) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing fields" }) };
    }

    const result = await pool.query(
      "INSERT INTO user_accounts (email, code, debt) VALUES ($1, $2, $3) RETURNING *",
      [email, code, debt || 0]
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0])
    };
  } catch (err) {
    console.error("SaveUser Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error", details: err.message })
    };
  }
};
