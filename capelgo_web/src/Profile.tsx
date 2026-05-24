import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, LogOut, ChevronRight, Settings, Wallet, Heart, Gift, Ticket, Truck, ShieldCheck, Store, Mail, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myPrizes, setMyPrizes] = useState<any[]>([]);
  const [selectedPolicyPage, setSelectedPolicyPage] = useState<any>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [saldoCashback, setSaldoCashback] = useState(0);
  const [cashbackHistorico, setCashbackHistorico] = useState<any[]>([]);
  const [showCarteira, setShowCarteira] = useState(false);

  const openPolicy = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('paginas')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .maybeSingle();

      if (data) {
        setSelectedPolicyPage(data);
      } else {
        const fallbacks: Record<string, any> = {
          privacidade: {
            titulo: 'Política de Privacidade',
            subtitulo: 'Saiba como protegemos seus dados no CapelGo',
            conteudo_html: `
              <div class="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p><strong>1. Coleta de Informações:</strong> Coletamos dados como seu nome, telefone, e-mail, geolocalização e histórico de pedidos para garantir que sua entrega chegue com rapidez e segurança.</p>
                <p><strong>2. Uso de Dados:</strong> Seus dados são utilizados exclusivamente para o processamento de compras, entrega de produtos por nossos parceiros logísticos e participação na roleta de prêmios.</p>
                <p><strong>3. Segurança:</strong> Utilizamos protocolos de segurança avançados e criptografia de ponta a ponta nas transações de pagamento via PIX.</p>
                <p><strong>4. Seus Direitos:</strong> Você pode, a qualquer momento, solicitar a exclusão de sua conta e de todos os seus dados pessoais armazenados em nossos servidores entrando em contato com o suporte.</p>
              </div>
            `,
            cor_tema: '#FF4D2D'
          },
          termos: {
            titulo: 'Termos de Uso',
            subtitulo: 'Regras de utilização da plataforma CapelGo',
            conteudo_html: `
              <div class="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p><strong>1. Adesão aos Termos:</strong> Ao criar uma conta e utilizar o CapelGo, você concorda integralmente com estes termos de intermediação de entrega expressa.</p>
                <p><strong>2. Serviços da Plataforma:</strong> O CapelGo conecta clientes, lojistas e entregadores independentes em uma rede inteligente de logística de bairro.</p>
                <p><strong>3. Pagamentos e Cancelamento:</strong> Os pagamentos são realizados via PIX. Cancelamentos de pedidos podem ser efetuados antes do início do preparo pela loja parceira.</p>
                <p><strong>4. Limitação de Responsabilidade:</strong> Nos esforçamos para garantir prazos de entrega precisos, contudo imprevistos climáticos ou de trânsito podem acarretar pequenas variações.</p>
              </div>
            `,
            cor_tema: '#6366F1'
          },
          devolucoes: {
            titulo: 'Políticas de Devolução',
            subtitulo: 'Regras de troca, cancelamento e reembolso',
            conteudo_html: `
              <div class="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p><strong>1. Direito de Arrependimento:</strong> Conforme o Código de Defesa do Consumidor, solicitações de devolução por arrependimento podem ser feitas em até 7 dias corridos após a entrega do produto.</p>
                <p><strong>2. Condição do Produto:</strong> O produto devolvido deve estar em sua embalagem original, sem sinais de uso ou consumo, acompanhado de eventuais lacres e brindes.</p>
                <p><strong>3. Processo de Reembolso:</strong> O reembolso de pagamentos aprovados via PIX será processado pela nossa equipe financeira em até 24 horas úteis diretamente para a chave do pagador original.</p>
                <p><strong>4. Suporte Rápido:</strong> Para iniciar um processo de troca ou devolução, basta acessar o detalhe do seu pedido na aba de histórico e clicar em "Ajuda" ou contatar o suporte direto.</p>
              </div>
            `,
            cor_tema: '#10B981'
          }
        };
        setSelectedPolicyPage(fallbacks[slug] || { titulo: 'Página Não Encontrada', conteudo_html: '<p>Esta página não foi configurada.</p>' });
      }
      setIsPolicyModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          setUser(null);
          return;
        }
        
        // Tenta buscar o perfil do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setUser({ ...session.user, ...profile });

        // Carrega prêmios ganhos
        const { data: prizes } = await supabase
          .from('premios_ganhos')
          .select('*, loja:lojas(nome)')
          .eq('cliente_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (prizes) setMyPrizes(prizes);

        // Carrega saldo cashback
        const { data: profileData } = await supabase
          .from('profiles')
          .select('saldo_cashback')
          .eq('id', session.user.id)
          .single();
        if (profileData) setSaldoCashback(profileData.saldo_cashback || 0);

        // Carrega histórico cashback
        const { data: historico } = await supabase
          .from('cashback_historico')
          .select('*')
          .eq('profile_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (historico) setCashbackHistorico(historico);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.clear();
      setUser(null);
      navigate('/login');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-shopee-orange border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto border-x border-gray-100 relative">
        <header className="shopee-gradient p-6 text-white text-center pb-10">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border-4 border-white/30">
            👤
          </div>
          <h1 className="text-xl font-bold mb-2">Bem-vindo(a) ao CapelGo!</h1>
          <p className="text-sm text-white/80">Faça login para gerenciar suas compras e prêmios.</p>
        </header>
        <main className="flex-1 px-6 -mt-6 flex flex-col justify-between pb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <button onClick={() => navigate('/login')} className="w-full bg-shopee-orange text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-[#d03d1e] transition-colors mb-3">
              Fazer Login
            </button>
            <button onClick={() => navigate('/register')} className="w-full bg-orange-50 text-shopee-orange font-bold py-3.5 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors">
              Criar Conta Grátis
            </button>
          </div>

          {/* INFORMAÇÕES DA EMPRESA & POLÍTICAS (CNPJ, CONTATOS, ETC.) */}
          <footer className="text-center py-6 space-y-4 border-t border-gray-200/60 mt-12">
            {/* Links Rápidos de Políticas */}
            <div className="flex justify-center items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <button 
                onClick={() => openPolicy('privacidade')}
                className="hover:text-shopee-orange transition-colors"
              >
                Privacidade
              </button>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <button 
                onClick={() => openPolicy('termos')}
                className="hover:text-shopee-orange transition-colors"
              >
                Termos
              </button>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <button 
                onClick={() => openPolicy('devolucoes')}
                className="hover:text-shopee-orange transition-colors"
              >
                Devoluções
              </button>
            </div>

            {/* Dados Fiscais da Empresa */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/40 shadow-xs space-y-1">
              <p className="text-[10px] font-black text-gray-700 tracking-tight flex items-center justify-center gap-1.5 uppercase">
                <Store size={10} className="text-shopee-orange" /> CapelGo - Lojas Capel Ltda
              </p>
              <p className="text-[9px] font-medium text-gray-400">
                CNPJ: 51.575.325/0001-33
              </p>
            </div>

            {/* Canais de Contato */}
            <div className="flex flex-col justify-center items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
              <a href="mailto:contatos@lojascapel.com" className="flex items-center gap-1 hover:text-shopee-orange transition-colors">
                <Mail size={11} className="text-slate-400" /> contatos@lojascapel.com
              </a>
              <a href="tel:08007779000" className="flex items-center gap-1 hover:text-shopee-orange transition-colors">
                <Phone size={11} className="text-slate-400" /> 0800 777 9000
              </a>
            </div>

            {/* Direitos Reservados */}
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest pt-2">
              © {new Date().getFullYear()} CapelGo. Todos os direitos reservados.
            </p>
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto border-x border-gray-100">
      {/* HEADER PERFIL */}
      <header className="shopee-gradient p-4 text-white sticky top-0 z-30">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="text-white p-1 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex gap-4">
            <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <Settings size={22} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pb-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-md border-2 border-white ${user?.role === 'lojista' ? 'bg-orange-500' : 'bg-white'}`}>
            {user?.role === 'lojista' ? '🏪' : user?.role === 'admin' ? '🛡️' : user?.role === 'entregador' ? '🛵' : '👤'}
          </div>
          <div>
            <h1 className="text-lg font-bold">{user?.nome || user?.full_name || user?.email?.split('@')[0] || 'Usuário'}</h1>
            <p className="text-xs text-white/90 bg-black/10 px-2 py-0.5 rounded-full inline-block mt-1 font-black">
              {user?.role === 'lojista' ? '🔥 LOJISTA PARCEIRO' : user?.role === 'admin' ? '🛡️ ADMINISTRADOR' : user?.role === 'entregador' ? '🛵 ENTREGADOR' : '👤 MEMBRO CAPELGO'}
            </p>
            {/* DEBUG INFO - REMOVER DEPOIS */}
            <p className="text-[8px] text-white/50 mt-1">ID: {user?.id?.substring(0, 8)}... | Role: {user?.role}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {/* SEÇÃO: MEUS PEDIDOS */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
            <h2 className="font-bold text-gray-800">Meus Pedidos</h2>
            <button onClick={() => navigate('/meus-pedidos')} className="flex items-center text-xs text-gray-500 gap-1 hover:text-shopee-orange transition-colors">
              Ver histórico <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <MenuIcon icon={<Package size={24} />} label="Aguardando" onClick={() => navigate('/meus-pedidos')} />
            <MenuIcon icon={<Package size={24} />} label="Preparando" onClick={() => navigate('/meus-pedidos')} />
            <MenuIcon icon={<Package size={24} />} label="A Caminho" onClick={() => navigate('/meus-pedidos')} />
            <MenuIcon icon={<Package size={24} />} label="Entregue" onClick={() => navigate('/meus-pedidos')} />
          </div>
        </section>

        {/* SEÇÃO: FAVORITOS E CARTEIRA (Apenas visual para compor o app) */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 flex divide-x divide-gray-50">
           <div className="flex-1 p-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 rounded-l-xl transition-colors">
              <Heart size={20} className="text-shopee-orange" />
              <span className="text-xs font-medium text-gray-700">Favoritos</span>
           </div>
           <div className="flex-1 p-4 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-50 rounded-r-xl transition-colors" onClick={() => setShowCarteira(true)}>
               <Wallet size={20} className="text-shopee-orange" />
               <span className="text-xs font-medium text-gray-700">Carteira</span>
               {saldoCashback > 0 && <span className="text-[9px] font-black text-green-600 -mt-0.5">R$ {saldoCashback.toFixed(2)}</span>}
            </div>
        </section>

        {/* SEÇÃO: MEUS PRÊMIOS (NOVO!) */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
           <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-xs uppercase tracking-widest text-slate-800">Meus Prêmios & Cupons</h2>
              <Gift size={18} className="text-shopee-orange" />
           </div>
           
           {myPrizes.length > 0 ? (
              <div className="space-y-3">
                 {myPrizes.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm ${
                          p.tipo === 'produto' ? 'bg-blue-500' : p.tipo === 'cupom' ? 'bg-orange-500' : 'bg-green-500'
                       }`}>
                          {p.tipo === 'produto' ? <Gift size={20} /> : p.tipo === 'cupom' ? <Ticket size={20} /> : <Truck size={20} />}
                       </div>
                       <div className="flex-1">
                          <p className="text-[11px] font-black text-gray-800 uppercase leading-none">
                             {p.tipo === 'produto' ? 'Produto Grátis' : p.tipo === 'cupom' ? 'Cupom de Desconto' : 'Frete Grátis'}
                          </p>
                          <p className="text-[9px] text-gray-400 font-bold mt-1">Loja: {p.loja?.nome || 'Parceira'}</p>
                       </div>
                       <button 
                         onClick={() => navigate(`/loja/${p.loja_id}`)}
                         className="bg-white px-3 py-1.5 rounded-lg text-[9px] font-black text-shopee-orange border border-orange-100 shadow-sm"
                       >
                          RESGATAR
                       </button>
                    </div>
                 ))}
              </div>
           ) : (
              <div className="text-center py-6 border-2 border-dashed border-gray-50 rounded-2xl">
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Você ainda não tem prêmios.</p>
                 <button onClick={() => navigate('/')} className="text-[10px] font-black text-shopee-orange mt-2 uppercase">Girar Roleta Agora</button>
              </div>
           )}
        </section>

        {/* SEÇÃO: MAIS OPÇÕES */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {user?.role === 'admin' && (
             <MenuRow 
               icon={<ShieldCheck size={20} className="text-blue-600" />} 
               label="Painel do Administrador" 
               onClick={() => navigate('/admin')}
             />
          )}
          {user?.role === 'lojista' && (
             <MenuRow 
               icon={<Store size={20} className="text-shopee-orange" />} 
               label="Painel do Lojista" 
               onClick={() => navigate('/merchant')}
             />
          )}
          {user?.role === 'entregador' && (
             <MenuRow 
               icon={<Truck size={20} className="text-green-600" />} 
               label="Painel do Entregador" 
               onClick={() => navigate('/entregador')}
             />
          )}
          <MenuRow icon={<User size={20} />} label="Configurações da Conta" />
          <MenuRow 
            icon={<LogOut size={20} className="text-red-500" />} 
            label="Sair da Conta" 
            labelColor="text-red-500"
            onClick={handleLogout} 
            isLast 
          />
        </section>

        {/* INFORMAÇÕES DA EMPRESA & POLÍTICAS (CNPJ, CONTATOS, ETC.) */}
        <footer className="text-center py-6 px-4 space-y-4 border-t border-gray-100 mt-6">
          {/* Links Rápidos de Políticas */}
          <div className="flex justify-center items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <button 
              onClick={() => openPolicy('privacidade')}
              className="hover:text-shopee-orange transition-colors"
            >
              Privacidade
            </button>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <button 
              onClick={() => openPolicy('termos')}
              className="hover:text-shopee-orange transition-colors"
            >
              Termos
            </button>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <button 
              onClick={() => openPolicy('devolucoes')}
              className="hover:text-shopee-orange transition-colors"
            >
              Devoluções
            </button>
          </div>

          {/* Dados Fiscais da Empresa */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/40 shadow-xs space-y-1">
            <p className="text-[10px] font-black text-gray-700 tracking-tight flex items-center justify-center gap-1.5 uppercase">
              <Store size={10} className="text-shopee-orange" /> CapelGo - Lojas Capel Ltda
            </p>
            <p className="text-[9px] font-medium text-gray-400">
              CNPJ: 51.575.325/0001-33
            </p>
          </div>

          {/* Canais de Contato */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">
            <a href="mailto:contatos@lojascapel.com" className="flex items-center gap-1 hover:text-shopee-orange transition-colors">
              <Mail size={11} className="text-slate-400" /> contatos@lojascapel.com
            </a>
            <span className="hidden sm:inline text-gray-300">|</span>
            <a href="tel:08007779000" className="flex items-center gap-1 hover:text-shopee-orange transition-colors">
              <Phone size={11} className="text-slate-400" /> 0800 777 9000
            </a>
          </div>

          {/* Direitos Reservados */}
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest pt-2">
            © {new Date().getFullYear()} CapelGo. Todos os direitos reservados.
          </p>
        </footer>
      </main>

      {/* MODAL CARTEIRA */}
      <AnimatePresence>
        {showCarteira && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCarteira(false)} className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative bg-white w-full max-w-md h-[75vh] md:h-[550px] rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-10">
              <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
                <div>
                  <h3 className="text-sm font-black tracking-tight text-gray-800">Minha Carteira</h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">Cashback CapelGo</p>
                </div>
                <button onClick={() => setShowCarteira(false)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Saldo Disponível</p>
                  <p className="text-4xl font-black mt-1">R$ {saldoCashback.toFixed(2)}</p>
                  <p className="text-[10px] font-bold mt-2 opacity-70">Use no próximo pedido como forma de pagamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-gray-200"></div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Histórico de Cashback</h4>
                  <div className="h-[1px] flex-1 bg-gray-200"></div>
                </div>
                {cashbackHistorico.length > 0 ? cashbackHistorico.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black ${h.tipo === 'ganho' ? 'bg-green-500' : 'bg-red-500'}`}>{h.tipo === 'ganho' ? '+' : '-'}</div>
                      <div>
                        <p className="text-[11px] font-black text-gray-800 uppercase">{h.tipo === 'ganho' ? 'Cashback Recebido' : 'Cashback Utilizado'}</p>
                        <p className="text-[8px] text-gray-400 font-bold">{new Date(h.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-black ${h.tipo === 'ganho' ? 'text-green-600' : 'text-red-500'}`}>{h.tipo === 'ganho' ? '+' : '-'}R$ {Math.abs(parseFloat(h.valor || 0)).toFixed(2)}</span>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Wallet size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-[10px] font-bold text-gray-400">Nenhum cashback ainda</p>
                    <p className="text-[9px] text-gray-300 mt-1">Faça compras para ganhar cashback!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE POLÍTICAS E CMS */}
      <AnimatePresence>
        {isPolicyModalOpen && selectedPolicyPage && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsPolicyModalOpen(false)} 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs" 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              className="relative bg-white w-full max-w-md h-[75vh] md:h-[550px] rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0">
                <div>
                  <h3 className="text-sm font-black tracking-tight" style={{ color: selectedPolicyPage.cor_tema }}>
                    {selectedPolicyPage.titulo}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                    {selectedPolicyPage.subtitulo || 'Políticas Oficiais'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsPolicyModalOpen(false)} 
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                <div 
                  className="text-xs text-slate-600 leading-relaxed font-bold space-y-3"
                  dangerouslySetInnerHTML={{ __html: selectedPolicyPage.conteudo_html }}
                />
              </div>
              
              {/* Footer */}
              <div className="p-4 bg-white border-t flex justify-end">
                <button 
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-6 py-2 rounded-xl font-black text-[10px] text-white shadow-md active:scale-95 uppercase tracking-wider transition-transform"
                  style={{ backgroundColor: selectedPolicyPage.cor_tema || '#FF4D2D' }}
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuIcon({ icon, label, onClick }: any) {
  return (
    <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer group">
      <div className="text-gray-600 group-hover:text-shopee-orange transition-colors">
        {icon}
      </div>
      <span className="text-[10px] text-gray-600 font-medium text-center">{label}</span>
    </div>
  );
}

function MenuRow({ icon, label, labelColor = "text-gray-700", onClick, isLast }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!isLast ? 'border-b border-gray-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-500">
          {icon}
        </div>
        <span className={`text-sm font-medium ${labelColor}`}>{label}</span>
      </div>
      <ChevronRight size={18} className="text-gray-400" />
    </div>
  );
}
