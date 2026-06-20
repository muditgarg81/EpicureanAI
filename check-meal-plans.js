import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const fetchPlans = async () => {
  console.log('Fetching meal plans...');
  const { data, error } = await supabase.from('meal_plans').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  for (let plan of data) {
    console.log(`Plan for family: ${plan.family_id}`);
    const planData = typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
    for (let day in planData) {
      ['breakfast', 'lunch', 'dinner'].forEach(type => {
        if (planData[day] && planData[day][type]) {
          planData[day][type].forEach(meal => {
            if (['Chivito', 'Saoji Mutton', 'Sausage and Egg Croissant'].includes(meal.title)) {
              console.log(`FOUND ${meal.title}! URL: ${meal.img}`);
            }
          });
        }
      });
    }
  }
};

fetchPlans();
