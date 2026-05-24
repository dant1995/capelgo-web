import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ConfigContextData {
  plataformaLogo: string | null;
  loading: boolean;
}

const ConfigContext = createContext<ConfigContextData>({
  plataformaLogo: null,
  loading: true,
});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plataformaLogo, setPlataformaLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes_sistema')
          .select('*')
          .eq('chave', 'plataforma_logo')
          .single();

        if (data && data.valor) {
          setPlataformaLogo(data.valor);
        }
      } catch (err) {
        console.error("Erro ao carregar a logo da plataforma", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ plataformaLogo, loading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
