import { Client } from "pg";

export async function handler(event) {
  const code = event.queryStringParameters.code;

  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
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
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

