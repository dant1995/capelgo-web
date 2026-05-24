-- TechZone Eletrônicos
INSERT INTO public.produtos (loja_id, nome, preco, estoque_status, descricao, categoria)
SELECT id, 'Cabo USB-C 2m', 29.90, 'disponivel', 'Carregamento rápido 3A', 'acessorios' FROM public.lojas WHERE nome = 'TechZone Eletrônicos' UNION ALL
SELECT id, 'Fone Bluetooth TWS', 89.90, 'disponivel', 'Cancelamento de ruído', 'audio' FROM public.lojas WHERE nome = 'TechZone Eletrônicos' UNION ALL
SELECT id, 'Película Vidro 9H', 19.90, 'disponivel', 'Proteção para telas até 6.9"', 'acessorios' FROM public.lojas WHERE nome = 'TechZone Eletrônicos' UNION ALL
SELECT id, 'Carregador Turbo 65W', 69.90, 'disponivel', 'USB-C + USB-A', 'carregadores' FROM public.lojas WHERE nome = 'TechZone Eletrônicos' UNION ALL
SELECT id, 'Power Bank 10000mAh', 129.90, 'disponivel', 'Carrega 3 dispositivos', 'energia' FROM public.lojas WHERE nome = 'TechZone Eletrônicos' UNION ALL
SELECT id, 'Mouse Sem Fio 2.4GHz', 79.90, 'disponivel', 'DPI ajustável', 'informatica' FROM public.lojas WHERE nome = 'TechZone Eletrônicos';

-- Ferramentas do Bairro
INSERT INTO public.produtos (loja_id, nome, preco, estoque_status, descricao, categoria)
SELECT id, 'Furadeira 500W', 189.90, 'disponivel', 'Bivolt com maleta', 'ferramentas' FROM public.lojas WHERE nome = 'Ferramentas do Bairro' UNION ALL
SELECT id, 'Jogo de Chaves 8pç', 49.90, 'disponivel', 'Aço cromo-vanádio', 'ferramentas' FROM public.lojas WHERE nome = 'Ferramentas do Bairro' UNION ALL
SELECT id, 'Fita Isolante 10m', 8.90, 'disponivel', 'Alta resistência elétrica', 'materiais' FROM public.lojas WHERE nome = 'Ferramentas do Bairro' UNION ALL
SELECT id, 'Trena Digital 40m', 129.90, 'disponivel', 'Medidor a laser', 'medicao' FROM public.lojas WHERE nome = 'Ferramentas do Bairro';

-- Moda Ermelino
INSERT INTO public.produtos (loja_id, nome, preco, estoque_status, descricao, categoria)
SELECT id, 'Camiseta Básica Masculina', 39.90, 'disponivel', '100% algodão penteado', 'camisetas' FROM public.lojas WHERE nome = 'Moda Ermelino' UNION ALL
SELECT id, 'Calça Jeans Skinny', 129.90, 'disponivel', 'Elastano 2%', 'calcas' FROM public.lojas WHERE nome = 'Moda Ermelino' UNION ALL
SELECT id, 'Tênis Casual Unissex', 159.90, 'disponivel', 'Numeração 34-44', 'calcados' FROM public.lojas WHERE nome = 'Moda Ermelino';

-- Mercadinho Central
INSERT INTO public.produtos (loja_id, nome, preco, estoque_status, descricao, categoria)
SELECT id, 'Arroz Branco 5kg', 29.90, 'disponivel', 'Tipo 1 longo fino', 'graos' FROM public.lojas WHERE nome = 'Mercadinho Central' UNION ALL
SELECT id, 'Feijão Carioca 1kg', 8.90, 'disponivel', 'Grão tipo 1', 'graos' FROM public.lojas WHERE nome = 'Mercadinho Central' UNION ALL
SELECT id, 'Óleo de Soja 900ml', 7.50, 'disponivel', 'Refinado tipo 1', 'condimentos' FROM public.lojas WHERE nome = 'Mercadinho Central' UNION ALL
SELECT id, 'Detergente 500ml', 2.90, 'disponivel', 'Neutro concentrado', 'limpeza' FROM public.lojas WHERE nome = 'Mercadinho Central';

-- Farmácia Saúde+
INSERT INTO public.produtos (loja_id, nome, preco, estoque_status, descricao, categoria)
SELECT id, 'Dipirona 500mg 10cp', 9.90, 'disponivel', 'Analgésico e antitérmico', 'medicamentos' FROM public.lojas WHERE nome = 'Farmácia Saúde+' UNION ALL
SELECT id, 'Protetor Solar FPS50', 39.90, 'disponivel', 'Resistente à água', 'cosmeticos' FROM public.lojas WHERE nome = 'Farmácia Saúde+' UNION ALL
SELECT id, 'Vitamina C 1000mg', 29.90, 'disponivel', 'Efervescente + Zinco', 'suplementos' FROM public.lojas WHERE nome = 'Farmácia Saúde+';

-- Padaria Dona Maria
INSERT INTO public.produtos (loja_id, nome, preco, estoque_status, descricao, categoria)
SELECT id, 'Pão Francês (kg)', 14.90, 'disponivel', 'Fresquinho saindo do forno', 'paes' FROM public.lojas WHERE nome = 'Padaria Dona Maria' UNION ALL
SELECT id, 'Coxinha de Frango', 6.50, 'disponivel', 'Massa crocante', 'salgados' FROM public.lojas WHERE nome = 'Padaria Dona Maria' UNION ALL
SELECT id, 'Bolo de Cenoura', 45.00, 'disponivel', 'Forma inteira 10 pessoas', 'bolos' FROM public.lojas WHERE nome = 'Padaria Dona Maria' UNION ALL
SELECT id, 'Café Coado 500ml', 8.00, 'disponivel', 'Café 100% arábica', 'bebidas' FROM public.lojas WHERE nome = 'Padaria Dona Maria';
