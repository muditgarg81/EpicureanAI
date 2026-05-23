-- ==========================================
-- CREATE DISH IMAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.dish_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_name text UNIQUE NOT NULL,
  image_url text NOT NULL,
  source text DEFAULT 'unsplash',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.dish_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so the app can fetch images without logging in)
DROP POLICY IF EXISTS "Allow public read access to dish_images" ON public.dish_images;
CREATE POLICY "Allow public read access to dish_images" ON public.dish_images
  FOR SELECT USING (true);

-- Allow anon and authenticated users to insert (so the frontend can save new Unsplash images)
DROP POLICY IF EXISTS "Allow anon and authenticated insert to dish_images" ON public.dish_images;
CREATE POLICY "Allow anon and authenticated insert to dish_images" ON public.dish_images
  FOR INSERT WITH CHECK (true);

-- Allow authenticated updates (optional, for admin overrides)
DROP POLICY IF EXISTS "Allow authenticated update to dish_images" ON public.dish_images;
CREATE POLICY "Allow authenticated update to dish_images" ON public.dish_images
  FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
