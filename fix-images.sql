-- 1. Allow anonymous users to update and delete from dish_images (needed for the dashboard later!)
CREATE POLICY "Enable update for anonymous users" ON public.dish_images FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for anonymous users" ON public.dish_images FOR DELETE USING (true);

-- 2. Manually fix Dal Tadka to use a beautiful Unsplash close-up instead of the generic Wikipedia thali
UPDATE public.dish_images
SET 
  image_url = 'https://images.unsplash.com/photo-1626500155537-93690c24099e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5NTg5Mjd8MHwxfHNlYXJjaHwxfHxEYWwlMjBUYWRrYSUyMGZvb2R8ZW58MHwwfHx8MTc4MDgwMzc0Nnww&ixlib=rb-4.1.0&q=80&w=1080',
  source = 'unsplash'
WHERE dish_name = 'dal tadka';
