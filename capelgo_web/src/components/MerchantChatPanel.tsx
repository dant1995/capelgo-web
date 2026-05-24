import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  MessageCircle, 
  Send, 
  User, 
  ShoppingBag, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  MessageSquare,
  Search,
  ArrowLeft,
  Store,
  Package,
  ExternalLink,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MerchantChatPanelProps {
  pedidos: any[];
  currentUserProfile: any;
  lojaData: any;
  onNavigateToOrder?: (orderId: string) => void;
}

export default function MerchantChatPanel({ pedidos, currentUserProfile, lojaData, onNavigateToOrder }: MerchantChatPanelProps) {
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [chatMode, setChatMode] = useState<'cliente' | 'entregador'>('cliente');
  const [deliveryPersonProfile, setDeliveryPersonProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filtros de Pedido
  const orderIds = pedidos.map(p => p.id);

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages, selectedPedido]);

  // Carregar mensagens do Supabase
  useEffect(() => {
    if (orderIds.length === 0) {
      setLoading(false);
      return;
    }

    async function loadMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .in('pedido_id', orderIds)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar mensagens do chat:', error);
      } else if (data) {
        setAllMessages(data);
      }
      setLoading(false);
    }

    loadMessages();

    // ⚡ Supabase Realtime Subscription para receber mensagens instantaneamente
    const channel = supabase.channel('merchant_realtime_chats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensagens' },
        (payload) => {
          if (orderIds.includes(payload.new.pedido_id)) {
            setAllMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    // 🔄 Fallback Polling para garantir tempo real no Lojista
    const pollInterval = setInterval(async () => {
       if (orderIds.length === 0) return;
       const { data } = await supabase
         .from('mensagens')
         .select('*')
         .in('pedido_id', orderIds)
         .order('created_at', { ascending: true });

       if (data && data.length > 0) {
          setAllMessages(prev => {
             const ids = new Set(prev.map(m => m.id));
             const news = data.filter(m => !ids.has(m.id));
             if (news.length === 0) return prev;
             return [...prev, ...news];
          });
       }
    }, 3000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [pedidos]);

  // Buscar perfil do entregador quando o modo mudar
  const entregadorId = selectedPedido?.geolocalizacao_entregador?.entregador_id;

  useEffect(() => {
    if (chatMode === 'entregador' && entregadorId) {
      supabase.from('profiles').select('*').eq('id', entregadorId).single().then(({ data }) => {
        if (data) setDeliveryPersonProfile(data);
      });
    } else {
      setDeliveryPersonProfile(null);
    }
  }, [chatMode, entregadorId]);

  // Resetar modo quando mudar de pedido
  useEffect(() => {
    setChatMode('cliente');
    setDeliveryPersonProfile(null);
  }, [selectedPedido?.id]);

  // Enviar Mensagem
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedPedido || !currentUserProfile) return;

    const messageText = chatInput;
    setChatInput('');

    const messagePayload: any = {
      pedido_id: selectedPedido.id,
      remetente_id: currentUserProfile.id,
      tipo_remetente: 'lojista',
      texto: messageText,
      tipo: 'texto'
    };

    if (chatMode === 'entregador' && entregadorId) {
      messagePayload.destinatario_id = entregadorId;
    }

    const { data, error } = await supabase
      .from('mensagens')
      .insert(messagePayload)
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      const fallbackMsg: any = {
        id: Date.now().toString(),
        pedido_id: selectedPedido.id,
        remetente_id: currentUserProfile.id,
        tipo_remetente: 'lojista',
        texto: messageText,
        tipo: 'texto',
        created_at: new Date().toISOString()
      };
      if (chatMode === 'entregador' && entregadorId) {
        fallbackMsg.destinatario_id = entregadorId;
      }
      setAllMessages(prev => [...prev, fallbackMsg]);
    } else if (data) {
      setAllMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  };

  // Agrupar pedidos que possuem conversas
  const activeChats = pedidos.map(pedido => {
    const pedidoMsgs = allMessages.filter(m => 
      m.pedido_id === pedido.id && (m.tipo_remetente === 'cliente' || m.tipo_remetente === 'lojista')
    );
    const lastMsg = pedidoMsgs[pedidoMsgs.length - 1];
    
    return {
      pedido,
      lastMessage: lastMsg,
      messageCount: pedidoMsgs.length
    };
  }).filter(chat => {
    // Se o usuário digitou pesquisa, filtra pelo nome ou e-mail do cliente
    if (searchTerm.trim() !== '') {
      const nameMatch = chat.pedido.profiles?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const orderMatch = chat.pedido.id.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || orderMatch;
    }
    // Caso contrário, mostra todos os chats (com mensagens ou que sejam novos pedidos)
    return true;
  }).sort((a, b) => {
    // Ordena conversas pela data da última mensagem ou pela criação do pedido
    const dateA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : new Date(a.pedido.created_at).getTime();
    const dateB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : new Date(b.pedido.created_at).getTime();
    return dateB - dateA;
  });

  const selectedMessages = selectedPedido 
    ? allMessages.filter(m => {
        if (m.pedido_id !== selectedPedido.id) return false;
        if (chatMode === 'cliente') return m.tipo_remetente === 'cliente' || m.tipo_remetente === 'lojista';
        if (chatMode === 'entregador') return m.tipo_remetente === 'entregador' || m.tipo_remetente === 'lojista';
        return true;
      })
    : [];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'aguardando_pagamento': return 'bg-red-50 text-red-600 border-red-100';
      case 'pendente': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'em_preparo': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'saiu_para_entrega': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-green-50 text-green-600 border-green-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aguardando_pagamento': return 'Aguardando Pix';
      case 'pendente': return 'Pendente';
      case 'em_preparo': return 'Em Preparo';
      case 'saiu_para_entrega': return 'A Caminho';
      case 'entregue': return 'Entregue';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden h-[calc(100vh-12rem)] md:h-[680px] flex animate-fade-in">
      {/* 1. SIDEBAR: LISTA DE CONVERSAS */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col shrink-0 ${selectedPedido ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-50 space-y-3">
          <h3 className="font-black text-slate-800 text-sm tracking-tight">Conversas com Clientes</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou pedido..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-shopee-orange"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50/50">
          {loading ? (
            <div className="p-8 text-center text-gray-400 space-y-2">
              <div className="w-6 h-6 border-2 border-shopee-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Carregando chats...</p>
            </div>
          ) : activeChats.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-2">
              <MessageCircle className="mx-auto opacity-20" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-wider">Nenhum chat disponível</p>
            </div>
          ) : (
            activeChats.map((chat) => {
              const isSelected = selectedPedido?.id === chat.pedido.id;
              return (
                <div 
                  key={chat.pedido.id}
                  onClick={() => setSelectedPedido(chat.pedido)}
                  className={`p-4 cursor-pointer transition-all flex items-center gap-3 relative ${
                    isSelected ? 'bg-orange-50/40 border-l-4 border-shopee-orange' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700 text-sm border shadow-sm shrink-0">
                    {chat.pedido.profiles?.nome?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                    <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-xs font-black text-slate-800 truncate pr-2">
                        {chat.pedido.profiles?.nome || 'Cliente Sem Nome'}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {chat.pedido.geolocalizacao_entregador?.entregador_id && (
                          <span className="text-[7px] bg-purple-100 text-purple-700 font-black uppercase px-1.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-0.5">
                            <Truck size={8} />
                            Ent
                          </span>
                        )}
                        <span className="text-[8px] font-bold text-gray-400">
                          {chat.lastMessage 
                            ? new Date(chat.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(chat.pedido.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono truncate">#{chat.pedido.id.slice(0, 8)}</p>
                    <p className={`text-[11px] truncate mt-1 ${!chat.lastMessage?.lida && chat.lastMessage?.tipo_remetente !== 'lojista' ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                      {chat.lastMessage 
                        ? (chat.lastMessage.tipo_remetente === 'lojista' ? 'Você: ' : (chat.lastMessage.tipo_remetente === 'entregador' ? 'Entregador: ' : '')) + chat.lastMessage.texto
                        : 'Nenhuma mensagem. Comece o papo!'}
                    </p>
                  </div>
                  {/* Bolinha não lida */}
                  {!chat.lastMessage?.lida && chat.lastMessage?.tipo_remetente !== 'lojista' && (
                    <span className="w-2.5 h-2.5 bg-shopee-orange rounded-full shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CHAT MESSENGER WINDOW */}
      <div className={`flex-1 flex flex-col bg-gray-50/20 ${!selectedPedido ? 'hidden md:flex items-center justify-center p-8' : 'flex'}`}>
        {selectedPedido ? (
          <>
            {/* Header Chat */}
            <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedPedido(null)}
                  className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors -ml-2"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-black text-white text-sm shadow-md shrink-0">
                  {chatMode === 'entregador' && deliveryPersonProfile
                    ? deliveryPersonProfile.nome?.substring(0, 2).toUpperCase() || 'E'
                    : selectedPedido.profiles?.nome?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">
                    {chatMode === 'entregador' && deliveryPersonProfile
                      ? deliveryPersonProfile.nome
                      : selectedPedido.profiles?.nome}
                  </h4>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                    {chatMode === 'entregador' ? 'Entregador' : 'Cliente'} • Pedido #{selectedPedido.id.slice(0, 8)} • R$ {selectedPedido.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {entregadorId && (
                  <div className="flex bg-gray-100 rounded-lg p-0.5 mr-1">
                    <button
                      onClick={() => setChatMode('cliente')}
                      className={`px-2.5 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${chatMode === 'cliente' ? 'bg-white text-shopee-orange shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <User size={12} className="inline mr-1" />
                      Cliente
                    </button>
                    <button
                      onClick={() => setChatMode('entregador')}
                      className={`px-2.5 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${chatMode === 'entregador' ? 'bg-white text-shopee-orange shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Truck size={12} className="inline mr-1" />
                      Entregador
                    </button>
                  </div>
                )}
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${getStatusBadgeClass(selectedPedido.status)}`}>
                  {getStatusLabel(selectedPedido.status)}
                </span>
                {onNavigateToOrder && (
                  <button 
                    onClick={() => onNavigateToOrder(selectedPedido.id)}
                    className="p-2 text-gray-400 hover:text-shopee-orange hover:bg-orange-50 rounded-xl transition-all"
                    title="Ver Detalhes do Pedido"
                  >
                    <ExternalLink size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Listagem de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedMessages.length > 0 ? (
                selectedMessages.map((msg) => {
                  const isLojista = msg.tipo_remetente === 'lojista';
                  const roleLabel = msg.tipo_remetente === 'cliente' ? 'Cliente' : msg.tipo_remetente === 'entregador' ? 'Entregador' : '';
                  return (
                    <div key={msg.id} className={`flex ${isLojista ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3.5 rounded-2xl shadow-xs border relative flex flex-col ${
                        isLojista 
                          ? 'bg-shopee-orange border-orange-200 text-white rounded-tr-none' 
                          : 'bg-white border-slate-100 text-slate-800 rounded-tl-none'
                      }`}>
                        {!isLojista && roleLabel && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-shopee-orange mb-1">{roleLabel}</span>
                        )}
                        <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
                        <span className={`text-[7px] font-bold mt-1 text-right block self-end ${
                          isLojista ? 'text-orange-100' : 'text-slate-400'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30 space-y-2 py-20">
                  <MessageSquare size={48} className="text-gray-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inicie a conversa!</p>
                  <p className="text-[11px] text-slate-400 max-w-[200px]">Envie uma mensagem para o cliente ou entregador sobre este pedido.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para escrever */}
            <div className="bg-white border-t border-gray-100 p-4 flex gap-3 items-center shrink-0 shadow-sm">
              <input 
                type="text" 
                placeholder={chatMode === 'entregador' ? "Fale com o entregador..." : "Fale com o cliente..."} 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-xs font-semibold focus:ring-2 focus:ring-shopee-orange"
              />
              <button 
                onClick={handleSendMessage}
                className="w-12 h-12 bg-shopee-orange text-white rounded-2xl flex items-center justify-center shadow-lg shadow-shopee-orange/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4 max-w-sm px-6 py-20">
            <div className="w-20 h-20 bg-orange-50 text-shopee-orange rounded-full flex items-center justify-center mx-auto shadow-sm">
              <MessageSquare size={36} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Nenhuma conversa selecionada</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Selecione um cliente na lista lateral para visualizar o histórico de mensagens, sanar dúvidas de entrega, confirmar variações de estoque ou dar suporte personalizado.
            </p>
          </div>
        )}
      </div>

      {/* 3. ORDER PREVIEW SIDE PANEL (DESKTOP ONLY) */}
      {selectedPedido && (
        <div className="hidden lg:flex w-72 border-l border-gray-100 flex-col bg-white shrink-0">
          <div className="p-4 border-b border-gray-50 shrink-0">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-shopee-orange" />
              Detalhes do Pedido
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-1.5">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Status do Pedido</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  selectedPedido.status === 'entregue' ? 'bg-green-500' : 'bg-orange-500'
                }`} />
                <span className="text-xs font-black text-slate-800">{getStatusLabel(selectedPedido.status)}</span>
              </div>
            </div>

            <div className="border-t border-gray-50 pt-3 space-y-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Itens do Pedido</span>
              <div className="space-y-2">
                {selectedPedido.itens?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-2.5 items-start bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <img 
                      src={item.imagem || 'https://via.placeholder.com/40'} 
                      alt={item.nome}
                      className="w-8 h-8 rounded-lg object-cover border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-gray-800 line-clamp-1 leading-none mb-0.5">{item.nome}</p>
                      <span className="text-[9px] text-gray-400 font-medium">Qtd: {item.qtd} • R$ {item.preco.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-50 pt-3 space-y-1.5">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Resumo de Valores</span>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-400">Total Pago:</span>
                <span className="font-bold text-slate-800">R$ {selectedPedido.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-green-600">
                <span>Repasse Líquido:</span>
                <span>R$ {(selectedPedido.repasse_lojista_valor || (selectedPedido.total * 0.9)).toFixed(2)}</span>
              </div>
            </div>

            {selectedPedido.endereco_entrega && (
              <div className="border-t border-gray-50 pt-3 space-y-1">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Endereço de Entrega</span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">{selectedPedido.endereco_entrega}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
