import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';

const TOPICS = [
  { id: 'central-de-ajuda', title: 'Central de Ajuda', content: 'Bem-vindo à nossa Central de Ajuda. Aqui você encontra respostas para as dúvidas mais frequentes sobre o CapelGo. Se precisar de mais assistência, entre em contato através da página Fale Conosco.' },
  { id: 'como-comprar', title: 'Como Comprar', content: 'Comprar no CapelGo é fácil e seguro.\n\n1) Busque seu produto ou navegue pelas categorias.\n2) Adicione ao carrinho.\n3) Faça login ou crie sua conta.\n4) Escolha a forma de pagamento e finalize a compra.\n\nAcompanhe o status do pedido na seção "Meus Pedidos".' },
  { id: 'metodos-de-pagamento', title: 'Métodos de Pagamento', content: 'Aceitamos diversas formas de pagamento para sua comodidade:\n\n- PIX (Aprovação Imediata e Segura)\n- Cartões de Crédito (Visa, Mastercard, Elo, Amex) com opções de parcelamento\n- Boleto Bancário (Aprovação em até 2 dias úteis).' },
  { id: 'garantia', title: 'Garantia CapelGo', content: 'A Garantia CapelGo assegura que o seu pagamento só é liberado para o vendedor após você receber o produto e confirmar que está tudo certo. Se houver problemas com o recebimento ou com o item, nós intermediamos a devolução do seu dinheiro de forma rápida e segura.' },
  { id: 'devolucao-e-reembolso', title: 'Devolução e Reembolso', content: 'Você tem até 7 dias corridos após o recebimento do produto para solicitar a devolução por arrependimento sem nenhum custo extra. Para produtos com defeito de fabricação, os prazos variam conforme a legislação do Código de Defesa do Consumidor. A devolução do pagamento é feita na mesma forma original de pagamento.' },
  { id: 'fale-conosco', title: 'Fale Conosco', content: 'Precisa de ajuda com o seu pedido ou possui outras dúvidas? Fale com a gente através dos nossos canais de atendimento exclusivos.\n\nWhatsApp: (00) 00000-0000\nE-mail: suporte@capelgo.com\n\nNosso horário de atendimento é de Segunda a Sexta-feira, das 08h às 18h.' },
  { id: 'ouvidoria', title: 'Ouvidoria', content: 'A Ouvidoria da CapelGo atua como a última instância de atendimento para a solução de questões que não puderam ser resolvidas pela nossa Central de Relacionamento. Nosso objetivo é mediar de forma imparcial e justa.\n\nPara contatar, envie um e-mail detalhado para: ouvidoria@capelgo.com' },
  { id: 'sobre-nos', title: 'Sobre a CapelGo', content: 'O CapelGo é um marketplace revolucionário projetado para conectar grandes e pequenos lojistas aos clientes com extrema rapidez, segurança e total transparência. Trabalhamos incessantemente para oferecer as melhores ofertas, a melhor experiência de usuário e construir uma rede de entregadores hiperlocal e eficiente.' },
  { id: 'politicas', title: 'Políticas CapelGo', content: 'Nossas políticas são desenhadas rigorosamente para garantir um ambiente justo, seguro e confiável para todos os usuários — tanto compradores quanto vendedores.\n\nÉ estritamente proibida a comercialização de produtos ilícitos, falsificados, medicamentos controlados ou qualquer item que infrinja direitos autorais em nossa plataforma.' },
  { id: 'privacidade', title: 'Política de Privacidade', content: 'Nós levamos a proteção dos seus dados a sério. Todos os seus dados pessoais, históricos de compra e informações financeiras são criptografados de ponta a ponta.\n\nNão vendemos ou compartilhamos suas informações sensíveis com empresas terceiras sem o seu consentimento explícito, seguindo rigorosamente a LGPD (Lei Geral de Proteção de Dados).' },
  { id: 'afiliados', title: 'Programa de Afiliados', content: 'Indique o CapelGo para seus amigos e seguidores e ganhe comissões!\n\nAo se inscrever no nosso programa de afiliados, você recebe um link exclusivo para divulgar nossos produtos. Sempre que uma compra for finalizada e paga através do seu link, um percentual é depositado diretamente na sua carteira digital CapelGo.' }
];

export default function Institucional() {
  const { topico } = useParams();
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]);

  useEffect(() => {
    if (topico) {
      const found = TOPICS.find(t => t.id === topico);
      if (found) {
        setActiveTopic(found);
      } else {
        setActiveTopic(TOPICS[0]);
      }
    }
  }, [topico]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto w-full px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-[#EE4D2D] hover:bg-orange-50 p-2 rounded-full transition-colors md:hidden">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-black text-[#EE4D2D] italic tracking-tighter cursor-pointer" onClick={() => navigate('/')}>CapelGo</h1>
            <span className="hidden md:block text-gray-400 text-sm border-l border-gray-300 pl-4 ml-2">Portal Institucional</span>
          </div>
          <button onClick={() => navigate('/')} className="text-sm font-bold text-gray-600 hover:text-[#EE4D2D]">Voltar para Loja</button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto w-full px-4 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Menu Lateral Desktop */}
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden sticky top-24">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h2 className="font-black text-gray-800 uppercase tracking-wider text-sm">Tópicos</h2>
            </div>
            <ul className="flex flex-col py-2">
              {TOPICS.map(t => (
                <li 
                  key={t.id}
                  onClick={() => navigate(`/institucional/${t.id}`)}
                  className={`px-4 py-3 cursor-pointer text-sm font-medium border-l-4 transition-colors ${activeTopic.id === t.id ? 'border-[#EE4D2D] text-[#EE4D2D] bg-orange-50/50' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                >
                  {t.title}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Menu Dropdown Mobile */}
        <div className="w-full md:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-600">Navegar por:</span>
          <select 
            value={activeTopic.id}
            onChange={(e) => navigate(`/institucional/${e.target.value}`)}
            className="bg-gray-50 border border-gray-200 text-sm font-bold text-[#EE4D2D] p-2 rounded outline-none w-2/3"
          >
            {TOPICS.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {/* Conteúdo Central */}
        <section className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-10 min-h-[500px]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-6 uppercase tracking-wider">
            <span>Institucional</span>
            <ChevronRight size={14} />
            <span className="text-[#EE4D2D]">{activeTopic.title}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-6">{activeTopic.title}</h2>
          
          <div className="prose prose-sm md:prose-base max-w-none text-gray-600 leading-relaxed space-y-4">
            {activeTopic.content.split('\n').map((paragraph, idx) => {
              if (!paragraph.trim()) return <br key={idx} />;
              return <p key={idx} className="mb-2">{paragraph}</p>;
            })}
            
            <div className="mt-12 p-6 bg-orange-50 rounded-xl border border-orange-100">
              <h3 className="text-[#EE4D2D] font-bold mb-2">Ainda precisa de ajuda?</h3>
              <p className="text-sm text-gray-600 mb-4">Nossa equipe de suporte está pronta para te atender de Segunda a Sexta, das 08h às 18h.</p>
              <button 
                onClick={() => navigate('/institucional/fale-conosco')}
                className="bg-[#EE4D2D] hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm"
              >
                Ver Canais de Atendimento
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
