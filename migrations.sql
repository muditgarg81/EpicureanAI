-- ==========================================
-- 1. ADD MISSING COLUMN FOR SUBSCRIPTIONS
-- ==========================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "activePlan" text DEFAULT 'Taste';

-- ==========================================
-- 2. FIX RLS POLICIES FOR FAMILY MEMBERS DATA
-- ==========================================
-- Enable RLS on family_members_data
ALTER TABLE family_members_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow select for family members" ON family_members_data;
DROP POLICY IF EXISTS "Allow insert for family members" ON family_members_data;
DROP POLICY IF EXISTS "Allow update for family members" ON family_members_data;
DROP POLICY IF EXISTS "Allow all actions for family members" ON family_members_data;
DROP POLICY IF EXISTS "Allow authenticated select on family_members_data" ON family_members_data;
DROP POLICY IF EXISTS "Allow authenticated upsert on family_members_data" ON family_members_data;
DROP POLICY IF EXISTS "Allow authenticated insert on family_members_data" ON family_members_data;
DROP POLICY IF EXISTS "Allow authenticated update on family_members_data" ON family_members_data;
DROP POLICY IF EXISTS "Allow authenticated delete on family_members_data" ON family_members_data;

-- Create policies for family_members_data
CREATE POLICY "Allow authenticated select on family_members_data" ON family_members_data
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on family_members_data" ON family_members_data
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on family_members_data" ON family_members_data
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on family_members_data" ON family_members_data
  FOR DELETE TO authenticated USING (true);


-- ==========================================
-- 3. FIX RLS POLICIES FOR FAMILY INVITATIONS
-- ==========================================
-- Enable RLS on family_invitations
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow select for anyone with token" ON family_invitations;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON family_invitations;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON family_invitations;
DROP POLICY IF EXISTS "Allow select for anyone" ON family_invitations;
DROP POLICY IF EXISTS "Allow insert for anyone" ON family_invitations;
DROP POLICY IF EXISTS "Allow update for anyone" ON family_invitations;

-- Create policies for family_invitations
CREATE POLICY "Allow select for anyone" ON family_invitations
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON family_invitations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON family_invitations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- ==========================================
-- 4. CREATE STORAGE BUCKET AND SET RLS POLICIES FOR INVITE LANDING PAGE
-- ==========================================
-- Create bucket "invites" if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('invites', 'invites', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies for invites bucket
DROP POLICY IF EXISTS "Allow public read access to invites" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert to invites" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to invites" ON storage.objects;

-- Create policies for invites bucket
CREATE POLICY "Allow public read access to invites" ON storage.objects
  FOR SELECT USING (bucket_id = 'invites');

CREATE POLICY "Allow public insert to invites" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'invites');

CREATE POLICY "Allow public update to invites" ON storage.objects
  FOR UPDATE USING (bucket_id = 'invites');


-- ==========================================
-- 5. ENSURE PANTRY AND GROCERY TABLES EXIST
-- ==========================================
CREATE TABLE IF NOT EXISTS public.pantry_items (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  quantity text,
  status text,
  level integer,
  color text,
  img text,
  checked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user to select their own pantry items" ON public.pantry_items;
DROP POLICY IF EXISTS "Allow user to insert their own pantry items" ON public.pantry_items;
DROP POLICY IF EXISTS "Allow user to update their own pantry items" ON public.pantry_items;
DROP POLICY IF EXISTS "Allow user to delete their own pantry items" ON public.pantry_items;

CREATE POLICY "Allow user to select their own pantry items" ON public.pantry_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow user to insert their own pantry items" ON public.pantry_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow user to update their own pantry items" ON public.pantry_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow user to delete their own pantry items" ON public.pantry_items FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.grocery_items (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  quantity text,
  checked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user to select their own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Allow user to insert their own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Allow user to update their own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Allow user to delete their own grocery items" ON public.grocery_items;

CREATE POLICY "Allow user to select their own grocery items" ON public.grocery_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow user to insert their own grocery items" ON public.grocery_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow user to update their own grocery items" ON public.grocery_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow user to delete their own grocery items" ON public.grocery_items FOR DELETE USING (auth.uid() = user_id);

