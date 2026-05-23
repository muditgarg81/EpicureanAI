import fs from 'fs';
import path from 'path';

function checkFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`\n--- ${path.basename(filePath)} ---`);
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.toLowerCase().includes('culinarydatabank') || line.toLowerCase().includes('.filter(') || line.toLowerCase().includes('search')) {
            console.log(`${i+1}: ${line.trim()}`);
        }
    });
}

checkFile('C:/Users/MUDIT GARG/Downloads/stitch_global_ai_kitchen_coach/src/pages/WeeklyMealPlanner.jsx');
checkFile('C:/Users/MUDIT GARG/Downloads/stitch_global_ai_kitchen_coach/src/pages/ExplorePage.jsx');
checkFile('C:/Users/MUDIT GARG/Downloads/stitch_global_ai_kitchen_coach/src/pages/AiRecipeGenerator.jsx');
