require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAll() {
  const { data, error } = await supabase
    .from('recipes')
    .select('dish_name, detailed_recipe');
    
  if (error) {
    console.error("Error fetching recipes", error);
    return;
  }
  
  const badRecipes = data.filter(r => r.detailed_recipe && r.detailed_recipe.includes('structured beginner template'));
  
  console.log(`Found ${badRecipes.length} recipes with generic template out of ${data.length} total recipes.`);
  console.log("Names:", badRecipes.map(r => r.dish_name));
}

checkAll();
