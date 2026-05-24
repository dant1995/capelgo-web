import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { 
  MapPin, 
  Package, 
  Navigation, 
  ChevronLeft, 
  Phone, 
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Send,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    L: any;
  }
}

export default function Rastreio() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRated, setIsRated] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [mapReady, setMapReady] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [driverPos, setDriverPos] = useState<{lat: number, lng: number} | null>(null);
  const [lojaInfo, setLojaInfo] = useState<any>(null);
  const [generatedCoupon, setGeneratedCoupon] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DEVOLUCOES E REEMBOLSOS STATE
  const [devolucaoInfo, setDevolucaoInfo] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnMotivo, setReturnMotivo] = useState('produto_defeito');
  const [returnSolucao, setReturnSolucao] = useState('devolucao_e_reembolso');
  const [returnDetalhes, setReturnDetalhes] = useState('');
  const [returnFotos, setReturnFotos] = useState<string[]>([]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 1. Carregar Dados Iniciais do Pedido
  useEffect(() => {
    async function loadPedido() {
      if (!pedidoId) return;
        const { data, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single();

        if (data) {
          setPedido(data);
          
          // Buscar info da loja para marketing
          if (data.loja_id) {
            const { data: store } = await supabase
              .from('lojas')
              .select('*')
              .eq('id', data.loja_id)
              .single();
            setLojaInfo(store);
          }

          if (data.geolocalizacao_entregador) {
            const { lat, lng } = data.geolocalizacao_entregador;
            const nLat = Number(lat);
            const nLng = Number(lng);
            if (!isNaN(nLat) && !isNaN(nLng)) {
              setDriverPos({ lat: nLat, lng: nLng });
            }
          }
          
          try {
            // Verificar se já avaliou na tabela de avaliacoes
            const { data: existingReview, error: revError } = await supabase
              .from('avaliacoes')
              .select('*')
              .eq('pedido_id', pedidoId)
              .maybeSingle();

            if (!revError && existingReview) {
              setIsRated(true);
              setRating(existingReview.nota);
              setComment(existingReview.comentario);
            }
          } catch (e) {
            console.warn("Não foi possível carregar avaliações antigas:", e);
          }

          try {
            // Verificar se já existe solicitação de devolução
            const { data: returnReq, error: retError } = await supabase
              .from('devolucoes')
              .select('*')
              .eq('pedido_id', pedidoId)
              .maybeSingle();
              
            if (!retError && returnReq) {
              setDevolucaoInfo(returnReq);
            }
          } catch (e) {
            console.warn("Não foi possível carregar informações da devolução:", e);
          }
        }
      setLoading(false);
    }
    loadPedido();
  }, [pedidoId]);

  // 2. Ouvir Mudanças em Tempo Real (GPS do Entregador)
  useEffect(() => {
    if (!pedidoId) return;

    const handlePedidoUpdate = (payload: any) => {
      try {
        setPedido(payload.new);
        if (payload.new.geolocalizacao_entregador) {
          const { lat, lng } = payload.new.geolocalizacao_entregador;
          const nLat = Number(lat);
          const nLng = Number(lng);
          if (!isNaN(nLat) && !isNaN(nLng)) {
            setDriverPos({ lat: nLat, lng: nLng });
          }
        }
      } catch (err) {
        console.warn('Erro ao processar atualização Realtime:', err);
      }
    };

    const channel = supabase
      .channel(`rastreio-${pedidoId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'pedidos',
        filter: `id=eq.${pedidoId}`
      }, handlePedidoUpdate)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.warn('Realtime rastreio: erro no canal');
      });

    const devChannel = supabase
      .channel(`devolucao-${pedidoId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'devolucoes',
        filter: `pedido_id=eq.${pedidoId}`
      }, (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            setDevolucaoInfo(null);
          } else {
            setDevolucaoInfo(payload.new);
          }
        } catch (err) {
          console.warn('Erro ao processar devolução Realtime:', err);
        }
      })
      .subscribe();

    // Fallback: polling a cada 15s caso o Realtime falhe
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase.from('pedidos').select('*').eq('id', pedidoId).single();
        if (data) setPedido(data);
      } catch (e) {
        // silencioso
      }
    }, 15000);

    return () => { 
      supabase.removeChannel(channel); 
      supabase.removeChannel(devChannel);
      clearInterval(pollInterval);
    };
  }, [pedidoId]);

  // 3. Carregador Dinâmico do Leaflet (Emergência)
  useEffect(() => {
    // Polling de segurança
    const checkInterval = setInterval(() => {
      if ((window as any).L && !mapRef.current) {
        initMap();
      }
      if (mapRef.current) clearInterval(checkInterval);
    }, 1000);

    if (!(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      clearInterval(checkInterval);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };

    function initMap() {
      console.log("🚀 Tentando inicializar mapa...");
      if (!mapContainerRef.current || mapRef.current) {
        console.log("⚠️ Container ausente ou mapa já existente.");
        return;
      }
      
      try {
        const L = (window as any).L;
        if (!L) {
          console.error("❌ Leaflet (L) não encontrado!");
          return;
        }

        setMapReady(true); // Forçar sumir o carregando
        console.log("✅ Leaflet encontrado, criando objeto map...");

        const initialLat = driverPos?.lat && driverPos.lat !== 0 ? driverPos.lat : -23.5505;
        const initialLng = driverPos?.lng && driverPos.lng !== 0 ? driverPos.lng : -46.6333;

      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([initialLat, initialLng], 15);

      // Usando CartoDB Voyager (Mais limpo e performático)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
      }).addTo(mapRef.current);
      
      // Múltiplas tentativas de forçar renderização
      [100, 500, 1000].forEach(delay => {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
            console.log(`📏 Redimensionamento forçado (${delay}ms)`);
          }
        }, delay);
      });
      } catch (err) {
        console.error("❌ Falha crítica no initMap:", err);
      }
    }
  }, []);

  // 4. Atualizar Marcadores e Zoom
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    const L = window.L;

    if (driverPos && !isNaN(driverPos.lat) && !isNaN(driverPos.lng)) {
      try {
        if (mapRef.current) mapRef.current.invalidateSize(); 

        // 1. Marcador do Entregador
        if (markerRef.current) {
          markerRef.current.setLatLng([driverPos.lat, driverPos.lng]);
        } else if (mapRef.current) {
          const bikeIcon = (window as any).L.divIcon({
            className: 'custom-bike-icon',
            html: `<div class="relative">
                    <div class="absolute -inset-4 bg-orange-500/20 rounded-full animate-ping"></div>
                    <div class="bg-orange-600 p-2 rounded-full shadow-2xl border-2 border-white relative z-10 scale-110">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" stroke-width="3" fill="none"><path d="M5.5 17.5L2 17.5L2 15.5L4 15.5L4.5 13.5L14 13.5L14.5 15.5L18.5 15.5L18.5 17.5L15 17.5M10 13.5L10 11.5L12 11.5L12 13.5M6 13.5L6 11.5L8 11.5L8 13.5"/></svg>
                    </div>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
          markerRef.current = (window as any).L.marker([driverPos.lat, driverPos.lng], { icon: bikeIcon }).addTo(mapRef.current);
        }

        // 2. Marcador da Loja
        // Coordenadas da Loja e Destino (Lendo do novo formato JSONB)
        const sLat = parseFloat(pedido?.geolocalizacao_loja?.lat || 0);
        const sLng = parseFloat(pedido?.geolocalizacao_loja?.lng || 0);
        const dLat = parseFloat(pedido?.geolocalizacao_cliente?.lat || 0);
        const dLng = parseFloat(pedido?.geolocalizacao_cliente?.lng || 0);

        console.log("📍 Dados para o Mapa:", { 
          entregador: driverPos, 
          loja: { sLat, sLng },
          destino: { dLat, dLng } 
        });

        if (!isNaN(sLat) && sLat !== 0 && mapRef.current) {
          if (window.storeMarker) mapRef.current.removeLayer(window.storeMarker);
          const storeIcon = (window as any).L.divIcon({
            className: 'store-marker',
            html: `<div class="bg-slate-900 p-2 rounded-xl shadow-lg border-2 border-white">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="3" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                 </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          window.storeMarker = (window as any).L.marker([sLat, sLng], { icon: storeIcon }).addTo(mapRef.current);
        }

        // 3. Marcador do Destino
        if (!isNaN(dLat) && dLat !== 0 && mapRef.current) {
          if (window.destMarker) mapRef.current.removeLayer(window.destMarker);
          const destIcon = (window as any).L.divIcon({
            className: 'dest-marker',
            html: `<div class="bg-green-600 p-2 rounded-xl shadow-lg border-2 border-white">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="3" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                 </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });
          window.destMarker = (window as any).L.marker([dLat, dLng], { icon: destIcon }).addTo(mapRef.current);
        }
        
        // Centralizar mapa e ajustar zoom
        if (mapRef.current) {
          const validPoints: any[] = [];
          
          // Verificar se a posição do entregador é válida
          if (driverPos.lat !== 0 && driverPos.lng !== 0) {
            validPoints.push([driverPos.lat, driverPos.lng]);
          }

          // Verificar se a posição da loja é válida
          if (!isNaN(sLat) && sLat !== 0) {
            validPoints.push([sLat, sLng]);
          }

          // Verificar se a posição do destino é válida
          if (!isNaN(dLat) && dLat !== 0) {
            validPoints.push([dLat, dLng]);
          }
          
          if (validPoints.length > 1) {
            mapRef.current.fitBounds(validPoints, { padding: [50, 50], maxZoom: 16 });
          } else if (validPoints.length === 1) {
            mapRef.current.setView(validPoints[0], 16);
          }
        }
      } catch (e) {
        console.error("Erro ao atualizar mapa:", e);
      }
    }
  }, [driverPos, pedido, lojaInfo]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const handleSubmitReturn = async () => {
    if (!pedido) return;
    setIsSubmittingReturn(true);
    try {
      // 1. Gerar um solicitacao_id legível (DEV-YYMMDD + 6 caracteres randômicos)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '').substring(2);
      const randStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const solicitacaoId = `DEV-${dateStr}${randStr}`;

      // 2. Mapear produtos do pedido para o formato JSONB
      const returnProducts = pedido.itens?.map((item: any) => ({
        id: item.id || 'prod-1',
        nome: item.nome || 'Produto',
        preco: item.preco || 0.00,
        qtd: item.qtd || item.quantidade || 1,
        variacao: item.variacao || '',
        imagem: item.imagem || item.imagem_url || 'https://via.placeholder.com/150'
      })) || [];

      // 3. Montar dados
      const returnData = {
        solicitacao_id: solicitacaoId,
        pedido_id: pedido.id,
        cliente_id: pedido.cliente_id,
        loja_id: pedido.loja_id,
        produtos: returnProducts,
        valor_reembolso: parseFloat(pedido.total || 0),
        motivo: returnMotivo,
        solucao: returnSolucao,
        status_solicitacao: 'pendente',
        status_entrega: 'nao_iniciado',
        detalhes: returnDetalhes,
        fotos: returnFotos.length > 0 ? returnFotos : ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600']
      };

      // 4. Inserir no Supabase
      const { error } = await supabase.from('devolucoes').insert(returnData);
      if (error) throw error;

      alert(`Solicitação de devolução ${solicitacaoId} enviada com sucesso! O lojista irá analisá-la.`);
      setShowReturnModal(false);
      
      // Recarregar dados da devolução
      const { data: returnReq } = await supabase
        .from('devolucoes')
        .select('*')
        .eq('pedido_id', pedido.id)
        .maybeSingle();
      if (returnReq) setDevolucaoInfo(returnReq);
    } catch (err: any) {
      console.error('Erro ao solicitar devolução:', err);
      alert('Erro ao enviar solicitação de devolução: ' + (err.message || JSON.stringify(err)));
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const getStatusStep = () => {
    if (pedido?.status === 'entregue') return 3;
    if (pedido?.status === 'saiu_para_entrega' || pedido?.status === 'em_coleta') return 2;
    if (pedido?.status === 'em_preparo' || pedido?.status === 'pronto') return 1;
    return 0;
  };

  const handleSendRating = async () => {
    if (rating === 0 || !pedido) return;
    setIsSubmitting(true);
    
    try {
      // 1. Salvar Avaliação na tabela oficial
      const { data: reviewData, error: revError } = await supabase
        .from('avaliacoes')
        .insert({
          pedido_id: pedidoId,
          produto_id: pedido.itens?.[0]?.id || '00000000-0000-0000-0000-000000000000',
          cliente_id: pedido.cliente_id,
          loja_id: pedido.loja_id,
          nota: rating,
          comentario: comment,
          fotos: []
        }).select().single();

      if (revError) throw revError;

      // 2. Verificar se ganha Cupom (Recompensa)
      if (lojaInfo?.recompensa_review_ativa) {
        const cupomCodigo = `GIFT-${Math.random().toString(36).toUpperCase().substring(2, 6)}`;
        const { data: cupom, error: cupomErr } = await supabase.from('cupons').insert({
          codigo: cupomCodigo,
          valor: lojaInfo.recompensa_valor,
          tipo: lojaInfo.recompensa_tipo,
          loja_id: pedido.loja_id,
          cliente_id: pedido.cliente_id
        }).select().single();

        if (!cupomErr && cupom) {
          // Vincular cupom à avaliação
          await supabase.from('avaliacoes').update({ cupom_gerado_id: cupom.id }).eq('id', reviewData.id);
          setGeneratedCoupon(cupom);
        }
      }

      setIsRated(true);
    } catch (error) {
      console.error('Erro ao avaliar:', error);
      alert('Erro ao enviar avaliação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-orange-100">
      {/* Header Fixo */}
      <header className="bg-white/80 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-2xl transition-all active:scale-90 text-slate-400">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido #{(pedidoId || '').slice(-6).toUpperCase()}</p>
          <h1 className="text-sm font-black text-slate-900 tracking-tight">Rastreando Entrega</h1>
        </div>
        <div className="w-10" />
      </header>

      {/* Mapa */}
      <div className="h-[300px] relative bg-slate-100 overflow-hidden border-b border-slate-100">
        <div 
          ref={mapContainerRef} 
          className="absolute inset-0 z-10" 
          style={{ width: '100%', height: '100%', minHeight: '300px' }}
        />
        {!mapReady && (
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center text-slate-400 gap-2">
             <RefreshCw size={24} className="animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest text-center px-6">Iniciando GPS...<br/><span className="text-[8px] opacity-50 lowercase">(Verifique a permissão do navegador)</span></p>
          </div>
        )}
        
        {/* Alerta do Entregador */}
        <AnimatePresence>
          {pedido?.alerta_entrega && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-4 left-4 right-4 z-20 bg-red-500 text-white p-4 rounded-[24px] flex items-center gap-4 shadow-2xl shadow-red-500/20"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Alerta de Entrega</p>
                <p className="text-xs font-bold truncate">{pedido.alerta_entrega}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse de Rastreamento */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20 shadow-sm">
           <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
           <span className="text-[9px] font-black uppercase text-slate-900 tracking-widest">GPS Ativo</span>
        </div>
      </div>

      {/* Info do Pedido */}
      <div className="px-5 -mt-8 relative z-20">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-6 space-y-6 border border-slate-100">
          
          {/* Status Tracker */}
          <div className="flex justify-between relative py-2 mb-2">
            <div className="absolute top-5 left-2 right-2 h-1 bg-slate-100 z-0 rounded-full" />
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${(getStatusStep() / 3) * 100}%` }}
               className="absolute top-5 left-2 h-1 bg-orange-500 z-0 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
            />
            
            {[
              { icon: <Package size={16} />, label: 'Pedido' },
              { icon: <Clock size={16} />, label: 'Preparo' },
              { icon: <Navigation size={16} />, label: 'Caminho' },
              { icon: <CheckCircle2 size={16} />, label: 'Chegou' }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  getStatusStep() >= idx ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 rotate-0' : 'bg-white text-slate-300 border border-slate-100 rotate-12'
                }`}>
                  {step.icon}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-tighter ${getStatusStep() >= idx ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px bg-slate-50" />

          {/* Entregador Info */}
          {pedido?.geolocalizacao_entregador?.entregador_id ? (
            <div className="flex items-center justify-between bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-500 rounded-[24px] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">
                  {pedido.geolocalizacao_entregador.entregador_nome?.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-none mb-1">{pedido.geolocalizacao_entregador.entregador_nome || 'Seu Entregador'}</h3>
                  <div className="flex items-center gap-1.5 text-green-500">
                    <Navigation size={12} className="animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest">A caminho</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${pedido.geolocalizacao_entregador.entregador_telefone || ''}`} className="w-11 h-11 bg-white flex items-center justify-center rounded-2xl text-slate-400 border border-slate-100 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm">
                  <Phone size={18} />
                </a>
                <a href={`https://wa.me/55${pedido.geolocalizacao_entregador.entregador_telefone?.replace(/\D/g,'') || ''}`} className="w-11 h-11 bg-white flex items-center justify-center rounded-2xl text-slate-400 border border-slate-100 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-sm">
                  <MessageCircle size={18} />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-200 animate-pulse border border-slate-100">
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Aguardando Coleta</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">A loja está preparando seu pacote</p>
              </div>
            </div>
          )}

          {/* PIN de Segurança */}
          {pedido?.codigo_confirmacao && (
            <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-[32px] p-6 text-center space-y-2 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10">
                  <ShieldCheck size={40} className="text-orange-500" />
               </div>
               <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Código de Confirmação</p>
               <div className="flex justify-center gap-3">
                  {pedido.codigo_confirmacao.split('').map((num: string, i: number) => (
                    <div key={i} className="w-10 h-12 bg-white rounded-xl flex items-center justify-center text-2xl font-black text-orange-600 shadow-sm border border-orange-100">
                       {num}
                    </div>
                  ))}
               </div>
               <p className="text-[9px] font-bold text-orange-400">Informe este código ao entregador no ato da entrega.</p>
            </div>
          )}

          <div className="bg-slate-900 text-white rounded-[32px] p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-orange-500">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Entregar em:</p>
              <p className="text-xs font-bold text-white leading-tight mt-1">{pedido?.endereco_entrega || '...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DE DEVOLUÇÃO E REEMBOLSO (Aparece apenas quando entregue) */}
      {pedido?.status === 'entregue' && (
        <div className="px-5 mt-6">
          {devolucaoInfo ? (
            <div className="bg-orange-50 border border-orange-100 rounded-[32px] p-6 space-y-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-shopee-orange shrink-0">
                  <RefreshCw size={20} className="animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 bg-orange-100 text-shopee-orange text-[9px] font-black uppercase rounded-lg mb-1">
                    {devolucaoInfo.status_solicitacao === 'pendente' && 'Pendente'}
                    {devolucaoInfo.status_solicitacao === 'em_analise' && 'Em Análise'}
                    {devolucaoInfo.status_solicitacao === 'em_devolucao' && 'Em Devolução'}
                    {devolucaoInfo.status_solicitacao === 'reembolso_pago' && 'Reembolso Pago'}
                    {devolucaoInfo.status_solicitacao === 'aprovada' && 'Aprovada'}
                    {devolucaoInfo.status_solicitacao === 'recusada' && 'Recusada'}
                    {devolucaoInfo.status_solicitacao === 'cancelada' && 'Cancelada'}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 leading-none">Solicitação de Devolução</h4>
                  <p className="text-[10px] text-slate-500 font-bold tracking-wider mt-1">ID: {devolucaoInfo.solicitacao_id}</p>
                </div>
              </div>
              
              <div className="bg-white/80 p-4 rounded-2xl text-xs text-slate-700 space-y-2 border border-orange-50/50 shadow-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Motivo:</span>
                  <span className="font-bold text-slate-950">
                    {devolucaoInfo.motivo === 'produto_defeito' && 'Produto com defeito'}
                    {devolucaoInfo.motivo === 'item_errado' && 'Item errado / incorreto'}
                    {devolucaoInfo.motivo === 'danificado_transporte' && 'Danificado no transporte'}
                    {devolucaoInfo.motivo === 'arrependimento' && 'Arrependimento de compra'}
                    {devolucaoInfo.motivo === 'tamanho_incorreto_engano' && 'Tamanho incorreto por engano'}
                    {devolucaoInfo.motivo === 'nao_gostou' && 'Não gostou do produto'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Logística Reversa:</span>
                  <span className="font-bold text-slate-950">
                    {devolucaoInfo.quem_paga_frete === 'merchant' ? 'Lojista Paga (Grátis para você)' : 'Você paga (Retido do Reembolso)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Valor Reembolso:</span>
                  <span className="font-bold text-shopee-orange">
                    R$ {parseFloat(devolucaoInfo.valor_reembolso || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {devolucaoInfo.status_solicitacao === 'em_devolucao' && (
                <div className="bg-orange-100/50 p-4 rounded-2xl text-xs text-orange-800 leading-relaxed border border-orange-200">
                  <p className="font-black uppercase tracking-wider text-[10px] mb-1">🏍️ Coleta Reversa Ativa</p>
                  <p className="text-[11px] font-bold">O entregador passará para coletar o item em seu endereço cadastrado. Mantenha-o embalado e pronto.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-shopee-orange shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 leading-none">Problemas com o produto?</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Você tem até 7 dias para solicitar a devolução ou reembolso da sua compra.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReturnModal(true)}
                className="w-full py-3.5 bg-orange-50 hover:bg-orange-100 text-shopee-orange font-black rounded-2xl text-xs uppercase tracking-wider transition-all"
              >
                Solicitar Devolução / Reembolso
              </button>
            </div>
          )}
        </div>
      )}

      {/* ÁREA DE AVALIAÇÃO (Aparece apenas quando entregue) */}
      <AnimatePresence>
        {pedido?.status === 'entregue' && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="px-5 mt-6 mb-10"
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-8 shadow-2xl text-center space-y-6 border border-white/5 relative overflow-hidden">
               {/* Detalhe visual de brilho */}
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 blur-[50px] rounded-full" />
               
               <div className="space-y-2">
                 <h3 className="text-xl font-black text-white tracking-tight">O que achou da experiência?</h3>
                 <p className="text-xs text-slate-400">Sua avaliação ajuda a {pedido?.loja_nome || 'loja'} a melhorar.</p>
               </div>

               {!isRated ? (
                 <>
                   <div className="flex justify-center gap-2">
                     {[1, 2, 3, 4, 5].map((star) => (
                       <button 
                         key={star}
                         onClick={() => setRating(star)}
                         className="p-1 transition-transform active:scale-75"
                       >
                         <Star 
                           size={36} 
                           fill={rating >= star ? "#F97316" : "none"} 
                           className={rating >= star ? "text-orange-500" : "text-slate-600"}
                         />
                       </button>
                     ))}
                   </div>

                   <textarea 
                     value={comment}
                     onChange={(e) => setComment(e.target.value)}
                     placeholder="Conte-nos o que achou dos produtos..."
                     className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-orange-500/50 transition-all resize-none h-24"
                   />

                   <button 
                     onClick={handleSendRating}
                     disabled={rating === 0}
                     className="w-full py-4 bg-orange-500 disabled:bg-slate-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20 transition-all active:scale-95"
                   >
                     <Send size={18} />
                     Enviar Avaliação
                   </button>
                 </>
               ) : (
                 <div className="py-4 space-y-6">
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={20} fill={rating >= s ? "#F97316" : "none"} className={rating >= s ? "text-orange-500" : "text-slate-700"} />
                      ))}
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl italic text-slate-400 text-xs">
                       "{comment || 'Nenhum comentário deixado.'}"
                    </div>
                    
                    {generatedCoupon ? (
                       <motion.div 
                         initial={{ scale: 0.9, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         className="bg-orange-500 p-6 rounded-[32px] text-white space-y-3 shadow-xl shadow-orange-500/30"
                       >
                          <p className="text-[10px] font-black uppercase tracking-[3px]">🎁 Você ganhou um cupom!</p>
                          <div className="bg-white/20 backdrop-blur-md rounded-2xl py-3 border border-white/30">
                             <span className="text-2xl font-black tracking-widest">{generatedCoupon.codigo}</span>
                          </div>
                          <p className="text-[9px] font-bold text-white/80">Válido para sua próxima compra nesta loja.</p>
                       </motion.div>
                    ) : (
                       <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Avaliação Enviada com Sucesso!</p>
                    )}
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Itens */}
      <div className="px-5 mt-6">
        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Conteúdo do Pedido</h4>
           <div className="space-y-4">
              {pedido?.itens?.map((item: any, idx: number) => (
                 <div key={idx} className="flex items-center gap-4">
                    <img src={item.imagem || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-2xl object-cover border border-slate-50 shadow-sm" />
                    <div className="flex-1 min-w-0">
                       <p className="text-xs font-black text-slate-900 truncate">{item.qtd}x {item.nome}</p>
                       {item.variacao && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-[8px] font-black uppercase rounded-lg border border-orange-100">
                             {item.variacao}
                          </span>
                       )}
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400">Subtotal</p>
                       <p className="text-xs font-black text-slate-900">R$ {(item.preco * item.qtd).toFixed(2)}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
      {/* MODAL DE SOLICITAÇÃO DE DEVOLUÇÃO / REEMBOLSO */}
      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowReturnModal(false)} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              className="relative bg-white w-full max-w-md h-[90vh] md:h-[650px] rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-xl text-shopee-orange">
                    🔄
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Solicitar Devolução</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Reembolso Garantido</p>
                  </div>
                </div>
                <button onClick={() => setShowReturnModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {/* 1. Motivo */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Qual o motivo da devolução?</label>
                  <select 
                    value={returnMotivo}
                    onChange={(e) => setReturnMotivo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500/50 outline-none"
                  >
                    <option value="produto_defeito">Produto com defeito / quebrado</option>
                    <option value="item_errado">Item errado / cor ou tamanho incorreto</option>
                    <option value="danificado_transporte">Danificado no transporte</option>
                    <option value="arrependimento">Arrependimento / Não quero mais</option>
                    <option value="tamanho_incorreto_engano">Comprei tamanho incorreto por engano</option>
                    <option value="nao_gostou">Não atendeu às minhas expectativas</option>
                  </select>
                  <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex gap-2">
                    <span className="text-xs">💡</span>
                    <p className="text-[10px] text-orange-700 leading-normal font-medium">
                      {['produto_defeito', 'item_errado', 'danificado_transporte'].includes(returnMotivo) 
                        ? 'O lojista pagará o frete de devolução por se tratar de um erro/defeito do produto.' 
                        : 'Você arcará com o frete de devolução (retido do seu reembolso) por arrependimento/engano.'}
                    </p>
                  </div>
                </div>

                {/* 2. Solução */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">O que você deseja?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setReturnSolucao('apenas_reembolso')}
                      className={`p-4 rounded-2xl border-2 text-left space-y-1 transition-all ${
                        returnSolucao === 'apenas_reembolso' 
                          ? 'border-shopee-orange bg-orange-50/30' 
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900">Apenas Reembolso</p>
                      <p className="text-[9px] text-slate-400">Não precisa devolver o produto fisicamente.</p>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setReturnSolucao('devolucao_e_reembolso')}
                      className={`p-4 rounded-2xl border-2 text-left space-y-1 transition-all ${
                        returnSolucao === 'devolucao_e_reembolso' 
                          ? 'border-shopee-orange bg-orange-50/30' 
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900">Devolução e Reembolso</p>
                      <p className="text-[9px] text-slate-400">Devolver o produto para obter reembolso.</p>
                    </button>
                  </div>
                </div>

                {/* 3. Detalhes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Descreva o problema</label>
                  <textarea 
                    value={returnDetalhes}
                    onChange={(e) => setReturnDetalhes(e.target.value)}
                    placeholder="Forneça detalhes adicionais sobre o motivo do reembolso ou o defeito..."
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-500/50 resize-none h-24"
                  />
                </div>

                {/* 4. Fotos Reais */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fotos de evidência (Opcional)</label>
                  <div className="flex gap-3 flex-wrap">
                    <label className="w-16 h-16 bg-white border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-orange-500 hover:text-orange-500 cursor-pointer transition-all active:scale-95 shadow-sm">
                      <span className="text-xl">+</span>
                      <span className="text-[8px] font-bold">Adicionar</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            Array.from(files).forEach(file => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setReturnFotos(prev => [...prev, reader.result]);
                                }
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                      />
                    </label>
                    {returnFotos.map((url, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-2xl overflow-hidden relative group border border-slate-200 shadow-sm">
                        <img src={url} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setReturnFotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSubmitReturn}
                  disabled={isSubmittingReturn}
                  className="flex-1 py-4 bg-shopee-orange hover:bg-orange-600 disabled:bg-slate-400 text-white font-black rounded-2xl text-xs transition-all active:scale-95 shadow-lg shadow-orange-500/25"
                >
                  {isSubmittingReturn ? 'Enviando...' : 'Confirmar Solicitação'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
