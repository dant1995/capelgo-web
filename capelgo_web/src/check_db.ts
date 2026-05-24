
import { supabase } from './lib/supabase';

async function checkSchema() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Erro ao buscar perfil:', error);
  } else {
    console.log('Estrutura do perfil:', data && data[0] ? Object.keys(data[0]) : 'Tabela vazia');
    console.log('Dados exemplo:', data && data[0]);
  }
}

checkSchema();
