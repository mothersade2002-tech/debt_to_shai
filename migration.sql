-- Migration SQL: run in Neon
CREATE TABLE IF NOT EXISTS user_accounts (
  id SERIAL PRIMARY KEY,
  email TEXT,
  code TEXT UNIQUE,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  debt NUMERIC DEFAULT 0,
  logincount INTEGER DEFAULT 0,
  lastlogin TIMESTAMP WITH TIME ZONE,
  lastspin TIMESTAMP WITH TIME ZONE,
  spin_count INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  title TEXT DEFAULT 'Worm'
);

CREATE TABLE IF NOT EXISTS relapses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL REFERENCES user_accounts(code) ON DELETE CASCADE,
  note TEXT,
  amount NUMERIC,
  platform TEXT,
  approved BOOLEAN DEFAULT FALSE,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL REFERENCES user_accounts(code) ON DELETE CASCADE,
  task_name TEXT,
  proof_filename TEXT,
  proof_size INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_accounts_code ON user_accounts(code);
CREATE INDEX IF NOT EXISTS idx_relapses_code ON relapses(code);
CREATE INDEX IF NOT EXISTS idx_tasks_code ON tasks(code);
