import { Client } from "pg";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { code, entries } = JSON.parse(event.body || "{}");

  const client = new Client({
    connectionString: process.env.NEON_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    let total = 0;
    for (let e of entries) {
      await client.query(
        "INSERT INTO relapse_entries (user_code, note, amount, platform) VALUES ($1,$2,$3,$4)",
        [code, e.note, e.amount, e.platform]
      );
      total += e.amount;
    }

    await client.query(
      "UPDATE user_accounts SET debt = debt - $1 WHERE code=$2",
      [total, code]
    );

    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true, reduced: total }) };
  } catch (err) {
    console.error("DB Error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

