import { createClient } from '@supabase/supabase-client';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectPremios() {
  console.log("Inspecting 'premios_ganhos'...");
  const { data, error } = await supabase.from('premios_ganhos').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data in premios_ganhos.");
  }
}

inspectPremios();
