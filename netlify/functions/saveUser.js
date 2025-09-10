import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { height, weight, money, email, code, createdAt, debt } = JSON.parse(event.body || "{}");

  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query(
      "INSERT INTO user_accounts (code, height, weight, money, email, createdAt, debt, hasTask) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [code, height, weight, money, email, createdAt, debt, false]
    );
    await client.end();
    return { statusCode: 200, body: JSON.stringify({ message: "Saved", code }) };
  } catch (err) {
    console.error("Database error ❌", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
