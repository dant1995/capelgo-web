-- Atualiza perfis de cliente que estão com nome NULL
-- Usa o prefixo do email como fallback (ex: joao@gmail.com → 'joao')
UPDATE public.profiles
SET nome = SPLIT_PART(
  (SELECT email FROM auth.users WHERE id = profiles.id),
  '@', 1
)
WHERE (nome IS NULL OR nome = '')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = profiles.id);

-- Também atualiza telefone se estiver vazio
-- (opcional, descomente se quiser)
-- UPDATE public.profiles
-- SET telefone = '(11) 99999-9999'
-- WHERE (telefone IS NULL OR telefone = '')
--   AND role = 'cliente';
