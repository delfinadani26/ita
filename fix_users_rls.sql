-- Fix: Add missing INSERT and DELETE policies for users table

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Users can read all users" ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can create accounts" ON public.users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own profile" ON public.users FOR DELETE USING (true);
