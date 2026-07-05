-- Add cuisine_tags: a pipe-separated list of normalized cuisine tags per dish,
-- e.g. "Awadhi|Indian|Mughlai". Powers the cuisine filter chips on the
-- Recipes Generator page.
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS cuisine_tags text;

-- Backfill from the existing `cuisine` column, which already stores multiple
-- cuisines separated by "/" (e.g. "Mughlai / Pakistani / North Indian").
-- Normalize into a deduplicated, trimmed, pipe-separated tag list.
UPDATE public.recipes
SET cuisine_tags = (
  SELECT string_agg(DISTINCT trim(tag), '|')
  FROM unnest(
    string_to_array(regexp_replace(cuisine, '\s*/\s*', '|', 'g'), '|')
  ) AS tag
  WHERE trim(tag) <> ''
)
WHERE cuisine IS NOT NULL
  AND (cuisine_tags IS NULL OR cuisine_tags = '');
