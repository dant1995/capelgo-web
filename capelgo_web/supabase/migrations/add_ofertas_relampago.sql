CREATE TABLE IF NOT EXISTS public.ofertas_relampago (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    preco_promocional NUMERIC(10,2) NOT NULL CHECK (preco_promocional >= 0),
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT data_fim_maior_que_inicio CHECK (data_fim > data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_ofertas_relampago_produto ON public.ofertas_relampago(produto_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_relampago_datas ON public.ofertas_relampago(data_inicio, data_fim);

ALTER TABLE public.ofertas_relampago ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ofertas_relampago_public_read" ON public.ofertas_relampago
    FOR SELECT USING (true);

CREATE POLICY "ofertas_relampago_public_insert" ON public.ofertas_relampago
    FOR INSERT WITH CHECK (true);

CREATE POLICY "ofertas_relampago_public_update" ON public.ofertas_relampago
    FOR UPDATE USING (true);

CREATE POLICY "ofertas_relampago_public_delete" ON public.ofertas_relampago
    FOR DELETE USING (true);
