-- Adiciona colunas de latitude/longitude nas tabelas lojas e profiles
-- Necessário para o mapa do entregador mostrar posições reais

ALTER TABLE public.lojas
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Atualizar lojas de exemplo com coordenadas reais de Ermelino Matarazzo, SP
UPDATE public.lojas SET
  latitude = -23.4892, longitude = -46.4839
WHERE nome = 'TechZone Eletrônicos' AND latitude IS NULL;

UPDATE public.lojas SET
  latitude = -23.4900, longitude = -46.4850
WHERE nome = 'Ferramentas do Bairro' AND latitude IS NULL;

UPDATE public.lojas SET
  latitude = -23.4885, longitude = -46.4825
WHERE nome = 'Moda Ermelino' AND latitude IS NULL;

UPDATE public.lojas SET
  latitude = -23.4870, longitude = -46.4810
WHERE nome = 'Mercadinho Central' AND latitude IS NULL;

UPDATE public.lojas SET
  latitude = -23.4910, longitude = -46.4840
WHERE nome = 'Farmácia Saúde+' AND latitude IS NULL;

UPDATE public.lojas SET
  latitude = -23.4895, longitude = -46.4835
WHERE nome = 'Padaria Dona Maria' AND latitude IS NULL;
