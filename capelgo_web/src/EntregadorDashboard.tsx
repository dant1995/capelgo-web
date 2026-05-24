import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { 
  Navigation, 
  Package, 
  MapPin, 
  Store, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MessageSquare,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Wallet,
  Star,
  Power,
  ShieldCheck,
  LogOut,
  Mail,
  User as UserIcon,
  RefreshCw,
  X,
  Camera,
  FileCheck,
  Award,
  Gift,
  Compass,
  Lock,
  Settings,
  Info,
  Eye,
  Search,
  Send,
  Sliders,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DateFilterBar from './components/DateFilterBar';

const EntregadorDashboard: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('inicio');
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [newOrderOffer, setNewOrderOffer] = useState<any>(null);
  const [earnings, setEarnings] = useState(128.50);
  const [deliveriesCount, setDeliveriesCount] = useState(12);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [ignoredOrders, setIgnoredOrders] = useState<string[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ganhoFilterDays, setGanhoFilterDays] = useState(7);
  const filteredHistory = history.filter(item => {
    if (!item.created_at) return true;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ganhoFilterDays);
    return new Date(item.created_at) >= cutoff;
  });

  // Estados de Envio de Documentos e Onboarding
  const [docCNH, setDocCNH] = useState('');
  const [docVeiculo, setDocVeiculo] = useState('');
  const [docComprovante, setDocComprovante] = useState('');
  const [docSelfie, setDocSelfie] = useState('');
  
  // Endereço de Atuação
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  
  // Veículo e telefone no onboarding
  const [telefone, setTelefone] = useState('');
  const [veiculoTipo, setVeiculoTipo] = useState('Moto');
  const [veiculoModelo, setVeiculoModelo] = useState('');
  const [veiculoPlaca, setVeiculoPlaca] = useState('');
  const [submittingDocs, setSubmittingDocs] = useState(false);

  // Estados de Edição do Perfil do Entregador (Aprovado)
  const [activePerfilDrawer, setActivePerfilDrawer] = useState<string | null>(null);
  const [perfilNome, setPerfilNome] = useState('');
  const [perfilTelefone, setPerfilTelefone] = useState('');
  const [perfilVeiculoModelo, setPerfilVeiculoModelo] = useState('');
  const [perfilVeiculoPlaca, setPerfilVeiculoPlaca] = useState('');
  const [perfilVeiculoTipo, setPerfilVeiculoTipo] = useState('Moto');
  const [perfilPixChave, setPerfilPixChave] = useState('');
  const [isSavingPerfil, setIsSavingPerfil] = useState(false);

  // Configurações de Conta
  const [soundNotif, setSoundNotif] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Configurações Operacionais Premium (iFood Style)
  const [regimeTrabalho, setRegimeTrabalho] = useState(() => localStorage.getItem('capelgo_regime_trabalho') || 'nuvem');
  const [lojaFixaId, setLojaFixaId] = useState(() => localStorage.getItem('capelgo_loja_fixa_id') || '');
  const [raioAtuacao, setRaioAtuacao] = useState(() => localStorage.getItem('capelgo_raio_atuacao') || '5');
  const [tipoPagamentoAceito, setTipoPagamentoAceito] = useState(() => localStorage.getItem('capelgo_tipo_pagamento') || 'online');
  const [gpsPrecisao, setGpsPrecisao] = useState(() => localStorage.getItem('capelgo_gps_precisao') || 'alta');
  const [lojasDisponiveis, setLojasDisponiveis] = useState<any[]>([]);

  // Estados do Chat
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatPartner, setChatPartner] = useState<'loja' | 'suporte' | null>(null);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);



  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const driverMarkerRef = React.useRef<any>(null);
  const storeMarkerRef = React.useRef<any>(null);

  // Inicializar Mapa
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current && window.L) {
      const L = window.L;
      // Garantir fundo claro no container do mapa
      mapContainerRef.current.style.background = '#e8e4df';
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-23.5505, -46.6333], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current).on('tileerror', (e: any) => {
        console.warn('Tile OSM falhou:', e);
      });
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Pedir permissão de notificação na inicialização
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Carregar usuário e dados iniciais
  useEffect(() => {
    async function loadInitialData() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      // 🔐 RBAC: Redirecionamento baseado na função
      if (profile) {
        if (profile.role === 'admin' || profile.role === 'entregador') {
          // OK - Permite acesso
        } else if (profile.role === 'lojista') {
          navigate('/merchant');
          return;
        } else {
          navigate('/perfil');
          return;
        }
      }

      setCurrentUser({ ...user, profile });

      // Buscar lojas para o regime Fixo de Loja
      const { data: stores } = await supabase.from('lojas').select('*');
      if (stores) {
        setLojasDisponiveis(stores);
      }

      // 1. Verificar se o entregador já tem um pedido em andamento
      const { data: pedidosEmAndamento } = await supabase
        .from('pedidos')
        .select('*')
        .in('status', ['em_coleta', 'saiu_para_entrega']);
      
      const meuPedidoAtivo = (pedidosEmAndamento || []).find(p => 
        p.geolocalizacao_entregador?.entregador_id === user.id
      );

      if (meuPedidoAtivo) {
        // Restaura a tela do pedido ativo
        const { data: profileCli } = await supabase.from('profiles').select('*').eq('id', meuPedidoAtivo.cliente_id).maybeSingle();
        const { data: profileLoja } = await supabase.from('profiles').select('*').eq('loja_id', meuPedidoAtivo.loja_id).eq('role', 'lojista').maybeSingle();
        const { data: lojaInfo } = await supabase.from('lojas').select('id, nome, endereco, latitude, longitude').eq('id', meuPedidoAtivo.loja_id).maybeSingle();
        const joined = {
          ...meuPedidoAtivo,
          profiles: profileCli,
          lojaProfile: profileLoja ? { ...profileLoja, ...lojaInfo } : lojaInfo,
          loja_nome: lojaInfo?.nome,
          loja_endereco: lojaInfo?.endereco,
          loja_lat: lojaInfo?.latitude,
          loja_lng: lojaInfo?.longitude,
        };
        setActiveOrder({ ...formatOrderForOffer(joined), status: meuPedidoAtivo.status });
      } else {
        // 2. Se não estiver em rota, buscar novos pedidos disponíveis (aguardando entregador)
        const { data: pedidosProntos } = await supabase
          .from('pedidos')
          .select('*')
          .eq('status', 'saiu_para_entrega');
        
        let disponiveis = pedidosProntos?.filter(p => 
          !p.geolocalizacao_entregador?.entregador_id && 
          !ignoredOrders.includes(p.id)
        ) || [];
        
        if (disponiveis.length > 0) {
          const clientIds = disponiveis.map(p => p.cliente_id).filter(Boolean);
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const validClientIds = clientIds.filter(id => uuidRegex.test(id));
          const { data: profilesData } = await supabase.from('profiles').select('*').in('id', validClientIds);
          
          const lojaIds = [...new Set(disponiveis.map(p => p.loja_id).filter(Boolean))];
          const { data: lojasData } = await supabase.from('lojas').select('id, nome, endereco, latitude, longitude').in('id', lojaIds);
          const { data: lojaProfilesData } = await supabase.from('profiles').select('*').in('loja_id', lojaIds).eq('role', 'lojista');

          disponiveis = disponiveis.map(p => {
            const lojaInfo = lojasData?.find(l => l.id === p.loja_id);
            const lojaProfile = lojaProfilesData?.find(prof => prof.loja_id === p.loja_id);
            return {
              ...p,
              profiles: profilesData?.find(prof => prof.id === p.cliente_id) || null,
              lojaProfile: lojaProfile ? { ...lojaProfile, ...lojaInfo } : (lojaInfo || null),
              loja_nome: lojaInfo?.nome,
              loja_endereco: lojaInfo?.endereco,
              loja_lat: lojaInfo?.latitude,
              loja_lng: lojaInfo?.longitude,
            };
          });

          setNewOrderOffer(formatOrderForOffer(disponiveis[0]));
        }
      }

      // Buscar ganhos reais (Soma da taxa de entrega dos pedidos concluídos pelo entregador logado)
      const { data: concluidos } = await supabase
        .from('pedidos')
        .select('*')
        .eq('status', 'entregue');
      
      // Filtrar localmente por ID do entregador no JSONB (ou usar query JSONB se preferir)
      const meusConcluidos = (concluidos || []).filter(p => 
        p.geolocalizacao_entregador?.entregador_id === user.id
      );
      
      if(meusConcluidos) {
        setDeliveriesCount(meusConcluidos.length);
        const totalGanhos = meusConcluidos.reduce((acc, curr) => acc + (Number(curr.taxa_entrega) || 0), 0);
        setEarnings(totalGanhos);
        setHistory(meusConcluidos);
      }
    }
    loadInitialData();
  }, []);

  // Sincronizar dados do perfil logado
  useEffect(() => {
    if (currentUser?.profile) {
      setPerfilNome(currentUser.profile.nome || '');
      setPerfilTelefone(currentUser.profile.telefone || '');
      setPerfilVeiculoModelo(currentUser.profile.veiculo_modelo || '');
      setPerfilVeiculoPlaca(currentUser.profile.veiculo_placa || '');
      setPerfilVeiculoTipo(currentUser.profile.veiculo_tipo || 'Moto');
      setPerfilPixChave(currentUser.profile.pix_chave || '');
      
      // Preencher formulário de onboarding se já houver dados parciais
      setTelefone(currentUser.profile.telefone || '');
      setVeiculoModelo(currentUser.profile.veiculo_modelo || '');
      setVeiculoPlaca(currentUser.profile.veiculo_placa || '');
      setVeiculoTipo(currentUser.profile.veiculo_tipo || 'Moto');
    }
  }, [currentUser]);

  // Busca de CEP para o formulário de onboarding
  const handleOnboardingCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setRua(data.logradouro);
        setBairro(data.bairro);
        setCidade(`${data.localidade} - ${data.uf}`);
      }
    } catch (err) { console.error("Erro ao buscar CEP no onboarding"); }
  };

  // Envio de documentos para aprovação
  const handleSendDocuments = async () => {
    if (!currentUser) return;
    setSubmittingDocs(true);
    
    // Imagens mock para CNH, selfie, comprovante e veículo para garantir funcionamento imediato
    const cnhUrl = docCNH || 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400';
    const veiculoUrl = docVeiculo || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400';
    const comprovanteUrl = docComprovante || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=400';
    const selfieUrl = docSelfie || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
    
    const enderecoCompleto = `${rua}, ${numero} - ${bairro}, ${cidade} (CEP: ${cep})`;

    const { error } = await supabase
      .from('profiles')
      .update({
        cnh_url: cnhUrl,
        veiculo_foto_url: veiculoUrl,
        comprovante_residencia_url: comprovanteUrl,
        selfie_url: selfieUrl,
        endereco: enderecoCompleto,
        telefone: telefone || perfilTelefone,
        veiculo_modelo: veiculoModelo || perfilVeiculoModelo,
        veiculo_placa: veiculoPlaca || perfilVeiculoPlaca,
        veiculo_tipo: veiculoTipo,
        status_aprovacao: 'em_analise',
        documentos_enviados_at: new Date().toISOString()
      })
      .eq('id', currentUser.id);

    if (error) {
      alert('Erro ao enviar documentos: ' + error.message);
    } else {
      alert('Documentos enviados com sucesso para análise!');
      // Re-carregar profile do usuário
      const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
      setCurrentUser((prev: any) => ({ ...prev, profile: updatedProfile }));
    }
    setSubmittingDocs(false);
  };

  // Reenviar documentos (Voltar de rejeitado para pendente_documentos)
  const handleResetRejection = async () => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        status_aprovacao: 'pendente_documentos',
        motivo_rejeicao: null
      })
      .eq('id', currentUser.id);

    if (error) {
      alert('Erro ao reiniciar: ' + error.message);
    } else {
      setCurrentUser((prev: any) => ({
        ...prev,
        profile: { ...prev.profile, status_aprovacao: 'pendente_documentos', motivo_rejeicao: null }
      }));
    }
  };

  // Atualizar dados de perfil de um entregador ativo
  const handleUpdatePerfilDetails = async () => {
    if (!currentUser) return;
    setIsSavingPerfil(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        nome: perfilNome,
        telefone: perfilTelefone,
        veiculo_modelo: perfilVeiculoModelo,
        veiculo_placa: perfilVeiculoPlaca,
        veiculo_tipo: perfilVeiculoTipo,
        pix_chave: perfilPixChave,
      })
      .eq('id', currentUser.id);

    if (error) {
      alert('Erro ao salvar perfil: ' + error.message);
    } else {
      alert('Perfil atualizado com sucesso!');
      setCurrentUser((prev: any) => ({
        ...prev,
        profile: {
          ...prev.profile,
          nome: perfilNome,
          telefone: perfilTelefone,
          veiculo_modelo: perfilVeiculoModelo,
          veiculo_placa: perfilVeiculoPlaca,
          veiculo_tipo: perfilVeiculoTipo,
          pix_chave: perfilPixChave,
        }
      }));
      setActivePerfilDrawer(null);
    }
    setIsSavingPerfil(false);
  };


  const formatOrderForOffer = (p: any) => {
    // Extrair nome e telefone das observações se houver
    let nomeExtra = '';
    let telExtra = '';
    if (p.observacoes && p.observacoes.includes('Cliente:')) {
      const parts = p.observacoes.split('|');
      nomeExtra = parts[0].replace('Cliente:', '').trim();
      telExtra = parts.find((pt: string) => pt.includes('Tel:'))?.replace('Tel:', '').trim() || '';
    }

    let clientLat = p.geolocalizacao_cliente?.lat || -23.5616;
    let clientLng = p.geolocalizacao_cliente?.lng || -46.6920;
    if (p.observacoes && p.observacoes.includes('GPS:')) {
      const gpsPart = p.observacoes.split('|').find((pt: string) => pt.includes('GPS:'));
      if (gpsPart) {
        const coordsStr = gpsPart.replace('GPS:', '').trim();
        const [latStr, lngStr] = coordsStr.split(',');
        if (latStr && lngStr) {
          clientLat = parseFloat(latStr);
          clientLng = parseFloat(lngStr);
        }
      }
    }

    return {
      id: (p.id || '').toString().slice(-4).toUpperCase(),
      fullId: p.id,
      valorGanhos: p.taxa_entrega || 7.00,
      loja: p.loja_nome || p.lojaProfile?.nome || 'Loja Parceira',
      lojaEndereco: p.lojaProfile?.endereco || p.loja_endereco || 'Coleta no balcão',
      lojaCoords: (p.lojaProfile?.latitude && p.lojaProfile?.longitude)
        ? { lat: Number(p.lojaProfile.latitude), lng: Number(p.lojaProfile.longitude) }
        : (p.loja_lat && p.loja_lng)
        ? { lat: Number(p.loja_lat), lng: Number(p.loja_lng) }
        : (p.geolocalizacao_loja?.lat && p.geolocalizacao_loja?.lng)
        ? { lat: Number(p.geolocalizacao_loja.lat), lng: Number(p.geolocalizacao_loja.lng) }
        : { lat: -23.5505, lng: -46.6333 },
      cliente: (nomeExtra && nomeExtra !== 'Não informado') ? nomeExtra : (p.profiles?.nome || 'Cliente'),
      clienteTelefone: (telExtra && telExtra !== 'Não informado') ? telExtra : (p.profiles?.telefone || ''),
      clienteEndereco: p.endereco_entrega || 'Endereço não informado',
      destinoCoords: { lat: clientLat, lng: clientLng },
      type: 'single',
      itens: p.itens || [],
      codigo_confirmacao: p.codigo_confirmacao
    };
  };

  const activeOrderRef = useRef(activeOrder);
  useEffect(() => { activeOrderRef.current = activeOrder; }, [activeOrder]);

  const ignoredOrdersRef = useRef(ignoredOrders);
  useEffect(() => { ignoredOrdersRef.current = ignoredOrders; }, [ignoredOrders]);

  // ✅ Ref para currentUser (para uso em closures do Realtime)
  const currentUserRef = useRef<any>(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Realtime para novos pedidos "Prontos" - filtra pedidos sem entregador OU atribuídos a mim
  useEffect(() => {
    const channel = supabase
      .channel('entregador-pedidos')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'pedidos',
        filter: 'status=eq.saiu_para_entrega'
      }, async (payload) => {
        try {
          const currentActive = activeOrderRef.current;
          const isAlreadyActive = currentActive && (currentActive.fullId === payload.new.id || currentActive.id === (payload.new.id || '').toString().slice(-4).toUpperCase());
          const isIgnored = ignoredOrdersRef.current.includes(payload.new.id);
          
          const meuId = currentUserRef.current?.id || currentUserRef.current?.profile?.id;
          const entregadorId = payload.new.geolocalizacao_entregador?.entregador_id;
          
          const euSouOEntregador = !entregadorId || entregadorId === meuId;
          
        if (euSouOEntregador && !isAlreadyActive && !isIgnored) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', payload.new.cliente_id).maybeSingle();
          const { data: lojaProfile } = await supabase.from('profiles').select('*').eq('loja_id', payload.new.loja_id).eq('role', 'lojista').maybeSingle();
          const { data: lojaInfo } = await supabase.from('lojas').select('id, nome, endereco, latitude, longitude').eq('id', payload.new.loja_id).maybeSingle();
          const joined = {
            ...payload.new,
            profiles: profile,
            lojaProfile: lojaProfile ? { ...lojaProfile, ...lojaInfo } : lojaInfo,
            loja_nome: lojaInfo?.nome,
            loja_endereco: lojaInfo?.endereco,
            loja_lat: lojaInfo?.latitude,
            loja_lng: lojaInfo?.longitude,
          };
          setNewOrderOffer(formatOrderForOffer(joined));
          } else if (isAlreadyActive || isIgnored) {
            setNewOrderOffer(null);
          }
        } catch (err) {
          console.error('Erro no Realtime entregador:', err);
        }
      })
      .subscribe();

    const dataChannel = supabase
      .channel('entregador-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes_sistema' }, () => {
        setEntregadores(prev => [...prev]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saques' }, () => {
        loadInitialData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, async (payload: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && payload.new.id === user.id) {
          if (payload.new.role !== 'entregador') {
            navigate('/perfil');
          } else if (payload.new.status_aprovacao) {
            loadInitialData();
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); supabase.removeChannel(dataChannel); };
  }, []);

  // Chat: carregar mensagens quando o parceiro de conversa mudar
  useEffect(() => {
    if (!chatPartner || !currentUser) return;

    const userId = currentUser.id;
    let active = true;

    async function loadChatMessages() {
      if (chatPartner === 'loja' && activeOrder) {
        const orderPedidoId = activeOrder.fullId || activeOrder.id;
        const { data } = await supabase
          .from('mensagens')
          .select('*')
          .eq('pedido_id', orderPedidoId)
          .order('created_at', { ascending: true });
        if (active && data) setChatMessages(data);
      } else if (chatPartner === 'suporte') {
        const { data } = await supabase
          .from('mensagens')
          .select('*')
          .is('pedido_id', null)
          .or(`remetente_id.eq.${userId},destinatario_id.eq.${userId}`)
          .order('created_at', { ascending: true });
        if (active && data) setChatMessages(data);
      }
    }

    loadChatMessages();

    const chatChannel = supabase.channel('entregador-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        if (!active) return;
        const msg = payload.new;
        if (chatPartner === 'loja' && activeOrder) {
          const orderPedidoId = activeOrder.fullId || activeOrder.id;
          if (msg.pedido_id === orderPedidoId) {
            setChatMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          }
        } else if (chatPartner === 'suporte') {
          if (!msg.pedido_id && (msg.remetente_id === userId || msg.destinatario_id === userId)) {
            setChatMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          }
        }
      })
      .subscribe();

    const pollInterval = setInterval(async () => {
      if (!active) return;
      if (chatPartner === 'loja' && activeOrder) {
        const orderPedidoId = activeOrder.fullId || activeOrder.id;
        const { data } = await supabase.from('mensagens').select('*').eq('pedido_id', orderPedidoId).order('created_at', { ascending: true });
        if (data && active) {
          setChatMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const news = data.filter(m => !ids.has(m.id));
            return news.length ? [...prev, ...news] : prev;
          });
        }
      } else if (chatPartner === 'suporte') {
        const { data } = await supabase.from('mensagens').select('*').is('pedido_id', null).or(`remetente_id.eq.${userId},destinatario_id.eq.${userId}`).order('created_at', { ascending: true });
        if (data && active) {
          setChatMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const news = data.filter(m => !ids.has(m.id));
            return news.length ? [...prev, ...news] : prev;
          });
        }
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(pollInterval);
      supabase.removeChannel(chatChannel);
    };
  }, [chatPartner, activeOrder, currentUser?.id]);

  // Fallback: escutar eventos de dispatch via localStorage (cross-tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'capelgo_dispatch' && e.newValue) {
        try {
          const dispatch = JSON.parse(e.newValue);
          if (currentUserRef.current && dispatch.entregador_id === currentUserRef.current.id) {
            setNewOrderOffer(dispatch);
          }
        } catch (err) {
          console.warn('Erro ao processar dispatch via localStorage:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Recarregar pedidos disponíveis quando o entregador volta pro app (tab reativada)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && !activeOrderRef.current) {
        const { data: pedidosProntos } = await supabase
          .from('pedidos')
          .select('*')
          .eq('status', 'saiu_para_entrega');
        const disponiveis = pedidosProntos?.filter(p =>
          !p.geolocalizacao_entregador?.entregador_id &&
          !ignoredOrders.includes(p.id)
        ) || [];
        if (disponiveis.length > 0) {
          const clientIds = [...new Set(disponiveis.map(p => p.cliente_id).filter(Boolean))];
          const { data: profilesData } = clientIds.length > 0
            ? await supabase.from('profiles').select('*').in('id', clientIds)
            : { data: [] };
          const lojaIds = [...new Set(disponiveis.map(p => p.loja_id).filter(Boolean))];
          const { data: lojasData } = lojaIds.length > 0
            ? await supabase.from('lojas').select('id, nome, endereco, latitude, longitude').in('id', lojaIds)
            : { data: [] };
          const disponiveisComPerfil = disponiveis.map(p => {
            const lojaInfo = lojasData?.find(l => l.id === p.loja_id);
            return {
              ...p,
              profiles: profilesData?.find(prof => prof.id === p.cliente_id) || null,
              lojaProfile: lojaInfo || null,
              loja_nome: lojaInfo?.nome,
              loja_endereco: lojaInfo?.endereco,
              loja_lat: lojaInfo?.latitude,
              loja_lng: lojaInfo?.longitude,
            };
          });
          setNewOrderOffer(formatOrderForOffer(disponiveisComPerfil[0]));
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [ignoredOrders]);

  // 🔔 NOTIFICAÇÃO PARA NOVOS PEDIDOS
  useEffect(() => {
    if (!newOrderOffer) return;

    // Vibrar (funciona em celular)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Notificação do sistema (funciona em PWA e navegador mobile)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🛵 Novo Pedido!', {
        body: `${newOrderOffer.cliente} - ${newOrderOffer.loja}`,
        icon: '/vite.svg',
        tag: 'novo-pedido',
        requireInteraction: true,
      });
    }

    // Som (fallback)
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});
  }, [newOrderOffer]);


  // Atualizar Mapa quando houver pedido ativo (marcadores da loja e destino)
  useEffect(() => {
     if (!mapRef.current || !activeOrder || !window.L) return;
     const L = window.L;

      // Limpar marcadores antigos
      if (storeMarkerRef.current) { mapRef.current.removeLayer(storeMarkerRef.current); storeMarkerRef.current = null; }

      const isCoordValida = (lat: number, lng: number) =>
        typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng) &&
        Math.abs(lat) > 0.1 && Math.abs(lng) > 0.1;

      const storeCoords = activeOrder.lojaCoords || { lat: -23.5505, lng: -46.6333 };
      const storeLat = isCoordValida(storeCoords.lat, storeCoords.lng) ? storeCoords.lat : -23.5505;
      const storeLng = isCoordValida(storeCoords.lat, storeCoords.lng) ? storeCoords.lng : -46.6333;

      // Marcador da loja (verde)
      storeMarkerRef.current = L.marker([storeLat, storeLng], {
       icon: L.divIcon({
         className: '',
         html: '<div style="background:#22c55e;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏪</div>',
         iconSize: [32, 32],
         iconAnchor: [16, 16]
       })
     }).addTo(mapRef.current).bindPopup(`<b>${activeOrder.loja || 'Loja'}</b><br/>${activeOrder.lojaEndereco || ''}`);

      mapRef.current.panTo([storeLat, storeLng]);
  }, [activeOrder, currentStopIndex]);

  // Redimensionar mapa quando o pedido ativo aparece (sai de h-0 para h-[300px])
  useEffect(() => {
    if (mapRef.current && activeOrder) {
      setTimeout(() => mapRef.current.invalidateSize(), 200);
    }
  }, [!!activeOrder]);

  // 🛰️ GPS CONTÍNUO (FROTA + PEDIDO ATIVO)
  useEffect(() => {
    if (!isOnline || !currentUser) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // 1. Atualizar no Perfil (para o Admin ver a frota disponível)
        await supabase.from('profiles')
           .update({ 
              online: true,
              geolocalizacao: { lat: latitude, lng: longitude },
              ultima_localizacao: { lat: latitude, lng: longitude, atualizada_em: new Date().toISOString() },
              updated_at: new Date().toISOString()
           })
           .eq('id', currentUser.id);

        // 2. Atualizar no Pedido Ativo (para o Cliente ver o trajeto)
        if (activeOrder?.fullId) {
           await supabase.from('pedidos')
              .update({ 
                geolocalizacao_entregador: { 
                  lat: latitude, 
                  lng: longitude,
                  entregador_id: currentUser.id,
                  entregador_nome: currentUser.profile?.nome || 'Entregador'
                } 
              })
              .eq('id', activeOrder.fullId);
        }
        
        // Atualizar marcador azul do entregador
        if (!mapRef.current || !window.L) return;
        const L = window.L;
        if (driverMarkerRef.current) {
           driverMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
           driverMarkerRef.current = L.marker([latitude, longitude], {
             icon: L.divIcon({
               className: '',
               html: '<div style="background:#1A73E8;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><div style="width:10px;height:10px;border-radius:50%;background:#fff"></div></div>',
               iconSize: [24, 24],
               iconAnchor: [12, 12]
             })
           }).addTo(mapRef.current);
        }
      },
      (error) => console.warn("GPS Error:", error.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, activeOrder, currentUser]);


  const handleAcceptOrder = async () => {
    // Para o estado interno do app, usamos 'em_coleta' para controlar a UI
    const order = { ...newOrderOffer, status: 'em_coleta' };
    
    // No banco, como 'entregador_id' não existe e 'em_coleta' é proibido:
    // 1. Mantemos 'saiu_para_entrega'
    // 2. Injetamos o ID do entregador dentro do JSON de geolocalização como workaround
    // Tentar pegar a posição real antes de aceitar, ou iniciar em 0,0 para forçar atualização
    let initialLat = -23.5505;
    let initialLng = -46.6333;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
      });
      initialLat = pos.coords.latitude;
      initialLng = pos.coords.longitude;
    } catch (e) {
      console.warn("Não foi possível pegar GPS inicial, usando padrão.");
    }

    const { error } = await supabase
      .from('pedidos')
      .update({ 
        status: 'saiu_para_entrega', 
        geolocalizacao_entregador: { 
          lat: initialLat, 
          lng: initialLng, 
          entregador_id: currentUser?.profile?.id || currentUser?.id,
          entregador_nome: currentUser?.profile?.nome || 'Entregador'
        } 
      })
      .eq('id', order.fullId);

    if(!error) {
      console.log("✅ Pedido aceito com sucesso!");
      setActiveOrder(order);
      setCurrentStopIndex(0);
      setNewOrderOffer(null);
    } else {
      console.error("❌ Erro ao aceitar pedido:", error);
      alert("Erro ao aceitar pedido: " + error.message);
    }
  };

  const handleRecenterMap = () => {
    if (!mapRef.current || !window.L) return;
    const pontos: [number, number][] = [];
    if (storeMarkerRef.current) {
      pontos.push(storeMarkerRef.current.getLatLng());
    }
    if (driverMarkerRef.current) {
      pontos.push(driverMarkerRef.current.getLatLng());
    }
    if (pontos.length >= 2) {
      mapRef.current.fitBounds(window.L.latLngBounds(pontos), { padding: [40, 40] });
    } else if (pontos.length === 1) {
      mapRef.current.panTo(pontos[0]);
    }
  };

  const openNavigation = (lat: number, lng: number, address?: string) => {
    let destination = `${lat},${lng}`;
    // If coordinates are default fake ones from code (-23.5505 Se or -23.5616 Pinheiros), force use address
    if (address && (!lat || lat === -23.5505 || lat === -23.5616)) {
      destination = encodeURIComponent(address);
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleStepComplete = async () => {
    if (activeOrder.status === 'em_coleta') {
      await supabase.from('pedidos').update({ status: 'saiu_para_entrega' }).eq('id', activeOrder.fullId || activeOrder.id);
      const updated = { ...activeOrder, status: 'saiu_para_entrega' };
      setActiveOrder(updated);
    } else {
      setShowCodeModal(true);
    }
  };

  const confirmDeliveryWithCode = () => {
     const isBatch = activeOrder.type === 'batch';
     const currentStop = isBatch ? activeOrder.entregas[currentStopIndex] : activeOrder;
     const correctCode = currentStop.codigo_confirmacao;
     const inputCode = deliveryCode.trim();
     
     if (inputCode === correctCode) {
        localStorage.setItem('capelgo_feedback', JSON.stringify({
           type: 'entregue',
           entregador: 'João da Moto',
           pedidoId: currentStop.id,
           timestamp: Date.now()
        }));

        // Atualizar pedido real no Supabase
        supabase.from('pedidos').update({ status: 'entregue' }).eq('id', currentStop.fullId || currentStop.id).then(({error}) => {
           if(error) console.error("Erro ao atualizar status de entrega", error);
        });

        if (isBatch && currentStopIndex < activeOrder.entregas.length - 1) {
           setCurrentStopIndex(prev => prev + 1);
           setShowCodeModal(false);
           setDeliveryCode('');
           alert(`Entrega confirmada! Dirija-se à próxima parada.`);
        } else {
           setEarnings(prev => prev + (activeOrder.valorGanhos || 12.50));
           setDeliveriesCount(prev => prev + (isBatch ? activeOrder.entregas.length : 1));
           setActiveOrder(null);
           setShowCodeModal(false);
           setDeliveryCode('');
           alert('Entrega(s) concluída(s) com sucesso!');
        }
     } else {
        alert(`Código incorreto! Peça ao cliente o código de 4 dígitos que aparece na tela dele.`);
     }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleReportProblem = async (reason: string) => {
    if (!activeOrder?.fullId) return;
    
    const { error } = await supabase
      .from('pedidos')
      .update({ alerta_entrega: reason })
      .eq('id', activeOrder.fullId);

    if (!error) {
       alert(`Problema reportado: ${reason}. O suporte foi notificado.`);
       
       // Notificar n8n
       try {
         fetch('https://n8n.capelgo.com.br/webhook/713600f6-950c-4034-9721-e3e786b40345', {
           method: 'POST',
           mode: 'no-cors',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             event: 'alerta_entrega',
             pedido_id: activeOrder.fullId,
             motivo: reason,
             entregador: currentUser?.profile?.nome || 'Entregador',
             timestamp: new Date().toISOString()
           })
         });
       } catch (e) {
         console.warn("Aviso n8n falhou:", e);
       }

       setShowReportModal(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !currentUser || !chatPartner) return;
    const messageText = chatInput;
    setChatInput('');

    const userId = currentUser.id;
    const payload: any = {
      remetente_id: userId,
      tipo_remetente: 'entregador',
      texto: messageText,
      tipo: 'texto'
    };

    if (chatPartner === 'loja' && activeOrder) {
      const orderPedidoId = activeOrder.fullId || activeOrder.id;
      payload.pedido_id = orderPedidoId;
      if (activeOrder.lojaProfile?.id) {
        payload.destinatario_id = activeOrder.lojaProfile.id;
      }
    } else {
      payload.pedido_id = null;
    }

    const { data, error } = await supabase.from('mensagens').insert(payload).select().single();

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      const fallbackMsg = { ...payload, id: Date.now(), created_at: new Date().toISOString() };
      setChatMessages(prev => [...prev, fallbackMsg]);
    } else if (data) {
      setChatMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatPartner]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500/30 overflow-x-hidden">
      {/* Header Fixo */}
      <header className="sticky top-0 z-[100] bg-slate-950/80 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center font-black text-xl italic shadow-lg shadow-orange-600/20">C</div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Portal do Entregador</p>
            <h1 className="text-sm font-black tracking-tight">{currentUser?.profile?.nome || 'Entregador'}</h1>
          </div>
        </div>
        <button 
           onClick={async () => {
             const newStatus = !isOnline;
             setIsOnline(newStatus);
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
               await supabase.from('profiles').update({ online: newStatus }).eq('id', user.id);
             }
           }}
           className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${
             isOnline ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
           }`}
        >
           <Power size={14} />
           <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
        </button>
      </header>

      <main className="p-4 space-y-6 max-w-lg mx-auto pb-24">
        {currentUser?.profile && currentUser?.profile?.status_aprovacao !== 'aprovado' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Se pendente de documentos */}
            {(!currentUser?.profile?.status_aprovacao || currentUser?.profile?.status_aprovacao === 'pendente_documentos') && (
              <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[40px] space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto text-orange-500">
                    <FileCheck size={32} />
                  </div>
                  <h2 className="text-xl font-black tracking-tight">Onboarding do Entregador</h2>
                  <p className="text-xs text-slate-400">Complete seu cadastro enviando os documentos obrigatórios para nossa análise e aprovação.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">1. Dados Operacionais</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Telefone de Contato</label>
                    <input 
                      type="tel" 
                      value={telefone} 
                      onChange={(e) => setTelefone(e.target.value)} 
                      placeholder="(00) 00000-0000"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-orange-500 transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tipo de Veículo</label>
                      <select 
                        value={veiculoTipo} 
                        onChange={(e) => setVeiculoTipo(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-orange-500 transition-all outline-none"
                      >
                        <option value="Moto">Moto</option>
                        <option value="Bike">Bicicleta</option>
                        <option value="Carro">Carro</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Placa do Veículo</label>
                      <input 
                        type="text" 
                        value={veiculoPlaca} 
                        onChange={(e) => setVeiculoPlaca(e.target.value.toUpperCase())} 
                        placeholder="ABC-1234"
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-orange-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Modelo do Veículo</label>
                    <input 
                      type="text" 
                      value={veiculoModelo} 
                      onChange={(e) => setVeiculoModelo(e.target.value)} 
                      placeholder="Ex: Honda CG 160 Cargo"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-orange-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">2. Endereço de Atuação</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CEP (Busca automática)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={cep} 
                        onChange={(e) => setCep(e.target.value)} 
                        onBlur={handleOnboardingCepBlur}
                        placeholder="00000000"
                        className="flex-1 bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-orange-500 transition-all outline-none"
                      />
                      <button 
                        type="button"
                        onClick={handleOnboardingCepBlur}
                        className="px-4 bg-orange-600 rounded-2xl text-xs font-black uppercase flex items-center justify-center"
                      >
                        <Search size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rua / Logradouro</label>
                      <input 
                        type="text" 
                        value={rua} 
                        onChange={(e) => setRua(e.target.value)} 
                        placeholder="Rua..."
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-orange-500 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Número</label>
                      <input 
                        type="text" 
                        value={numero} 
                        onChange={(e) => setNumero(e.target.value)} 
                        placeholder="123"
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-orange-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Bairro</label>
                      <input 
                        type="text" 
                        value={bairro} 
                        onChange={(e) => setBairro(e.target.value)} 
                        placeholder="Bairro..."
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-orange-500 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cidade - UF</label>
                      <input 
                        type="text" 
                        value={cidade} 
                        onChange={(e) => setCidade(e.target.value)} 
                        placeholder="Cidade..."
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-orange-500 transition-all outline-none bg-slate-950/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">3. Fotos e Documentos</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-3xl border border-white/5 text-center space-y-2 flex flex-col justify-between h-40 relative group">
                      {docCNH ? (
                        <div className="absolute inset-0 rounded-3xl overflow-hidden">
                          <img src={docCNH} className="w-full h-full object-cover" />
                          <button onClick={() => setDocCNH('')} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-red-500"><X size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <Camera size={24} className="mx-auto text-orange-500 mt-2" />
                          <p className="text-[9px] font-black uppercase text-slate-400">Foto da CNH</p>
                          <button 
                            onClick={() => setDocCNH('https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400')}
                            className="w-full bg-slate-900 border-none rounded-xl py-2 text-[8px] font-black uppercase text-orange-500 hover:bg-orange-500/10 transition-all cursor-pointer"
                          >
                            Simular CNH
                          </button>
                        </>
                      )}
                    </div>

                    <div className="p-4 bg-slate-950 rounded-3xl border border-white/5 text-center space-y-2 flex flex-col justify-between h-40 relative group">
                      {docVeiculo ? (
                        <div className="absolute inset-0 rounded-3xl overflow-hidden">
                          <img src={docVeiculo} className="w-full h-full object-cover" />
                          <button onClick={() => setDocVeiculo('')} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-red-500"><X size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <Camera size={24} className="mx-auto text-orange-500 mt-2" />
                          <p className="text-[9px] font-black uppercase text-slate-400">Foto do Veículo</p>
                          <button 
                            onClick={() => setDocVeiculo('https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400')}
                            className="w-full bg-slate-900 border-none rounded-xl py-2 text-[8px] font-black uppercase text-orange-500 hover:bg-orange-500/10 transition-all cursor-pointer"
                          >
                            Simular Veículo
                          </button>
                        </>
                      )}
                    </div>

                    <div className="p-4 bg-slate-950 rounded-3xl border border-white/5 text-center space-y-2 flex flex-col justify-between h-40 relative group">
                      {docComprovante ? (
                        <div className="absolute inset-0 rounded-3xl overflow-hidden">
                          <img src={docComprovante} className="w-full h-full object-cover" />
                          <button onClick={() => setDocComprovante('')} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-red-500"><X size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <Camera size={24} className="mx-auto text-orange-500 mt-2" />
                          <p className="text-[9px] font-black uppercase text-slate-400">Residência</p>
                          <button 
                            onClick={() => setDocComprovante('https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=400')}
                            className="w-full bg-slate-900 border-none rounded-xl py-2 text-[8px] font-black uppercase text-orange-500 hover:bg-orange-500/10 transition-all cursor-pointer"
                          >
                            Simular Compr.
                          </button>
                        </>
                      )}
                    </div>

                    <div className="p-4 bg-slate-950 rounded-3xl border border-white/5 text-center space-y-2 flex flex-col justify-between h-40 relative group">
                      {docSelfie ? (
                        <div className="absolute inset-0 rounded-3xl overflow-hidden">
                          <img src={docSelfie} className="w-full h-full object-cover" />
                          <button onClick={() => setDocSelfie('')} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-red-500"><X size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <Camera size={24} className="mx-auto text-orange-500 mt-2" />
                          <p className="text-[9px] font-black uppercase text-slate-400">Selfie c/ CNH</p>
                          <button 
                            onClick={() => setDocSelfie('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400')}
                            className="w-full bg-slate-900 border-none rounded-xl py-2 text-[8px] font-black uppercase text-orange-500 hover:bg-orange-500/10 transition-all cursor-pointer"
                          >
                            Simular Selfie
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-500 italic text-center">💡 Dica: Dê um clique simples no botão "Simular" para preencher cada foto com um documento de teste instantaneamente!</p>
                </div>

                <button 
                  onClick={handleSendDocuments}
                  disabled={submittingDocs || !cep || !rua || !numero || !docCNH || !docVeiculo || !docComprovante || !docSelfie}
                  className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  {submittingDocs ? <RefreshCw className="animate-spin" size={16} /> : <FileCheck size={16} />}
                  Enviar Todos os Documentos
                </button>
              </div>
            )}

            {/* Se em análise */}
            {currentUser?.profile?.status_aprovacao === 'em_analise' && (
              <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[40px] text-center space-y-6">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="w-24 h-24 bg-orange-500/10 rounded-full animate-ping absolute inset-0" />
                  <div className="w-24 h-24 bg-slate-900 rounded-full border border-orange-500/20 flex items-center justify-center text-orange-500 relative">
                    <Clock size={40} className="animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black tracking-tight">Cadastro em Análise!</h2>
                  <p className="text-xs text-slate-400">Nossos moderadores das Lojas Capel estão conferindo seus documentos e veículo. Isso geralmente leva menos de 24h úteis.</p>
                </div>

                <div className="p-6 bg-slate-950 rounded-3xl border border-white/5 text-left space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 text-green-500"><CheckCircle2 size={14} /></div>
                    <div>
                      <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">1. Conta Registrada</p>
                      <p className="text-[8px] text-slate-500">Seu usuário já está ativo no banco de dados.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0 text-orange-500 animate-pulse"><RefreshCw size={14} className="animate-spin" /></div>
                    <div>
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">2. Revisão de Documentos</p>
                      <p className="text-[8px] text-slate-500">Validando sua CNH, selfie e placa do veículo.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 opacity-40">
                    <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center shrink-0 text-slate-500"><Lock size={14} /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3. Acesso Liberado</p>
                      <p className="text-[8px] text-slate-500">Pronto para rodar na rua e começar a lucrar!</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
                    setCurrentUser((prev: any) => ({ ...prev, profile: updatedProfile }));
                  }}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Atualizar Status
                </button>
              </div>
            )}

            {/* Se rejeitado */}
            {currentUser?.profile?.status_aprovacao === 'rejeitado' && (
              <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[40px] text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle size={40} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black tracking-tight text-red-500">Cadastro Rejeitado</h2>
                  <p className="text-xs text-slate-400">Infelizmente, identificamos inconsistências na documentação enviada.</p>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-left">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Motivo da Rejeição:</p>
                  <p className="text-xs font-bold text-slate-200">{currentUser?.profile?.motivo_rejeicao || 'Fotos dos documentos ilegíveis ou placa incoerente com o modelo informado. Por favor, reenvie fotos mais nítidas.'}</p>
                </div>

                <button 
                  onClick={handleResetRejection}
                  className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <RefreshCw size={16} />
                  Corrigir e Reenviar
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <>
            {activeTab === 'inicio' && (
            <>
            {/* Resumo de Ganhos */}
            <section className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 border border-white/5 p-4 rounded-[32px]">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Wallet size={12} />
              <p className="text-[8px] font-black uppercase tracking-widest">Ganhos de Hoje</p>
            </div>
            <p className="text-xl font-black tracking-tighter text-orange-500">R$ {earnings.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/50 border border-white/5 p-4 rounded-[32px]">
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Package size={12} />
              <p className="text-[8px] font-black uppercase tracking-widest">Entregas</p>
            </div>
            <p className="text-xl font-black tracking-tighter">{deliveriesCount}</p>
          </div>
        </section>

        {/* Status Area */}
        {!isOnline && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-slate-700">
              <Power size={32} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Você está Offline</h2>
              <p className="text-xs text-slate-500">Fique online para começar a receber pedidos.</p>
            </div>
          </div>
        )}

        {isOnline && !activeOrder && !newOrderOffer && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 bg-orange-600/20 rounded-full animate-ping absolute inset-0" />
              <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center relative border border-orange-600/50">
                <Navigation size={40} className="text-orange-500 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Buscando Pedidos...</h2>
              <p className="text-xs text-slate-500">Aguarde na região de alta demanda.</p>
            </div>
          </div>
        )}

        {/* OFERTA DE NOVO PEDIDO */}
        <AnimatePresence>
          {newOrderOffer && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-orange-600 rounded-[40px] p-6 shadow-2xl shadow-orange-600/40 relative overflow-hidden z-[110]"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Nova Oferta #{newOrderOffer.id}</span>
                    <h2 className="text-2xl font-black tracking-tighter mt-2">R$ {newOrderOffer.valorGanhos.toFixed(2)}</h2>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                    <Clock size={20} />
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0"><Store size={16} /></div>
                    <div>
                      <p className="text-[8px] font-black text-white/60 uppercase">Coleta (Loja)</p>
                      <p className="text-xs font-bold">{newOrderOffer.loja}</p>
                      <p className="text-[9px] text-white/50">{newOrderOffer.lojaEndereco || 'Endereço não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center shrink-0"><MapPin size={16} /></div>
                    <div>
                      <p className="text-[8px] font-black text-white/60 uppercase">Entrega (Cliente)</p>
                      <p className="text-xs font-bold">{newOrderOffer.type === 'batch' ? `Múltiplos Destinos (${newOrderOffer.entregas.length} paradas)` : newOrderOffer.clienteEndereco || 'Endereço não informado'}</p>
                    </div>
                  </div>
                </div>

                {/* Detalhes dos Itens na Oferta */}
                <div className="bg-white/10 rounded-[24px] p-4 mb-8">
                  <p className="text-[8px] font-black text-white/60 uppercase mb-3 tracking-widest">Conteúdo da Entrega</p>
                  <div className="space-y-2">
                    {(newOrderOffer.itens || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <img src={item.imagem || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-lg object-cover border border-white/20" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold truncate">{item.qtd}x {item.nome}</p>
                          {item.variacao && <p className="text-[8px] text-white/60">{item.variacao}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => {
                    if (newOrderOffer?.fullId) {
                      setIgnoredOrders(prev => [...prev, newOrderOffer.fullId]);
                    }
                    setNewOrderOffer(null);
                  }} className="flex-1 bg-black/20 hover:bg-black/30 py-4 rounded-3xl font-black text-xs uppercase transition-all">Recusar</button>
                  <button onClick={handleAcceptOrder} className="flex-[2] bg-white text-orange-600 hover:bg-orange-50 py-4 rounded-3xl font-black text-xs uppercase shadow-xl transition-all">Aceitar Pedido</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PEDIDO ATIVO */}
        {activeOrder && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-white/5 rounded-[40px] p-6 overflow-hidden relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Em Andamento #{activeOrder.type === 'batch' ? activeOrder.entregas[currentStopIndex].id : activeOrder.id}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="p-2 bg-red-500/10 rounded-xl hover:bg-red-500 text-red-500 hover:text-white transition-all flex items-center gap-2"
                  >
                    <AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase">Reportar</span>
                  </button>
                  <button 
                    onClick={() => activeOrder.clienteTelefone && (window.location.href = `tel:${activeOrder.clienteTelefone}`)}
                    className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white"
                  >
                    <Phone size={16} />
                  </button>
                  <button 
                    onClick={() => activeOrder.clienteTelefone && window.open(`https://wa.me/55${activeOrder.clienteTelefone.replace(/\D/g,'')}`, '_blank')}
                    className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>

              <div className="relative mb-8 px-4">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 border-l border-dashed border-white/20" />
                
                <div className={`flex items-start gap-4 relative z-10 transition-opacity ${activeOrder.status === 'entrega' ? 'opacity-30' : 'opacity-100'}`}>
                  <div className="w-4 h-4 rounded-full bg-orange-600 mt-1 flex items-center justify-center ring-4 ring-orange-600/20"><Store size={8} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase">Ponto de Coleta</p>
                        <p className="text-sm font-bold">{activeOrder.loja}</p>
                        <p className="text-[10px] text-slate-400">{activeOrder.lojaEndereco}</p>
                      </div>
                      <button 
                        onClick={() => openNavigation(activeOrder.lojaCoords?.lat, activeOrder.lojaCoords?.lng, activeOrder.lojaEndereco)}
                        className="p-2 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                      >
                        <Navigation size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`flex items-start gap-4 relative z-10 mt-8 transition-opacity ${activeOrder.status === 'coleta' ? 'opacity-30' : 'opacity-100'}`}>
                  <div className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center ring-4 ${activeOrder.status === 'entrega' ? 'bg-green-500 ring-green-500/20' : 'bg-slate-700 ring-slate-700/20'}`}><MapPin size={8} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase">{activeOrder.type === 'batch' ? `Parada ${currentStopIndex + 1} de ${activeOrder.entregas.length}` : 'Ponto de Entrega'}</p>
                        <p className="text-sm font-bold">{activeOrder.type === 'batch' ? activeOrder.entregas[currentStopIndex].cliente : activeOrder.cliente}</p>
                        <p className="text-[10px] text-slate-400">{activeOrder.type === 'batch' ? activeOrder.entregas[currentStopIndex].clienteEndereco : activeOrder.clienteEndereco}</p>
                      </div>
                      <button 
                        onClick={() => openNavigation(
                           activeOrder.type === 'batch' ? activeOrder.entregas[currentStopIndex].destinoCoords?.lat : activeOrder.destinoCoords?.lat,
                           activeOrder.type === 'batch' ? activeOrder.entregas[currentStopIndex].destinoCoords?.lng : activeOrder.destinoCoords?.lng,
                           activeOrder.type === 'batch' ? activeOrder.entregas[currentStopIndex].clienteEndereco : activeOrder.clienteEndereco
                        )}
                        className="p-2 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all"
                      >
                        <Navigation size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

                {/* Detalhes dos Itens no Pedido Ativo */}
                <div className="mt-6 pt-6 border-t border-white/5 mb-8">
                   <p className="text-[8px] font-black text-slate-500 uppercase mb-4 tracking-widest">Itens para Conferência</p>
                   <div className="grid grid-cols-1 gap-3 px-4">
                      {(activeOrder.itens || []).map((item: any, idx: number) => (
                         <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                            <div className="relative">
                               <img src={item.imagem || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-xl object-cover" />
                               <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-slate-900">{item.qtd}x</span>
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-xs font-bold text-slate-200 truncate">{item.nome}</p>
                               {item.variacao && (
                                  <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md mt-1 inline-block uppercase tracking-wider">
                                     {item.variacao}
                                  </span>
                               )}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

               <div className="px-6 pb-4 space-y-3">
                <button 
                  onClick={() => {
                    let coords = activeOrder.status === 'coleta' ? activeOrder.lojaCoords : activeOrder.destinoCoords;
                    let addr = activeOrder.status === 'coleta' ? activeOrder.lojaEndereco : activeOrder.clienteEndereco;
                    if (activeOrder.type === 'batch' && activeOrder.status === 'entrega') {
                       coords = activeOrder.entregas[currentStopIndex].destinoCoords;
                       addr = activeOrder.entregas[currentStopIndex].clienteEndereco;
                    }
                    openNavigation(coords?.lat, coords?.lng, addr);
                  }}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Navigation size={14} className="text-orange-500" />
                  Abrir no Google Maps
                </button>
              </div>

              <button 
                onClick={handleStepComplete}
                className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-xl ${
                  activeOrder.status === 'coleta' 
                    ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/20' 
                    : 'bg-green-600 hover:bg-green-500 shadow-green-600/20'
                }`}
              >
                {activeOrder.status === 'coleta' ? 'Marcar como Coletado' : 'Confirmar Entrega'}
              </button>
            </div>
          </div>
        )}

        {/* MAPA REALTIME DO ENTREGADOR - renderizado sempre para o Leaflet inicializar */}
        <div className={`bg-slate-900 border border-white/5 rounded-[40px] h-[300px] relative overflow-hidden z-10 transition-all ${activeOrder ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
           <div ref={mapContainerRef} className="absolute inset-0" style={{ background: '#e8e4df' }} />
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
               <button onClick={handleRecenterMap} className="bg-black/60 backdrop-blur p-3 rounded-2xl border border-white/10 text-white font-black hover:bg-orange-600 transition-colors" title="Centralizar mapa"><Compass size={16} /></button>
               <button onClick={() => mapRef.current?.zoomIn()} className="bg-black/60 backdrop-blur p-3 rounded-2xl border border-white/10 text-white font-black hover:bg-orange-600 transition-colors">+</button>
               <button onClick={() => mapRef.current?.zoomOut()} className="bg-black/60 backdrop-blur p-3 rounded-2xl border border-white/10 text-white font-black hover:bg-orange-600 transition-colors">-</button>
            </div>
         </div>
          </>
          )}

          {/* ABA DE CHAT */}
          {activeTab === 'chat' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Seletor de parceiro de conversa */}
              <div className="flex gap-2">
                {activeOrder && (
                  <button
                    onClick={() => { setChatPartner('loja'); setChatMessages([]); }}
                    className={`flex-1 p-4 rounded-[32px] border text-left transition-all ${
                      chatPartner === 'loja'
                        ? 'bg-orange-600/20 border-orange-500/40'
                        : 'bg-slate-900/50 border-white/5 hover:bg-slate-900'
                    }`}
                  >
                    <Store size={20} className={chatPartner === 'loja' ? 'text-orange-500' : 'text-slate-500'} />
                    <p className="text-xs font-bold mt-2">{activeOrder.loja || 'Loja'}</p>
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Loja</p>
                  </button>
                )}
                <button
                  onClick={() => { setChatPartner('suporte'); setChatMessages([]); }}
                  className={`flex-1 p-4 rounded-[32px] border text-left transition-all ${
                    chatPartner === 'suporte'
                      ? 'bg-orange-600/20 border-orange-500/40'
                      : 'bg-slate-900/50 border-white/5 hover:bg-slate-900'
                  }`}
                >
                  <ShieldCheck size={20} className={chatPartner === 'suporte' ? 'text-orange-500' : 'text-slate-500'} />
                  <p className="text-xs font-bold mt-2">Suporte CapelGo</p>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Administrador</p>
                </button>
              </div>

              {chatPartner ? (
                <div className="bg-slate-900/50 border border-white/5 rounded-[40px] overflow-hidden flex flex-col h-[450px]">
                  {/* Header do chat */}
                  <div className="p-4 border-b border-white/5 flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-black text-sm">
                      {chatPartner === 'loja'
                        ? (activeOrder?.loja || 'L').substring(0, 2).toUpperCase()
                        : 'S'}
                    </div>
                    <div>
                      <h4 className="text-xs font-black">
                        {chatPartner === 'loja' ? (activeOrder?.loja || 'Loja') : 'Suporte CapelGo'}
                      </h4>
                      <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">
                        {chatPartner === 'loja' ? 'Loja' : 'Administrador'}
                      </p>
                    </div>
                    <button onClick={() => { setChatPartner(null); setChatMessages([]); }} className="ml-auto p-2 text-slate-500 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.filter(msg => {
                      if (chatPartner === 'loja') return msg.tipo_remetente === 'lojista' || msg.tipo_remetente === 'entregador';
                      if (chatPartner === 'suporte') return msg.tipo_remetente === 'admin' || msg.tipo_remetente === 'entregador';
                      return true;
                    }).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-40 space-y-2 py-16">
                        <MessageSquare size={40} className="text-slate-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nenhuma mensagem ainda</p>
                        <p className="text-[11px] text-slate-600 max-w-[220px]">Envie uma mensagem para {chatPartner === 'loja' ? 'a loja' : 'o suporte'}.</p>
                      </div>
                    ) : (
                      chatMessages.filter(msg => {
                        if (chatPartner === 'loja') return msg.tipo_remetente === 'lojista' || msg.tipo_remetente === 'entregador';
                        if (chatPartner === 'suporte') return msg.tipo_remetente === 'admin' || msg.tipo_remetente === 'entregador';
                        return true;
                      }).map((msg) => {
                        const isMe = msg.tipo_remetente === 'entregador';
                        const roleLabel = msg.tipo_remetente === 'lojista' ? 'Loja' : msg.tipo_remetente === 'admin' ? 'Admin' : '';
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3.5 rounded-2xl border relative flex flex-col ${
                              isMe
                                ? 'bg-orange-600 border-orange-500/30 text-white rounded-tr-none'
                                : 'bg-slate-800 border-white/10 text-slate-200 rounded-tl-none'
                            }`}>
                              {!isMe && roleLabel && (
                                <span className="text-[8px] font-black uppercase tracking-wider text-orange-400 mb-1">{roleLabel}</span>
                              )}
                              <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{msg.texto}</p>
                              <span className="text-[7px] font-bold mt-1 text-right block self-end text-slate-500">
                                {msg.created_at
                                  ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'Agora'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-white/5 flex gap-2 items-center shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder={chatPartner === 'loja' ? 'Fale com a loja...' : 'Fale com o suporte...'}
                      className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-xs font-semibold text-white outline-none focus:border-orange-500 transition-colors"
                    />
                    <button
                      onClick={sendChatMessage}
                      className="w-11 h-11 bg-orange-600 text-white rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-600">
                    <MessageSquare size={28} />
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">Selecione com quem deseja conversar</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ganhos' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <DateFilterBar selectedDays={ganhoFilterDays} onChange={setGanhoFilterDays} />

            <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-5 rounded-[32px] shadow-xl shadow-green-600/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-green-100">Total no período</p>
                  <h3 className="text-3xl font-black text-white mt-1">
                    R$ {filteredHistory.reduce((acc, item) => acc + Number(item.taxa_entrega || item.repasse_entregador_valor || 7), 0).toFixed(2)}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-green-100">Entregas</p>
                  <p className="text-3xl font-black text-white mt-1">{filteredHistory.length}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end mb-2">
              <h2 className="text-2xl font-black tracking-tight">Suas Entregas</h2>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{filteredHistory.length} Concluídas</span>
            </div>
            
            <div className="space-y-3">
              {filteredHistory.map((item, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-white/5 p-5 rounded-[32px] flex justify-between items-center group hover:bg-slate-900 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pedido #{item?.id ? item.id.toString().slice(-4).toUpperCase() : '----'}</p>
                      <p className="text-sm font-bold text-slate-200">{item.loja_nome || 'Loja Parceira'}</p>
                      <p className="text-[9px] text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '--/--'} às {item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-green-500">R$ {Number(item.taxa_entrega || item.repasse_entregador_valor || 7).toFixed(2)}</p>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Pago</span>
                  </div>
                </div>
              ))}
              
              {filteredHistory.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
                    <Package size={32} />
                  </div>
                  <p className="text-xs text-slate-500 italic">Você ainda não realizou entregas hoje.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'perfil' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Banner de Campanha Especial (iFood Style) */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-orange-600 to-amber-500 p-6 rounded-[36px] shadow-xl shadow-orange-600/10 relative overflow-hidden"
            >
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                <Award size={120} />
              </div>
              <div className="relative z-10 space-y-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white">Campanha CapelGo</span>
                <h3 className="text-lg font-black tracking-tight text-white leading-tight">Concorra a R$ 4.000 em Prêmios!</h3>
                <p className="text-[10px] text-white/80 font-medium">Realize 30 entregas esta semana e faça o curso rápido de Trânsito Seguro no Decola.</p>
                <button 
                  onClick={() => setActivePerfilDrawer(activePerfilDrawer === 'vantagens' ? null : 'vantagens')}
                  className="mt-3 bg-white text-orange-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md hover:bg-slate-100 transition-all"
                >
                  Conhecer Vantagens
                </button>
              </div>
            </motion.div>

            {/* Perfil Header */}
            <div className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-[32px] border border-white/5">
              <div className="w-16 h-16 bg-orange-600 rounded-[24px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-600/20">
                {(currentUser?.profile?.nome || 'E').charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">{currentUser?.profile?.nome || 'Entregador'}</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{currentUser?.profile?.veiculo_tipo || 'Moto'} • Reputação {currentUser?.profile?.avaliacao || '5.0'} ⭐</p>
                <span className="inline-block bg-green-500/10 text-green-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase mt-1">Conta Verificada</span>
              </div>
            </div>

            {/* Seção 1: Sua Conta */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Sua Conta</h4>
              
              {/* DADOS PESSOAIS */}
              <div className="bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden">
                <button 
                  onClick={() => setActivePerfilDrawer(activePerfilDrawer === 'pessoais' ? null : 'pessoais')}
                  className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500"><UserIcon size={18} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-200">Dados Pessoais</p>
                      <p className="text-[9px] text-slate-500">Gerencie seu nome, telefone e chaves de pagamento</p>
                    </div>
                  </div>
                  {activePerfilDrawer === 'pessoais' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                <AnimatePresence>
                  {activePerfilDrawer === 'pessoais' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4"
                    >
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                        <input 
                          type="text" 
                          value={perfilNome} 
                          onChange={(e) => setPerfilNome(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Telefone de Contato</label>
                        <input 
                          type="text" 
                          value={perfilTelefone} 
                          onChange={(e) => setPerfilTelefone(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">E-mail (Não alterável)</label>
                        <input 
                          type="text" 
                          value={currentUser?.email || ''} 
                          disabled
                          className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 text-xs font-bold text-slate-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Chave PIX (Para receber repasses)</label>
                        <input 
                          type="text" 
                          value={perfilPixChave} 
                          onChange={(e) => setPerfilPixChave(e.target.value)}
                          placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      <button 
                        onClick={handleUpdatePerfilDetails}
                        disabled={isSavingPerfil}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2"
                      >
                        {isSavingPerfil ? <RefreshCw className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                        Salvar Alterações
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* DADOS DE ENTREGA */}
              <div className="bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden">
                <button 
                  onClick={() => setActivePerfilDrawer(activePerfilDrawer === 'entrega' ? null : 'entrega')}
                  className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500"><Navigation size={18} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-200">Dados de Entrega</p>
                      <p className="text-[9px] text-slate-500">Forma de entrega, veículo, modelo e placa</p>
                    </div>
                  </div>
                  {activePerfilDrawer === 'entrega' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                <AnimatePresence>
                  {activePerfilDrawer === 'entrega' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tipo de Veículo</label>
                          <select 
                            value={perfilVeiculoTipo} 
                            onChange={(e) => setPerfilVeiculoTipo(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                          >
                            <option value="Moto">Moto</option>
                            <option value="Bike">Bicicleta</option>
                            <option value="Carro">Carro</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Placa do Veículo</label>
                          <input 
                            type="text" 
                            value={perfilVeiculoPlaca} 
                            onChange={(e) => setPerfilVeiculoPlaca(e.target.value.toUpperCase())}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Modelo do Veículo</label>
                        <input 
                          type="text" 
                          value={perfilVeiculoModelo} 
                          onChange={(e) => setPerfilVeiculoModelo(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>

                      <button 
                        onClick={handleUpdatePerfilDetails}
                        disabled={isSavingPerfil}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2"
                      >
                        {isSavingPerfil ? <RefreshCw className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                        Salvar Informações do Veículo
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CONFIGURAÇÕES OPERACIONAIS (ESTILO IFOOD) */}
              <div className="bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden">
                <button 
                  onClick={() => setActivePerfilDrawer(activePerfilDrawer === 'operacionais' ? null : 'operacionais')}
                  className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500"><Sliders size={18} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-200">Configurações Operacionais</p>
                      <p className="text-[9px] text-slate-500">Regime de trabalho, raio de atuação, pagamentos</p>
                    </div>
                  </div>
                  {activePerfilDrawer === 'operacionais' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                <AnimatePresence>
                  {activePerfilDrawer === 'operacionais' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4"
                    >
                      {/* Regime de Trabalho */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Regime de Trabalho (iFood Style)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            onClick={() => setRegimeTrabalho('nuvem')}
                            className={`p-3 rounded-2xl border-2 transition-all font-black text-[9px] uppercase tracking-wider ${regimeTrabalho === 'nuvem' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-white/5 text-slate-400 bg-slate-950/40'}`}
                          >
                            Nuvem (CapelGo Match)
                          </button>
                          <button 
                            type="button"
                            onClick={() => setRegimeTrabalho('fixo_loja')}
                            className={`p-3 rounded-2xl border-2 transition-all font-black text-[9px] uppercase tracking-wider ${regimeTrabalho === 'fixo_loja' ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-white/5 text-slate-400 bg-slate-950/40'}`}
                          >
                            Fixo de Loja
                          </button>
                        </div>
                      </div>

                      {/* Selecionar Loja se Fixo de Loja */}
                      {regimeTrabalho === 'fixo_loja' && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Selecione sua Loja de Vínculo</label>
                          <select 
                            value={lojaFixaId} 
                            onChange={(e) => setLojaFixaId(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                          >
                            <option value="">Selecione uma loja...</option>
                            {lojasDisponiveis.map(loja => (
                              <option key={loja.id} value={loja.id}>{loja.nome}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Raio de Atuação */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Raio Máximo de Atuação</label>
                        <select 
                          value={raioAtuacao} 
                          onChange={(e) => setRaioAtuacao(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        >
                          <option value="1">Até 1 km (Ideal para Bike)</option>
                          <option value="3">Até 3 km (Ideal para Bike Elétrica)</option>
                          <option value="5">Até 5 km (Recomendado para Moto)</option>
                          <option value="10">Até 10 km (Moto Pro)</option>
                          <option value="99">Sem Limite de Distância</option>
                        </select>
                      </div>

                      {/* Tipo de Pagamento */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Método de Recebimento</label>
                        <select 
                          value={tipoPagamentoAceito} 
                          onChange={(e) => setTipoPagamentoAceito(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        >
                          <option value="online">Apenas Pagamento Online (Pix já confirmado pelo Admin)</option>
                          <option value="todos">Todos (Online + Pagamento na Maquininha/Dinheiro)</option>
                        </select>
                      </div>

                      {/* Precisão do GPS */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Frequência do Rastreamento GPS</label>
                        <select 
                          value={gpsPrecisao} 
                          onChange={(e) => setGpsPrecisao(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500 transition-colors"
                        >
                          <option value="alta">Alta Precisão (Atualiza a cada 5s, maior consumo de bateria)</option>
                          <option value="bateria">Economia de Bateria (Atualiza a cada 20s, ideal para rotas longas)</option>
                        </select>
                      </div>

                      <button 
                        onClick={() => {
                          localStorage.setItem('capelgo_regime_trabalho', regimeTrabalho);
                          localStorage.setItem('capelgo_loja_fixa_id', lojaFixaId);
                          localStorage.setItem('capelgo_raio_atuacao', raioAtuacao);
                          localStorage.setItem('capelgo_tipo_pagamento', tipoPagamentoAceito);
                          localStorage.setItem('capelgo_gps_precisao', gpsPrecisao);
                          alert('Configurações operacionais salvas com sucesso!');
                        }}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-600/10 flex items-center justify-center gap-2"
                      >
                        <Check size={14} />
                        Confirmar Configurações Pro
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CONFIGURAÇÕES DE CONTA */}
              <div className="bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden">
                <button 
                  onClick={() => setActivePerfilDrawer(activePerfilDrawer === 'config' ? null : 'config')}
                  className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500"><Settings size={18} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-200">Configurações de Conta</p>
                      <p className="text-[9px] text-slate-500">Notificações, privacidade e opções avançadas</p>
                    </div>
                  </div>
                  {activePerfilDrawer === 'config' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                <AnimatePresence>
                  {activePerfilDrawer === 'config' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4 text-xs font-medium text-slate-300"
                    >
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-bold text-slate-200">Notificações por Som</p>
                          <p className="text-[9px] text-slate-500">Alertar novos pedidos com som e vibração</p>
                        </div>
                        <button 
                          onClick={() => setSoundNotif(!soundNotif)}
                          className={`w-12 h-6 rounded-full p-1 transition-all ${soundNotif ? 'bg-orange-600' : 'bg-slate-800'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all ${soundNotif ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex justify-between items-center py-2 border-t border-white/5">
                        <div>
                          <p className="font-bold text-slate-200">Modo Escuro Permanente</p>
                          <p className="text-[9px] text-slate-500">Forçar visual com alto contraste para economia de bateria</p>
                        </div>
                        <button 
                          onClick={() => setDarkMode(!darkMode)}
                          className={`w-12 h-6 rounded-full p-1 transition-all ${darkMode ? 'bg-orange-600' : 'bg-slate-800'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <button 
                          onClick={() => {
                            if(confirm("Deseja realmente solicitar a exclusão de sua conta? Esta ação enviará um ticket ao admin e é irreversível.")) {
                              alert("Solicitação enviada! Nossa equipe financeira entrará em contato em até 48h.");
                            }
                          }}
                          className="w-full py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Solicitar Exclusão da Conta
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Seção 2: Opções para Você */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Opções para Você</h4>

              {/* INDIQUE E GANHE */}
              <div className="bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden">
                <button 
                  onClick={() => setActivePerfilDrawer(activePerfilDrawer === 'indique' ? null : 'indique')}
                  className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500"><Gift size={18} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-200">Indique e Ganhe</p>
                      <p className="text-[9px] text-slate-500">Ganhe até R$ 50,00 indicando novos parceiros</p>
                    </div>
                  </div>
                  {activePerfilDrawer === 'indique' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                <AnimatePresence>
                  {activePerfilDrawer === 'indique' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4"
                    >
                      <p className="text-xs text-slate-300">Indique um amigo para ser entregador na Lojas Capel! Assim que ele completar 20 entregas válidas, ambos ganham um bônus de <b>R$ 50,00</b> creditados direto na carteira.</p>
                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Seu Código de Indicação</p>
                          <p className="text-sm font-black text-orange-500 tracking-wider">CAPELGO-DELIVERY-515</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText('CAPELGO-DELIVERY-515');
                            alert('Código de indicação copiado!');
                          }}
                          className="px-4 py-2 bg-orange-600 rounded-xl text-[9px] font-black uppercase text-white shadow-md"
                        >
                          Copiar Código
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* VANTAGENS (PARCERIAS, SEGURO, DESCONTOS) */}
              <div className="bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden">
                <button 
                  onClick={() => setActivePerfilDrawer(activePerfilDrawer === 'vantagens' ? null : 'vantagens')}
                  className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500"><Compass size={18} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-200">Vantagens & Benefícios</p>
                      <p className="text-[9px] text-slate-500">Seguro de vida, descontos e cursos gratuitos</p>
                    </div>
                  </div>
                  {activePerfilDrawer === 'vantagens' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                <AnimatePresence>
                  {activePerfilDrawer === 'vantagens' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4"
                    >
                      <div className="grid grid-cols-1 gap-3">
                        <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex gap-3 items-center">
                          <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center shrink-0 text-orange-500"><ShieldCheck size={20} /></div>
                          <div>
                            <p className="text-xs font-black text-slate-200">Seguro de Acidentes Capel</p>
                            <p className="text-[9px] text-slate-500 font-medium">Proteção total e assistência gratuita e automática ativa durante todas as suas rotas.</p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex gap-3 items-center">
                          <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center shrink-0 text-orange-500"><Wallet size={20} /></div>
                          <div>
                            <p className="text-xs font-black text-slate-200">Desconto de R$ 0,30/L na Shell</p>
                            <p className="text-[9px] text-slate-500 font-medium">Abasteça usando o Shell Box com nosso cupom exclusivo nas Lojas Capel.</p>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex gap-3 items-center animate-pulse">
                          <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center shrink-0 text-orange-500"><Award size={20} /></div>
                          <div>
                            <p className="text-xs font-black text-orange-500">Curso Decola CapelGo</p>
                            <p className="text-[9px] text-slate-500 font-medium">Faça o curso gratuito de pilotagem defensiva e ganhe pontuação extra na fila de pedidos!</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* EVENTOS (CLAIM BAG) */}
              <div className="bg-slate-900/50 border border-white/5 rounded-[32px] overflow-hidden">
                <button 
                  onClick={() => setActivePerfilDrawer(activePerfilDrawer === 'eventos' ? null : 'eventos')}
                  className="w-full p-5 flex justify-between items-center hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500"><Package size={18} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-200">Eventos & Campanhas</p>
                      <p className="text-[9px] text-slate-500">Ações de distribuição de mochilas e materiais gratuitos</p>
                    </div>
                  </div>
                  {activePerfilDrawer === 'eventos' ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                <AnimatePresence>
                  {activePerfilDrawer === 'eventos' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 pt-2 border-t border-white/5 space-y-4"
                    >
                      <div className="p-4 bg-orange-600/10 border border-orange-600/20 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-orange-500"><Info size={16} /> <p className="text-xs font-black uppercase">Mochila Térmica Oficial Grátis</p></div>
                        <p className="text-xs text-slate-300">Retire seu kit completo oficial da Lojas Capel contendo Mochila térmica impermeável, Jaqueta corta-vento e suporte de celular para guidão.</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Local: Av. Paulista, 1000 - Balcão de Logística Central</p>
                        <button 
                          onClick={() => {
                            alert("Kit reservado com sucesso! Apresente o código CAPEL-KIT-998 na retirada.");
                          }}
                          className="w-full mt-2 py-3 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg shadow-orange-600/10"
                        >
                          Reservar Equipamento Gratuito
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-full py-5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-[32px] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3"
            >
              <LogOut size={18} />
              Sair da Conta Parceira
            </button>
          </motion.div>
        )}
      </>
    )}

      </main>

      {/* MODAL DE CÓDIGO DE SEGURANÇA */}
      <AnimatePresence>
        {showCodeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCodeModal(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 w-full max-w-sm rounded-[40px] p-8 border border-white/10 shadow-2xl"
            >
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto text-orange-500">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-xl font-black tracking-tight">Código de Entrega</h3>
                <p className="text-xs text-slate-400">Solicite ao cliente o código de 4 caracteres para confirmar o recebimento.</p>
                <p className="text-[10px] text-orange-500 font-bold uppercase">Dica: São os 4 caracteres finais do pedido (#{activeOrder?.type === 'batch' ? (activeOrder?.entregas[currentStopIndex]?.id || '').toString().slice(-4).toUpperCase() : (activeOrder?.id || '').toString().slice(-4).toUpperCase()})</p>
              </div>

              <input 
                type="text" 
                maxLength={4}
                autoFocus
                value={deliveryCode}
                onChange={(e) => setDeliveryCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
                placeholder="XXXX"
                className="w-full bg-white text-slate-900 border-4 border-orange-600/20 rounded-[24px] p-6 text-center text-4xl font-black tracking-[0.5em] focus:border-orange-600 transition-all outline-none mb-8 shadow-inner"
              />

              <div className="flex gap-3">
                <button onClick={() => setShowCodeModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-500">Cancelar</button>
                <button 
                  onClick={confirmDeliveryWithCode}
                  className="flex-[2] bg-orange-600 py-4 rounded-2xl font-black text-xs uppercase shadow-xl shadow-orange-600/20"
                >
                  Confirmar Entrega
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE REPORTAR PROBLEMA */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReportModal(false)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 w-full max-w-sm rounded-[40px] p-8 border border-white/10 shadow-2xl"
            >
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto text-red-500">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black tracking-tight">Reportar Problema</h3>
                <p className="text-xs text-slate-400">Selecione o motivo do impedimento da entrega.</p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Loja Fechada / Não encontrada',
                  'Cliente não atende / Ausente',
                  'Problema com o Veículo',
                  'Pedido com defeito / vazando',
                  'Outro motivo'
                ].map((reason) => (
                  <button 
                    key={reason}
                    onClick={() => handleReportProblem(reason)}
                    className="w-full py-4 px-6 bg-white/5 hover:bg-red-500/20 border border-white/5 rounded-2xl text-left text-xs font-bold transition-all flex justify-between items-center group"
                  >
                    {reason}
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-red-500" />
                  </button>
                ))}
              </div>

              <button onClick={() => setShowReportModal(false)} className="w-full py-4 text-[10px] font-black uppercase text-slate-500">Voltar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Nav Inferior */}
      {currentUser?.profile?.status_aprovacao === 'aprovado' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center max-w-lg mx-auto rounded-t-[32px]">
        <button 
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'inicio' ? 'text-orange-500 scale-110' : 'text-slate-500'}`}
        >
          <Navigation size={20} />
          <span className="text-[8px] font-black uppercase">Início</span>
        </button>
        <button 
          onClick={() => setActiveTab('ganhos')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ganhos' ? 'text-orange-500 scale-110' : 'text-slate-500'}`}
        >
          <Wallet size={20} />
          <span className="text-[8px] font-black uppercase">Ganhos</span>
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-orange-500 scale-110' : 'text-slate-500'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[8px] font-black uppercase">Chat</span>
        </button>
        <button 
          onClick={() => setActiveTab('perfil')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'perfil' ? 'text-orange-500 scale-110' : 'text-slate-500'}`}
        >
          <Star size={20} />
          <span className="text-[8px] font-black uppercase">Perfil</span>
        </button>
      </nav>
      )}
    </div>
  );
};

export default EntregadorDashboard;
