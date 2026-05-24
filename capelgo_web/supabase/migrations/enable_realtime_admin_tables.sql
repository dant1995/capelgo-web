DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'produtos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.produtos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'banners') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.banners;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'categorias') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categorias;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'paginas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.paginas;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'saques') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.saques;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'premios_ganhos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.premios_ganhos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'configuracoes_sistema') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes_sistema;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lojas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lojas;
  END IF;
END;
$$;
