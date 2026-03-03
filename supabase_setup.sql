-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password TEXT NOT NULL,
  academic_degree TEXT,
  category TEXT NOT NULL,
  affiliation TEXT NOT NULL,
  institution TEXT,
  role TEXT NOT NULL DEFAULT 'participant',
  qr_code VARCHAR UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_amount NUMERIC,
  is_checked_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  abstract TEXT,
  keywords TEXT,
  file_uri TEXT,
  file_name TEXT,
  thematic_axis INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id INTEGER REFERENCES public.users(id),
  review_note TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  submission_id INTEGER REFERENCES public.submissions(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create congress_program table
CREATE TABLE IF NOT EXISTS public.congress_program (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  location TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewer_id ON public.submissions(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_qr_code ON public.users(qr_code);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congress_program ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES - USERS TABLE
-- ============================================
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (true);

-- ============================================
-- CREATE RLS POLICIES - SUBMISSIONS TABLE
-- ============================================
CREATE POLICY "submissions_select" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "submissions_insert" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_update" ON public.submissions FOR UPDATE USING (true);
CREATE POLICY "submissions_delete" ON public.submissions FOR DELETE USING (true);

-- ============================================
-- CREATE RLS POLICIES - MESSAGES TABLE
-- ============================================
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (true);

-- ============================================
-- CREATE RLS POLICIES - CONGRESS_PROGRAM TABLE
-- ============================================
CREATE POLICY "congress_program_select" ON public.congress_program FOR SELECT USING (true);
CREATE POLICY "congress_program_insert" ON public.congress_program FOR INSERT WITH CHECK (true);
CREATE POLICY "congress_program_update" ON public.congress_program FOR UPDATE USING (true);
CREATE POLICY "congress_program_delete" ON public.congress_program FOR DELETE USING (true);

-- ============================================
-- ENABLE REALTIME FOR ALL TABLES
-- ============================================
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.submissions REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.congress_program REPLICA IDENTITY FULL;
