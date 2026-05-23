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
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    
    const upper = trimmed.toUpperCase();
    
    // Check if line is a section header
    if (upper.includes('EQUIPMENT YOU NEED') || upper.includes('EQUIPMENT NEEDED') || upper === 'EQUIPMENT:' || upper === 'EQUIPMENT') {
      currentSection = 'equipment';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      continue;
    }
    
    if (upper === 'INGREDIENTS:' || (upper.includes('INGREDIENTS') && upper.endsWith(':')) || upper === 'INGREDIENTS' || upper.startsWith('INGREDIENTS YOU')) {
      currentSection = 'ingredients';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      continue;
    }
    
    if (upper.includes('STEP-BY-STEP METHOD') || upper.includes('METHOD:') || upper === 'INSTRUCTIONS:' || upper === 'STEPS:') {
      currentSection = 'steps-body';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      continue;
    }
    
    if (upper.startsWith('COMMON BEGINNER MISTAKES') || upper.startsWith('SERVING:') || upper.startsWith('WHY THIS WORKS:') || upper.startsWith('STORAGE:') || upper.startsWith('NOTES:')) {
      currentSection = 'tips';
      if (currentStep) { parsedSteps.push(currentStep); currentStep = null; }
      tips.push(trimmed);
      continue;
    }
    
    // Check for STEP header (e.g. "STEP 1 — MARINATE THE CHICKEN", "STEP 2: COOK THE TIKKA", "Step 3")
    const stepMatch = trimmed.match(/^step\s*(\d+)\s*(?:—|-|:)?\s*(.*)$/i);
    if (stepMatch) {
      currentSection = 'steps-body';
      if (currentStep) {
        parsedSteps.push(currentStep);
      }
      currentStep = {
        number: parseInt(stepMatch[1], 10),
        title: stepMatch[2] ? stepMatch[2].trim() : '',
        paragraphs: []
      };
      continue;
    }
    
    if (isDivider(trimmed)) continue;
    
    if (currentSection === 'intro') {
      if (!upper.includes('BEGINNER MASTER RECIPE') && !upper.includes('SERVES') && !upper.includes('PREP:')) {
        introText.push(trimmed);
      }
    } else if (currentSection === 'equipment') {
      const cleanEquip = trimmed.replace(/^[\-\*\s•]+\s*/, '');
      if (cleanEquip) equipment.push(cleanEquip);
    } else if (currentSection === 'ingredients') {
      parsedIngredients.push(trimmed);
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
  
  return {
    intro: introText.join(' '),
    equipment,
    ingredients: parsedIngredients,
    steps: parsedSteps,
    tips
  };
};

async function run() {
  const { data, error } = await supabase.from('recipes').select('*').eq('id', 960).single();
  if (error) {
    console.error('Error fetching recipe:', error);
  } else {
    const parsed = parseDetailedRecipe(data.detailed_recipe);
    console.log(`Parsed ${parsed.steps.length} steps:`);
    parsed.steps.forEach(s => {
      console.log(`- Step ${s.number}: ${s.title}`);
      console.log(`  Paragraphs:`, s.paragraphs);
    });
  }
}

run();
