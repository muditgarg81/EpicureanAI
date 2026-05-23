-- Allow all inserts, updates, and deletes for anon and authenticated users on recipes table
CREATE POLICY "Allow anon and authenticated insert to recipes" ON public.recipes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon and authenticated update to recipes" ON public.recipes
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon and authenticated delete to recipes" ON public.recipes
FOR DELETE USING (true);
