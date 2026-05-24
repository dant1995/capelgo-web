-- ============================================================
-- 📦 CapelGo: Sistema de Devoluções e Reembolsos (Auto-contido)
-- Regras de Negócio e Impactos Financeiros da Logística Reversa
-- ============================================================

-- 1. Criar tabela base de devolucoes caso não exista
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

-- 2. Adicionar colunas necessárias na tabela de devolucoes (caso já existisse sem elas)
ALTER TABLE public.devolucoes 
ADD COLUMN IF NOT EXISTS quem_paga_frete TEXT CHECK (quem_paga_frete IN ('merchant', 'customer')),
ADD COLUMN IF NOT EXISTS custo_coleta NUMERIC(10,2) NOT NULL DEFAULT 7.00 CHECK (custo_coleta >= 0);

-- 3. Habilitar RLS (Row Level Security) na tabela devolucoes
ALTER TABLE public.devolucoes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS de segurança e controle de acesso
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

-- 5. Trigger para definir automaticamente QUEM PAGA O FRETE e o CUSTO no momento da solicitação
CREATE OR REPLACE FUNCTION public.definir_logistica_reversa_frete()
RETURNS TRIGGER AS $$
BEGIN
    -- Definição de quem paga o frete com base no motivo
    -- merchant: produto_defeito, item_errado, danificado_transporte
    -- customer: arrependimento, tamanho_incorreto_engano, nao_gostou
    IF NEW.motivo IN ('produto_defeito', 'item_errado', 'danificado_transporte') THEN
        NEW.quem_paga_frete := 'merchant';
    ELSIF NEW.motivo IN ('arrependimento', 'tamanho_incorreto_engano', 'nao_gostou') THEN
        NEW.quem_paga_frete := 'customer';
    ELSE
        -- Default para outros motivos
        NEW.quem_paga_frete := 'customer';
    END IF;

    -- Define o custo fixo de coleta reversa da plataforma CapelGo
    NEW.custo_coleta := 7.00;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_definir_logistica_reversa ON public.devolucoes;
CREATE TRIGGER trigger_definir_logistica_reversa
    BEFORE INSERT ON public.devolucoes
    FOR EACH ROW
    EXECUTE FUNCTION public.definir_logistica_reversa_frete();


-- 6. Função RPC para Processar Financeiro da Devolução no fluxo de Aprovação
-- Esta função gerencia os estornos de saldo_cashback do cliente e débitos do lojista
CREATE OR REPLACE FUNCTION public.processar_financeiro_devolucao(
    p_devolucao_id UUID,
    p_decisao TEXT
)
RETURNS VOID AS $$
DECLARE
    v_cliente_id TEXT;
    v_loja_id UUID;
    v_lojista_id TEXT;
    v_valor_reembolso NUMERIC(10,2);
    v_custo_coleta NUMERIC(10,2);
    v_quem_paga_frete TEXT;
    v_status_atual TEXT;
    v_reembolso_final NUMERIC(10,2);
BEGIN
    -- 1. Buscar detalhes da devolução
    SELECT cliente_id, loja_id, valor_reembolso, custo_coleta, quem_paga_frete, status_solicitacao
    INTO v_cliente_id, v_loja_id, v_valor_reembolso, v_custo_coleta, v_quem_paga_frete, v_status_atual
    FROM public.devolucoes
    WHERE id = p_devolucao_id;

    -- Validar se a devolução já não foi processada
    IF v_status_atual = 'reembolso_pago' OR v_status_atual = 'recusada' THEN
        RAISE EXCEPTION 'Esta devolução já foi processada anteriormente.';
    END IF;

    -- Buscar ID do usuário lojista associado à loja
    SELECT id INTO v_lojista_id
    FROM public.profiles
    WHERE loja_id = v_loja_id AND role = 'lojista'
    LIMIT 1;

    IF p_decisao = 'aprovada' THEN
        -- REGRA 1: Se quem_paga_frete == 'merchant' (Lojista paga)
        IF v_quem_paga_frete = 'merchant' THEN
            -- O cliente recebe o reembolso INTEGRAL do produto
            v_reembolso_final := v_valor_reembolso;

            -- O valor de custo_coleta é debitado do lojista
            IF v_lojista_id IS NOT NULL THEN
                UPDATE public.profiles
                SET saldo_cashback = COALESCE(saldo_cashback, 0.00) - v_custo_coleta
                WHERE id = v_lojista_id;
            END IF;

        -- REGRA 2: Se quem_paga_frete == 'customer' (Cliente paga)
        ELSE
            -- O cliente recebe o reembolso subtraindo o custo da coleta
            v_reembolso_final := GREATEST(0.00, v_valor_reembolso - v_custo_coleta);
            -- O saldo do lojista permanece intacto em relação ao frete
        END IF;

        -- Creditar o valor estornado ao cliente
        UPDATE public.profiles
        SET saldo_cashback = COALESCE(saldo_cashback, 0.00) + v_reembolso_final
        WHERE id = v_cliente_id;

        -- Atualizar a solicitação de devolução para Reembolso Pago e Entrega Concluída
        UPDATE public.devolucoes
        SET status_solicitacao = 'reembolso_pago',
            status_entrega = 'entregue',
            updated_at = NOW()
        WHERE id = p_devolucao_id;

    ELSIF p_decisao = 'recusada' THEN
        -- Apenas atualizar a solicitação para Recusada / Em disputa
        UPDATE public.devolucoes
        SET status_solicitacao = 'recusada',
            updated_at = NOW()
        WHERE id = p_devolucao_id;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Habilitar Realtime para Devoluções
-- Nota: se der erro de publicação duplicada, você pode remover ou ignorar esta linha
ALTER PUBLICATION supabase_realtime ADD TABLE public.devolucoes;
