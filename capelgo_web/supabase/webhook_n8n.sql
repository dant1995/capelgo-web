-- ============================================================
-- CapelGo: Database Webhook para n8n
-- Execute no Supabase SQL Editor
-- ============================================================

-- Habilita a extensão pg_net (necessária para HTTP calls)
-- Já vem habilitada no Supabase por padrão

-- Função que dispara POST para o n8n quando um pedido é inserido
CREATE OR REPLACE FUNCTION public.notify_n8n_novo_pedido()
RETURNS TRIGGER AS $$
DECLARE
  loja_telefone TEXT;
  loja_nome TEXT;
  payload JSONB;
BEGIN
  -- Busca dados da loja
  SELECT nome, telefone
  INTO loja_nome, loja_telefone
  FROM public.lojas
  WHERE id = NEW.loja_id;

  -- Monta payload completo
  payload := jsonb_build_object(
    'evento', 'novo_pedido',
    'pedido_id', NEW.id,
    'loja_id', NEW.loja_id,
    'loja_nome', loja_nome,
    'loja_telefone', loja_telefone,
    'cliente_id', NEW.cliente_id,
    'total', NEW.total,
    'status', NEW.status,
    'itens', NEW.itens,
    'endereco', NEW.endereco_entrega,
    'criado_em', NEW.created_at
  );

  -- Envia para o webhook do n8n (substitua pela URL real)
  PERFORM net.http_post(
    url := 'https://n8n-n8n.sd8jyi.easypanel.host/webhook/capelgo-pedidos',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: executa a função quando um pedido é inserido
DROP TRIGGER IF EXISTS trigger_novo_pedido_n8n ON public.pedidos;
CREATE TRIGGER trigger_novo_pedido_n8n
  AFTER INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_n8n_novo_pedido();

-- ============================================================
-- Função para notificar quando status muda para 'pago'
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_n8n_pedido_pago()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Só dispara quando muda para 'pago'
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    payload := jsonb_build_object(
      'evento', 'pedido_pago',
      'pedido_id', NEW.id,
      'loja_id', NEW.loja_id,
      'total', NEW.total,
      'itens', NEW.itens
    );

    PERFORM net.http_post(
      url := 'https://n8n-n8n.sd8jyi.easypanel.host/webhook/capelgo-pedidos',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := payload::text
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_pedido_pago_n8n ON public.pedidos;
CREATE TRIGGER trigger_pedido_pago_n8n
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_n8n_pedido_pago();
