const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const parseDetailedRecipe = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  
  const lines = rawText.replace(/\r/g, '').split('\n');
  const equipment = [];
  const parsedIngredients = [];
  const parsedSteps = [];
  const introText = [];
  const tips = [];
  
  let currentSection = 'intro'; // 'intro', 'equipment', 'ingredients', 'steps-body', 'tips'
  let currentStep = null;
  
  const isDivider = (str) => /^[=\-\s*_#\+]+$/.test(str);

  for (let i = 0; i < lines.length; i++) {
    let trimmed = lines[i].trim();
    if (!trimmed) continue;
    
    let upper = trimmed.toUpperCase();
    
    // Check if line is equipment header
    const equipMatch = trimmed.match(/^equipment(?:\s+you\s+(?:will\s+)?need)?:?\s*(.*)$/i);
    if (equipMatch) {
      currentSection = 'equipment';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      
      const rest = equipMatch[1].trim();
      if (rest) {
        const items = rest.split(/,\s*(?![^()]*\))/);
        items.forEach(item => {
          const clean = item.trim().replace(/^[\-\*\s•]+\s*/, '');
          if (clean) equipment.push(clean);
        });
      }
      continue;
    }
    
    // Check if line is ingredients header
    const ingredientsMatch = trimmed.match(/^ingredients(?:\s+you\s+(?:will\s+)?need)?:?\s*(.*)$/i);
    if (ingredientsMatch) {
      currentSection = 'ingredients';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      
      const rest = ingredientsMatch[1].trim();
      if (rest) {
        const items = rest.split(/,\s*(?![^()]*\))/);
        items.forEach(item => {
          const clean = item.trim();
          if (clean) parsedIngredients.push(clean);
        });
      }
      continue;
    }
    
    // Check if line is method/instructions header
    const methodMatch = trimmed.match(/^(?:step-by-step\s+)?(?:method|instructions|steps|directions):?\s*(.*)$/i);
    if (methodMatch) {
      currentSection = 'steps-body';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      
      const rest = methodMatch[1].trim();
      if (!rest) continue;
      trimmed = rest;
      upper = rest.toUpperCase();
    }
    
    // Check if line is tips/storage header
    const tipsHeaderMatch = trimmed.match(/^(?:common\s+beginner\s+mistakes|serving|why\s+this\s+works|storage|notes|tips|beginner\s+tips?):?\s*(.*)$/i);
    if (tipsHeaderMatch) {
      currentSection = 'tips';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      tips.push(trimmed);
      continue;
    }
    
    // Check for STEP header or numbered step (e.g. "STEP 1 — MARINATE", "1. SOAK NOODLES: Soak dry...")
    const stepMatch = trimmed.match(/^(?:step\s+)?(\d+)\s*[\.\)\]—\-:]\s*(.*)$/i);
    if (stepMatch) {
      currentSection = 'steps-body';
      if (currentStep) {
        parsedSteps.push(currentStep);
      }
      
      let rawRest = stepMatch[2] ? stepMatch[2].trim() : '';
      let title = '';
      let firstParagraph = '';
      
      const titleSeparator = rawRest.match(/^(.*?[a-zA-Z0-9])\s*(?::|—|-)\s+(.+)$/);
      if (titleSeparator) {
        const potentialTitle = titleSeparator[1].trim();
        const potentialPara = titleSeparator[2].trim();
        if (potentialTitle.split(/\s+/).length <= 6) {
          title = potentialTitle;
          firstParagraph = potentialPara;
        } else {
          firstParagraph = rawRest;
        }
      } else {
        const wordCount = rawRest.split(/\s+/).length;
        const isSentence = rawRest.endsWith('.') || rawRest.endsWith('!') || rawRest.endsWith('?');
        if (wordCount <= 6 && !isSentence) {
          title = rawRest;
        } else {
          firstParagraph = rawRest;
        }
      }
      
      currentStep = {
        number: parseInt(stepMatch[1], 10),
        title: title,
        paragraphs: firstParagraph ? [firstParagraph] : []
      };
      continue;
    }
    
    if (isDivider(trimmed)) continue;
    
    if (currentSection === 'intro') {
      if (
        !upper.includes('BEGINNER MASTER RECIPE') &&
        !upper.includes('SERVES') &&
        !upper.includes('PREP:') &&
        !upper.includes('COOK:') &&
        !upper.includes('DIFFICULTY:') &&
        !upper.includes('SPICE:')
      ) {
        introText.push(trimmed);
      }
    } else if (currentSection === 'equipment') {
      const cleanEquip = trimmed.replace(/^[\-\*\s•]+\s*/, '');
      if (cleanEquip) equipment.push(cleanEquip);
    } else if (currentSection === 'ingredients') {
      const subheaderMatch = trimmed.match(/^(For\s+[^:]+):\s*(.*)$/i);
      if (subheaderMatch) {
        parsedIngredients.push(subheaderMatch[1] + ":");
        const rest = subheaderMatch[2].trim();
        if (rest) {
          const items = rest.split(/,\s*(?![^()]*\))/);
          items.forEach(item => {
            if (item.trim()) parsedIngredients.push(item.trim());
          });
        }
      } else {
        const hasMultipleQuantities = (trimmed.match(/\d+\s*(?:tbsp|tsp|g|kg|cup|cups|ml|oz|cloves|shallots|eggs|lbs?|pcs?|pieces)?\b/gi) || []).length > 1;
        if (trimmed.includes(',') && hasMultipleQuantities) {
          const items = trimmed.split(/,\s*(?![^()]*\))/);
          items.forEach(item => {
            if (item.trim()) parsedIngredients.push(item.trim());
          });
        } else {
          parsedIngredients.push(trimmed);
        }
      }
    } else if (currentSection === 'steps-body') {
      if (currentStep) {
        currentStep.paragraphs.push(trimmed);
      } else {
        introText.push(trimmed);
      }
    } else if (currentSection === 'tips') {
      tips.push(trimmed);
    }
  }
  
  if (currentStep) {
    parsedSteps.push(currentStep);
  }
  
  if (parsedSteps.length === 0) return null;
  
  return {
    intro: introText.join(' '),
    equipment,
    ingredients: parsedIngredients,
    steps: parsedSteps,
    tips
  };
};

async function testParse() {
  const { data, error } = await supabase.from('recipes').select('id, dish_name, detailed_recipe').in('id', [686, 700, 801]);
  if (error) {
    console.error(error);
    return;
  }
  
  for (const r of data) {
    const parsed = parseDetailedRecipe(r.detailed_recipe);
    console.log(`\n=================== PARSED ID: ${r.id} | ${r.dish_name} ===================`);
    if (!parsed) {
      console.log("FAILED TO PARSE!");
    } else {
      console.log("Intro:", parsed.intro);
      console.log("Equipment:", parsed.equipment);
      console.log("Ingredients:", parsed.ingredients.slice(0, 5), `... (${parsed.ingredients.length} total)`);
      console.log("Steps Count:", parsed.steps.length);
      parsed.steps.forEach(s => {
        console.log(`  Step ${s.number} | Title: "${s.title}"`);
        console.log(`    Paragraphs:`, s.paragraphs);
      });
      console.log("Tips:", parsed.tips);
    }
  }
}

testParse();
