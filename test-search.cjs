const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const ingredients = ['chicken', 'cabbage'];
    const maxTime = 20;
    const dietaryFilters = { contains_nuts: false, is_gluten_free: true };

    let qb = supabase.from('recipes').select('*');

    // Apply dietary eq filters
    Object.entries(dietaryFilters).forEach(([col, val]) => {
      qb = qb.eq(col, val);
    });

    // Apply time filter
    if (maxTime) {
      qb = qb.lte('total_time_min', maxTime);
    }

    // Ingredient ilike filters (OR-style using .or)
    if (ingredients.length > 0) {
      const orConditions = ingredients
        .map((ing) => `key_ingredients.ilike.%${ing}%`)
        .join(',');
      qb = qb.or(orConditions);
    }

    qb = qb.limit(20);

    console.log("Running query...");
    const { data, error } = await qb;

    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Success! Returned rows count:", data.length);
      if (data.length > 0) {
        console.log("Sample row:", data[0]);
      }
    }
  } catch (err) {
    console.error("Crash error:", err);
  }
}

test();
