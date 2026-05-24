-- Tabela para rastrear adições ao carrinho
CREATE TABLE IF NOT EXISTS public.adicoes_carrinho (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    produto_id UUID NOT NULL REFERENCES public.produtos(id),
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_adicoes_carrinho_produto ON public.adicoes_carrinho(produto_id);
CREATE INDEX IF NOT EXISTS idx_adicoes_carrinho_data ON public.adicoes_carrinho(created_at);

-- RLS
ALTER TABLE public.adicoes_carrinho ENABLE ROW LEVEL SECURITY;

-- Permitir insert anônimo (usuários não logados também adicionam ao carrinho)
CREATE POLICY insert_adicoes_carrinho ON public.adicoes_carrinho
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Admin pode ler todas
CREATE POLICY select_adicoes_carrinho_admin ON public.adicoes_carrinho
    FOR SELECT TO authenticated
    USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.adicoes_carrinho;
