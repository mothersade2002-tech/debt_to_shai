
// taskHandlers.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function getUser(req, res) {
  const code = req.params?.code || req.query?.code;
  if (!code) return res.status(400).json({ error: "Missing code" });

  try {
    const result = await pool.query("SELECT * FROM user_accounts WHERE code = $1", [code]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
}

async function submitTask(req, res) {
  const { code, taskId } = req.body;
  if (!code || !taskId) return res.status(400).json({ error: "Missing fields" });

  try {
    await pool.query(
      "UPDATE tasks SET completed = true WHERE id = $1 AND user_code = $2",
      [taskId, code]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
}

module.exports = { getUser, submitTask };
