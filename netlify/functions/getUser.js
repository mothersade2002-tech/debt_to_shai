import { Client } from "pg";

export async function handler(event) {
  const code = event.queryStringParameters.code;

  console.log("ENV NETLIFY_DATABASE_URL_UNPOOLED exists?", !!process.env.NEON_DB_URL);

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to database ✅");

    const result = await client.query(
      "SELECT * FROM user_accounts WHERE code = $1",
      [code]
    );

    await client.end();

    if (result.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Code not found" }) };
    }

    return { statusCode: 200, body: JSON.stringify(result.rows[0]) };

  } catch (err) {
    console.error("Database error ❌", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
