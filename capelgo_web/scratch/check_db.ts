import { createClient } from '@supabase/supabase-client';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log("Checking columns for 'produtos'...");
  const { data: prodData, error: prodError } = await supabase
    .from('produtos')
    .select('*')
    .limit(1);
  
  if (prodError) {
    console.error("Error fetching produtos:", prodError.message);
  } else if (prodData && prodData.length > 0) {
    console.log("Columns in 'produtos':", Object.keys(prodData[0]));
  } else {
    console.log("No data in 'produtos' to check columns.");
  }

  console.log("\nChecking columns for 'lojas'...");
  const { data: lojaData, error: lojaError } = await supabase
    .from('lojas')
    .select('*')
    .limit(1);
  
  if (lojaError) {
    console.error("Error fetching lojas:", lojaError.message);
  } else if (lojaData && lojaData.length > 0) {
    console.log("Columns in 'lojas':", Object.keys(lojaData[0]));
  } else {
    console.log("No data in 'lojas' to check columns.");
  }
}

checkColumns();
