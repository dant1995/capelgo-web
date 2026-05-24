-- ============================================================
-- 📦 CapelGo: Sistema de Devoluções e Reembolsos (Estilo Shopee)
-- Execute este script no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.devolucoes (
    id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    solicitacao_id      TEXT NOT NULL UNIQUE, -- Código legível da devolução (ex: DEV-2603200MV8)
    pedido_id           UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    cliente_id          TEXT NOT NULL, -- ID do comprador (pode ser UUID correspondente ao auth.users.id)
    loja_id             UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    produtos            JSONB DEFAULT '[]'::JSONB, -- Lista dos produtos devolvidos [ { id, nome, preco, qtd, imagem, variacao } ]
    valor_reembolso     NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (valor_reembolso >= 0),
    motivo              TEXT NOT NULL, -- Ex: 'Arrependimento', 'Produto com defeito', 'Estoque esgotado', 'Falha no pagamento'
    solucao             TEXT NOT NULL DEFAULT 'apenas_reembolso' CHECK (solucao IN ('apenas_reembolso', 'devolucao_e_reembolso')),
    status_solicitacao  TEXT NOT NULL DEFAULT 'pendente' 
                        CHECK (status_solicitacao IN ('pendente', 'em_analise', 'em_devolucao', 'reembolso_pago', 'aprovada', 'recusada', 'cancelada')),
    status_entrega      TEXT NOT NULL DEFAULT 'nao_iniciado' 
                        CHECK (status_entrega IN ('nao_iniciado', 'coleta_agendada', 'em_transito', 'entregue', 'cancelado')),
    detalhes            TEXT,
    fotos               TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.devolucoes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "devolucoes_cliente_select" ON public.devolucoes;
CREATE POLICY "devolucoes_cliente_select" ON public.devolucoes
    FOR SELECT USING (cliente_id = auth.uid()::text);

DROP POLICY IF EXISTS "devolucoes_cliente_insert" ON public.devolucoes;
CREATE POLICY "devolucoes_cliente_insert" ON public.devolucoes
    FOR INSERT WITH CHECK (cliente_id = auth.uid()::text);

DROP POLICY IF EXISTS "devolucoes_lojista_select" ON public.devolucoes;
CREATE POLICY "devolucoes_lojista_select" ON public.devolucoes
    FOR SELECT USING (
        loja_id = (
            SELECT loja_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'lojista'
        )
    );

DROP POLICY IF EXISTS "devolucoes_lojista_update" ON public.devolucoes;
CREATE POLICY "devolucoes_lojista_update" ON public.devolucoes
    FOR UPDATE USING (
        loja_id = (
            SELECT loja_id FROM public.profiles
            WHERE id = auth.uid() AND role = 'lojista'
        )
    );

DROP POLICY IF EXISTS "devolucoes_admin_all" ON public.devolucoes;
CREATE POLICY "devolucoes_admin_all" ON public.devolucoes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Habilitar Realtime para Devoluções
ALTER PUBLICATION supabase_realtime ADD TABLE public.devolucoes;
