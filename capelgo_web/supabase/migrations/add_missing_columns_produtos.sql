-- ============================================================
-- 🚀 CapelGo — Adiciona colunas faltantes na tabela produtos
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- ─── NOVAS COLUNAS (uma por vez) ────────────────────────────
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS subcategoria TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS estoque INTEGER DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS variacoes JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS preco_promocional NUMERIC(10,2);
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS promocao_ativa BOOLEAN DEFAULT false;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS promocao_data_fim TIMESTAMPTZ;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS premio_nome TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS preco_antigo NUMERIC(10,2);
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS promotion_status TEXT DEFAULT 'none';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS visualizacoes INTEGER DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS vendidos INTEGER DEFAULT 0;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS galeria JSONB DEFAULT '[]'::JSONB;

-- ─── CHECK CONSTRAINTS ──────────────────────────────────────
ALTER TABLE public.produtos DROP CONSTRAINT IF EXISTS check_promotion_status;
ALTER TABLE public.produtos ADD CONSTRAINT check_promotion_status CHECK (promotion_status IN ('none', 'pending', 'approved'));
