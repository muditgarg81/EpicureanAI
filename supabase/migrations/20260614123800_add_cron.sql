-- Enable the pg_cron extension if not already enabled
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Create a cron job to call the Edge Function every 5 minutes
-- NOTE: You will need to replace '<PROJECT_REF>' with your actual Supabase project reference
-- The cron schedule '*/5 * * * *' means every 5 minutes.
select
  cron.schedule(
    'generate-images-cron',
    '*/5 * * * *',
    $$
    select
      net.http_post(
          url:='https://<PROJECT_REF>.supabase.co/functions/v1/generate-images',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_ANON_KEY>"}'::jsonb
      ) as request_id;
    $$
  );
