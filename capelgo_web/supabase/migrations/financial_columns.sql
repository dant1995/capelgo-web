-- ============================================================
-- 💰 Migração: Colunas Financeiras para Pedidos
-- Objetivo: Armazenar repasses e comissões de forma imutável
-- ============================================================

ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS comissao_admin_valor NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS repasse_lojista_valor NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS repasse_entregador_valor NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS taxa_entrega NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS codigo_confirmacao TEXT;

COMMENT ON COLUMN public.pedidos.comissao_admin_valor IS 'Valor fixo ganho pela plataforma sobre a venda do produto';
COMMENT ON COLUMN public.pedidos.repasse_lojista_valor IS 'Valor líquido a ser pago ao dono da loja (Total - Comissão)';
COMMENT ON COLUMN public.pedidos.repasse_entregador_valor IS 'Valor a ser pago ao entregador por este serviço';
COMMENT ON COLUMN public.pedidos.taxa_entrega IS 'Valor total cobrado do cliente pela logística';
