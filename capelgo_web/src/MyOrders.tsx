import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Clock, 
  Truck, 
  CheckCircle2, 
  ChevronRight,
  MessageCircle,
  Package,
  ShieldCheck,
  Send,
  X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pedidos'); // 'pedidos' ou 'mensagens'
  
  // CHAT STATES
  const [selectedChatPedido, setSelectedChatPedido] = useState<any>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'chat') setActiveTab('mensagens');
  }, [location]);

  const [trackingPedido, setTrackingPedido] = useState<any>(null);

  // Carregar Leaflet via CDN
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let pollInterval: any;

    async function loadMyOrders() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      const user = session.user;
      if (!active) return;
      setUserId(user.id);

      console.log('Buscando pedidos para o usuário:', user.id);
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, lojas(*)')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error('Erro Supabase:', error);
      console.log('Pedidos encontrados:', data);

      if (!error && data) {
        if (!active) return;
        setPedidos(data);
        const activeOrder = data.find(p => ['em_coleta', 'saiu_para_entrega'].includes(p.status));
        if (activeOrder) setTrackingPedido(activeOrder);

        // Buscar mensagens históricas para povoar a aba "Conversas" imediatamente
        const orderIds = data.map(p => p.id);
        let msgQuery = supabase.from('mensagens').select('*');
        if (orderIds.length > 0) {
           msgQuery = msgQuery.or(`pedido_id.in.(${orderIds.join(',')}),remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`);
        } else {
           msgQuery = msgQuery.or(`remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`);
        }

        const { data: messagesData, error: msgError } = await msgQuery.order('created_at', { ascending: true });
        if (!msgError && messagesData && active) {
           setMensagens(messagesData);
        }

        // Configurar o Polling ativo
        pollInterval = setInterval(async () => {
           let pollQuery = supabase.from('mensagens').select('*');
           if (orderIds.length > 0) {
              pollQuery = pollQuery.or(`pedido_id.in.(${orderIds.join(',')}),remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`);
           } else {
              pollQuery = pollQuery.or(`remetente_id.eq.${user.id},destinatario_id.eq.${user.id}`);
           }

           const { data: pollData } = await pollQuery.order('created_at', { ascending: true });
           if (pollData && pollData.length > 0 && active) {
              setMensagens(prev => {
                 const ids = new Set(prev.map(m => m.id));
                 const news = pollData.filter(m => !ids.has(m.id));
                 if (news.length === 0) return prev;
                 return [...prev, ...news];
              });
           }
        }, 3000);
      }
      if (active) setLoading(false);
    }
    loadMyOrders();

    const channel = supabase.channel('client_realtime_chats')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, (payload) => {
        setPedidos(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
        if (['em_coleta', 'saiu_para_entrega'].includes(payload.new.status)) {
            setTrackingPedido(payload.new);
        } else if (payload.new.status === 'entregue') {
            setTrackingPedido(null);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        setMensagens(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => { 
       active = false;
       if (pollInterval) clearInterval(pollInterval);
       supabase.removeChannel(channel);
    };
  }, [navigate]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedChatPedido || !userId) return;

    const messageText = chatInput;
    setChatInput('');

    const isSupport = selectedChatPedido.id === 'suporte';
    const { data, error } = await supabase.from('mensagens').insert({
       pedido_id: isSupport ? null : selectedChatPedido.id,
       remetente_id: userId,
       tipo_remetente: 'cliente',
       texto: messageText,
       tipo: 'texto'
    }).select().single();

    if (!error && data) {
       setMensagens(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
       });
    } else if (error) {
       console.error('Erro ao enviar mensagem:', error);
       // Fallback local
       const newMessage = {
          id: Date.now(),
          pedido_id: isSupport ? null : selectedChatPedido.id,
          remetente_id: userId,
          tipo_remetente: 'cliente',
          texto: messageText,
          tipo: 'texto',
          created_at: new Date().toISOString()
       };
       const localMsgs = JSON.parse(localStorage.getItem('capelgo_local_chat') || '[]');
       localStorage.setItem('capelgo_local_chat', JSON.stringify([...localMsgs, newMessage]));
       setMensagens(prev => [...prev, newMessage]);
       window.dispatchEvent(new Event('storage'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto border-x border-gray-100">
      {/* HEADER */}
      <header className="bg-white p-4 flex items-center gap-4 sticky top-0 z-30 border-b">
         <button onClick={() => navigate(-1)} className="text-shopee-orange">
            <ArrowLeft size={24} />
         </button>
         <h1 className="text-lg font-bold text-gray-800">Minha Atividade</h1>
      </header>

      {/* TABS */}
      <div className="bg-white border-b flex px-4">
        <button 
          onClick={() => setActiveTab('pedidos')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pedidos' ? 'border-shopee-orange text-shopee-orange' : 'border-transparent text-gray-400'}`}
        >
          Pedidos
        </button>
        <button 
          onClick={() => setActiveTab('mensagens')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'mensagens' ? 'border-shopee-orange text-shopee-orange' : 'border-transparent text-gray-400'}`}
        >
          Conversas
        </button>
      </div>

       <main className="flex-1 p-4 space-y-4 overflow-y-auto">
          {activeTab === 'pedidos' && (
            <>
          {/* CARD DE ACOMPANHAMENTO REALTIME */}
          {trackingPedido && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => navigate(`/rastreio/${trackingPedido.id}`)}
              className="bg-slate-900 text-white rounded-[32px] p-6 shadow-xl border border-white/5 space-y-6 overflow-hidden relative cursor-pointer active:scale-95 transition-transform"
            >
               <div className="relative z-10">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-[10px] font-black text-shopee-orange uppercase tracking-widest mb-1">Acompanhando Entrega</p>
                        <h3 className="text-xl font-black tracking-tighter">
                           {trackingPedido.status === 'saiu_para_entrega' 
                             ? (trackingPedido.geolocalizacao_entregador?.entregador_id ? 'Seu pedido está a caminho!' : 'Pedido pronto para coleta') 
                             : 'Seu pedido está em preparo'}
                        </h3>
                     </div>
                     <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">🏍️</div>
                  </div>

                  {/* MAPA MINI */}
                  <div className="h-32 bg-slate-800 rounded-2xl overflow-hidden relative border border-white/10">
                     <TrackingMap position={trackingPedido.geolocalizacao_entregador} />
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                     <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Código de Entrega</p>
                        <p className="text-2xl font-black tracking-[0.3em] text-shopee-orange">
                           {(trackingPedido.id || '').toString().slice(-4).toUpperCase().split('').join(' ')}
                        </p>
                     </div>
                     <ShieldCheck size={24} className="text-white/20" />
                  </div>

                  <div className="space-y-1">
                     <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-bold text-gray-400">
                           {trackingPedido.status === 'saiu_para_entrega' ? (trackingPedido.geolocalizacao_entregador?.entregador_id ? 'Em rota de entrega' : 'Aguardando coleta') : 'Em processo de preparo'}
                        </p>
                        <p className="text-[10px] font-black text-shopee-orange">Ao vivo</p>
                     </div>
                     <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: "30%" }}
                                                     animate={{ width: trackingPedido.status === 'saiu_para_entrega' ? (trackingPedido.geolocalizacao_entregador?.entregador_id ? '85%' : '60%') : '40%' }}

                          className="h-full bg-shopee-orange rounded-full transition-all duration-1000" 
                        />
                     </div>
                  </div>
               </div>
               <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-shopee-orange/10 rounded-full blur-3xl" />
            </motion.div>
          )}

          {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <div className="w-8 h-8 border-4 border-shopee-orange border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Buscando seus pedidos...</p>
           </div>
         ) : pedidos.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm">🛒</div>
              <h2 className="text-lg font-bold text-gray-800">Você ainda não comprou nada</h2>
              <p className="text-sm text-gray-500 max-w-[200px]">Que tal conferir as ofertas imperdíveis de hoje?</p>
              <button onClick={() => navigate('/')} className="bg-shopee-orange text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-shopee-orange/20">Ver Ofertas</button>
           </div>
         ) : (
           pedidos.map(p => (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key={p.id} 
               className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4"
             >
                {/* Loja e Status */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-lg">🏪</div>
                      <div>
                         <p className="text-sm font-bold text-gray-800">{p.lojas?.nome || 'Loja Oficial'}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(p.created_at).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <StatusBadge status={p.status} />
                </div>

                {/* Itens e Total */}
                <div className="space-y-2">
                   <p className="text-xs text-gray-500 font-medium">Itens:</p>
                   <div className="space-y-1">
                      {p.itens?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs text-gray-700">
                           <span>{item.quantidade}x {item.nome}</span>
                           <span className="font-bold">R${(item.preco * item.quantidade).toFixed(2)}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Pago</span>
                   <span className="text-lg font-black text-shopee-orange">R${p.total}</span>
                </div>

                {/* Barra de Progresso Rápida */}
                <div className="py-2">
                   <TrackingBar status={p.status} />
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2">
                   {['saiu_para_entrega', 'em_coleta', 'entregue'].includes(p.status) && (
                      <button 
                        onClick={() => navigate(`/rastreio/${p.id}`)}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-slate-200"
                      >
                         <Truck size={16} /> {p.status === 'entregue' ? 'Ver Detalhes/Avaliar' : 'Rastrear no Mapa'}
                      </button>
                   )}
                   <div className="flex gap-2">
                      <button 
                        onClick={() => {
                           setSelectedChatPedido(p);
                           supabase.from('mensagens')
                              .select('*')
                              .eq('pedido_id', p.id)
                              .order('created_at', { ascending: true })
                              .then(({ data }) => data && setMensagens(prev => {
                                 const ids = new Set(prev.map(m => m.id));
                                 const news = data.filter(m => !ids.has(m.id));
                                 return [...prev, ...news];
                              }));
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-orange-50 text-shopee-orange py-2.5 rounded-xl font-bold text-xs"
                      >
                         <MessageCircle size={16} /> Chat
                      </button>
                      <button 
                        onClick={() => window.open(`https://wa.me/55${p.lojas?.phone?.replace(/\D/g,'')}`, '_blank')}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 py-2.5 rounded-xl font-bold text-xs"
                      >
                         WhatsApp
                      </button>
                   </div>
                </div>
             </motion.div>
           ))
         )}
            </>
          )}

          {activeTab === 'mensagens' && (
            <div className="space-y-4">
              {pedidos.filter(p => mensagens.some(m => m.pedido_id === p.id)).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                   <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-4xl shadow-sm text-shopee-orange">💬</div>
                   <h2 className="text-lg font-bold text-gray-800">Nenhuma conversa ativa</h2>
                   <p className="text-sm text-gray-500 max-w-[240px]">Suas conversas com as lojas sobre seus pedidos aparecerão aqui.</p>
                   
                   <div className="pt-6 w-full max-w-[280px]">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">Precisa de ajuda?</p>
                      <button 
                        onClick={() => {
                           setSelectedChatPedido({ id: 'suporte', lojas: { nome: 'Suporte CapelGo' } });
                           // Carregar mensagens de suporte
                           supabase.from('mensagens')
                              .select('*')
                              .is('pedido_id', null)
                              .eq('remetente_id', userId)
                              .order('created_at', { ascending: true })
                              .then(({ data }) => data && setMensagens(prev => {
                                 const ids = new Set(prev.map(m => m.id));
                                 const news = data.filter(m => !ids.has(m.id));
                                 return [...prev, ...news];
                              }));
                        }}
                        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 p-4 rounded-2xl hover:border-shopee-orange transition-colors group"
                      >
                         <div className="w-10 h-10 bg-shopee-orange rounded-xl flex items-center justify-center text-white shadow-lg shadow-shopee-orange/20">
                            <ShieldCheck size={20} />
                         </div>
                         <div className="text-left">
                            <p className="text-xs font-bold text-gray-800 group-hover:text-shopee-orange">Suporte CapelGo</p>
                            <p className="text-[10px] text-gray-400">Falar com um atendente</p>
                         </div>
                      </button>
                   </div>
                </div>
              ) : (
                pedidos.filter(p => mensagens.some(m => m.pedido_id === p.id)).map(p => {
                   const lastMsg = [...mensagens].reverse().find(m => m.pedido_id === p.id);
                   return (
                      <div 
                        key={p.id}
                        onClick={() => {
                           setSelectedChatPedido(p);
                        }}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-shopee-orange/30 transition-all"
                      >
                         <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl">🏪</div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start">
                               <h4 className="text-sm font-bold text-gray-800">{p.lojas?.nome || 'Loja'}</h4>
                               <span className="text-[9px] text-gray-400">{lastMsg?.created_at ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">{lastMsg?.texto || 'Clique para ver a conversa'}</p>
                         </div>
                         <ChevronRight size={16} className="text-gray-300" />
                      </div>
                   )
                })
              )}
            </div>
          )}
       </main>

       {/* MODAL CHAT */}
       <AnimatePresence>
          {selectedChatPedido && (
             <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   exit={{ opacity: 0 }} 
                   onClick={() => setSelectedChatPedido(null)} 
                   className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
                />
                <motion.div 
                   initial={{ y: "100%" }} 
                   animate={{ y: 0 }} 
                   exit={{ y: "100%" }} 
                   className="relative bg-white w-full max-w-md h-[80vh] md:h-[600px] rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
                >
                   {/* Header Chat */}
                   <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">🏪</div>
                         <div>
                            <h4 className="text-sm font-bold text-gray-800">{selectedChatPedido.lojas?.nome || 'Loja'}</h4>
                            <p className="text-[10px] text-green-500 font-bold uppercase">Online agora</p>
                         </div>
                      </div>
                      <button onClick={() => setSelectedChatPedido(null)} className="p-2 text-gray-400 hover:text-gray-600">
                         <X size={20} />
                      </button>
                   </div>

                   {/* Lista de Mensagens */}
                   <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                      {mensagens.filter(m => {
                          if (selectedChatPedido.id === 'suporte') {
                             return m.pedido_id === null && (m.remetente_id === userId || m.destinatario_id === userId) && (m.tipo_remetente === 'cliente' || m.tipo_remetente === 'admin');
                          }
                          return m.pedido_id === selectedChatPedido.id && (m.tipo_remetente === 'cliente' || m.tipo_remetente === 'lojista');
                       }).map(m => (
                          <div key={m.id} className={`flex ${m.remetente_id === userId ? 'justify-end' : 'justify-start'}`}>
                             <div className={`p-3 rounded-2xl max-w-[80%] text-xs font-bold shadow-sm ${
                                m.remetente_id === userId ? 'bg-shopee-orange text-white rounded-tr-none' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                             }`}>
                                {m.texto}
                                <p className={`text-[7px] mt-1 text-right ${m.remetente_id === userId ? 'text-white/70' : 'text-gray-300'}`}>
                                   {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                             </div>
                          </div>
                       ))}
                       {mensagens.filter(m => {
                          if (selectedChatPedido.id === 'suporte') {
                             return m.pedido_id === null && (m.remetente_id === userId || m.destinatario_id === userId) && (m.tipo_remetente === 'cliente' || m.tipo_remetente === 'admin');
                          }
                          return m.pedido_id === selectedChatPedido.id && (m.tipo_remetente === 'cliente' || m.tipo_remetente === 'lojista');
                       }).length === 0 && (
                         <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                            <MessageCircle size={48} className="text-gray-300 mb-2" />
                            <p className="text-[10px] font-black uppercase text-gray-400">{selectedChatPedido.id === 'suporte' ? 'Fale com nosso time de suporte' : 'Inicie uma conversa com a loja'}</p>
                         </div>
                      )}
                   </div>

                   {/* Input Chat */}
                   <div className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
                      <input 
                         type="text" 
                         value={chatInput}
                         onChange={(e) => setChatInput(e.target.value)}
                         onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                         placeholder="Escreva sua mensagem..."
                         className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-shopee-orange"
                      />
                      <button 
                         onClick={sendMessage}
                         className="w-12 h-12 bg-shopee-orange text-white rounded-2xl flex items-center justify-center shadow-lg shadow-shopee-orange/20"
                      >
                         <Send size={20} />
                      </button>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    'confirmado': { color: 'bg-orange-100 text-orange-600', label: 'Confirmado' },
    'pendente': { color: 'bg-orange-100 text-orange-600', label: 'Aguardando' },
    'em_preparo': { color: 'bg-blue-100 text-blue-600', label: 'Preparando' },
    'pronto': { color: 'bg-yellow-100 text-yellow-600', label: 'Pronto' },
    'em_coleta': { color: 'bg-purple-100 text-purple-600', label: 'Em Coleta' },
    'saiu_para_entrega': { color: 'bg-green-100 text-green-600', label: 'Em Rota' },
    'entregue': { color: 'bg-gray-100 text-gray-600', label: 'Entregue' }
  };
  const config = configs[status] || configs['pendente'];
  return (
    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${config.color}`}>
       {config.label}
    </span>
  );
}

function TrackingBar({ status }: { status: string }) {
  const steps = ['pendente', 'em_preparo', 'pronto', 'saiu_para_entrega', 'entregue'];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-center justify-between px-2">
       {steps.map((step, i) => (
         <div key={step} className="flex flex-col items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${i <= currentIndex ? 'bg-shopee-orange' : 'bg-gray-200'}`} />
            <div className={`text-[7px] font-bold uppercase ${i <= currentIndex ? 'text-shopee-orange' : 'text-gray-300'}`}>
               {step.replace(/_/g, ' ')}
            </div>
         </div>
       ))}
    </div>
  );
}

function TrackingMap({ position }: { position: any }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const marker = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current && window.L && position) {
      const L = window.L;
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([position.lat, position.lng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap.current);
      
      marker.current = L.marker([position.lat, position.lng]).addTo(leafletMap.current);
    }
  }, [position]);

  useEffect(() => {
     if (leafletMap.current && marker.current && position) {
        marker.current.setLatLng([position.lat, position.lng]);
        leafletMap.current.panTo([position.lat, position.lng]);
     }
  }, [position]);

  return <div ref={mapRef} className="w-full h-full" />;
}
