-- Adiciona coluna para controlar expiração da promoção relâmpago
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS promocao_data_fim TIMESTAMPTZ;
