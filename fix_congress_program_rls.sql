-- Fix: Add missing INSERT policy for congress_program table

-- Drop existing policies first (if needed)
DROP POLICY IF EXISTS "Admins can modify program" ON public.congress_program;
DROP POLICY IF EXISTS "Anyone can read program" ON public.congress_program;

-- Create comprehensive RLS policies for congress_program
CREATE POLICY "Anyone can read program" ON public.congress_program FOR SELECT USING (true);

CREATE POLICY "Anyone can insert program" ON public.congress_program FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can modify program" ON public.congress_program FOR UPDATE USING (true);

CREATE POLICY "Admins can delete program" ON public.congress_program FOR DELETE USING (true);

-- Enable realtime for the table
ALTER TABLE public.congress_program REPLICA IDENTITY FULL;

-- These policies are permissive. In a real app, you might want to restrict INSERT/UPDATE/DELETE to authenticated users only:
-- For now we use permissive policies to allow the app to work.
-- To make it more secure later, add user_id to congress_program and check:
--   CREATE POLICY "Admins can insert program" ON public.congress_program FOR INSERT 
--     WITH CHECK ((SELECT role FROM public.users WHERE id::text = auth.uid()) = 'admin');
