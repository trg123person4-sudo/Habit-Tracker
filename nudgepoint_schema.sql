-- =========================================================================
-- NUDGEPOINT — CLASSROOM PULSE & COMPREHENSION RADAR
-- Dedicated PostgreSQL / Supabase Database Schema
-- =========================================================================

-- 1. Lecture Rooms (Created by authenticated teachers)
CREATE TABLE IF NOT EXISTS np_rooms (
  id TEXT PRIMARY KEY,                       -- e.g. 'CALC'
  title TEXT NOT NULL,                      -- e.g. 'MATH 201: Multivariable Calculus'
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_pin TEXT NOT NULL,                -- 4-digit or alphanumeric passkey (e.g. '8492')
  active_topic TEXT DEFAULT '1. Introduction',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Lecture Milestones / Topics
CREATE TABLE IF NOT EXISTS np_milestones (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES np_rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  timestamp_offset TEXT NOT NULL,           -- e.g. '07:15'
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Student Friction Pulses (Anonymous telemetry stream)
CREATE TABLE IF NOT EXISTS np_pulses (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES np_rooms(id) ON DELETE CASCADE,
  student_hash TEXT NOT NULL,               -- Ephemeral anonymous client token hash
  tag TEXT NOT NULL,                        -- 'step', 'pace', 'example', 'notation', 'unclear'
  topic TEXT,
  timestamp BIGINT NOT NULL,                -- Milliseconds since epoch
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Micro-Backchannel Questions
CREATE TABLE IF NOT EXISTS np_questions (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES np_rooms(id) ON DELETE CASCADE,
  student_hash TEXT NOT NULL,
  text TEXT NOT NULL CHECK (char_length(text) <= 120),
  upvotes INT DEFAULT 0,
  projected BOOLEAN DEFAULT FALSE,
  answered BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL
);

-- 5. Pedagogical Bridge Interventions (Logged by teacher)
CREATE TABLE IF NOT EXISTS np_interventions (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES np_rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT,
  timestamp BIGINT NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_np_pulses_room_time ON np_pulses(room_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_np_questions_room ON np_questions(room_id);
CREATE INDEX IF NOT EXISTS idx_np_milestones_room ON np_milestones(room_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE np_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE np_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE np_pulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE np_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE np_interventions ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- SECURE ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- 1. Rooms: Anyone can view active rooms; only owner teacher can update/delete
CREATE POLICY "Public read active rooms" ON np_rooms
  FOR SELECT TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY "Teachers can manage their own rooms" ON np_rooms
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- 2. Pulses: Anonymous students can INSERT their own pulses; teacher can read all pulses in their room
CREATE POLICY "Anonymous pulse emission" ON np_pulses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Read pulses in room" ON np_pulses
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Resolve own pulse" ON np_pulses
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (resolved = TRUE);

-- 3. Questions: Anonymous students can insert and upvote; teachers can project
CREATE POLICY "Read questions in room" ON np_questions
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Submit question" ON np_questions
  FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(text) > 0 AND char_length(text) <= 120);

CREATE POLICY "Upvote question" ON np_questions
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Interventions: Only teacher can insert/manage interventions
CREATE POLICY "Read interventions" ON np_interventions
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Teachers record interventions" ON np_interventions
  FOR INSERT TO authenticated
  WITH CHECK (
    room_id IN (SELECT id FROM np_rooms WHERE teacher_id = auth.uid())
  );
