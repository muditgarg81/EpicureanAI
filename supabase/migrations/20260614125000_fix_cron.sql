select cron.unschedule('generate-images-cron');

select
  cron.schedule(
    'generate-images-cron',
    '*/5 * * * *',
    $$
    select
      net.http_post(
          url:='https://faubfxqdufvusuablqqe.supabase.co/functions/v1/generate-images',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo"}'::jsonb
      ) as request_id;
    $$
  );
