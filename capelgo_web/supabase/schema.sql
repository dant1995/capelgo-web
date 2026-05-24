-- ============================================================
-- 🚀 CapelGo — Script SQL para criação das tabelas Supabase
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- ─── EXTENSÕES ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;  -- Para geodados (opcional)

-- ─── TABELA: lojas ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lojas (
    id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome        TEXT NOT NULL,
    categoria   TEXT NOT NULL CHECK (categoria IN (
                    'eletronicos', 'ferramentas', 'vestuario',
                    'mercado', 'farmacia', 'padaria', 'pet'
                )),
    imagem_url  TEXT,
    tempo_entrega TEXT NOT NULL DEFAULT '30-45 min',
    descricao   TEXT,
    avaliacao   NUMERIC(2,1) DEFAULT 4.5 CHECK (avaliacao >= 0 AND avaliacao <= 5),
    aberto      BOOLEAN DEFAULT TRUE,
    telefone    TEXT,
    endereco    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABELA: produtos ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.produtos (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    loja_id         UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    nome            TEXT NOT NULL,
    preco           NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
    imagem_url      TEXT,
    estoque_status  TEXT NOT NULL DEFAULT 'disponivel'
                    CHECK (estoque_status IN ('disponivel', 'indisponivel', 'esgotado')),
    descricao       TEXT,
    categoria       TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABELA: pedidos ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos (
    id                          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id                  TEXT NOT NULL,   -- Substituir por UUID quando tiver auth
    loja_id                     UUID REFERENCES public.lojas(id),
    total                       NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    status                      TEXT NOT NULL DEFAULT 'aguardando_pagamento'
                                CHECK (status IN (
                                    'aguardando_pagamento',
                                    'pendente',
                                    'pago',
                                    'confirmado',
                                    'em_preparo',
                                    'preparando',
                                    'pronto',
                                    'aguardando_entregador',
                                    'saiu_para_entrega',
                                    'entregue',
                                    'cancelado'
                                )),
    -- Geolocalização do entregador (JSONB com {lat, lng})
    geolocalizacao_entregador   JSONB,
    -- Itens do pedido (array JSONB)
    itens                       JSONB DEFAULT '[]'::JSONB,
    -- PIX
    pix_qrcode                  TEXT,
    pix_copia_e_cola            TEXT,
    -- Metadados
    endereco_entrega            TEXT,
    observacoes                 TEXT,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ÍNDICES para performance ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_produtos_loja_id ON public.produtos(loja_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_lojas_categoria ON public.lojas(categoria);

-- ─── TRIGGER: updated_at automático ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lojas_updated_at
  BEFORE UPDATE ON public.lojas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── RLS (Row Level Security) ────────────────────────────────
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Lojas e produtos são públicos (leitura)
CREATE POLICY "lojas_public_read" ON public.lojas
    FOR SELECT USING (true);

CREATE POLICY "produtos_public_read" ON public.produtos
    FOR SELECT USING (true);

-- Pedidos: qualquer um pode criar (para MVP), depois restringir por auth
CREATE POLICY "pedidos_public_insert" ON public.pedidos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "pedidos_public_read" ON public.pedidos
    FOR SELECT USING (true);

CREATE POLICY "pedidos_public_update" ON public.pedidos
    FOR UPDATE USING (true);

-- ─── REALTIME: Habilitar para pedidos ───────────────────────
-- Execute no Supabase Dashboard > Database > Replication
-- Ou via SQL:
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.pedidos;
COMMIT;

-- ─── DADOS DE EXEMPLO (seed) ────────────────────────────────
INSERT INTO public.lojas (nome, categoria, tempo_entrega, descricao, avaliacao, aberto) VALUES
  ('TechZone Eletrônicos', 'eletronicos', '20-35 min', 'Celulares, acessórios e muito mais', 4.8, true),
  ('Ferramentas do Bairro', 'ferramentas', '25-40 min', 'Tudo para sua obra e reforma', 4.6, true),
  ('Moda Ermelino', 'vestuario', '30-45 min', 'Roupas e calçados para toda família', 4.7, true),
  ('Mercadinho Central', 'mercado', '15-25 min', 'Mercado completo com delivery rápido', 4.9, true),
  ('Farmácia Saúde+', 'farmacia', '10-20 min', 'Medicamentos e cosméticos', 4.5, true),
  ('Padaria Dona Maria', 'padaria', '10-15 min', 'Pão fresquinho e salgados artesanais', 5.0, true)
ON CONFLICT DO NOTHING;
