require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listImages() {
  let allData = [];
  let hasMore = true;
  let start = 0;
  const limit = 1000;

  while (hasMore) {
    const { data, error } = await supabase
      .from('dish_images')
      .select('dish_name')
      .eq('source', 'ai_generated')
      .order('dish_name', { ascending: true })
      .range(start, start + limit - 1);

    if (error) {
      console.error("Error:", error);
      return;
    }
    
    if (data.length > 0) {
      allData = allData.concat(data);
      start += limit;
    } else {
      hasMore = false;
    }
  }

  let mdContent = `# AI Generated Dish Images\n\n`;
  mdContent += `Total images generated so far: **${allData.length}**\n\n`;
  mdContent += `| # | Dish Name |\n`;
  mdContent += `|---|---|\n`;
  
  allData.forEach((item, i) => {
    const name = item.dish_name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    mdContent += `| ${i + 1} | ${name} |\n`;
  });

  const path = 'C:\\\\Users\\\\MUDIT GARG\\\\.gemini\\\\antigravity\\\\brain\\\\90fdf123-5f2d-4a49-bc5f-4e4fa51921ef\\\\ai_generated_dishes.md';
  fs.writeFileSync(path, mdContent);
  console.log("Artifact created.");
}

listImages();
