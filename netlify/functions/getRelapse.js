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
      "SELECT note, amount, platform, createdAt FROM relapse_entries WHERE user_code=$1 ORDER BY createdAt DESC",
      [code]
    );
    await client.end();

    return { statusCode: 200, body: JSON.stringify(result.rows) };
  } catch (err) {
    console.error("DB Error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

