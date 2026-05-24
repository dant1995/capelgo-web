-- ============================================================
-- CapelGo: RBAC + Profiles
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'cliente' 
              CHECK (role IN ('cliente', 'lojista', 'admin')),
  loja_id     UUID REFERENCES public.lojas(id) ON DELETE SET NULL,
  nome        TEXT,
  telefone    TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger: cria profile automaticamente ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, nome)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente'),
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin pode ver todos os profiles (via service_role key no n8n)
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 5. RLS na tabela pedidos
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Cliente vê seus próprios pedidos
DROP POLICY IF EXISTS "pedidos_cliente_select" ON public.pedidos;
CREATE POLICY "pedidos_cliente_select" ON public.pedidos
  FOR SELECT USING (
    cliente_id = auth.uid()::text
  );

-- Lojista vê pedidos da sua loja
DROP POLICY IF EXISTS "pedidos_lojista_select" ON public.pedidos;
CREATE POLICY "pedidos_lojista_select" ON public.pedidos
  FOR SELECT USING (
    loja_id = (
      SELECT loja_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'lojista'
    )
  );

-- Admin vê tudo
DROP POLICY IF EXISTS "pedidos_admin_all" ON public.pedidos;
CREATE POLICY "pedidos_admin_all" ON public.pedidos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Qualquer auth pode inserir pedido
DROP POLICY IF EXISTS "pedidos_insert" ON public.pedidos;
CREATE POLICY "pedidos_insert" ON public.pedidos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Lojista e admin podem atualizar status
DROP POLICY IF EXISTS "pedidos_update" ON public.pedidos;
CREATE POLICY "pedidos_update" ON public.pedidos
  FOR UPDATE USING (
    loja_id = (
      SELECT loja_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'lojista'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Criar admin padrão (ajuste o email)
-- Após executar, vá em Auth > Users no Supabase e crie o usuário manualmente
-- Depois execute:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid-do-admin>';

-- 7. Ativar Realtime na tabela pedidos
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
