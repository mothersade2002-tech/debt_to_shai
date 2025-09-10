import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { code, newDebt } = JSON.parse(event.body || "{}");

  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query("UPDATE user_accounts SET debt=$1 WHERE code=$2", [newDebt, code]);
    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true, newDebt }) };
  } catch (err) {
    console.error("DB Error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
