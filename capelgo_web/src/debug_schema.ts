
import { supabase } from './lib/supabase';

async function checkSchema() {
  const tables = ['profiles', 'lojas', 'produtos', 'avaliacoes', 'cupons', 'pedidos'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`\n--- Tabela ${table} ---`);
      console.error('Erro ou tabela inexistente:', error.message);
    } else {
      console.log(`\n--- Tabela ${table} ---`);
      console.log('Colunas:', data && data[0] ? Object.keys(data[0]) : 'Tabela vazia');
      if (data && data[0]) {
        console.log('Exemplo:', data[0]);
      }
    }
  }
}

checkSchema();
