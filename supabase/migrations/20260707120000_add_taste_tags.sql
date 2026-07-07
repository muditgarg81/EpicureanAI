-- Add taste_tags: a pipe-separated list of taste/temperature tags per dish,
-- e.g. "Spicy|Savory|Hot". Powers the taste filter chips on the Recipes
-- Generator page (Sweet, Spicy, Tangy, Sour, Salty, Savory, Cold, Hot).
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS taste_tags text;

-- Backfill via heuristics over existing columns (spice_level, course,
-- dish_type, description, full_ingredients) since taste has no source
-- column to copy from, unlike cuisine_tags.
WITH computed AS (
  SELECT id,
    array_remove(ARRAY[
      CASE WHEN course ILIKE '%dessert%' OR course ILIKE '%sweet%'
             OR dish_type ILIKE '%sweet%' OR dish_type ILIKE '%halwa%' OR dish_type ILIKE '%dessert%'
             OR description ~* '(sweet|sugar|syrup|jaggery|honey|caramel|candied)'
        THEN 'Sweet' END,
      CASE WHEN spice_level >= 2
             OR description ~* '(spicy|fiery|chili|chilli)'
        THEN 'Spicy' END,
      CASE WHEN description ~* '(tangy|tamarind|zesty|citrus)'
             OR full_ingredients ~* '(tamarind|lemon|lime)'
        THEN 'Tangy' END,
      CASE WHEN description ~* '(sour|fermented|pickled)'
             OR dish_type ILIKE '%pickle%'
             OR full_ingredients ~* '(vinegar|buttermilk|yogurt)'
        THEN 'Sour' END,
      CASE WHEN description ~* '(salty|salted|briny|cured)'
             OR dish_type ILIKE '%pickle%' OR dish_type ILIKE '%cured%'
        THEN 'Salty' END,
      CASE WHEN course NOT ILIKE '%dessert%' AND course NOT ILIKE '%beverage%' AND course NOT ILIKE '%drink%'
        THEN 'Savory' END,
      CASE WHEN course ILIKE '%salad%' OR course ILIKE '%beverage%' OR course ILIKE '%drink%'
             OR dish_type ~* '(chilled|frozen|ice cream|sorbet|raita)'
             OR description ~* '(chilled|iced|frozen)'
        THEN 'Cold' END,
      CASE WHEN course ILIKE '%soup%' OR course ILIKE '%stew%'
             OR dish_type ~* '(soup|stew)'
             OR description ~* '(piping hot|steaming|served hot)'
        THEN 'Hot' END
    ], NULL) AS tags
  FROM public.recipes
)
UPDATE public.recipes r
SET taste_tags = array_to_string(c.tags, '|')
FROM computed c
WHERE r.id = c.id
  AND array_length(c.tags, 1) > 0
  AND (r.taste_tags IS NULL OR r.taste_tags = '');
