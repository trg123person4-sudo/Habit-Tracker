-- =========================================================================
-- HABIT TRACKER - SUPABASE DATABASE SCHEMA
-- =========================================================================
-- Instructions:
-- 1. Create a free project at https://supabase.com
-- 2. Open the SQL Editor in your Supabase Dashboard
-- 3. Paste this entire script and click "Run"
-- 4. Copy your Project URL & Anon Key from Settings -> API and paste them
--    into the in-app "Connect Supabase" modal in Habit Tracker!
-- =========================================================================

-- 1. Key-Value Sync Store (Enables instant syncing of all existing localStorage keys)
CREATE TABLE IF NOT EXISTS app_kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Profiles / Users Table (Passwords hashed with SHA-256)
CREATE TABLE IF NOT EXISTS profiles (
  email TEXT PRIMARY KEY,
  username TEXT,
  code TEXT UNIQUE,
  password_hash TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  avatar TEXT,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2b. Public Profiles View (Exposes only safe, non-sensitive fields for leaderboard & searches)
CREATE OR REPLACE VIEW public_profiles AS
  SELECT email, username, code, is_admin, current_streak, longest_streak, avatar, updated_at
  FROM profiles;

-- 3. Habits Table
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  frequency_type TEXT DEFAULT 'everyday',
  color TEXT,
  icon TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Habit Completions (Fulfillments per day)
CREATE TABLE IF NOT EXISTS habit_completions (
  user_email TEXT NOT NULL,
  date TEXT NOT NULL,
  habit_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_email, date, habit_id)
);

-- 5. Todos / Tasks Table
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  category TEXT,
  due_date TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Journal Entries & Mood Tracking
CREATE TABLE IF NOT EXISTS journal_entries (
  user_email TEXT NOT NULL,
  date TEXT NOT NULL,
  text TEXT,
  mood TEXT,
  word_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_email, date)
);

-- 7. Focus & Pomodoro Sessions
CREATE TABLE IF NOT EXISTS timer_sessions (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  duration_seconds INT NOT NULL,
  mode TEXT,
  linked_type TEXT,
  linked_id TEXT,
  linked_name TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Multiplayer Streak Challenges (Realtime Battles)
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  habit_name TEXT,
  category TEXT,
  duration_days INT DEFAULT 7,
  creator_email TEXT NOT NULL,
  creator_username TEXT,
  creator_code TEXT,
  target_email TEXT,
  target_username TEXT,
  target_code TEXT,
  status TEXT DEFAULT 'pending',
  start_date TEXT,
  end_date TEXT,
  winner TEXT,
  completions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Badges & Achievements Table
CREATE TABLE IF NOT EXISTS user_badges (
  user_email TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_email, badge_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_email);
CREATE INDEX IF NOT EXISTS idx_completions_user ON habit_completions(user_email);
CREATE INDEX IF NOT EXISTS idx_completions_date ON habit_completions(date);
CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_email);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_email);
CREATE INDEX IF NOT EXISTS idx_challenges_creator ON challenges(creator_email);
CREATE INDEX IF NOT EXISTS idx_challenges_target ON challenges(target_email);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON profiles(current_streak DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE app_kv_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- SECURE ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- 1. Profiles: Public can read for leaderboard; users only update own profile
DROP POLICY IF EXISTS "Allow public access to profiles" ON profiles;
CREATE POLICY "Public profile read" ON profiles
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (email = (auth.jwt() ->> 'email'))
  WITH CHECK (email = (auth.jwt() ->> 'email'));

CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (email = (auth.jwt() ->> 'email'));

-- 2. Habits: Isolated to authenticated owner
DROP POLICY IF EXISTS "Allow public access to habits" ON habits;
CREATE POLICY "Users manage own habits" ON habits
  FOR ALL TO authenticated
  USING (user_email = (auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (auth.jwt() ->> 'email'));

-- 3. Habit Completions: Isolated to authenticated owner
DROP POLICY IF EXISTS "Allow public access to habit_completions" ON habit_completions;
CREATE POLICY "Users manage own habit completions" ON habit_completions
  FOR ALL TO authenticated
  USING (user_email = (auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (auth.jwt() ->> 'email'));

-- 4. Todos: Isolated to authenticated owner
DROP POLICY IF EXISTS "Allow public access to todos" ON todos;
CREATE POLICY "Users manage own todos" ON todos
  FOR ALL TO authenticated
  USING (user_email = (auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (auth.jwt() ->> 'email'));

-- 5. Journal Entries: Private intimate diaries strictly bound to owner
DROP POLICY IF EXISTS "Allow public access to journal_entries" ON journal_entries;
CREATE POLICY "Users manage own journal entries" ON journal_entries
  FOR ALL TO authenticated
  USING (user_email = (auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (auth.jwt() ->> 'email'));

-- 6. Timer Sessions: Isolated to authenticated owner
DROP POLICY IF EXISTS "Allow public access to timer_sessions" ON timer_sessions;
CREATE POLICY "Users manage own timer sessions" ON timer_sessions
  FOR ALL TO authenticated
  USING (user_email = (auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (auth.jwt() ->> 'email'));

-- 7. Challenges: Participants (creator or target) can view and update
DROP POLICY IF EXISTS "Allow public access to challenges" ON challenges;
CREATE POLICY "Participants view challenges" ON challenges
  FOR SELECT TO authenticated
  USING (
    creator_email = (auth.jwt() ->> 'email') OR 
    target_email = (auth.jwt() ->> 'email')
  );

CREATE POLICY "Creator inserts challenges" ON challenges
  FOR INSERT TO authenticated
  WITH CHECK (creator_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Participants update challenges" ON challenges
  FOR UPDATE TO authenticated
  USING (
    creator_email = (auth.jwt() ->> 'email') OR 
    target_email = (auth.jwt() ->> 'email')
  );

-- 8. User Badges: Isolated to authenticated owner
DROP POLICY IF EXISTS "Allow public access to user_badges" ON user_badges;
CREATE POLICY "Users manage own badges" ON user_badges
  FOR ALL TO authenticated
  USING (user_email = (auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (auth.jwt() ->> 'email'));

-- 9. Key-Value Store: Isolated by key prefix
DROP POLICY IF EXISTS "Allow public access to app_kv_store" ON app_kv_store;
CREATE POLICY "Users access own kv entries" ON app_kv_store
  FOR ALL TO authenticated
  USING (key LIKE '%' || (auth.jwt() ->> 'email') || '%')
  WITH CHECK (key LIKE '%' || (auth.jwt() ->> 'email') || '%');

-- Enable Realtime publication for multi-device sync
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE habit_completions;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_kv_store;
  EXCEPTION WHEN others THEN NULL;
  END;
END $$;
