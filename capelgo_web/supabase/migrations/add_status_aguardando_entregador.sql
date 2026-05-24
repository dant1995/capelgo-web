-- Atualiza o CHECK constraint da tabela pedidos com todos os status usados pelo app
-- O código usa: pendente (após confirmar PIX), pago, em_preparo, preparando,
-- pronto, aguardando_entregador, saiu_para_entrega, entregue, cancelado

ALTER TABLE public.pedidos
DROP CONSTRAINT IF EXISTS pedidos_status_check;

ALTER TABLE public.pedidos
ADD CONSTRAINT pedidos_status_check
CHECK (status IN (
    'aguardando_pagamento',
    'pendente',
    'pago',
    'confirmado',
    'em_preparo',
    'preparando',
    'pronto',
    'aguardando_entregador',
    'saiu_para_entrega',
    'entregue',
    'cancelado'
));
