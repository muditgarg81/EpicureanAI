const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faubfxqdufvusuablqqe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdWJmeHFkdWZ2dXN1YWJscXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE4ODcsImV4cCI6MjA5NDI1Nzg4N30.8sMduFlElll7P_geozrKYgStouwkqHEaBb14wuxCYQo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
  console.log("Checking connection and fetching profiles...");
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  console.log("Profiles test:", { profiles, profileErr });

  console.log("\nChecking families table...");
  const { data: families, error: familiesErr } = await supabase
    .from('families')
    .select('*')
    .limit(1);
  console.log("Families test:", { families, familiesErr });

  console.log("\nChecking family_members_data table...");
  const { data: familyMembers, error: membersErr } = await supabase
    .from('family_members_data')
    .select('*')
    .limit(1);
  console.log("Family Members Data test:", { familyMembers, membersErr });

  console.log("\nChecking schema information via a generic RPC or postgrest call...");
  const tables = ['profiles', 'families', 'family_members_data', 'family_invitations', 'meal_plans', 'grocery_items', 'pantry_items'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    console.log(`Table '${table}' exists/accessible:`, error ? `No (${error.message})` : 'Yes');
  }
}

diagnose();
