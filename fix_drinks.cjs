require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const drinks = [
  {
    name: 'Irish Coffee',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Irish_coffee_glass.jpg/960px-Irish_coffee_glass.jpg'
  },
  {
    name: 'Singapore Sling',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Singapore_Sling_and_peanuts_at_the_Raffles_Hotel_Long_Bar_in_Singapore.jpg/960px-Singapore_Sling_and_peanuts_at_the_Raffles_Hotel_Long_Bar_in_Singapore.jpg'
  },
  {
    name: 'Long Island Iced Tea',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Long_Island_Iced_Teas.jpg'
  },
  {
    name: 'Cosmopolitan',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/Cosmopolitan_%285076906532%29.jpg'
  }
];

async function run() {
  for (const drink of drinks) {
    const { error } = await supabase
      .from('recipes')
      .update({ image_url: drink.url })
      .eq('dish_name', drink.name);
      
    if (error) {
      console.error('Error updating', drink.name, error);
    } else {
      console.log('Successfully updated', drink.name, 'with authentic Wikipedia image.');
    }
  }
}
run();
