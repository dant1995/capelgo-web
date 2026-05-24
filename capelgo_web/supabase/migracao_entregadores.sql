-- ============================================================
-- 🚀 CapelGo — Migração de Aprovação e Validação de Entregadores
-- Execute este script no SQL Editor do seu Supabase
-- ============================================================

-- 1. Atualizar a constraint de roles para incluir 'entregador' se necessário
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('cliente', 'lojista', 'admin', 'entregador'));

-- 2. Adicionar campos de validação de documentos e aprovação
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_aprovacao TEXT DEFAULT 'pendente_documentos'
    CHECK (status_aprovacao IN ('pendente_documentos', 'em_analise', 'aprovado', 'rejeitado'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnh_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS veiculo_foto_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS comprovante_residencia_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS documentos_enviados_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;

-- 3. Habilitar que o próprio entregador possa atualizar seus documentos e status_aprovacao
-- (A política profiles_update_own já permite isso pois ele atualiza o próprio ID)
