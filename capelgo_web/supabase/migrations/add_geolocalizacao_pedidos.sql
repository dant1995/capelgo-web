-- Adiciona colunas JSONB de geolocalização no pedido
ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS geolocalizacao_cliente JSONB,
ADD COLUMN IF NOT EXISTS geolocalizacao_loja JSONB;
