-- ============================================================
-- 🚀 CapelGo — Criação e Semeadura das Páginas de Políticas (CMS)
-- Execute este script no SQL Editor do seu Supabase
-- ============================================================

-- 1. Criar a tabela de páginas caso não exista
CREATE TABLE IF NOT EXISTS public.paginas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    slug TEXT UNIQUE NOT NULL,
    conteudo_html TEXT NOT NULL,
    cor_tema TEXT DEFAULT '#FF4D2D',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.paginas ENABLE ROW LEVEL SECURITY;

-- 3. Criar política de leitura pública (qualquer um pode ler páginas ativas)
DROP POLICY IF EXISTS "paginas_public_read" ON public.paginas;
CREATE POLICY "paginas_public_read" ON public.paginas
    FOR SELECT USING (ativo = true);

-- 4. Criar política de escrita/atualização para admins (pode ser customizado conforme RBAC)
DROP POLICY IF EXISTS "paginas_admin_all" ON public.paginas;
CREATE POLICY "paginas_admin_all" ON public.paginas
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Inserir/Semeador políticas profissionais padrão em Português (Brasil)
INSERT INTO public.paginas (slug, titulo, subtitulo, cor_tema, ativo, conteudo_html) VALUES
(
  'privacidade',
  'Política de Privacidade',
  'Saiba como protegemos seus dados no CapelGo',
  '#FF4D2D',
  true,
  '<div class="space-y-4 text-gray-600 text-sm leading-relaxed">
    <p class="font-bold text-gray-800">1. Compromisso com a Privacidade</p>
    <p>A <strong>CapelGo - Lojas Capel Ltda</strong>, registrada sob o CNPJ: 51.575.325/0001-33, está comprometida com a proteção e a transparência no tratamento dos dados pessoais de seus clientes, lojistas e entregadores parceiros.</p>
    
    <p class="font-bold text-gray-800">2. Coleta de Informações</p>
    <p>Para o funcionamento da plataforma de delivery de bairro, nós coletamos dados estritamente necessários, tais como:</p>
    <ul class="list-disc pl-5 space-y-1">
      <li><strong>Identificação:</strong> Nome completo, e-mail, telefone e número de cadastro.</li>
      <li><strong>Dados de Entrega:</strong> Geolocalização precisa, endereços de entrega e históricos de pedidos.</li>
      <li><strong>Dados de Pagamento:</strong> Registro de transações via PIX (não armazenamos dados bancários diretamente, apenas comprovantes de intermediação de frete).</li>
    </ul>

    <p class="font-bold text-gray-800">3. Uso das Informações</p>
    <p>Seus dados pessoais são utilizados com o único propósito de processar compras, otimizar rotas de entrega inteligente, viabilizar o chat com lojistas/suporte e garantir a participação segura na roleta de prêmios promocionais.</p>

    <p class="font-bold text-gray-800">4. Compartilhamento de Dados</p>
    <p>Nós não compartilhamos seus dados com terceiros para fins publicitários. As únicas informações compartilhadas são os dados estritamente necessários para os entregadores (como endereço e nome do recebedor) realizarem a logística expressa.</p>

    <p class="font-bold text-gray-800">5. Segurança da Informação</p>
    <p>Utilizamos protocolos modernos de segurança e criptografia de ponta a ponta em todos os endpoints para proteger seus registros contra vazamentos ou acessos não autorizados.</p>
  </div>'
),
(
  'termos',
  'Termos de Uso',
  'Regras de utilização da plataforma CapelGo',
  '#6366F1',
  true,
  '<div class="space-y-4 text-gray-600 text-sm leading-relaxed">
    <p class="font-bold text-gray-800">1. Aceite dos Termos</p>
    <p>Ao criar uma conta ou utilizar os serviços do aplicativo <strong>CapelGo</strong>, você concorda integralmente com estes Termos e Condições Gerais de Uso, aplicáveis a clientes, estabelecimentos comerciais e entregadores.</p>

    <p class="font-bold text-gray-800">2. Escopo dos Serviços</p>
    <p>O CapelGo atua exclusivamente como uma plataforma tecnológica de intermediação logística de bairro. Nós facilitamos o contato e a contratação direta de fretes rápidos entre Lojistas e Entregadores Parceiros para levar produtos aos Clientes Finais.</p>

    <p class="font-bold text-gray-800">3. Pagamentos e Cobranças</p>
    <ul class="list-disc pl-5 space-y-1">
      <li>As transações de produtos e custos de entrega na plataforma são intermediadas integralmente via <strong>PIX</strong>.</li>
      <li>As taxas de frete são calculadas dinamicamente com base na quilometragem e repassadas de forma transparente.</li>
      <li>O início da preparação dos produtos pelo Lojista está condicionado à confirmação de pagamento válida do PIX por parte do Administrador do sistema.</li>
    </ul>

    <p class="font-bold text-gray-800">4. Direitos e Deveres do Usuário</p>
    <p>Os usuários comprometem-se a fornecer informações verídicas e atualizadas sobre o endereço de entrega e a manter um tratamento cordial e respeitoso com lojistas e motoristas parceiros durante a entrega.</p>

    <p class="font-bold text-gray-800">5. Limitação de Responsabilidade</p>
    <p>Trabalhamos intensamente para manter a alta taxa de disponibilidade e agilidade nas entregas de bairro, contudo imprevistos mecânicos, de trânsito ou climáticos podem alterar prazos estimados originalmente.</p>
  </div>'
),
(
  'devolucoes',
  'Políticas de Devolução',
  'Regras de troca, cancelamento e reembolso',
  '#10B981',
  true,
  '<div class="space-y-4 text-gray-600 text-sm leading-relaxed">
    <p class="font-bold text-gray-800">1. Direito de Arrependimento</p>
    <p>Conforme previsto no Artigo 49 do Código de Defesa do Consumidor, o cliente tem o direito de solicitar a devolução de produtos adquiridos pela internet no prazo de até <strong>7 (sete) dias corridos</strong>, contados a partir do recebimento da entrega em sua residência.</p>

    <p class="font-bold text-gray-800">2. Condições para Devolução</p>
    <p>Para que a troca ou reembolso seja efetuado de forma ágil, o produto devolvido deve obrigatoriamente atender aos seguintes requisitos:</p>
    <ul class="list-disc pl-5 space-y-1">
      <li>Estar acondicionado em sua embalagem original completa.</li>
      <li>Não apresentar indícios ou sinais de uso, consumo, lavagem ou manipulação.</li>
      <li>Estar acompanhado de todos os eventuais manuais, acessórios e brindes que integraram o envio original.</li>
    </ul>

    <p class="font-bold text-gray-800">3. Processamento de Reembolso</p>
    <p>Uma vez que o estabelecimento lojista confirme o recolhimento do produto devolvido e a integridade de seu estado:</p>
    <ul class="list-disc pl-5 space-y-1">
      <li>O reembolso total dos valores pagos (incluindo o frete original) será efetuado pelo administrador via <strong>PIX</strong>.</li>
      <li>O estorno é concluído em até <strong>24 horas úteis</strong> diretamente para a mesma conta bancária de origem da chave PIX pagadora do pedido.</li>
    </ul>

    <p class="font-bold text-gray-800">4. Canais de Ajuda</p>
    <p>Caso necessite iniciar uma solicitação de devolução, você pode abrir o detalhamento do seu pedido na seção "Histórico", acionar o chat direto com o Lojista responsável pela venda, ou entrar em contato direto com o nosso suporte geral pelo e-mail <strong>contatos@lojascapel.com</strong> ou pelo telefone <strong>0800 777 9000</strong>.</p>
  </div>'
)
ON CONFLICT (slug) 
DO UPDATE SET 
    titulo = EXCLUDED.titulo,
    subtitulo = EXCLUDED.subtitulo,
    conteudo_html = EXCLUDED.conteudo_html,
    cor_tema = EXCLUDED.cor_tema,
    ativo = EXCLUDED.ativo,
    updated_at = NOW();
