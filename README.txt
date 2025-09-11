Files included:
- index.html, create.html, signin.html, confirm.html, account.html, leaderboard.html
- style.css, account.js
- netlify/functions/*.js (serverless functions)
- migration.sql (run in Neon to update schema)
- package.json (declares pg dependency)

Install & deploy:
- Add files to git repo. Ensure package.json in root.
- Set NEON_DB_URL in Netlify env vars.
- Run migration.sql in Neon to update schema.
- Deploy to Netlify; Netlify will install dependencies and serve functions.
