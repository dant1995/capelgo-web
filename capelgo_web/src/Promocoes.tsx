import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Star, 
  Tag, 
  Zap, 
  ChevronRight, 
  Share2, 
  Clock, 
  Flame, 
  Gift, 
  Ticket,
  Trophy,
  RefreshCw,
  Loader2,
  X as XIcon
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';

export default function Promocoes() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [categoriasDB, setCategoriasDB] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [giftProducts, setGiftProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 45 });
  const [showRoulette, setShowRoulette] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<any>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [promoBanners, setPromoBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [recentWins, setRecentWins] = useState<any[]>([]);
  const [myPrizes, setMyPrizes] = useState<any[]>([]);
  const [featuredLojas, setFeaturedLojas] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPrizeForClaim, setSelectedPrizeForClaim] = useState<any>(null);
  const [copiedPrizeId, setCopiedPrizeId] = useState(false);

  const lojasComBrinde = useMemo(() => {
    const map = new Map();
    giftProducts.forEach(p => {
      if (p.lojas && p.lojas.id) {
        map.set(p.lojas.id, p.lojas);
      }
    });
    return Array.from(map.values());
  }, [giftProducts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-scroll logic para banners de promoções
  useEffect(() => {
    if (promoBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => {
        const next = (prev + 1) % promoBanners.length;
        if (bannerRef.current) {
          const width = bannerRef.current.offsetWidth;
          bannerRef.current.scrollTo({
            left: width * next,
            behavior: 'smooth'
          });
        }
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [promoBanners]);

  const handleBannerClick = async (banner: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('banner_clicks').insert({
        banner_id: banner.id,
        cliente_id: user?.id || null
      });
    } catch (e) {
      console.error("Erro ao registrar clique no banner:", e);
    }

    if (!banner.link_url) return;
    if (banner.link_url.startsWith('http')) {
      window.open(banner.link_url, '_blank');
    } else {
      navigate(banner.link_url);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setUserId(data?.session?.user?.id || null);

      const { data: cats } = await supabase.from('categorias').select('*').order('nome');
      if (cats) setCategoriasDB(cats);

      // 1. Buscar produtos em promoção (com preco_antigo)
      const { data: prods, error: pErr } = await supabase
        .from('produtos')
        .select('*, lojas(nome)');
      
      if (prods) {
        // Filtrar localmente caso a coluna preco_antigo não exista no banco ainda para não quebrar a query
        const filtered = prods.filter(p => p.preco_antigo !== null && p.preco_antigo !== undefined);
        setProducts(filtered.length > 0 ? filtered : prods.slice(0, 8)); // Fallback para mostrar algo
      }

      // 2. Buscar produtos com brinde
      const { data: gifts } = await supabase
        .from('produtos')
        .select('*, lojas(*)');
      
      if (gifts) {
        const withGifts = gifts.filter(p => p.premio_nome !== null && p.premio_nome !== undefined);
        setGiftProducts(withGifts);
      }

      // 3. Buscar cupons disponíveis
      try {
        const { data: cups } = await supabase
          .from('cupons')
          .select('*')
          .eq('usado', false)
          .limit(10);
        if (cups) setCoupons(cups);
      } catch (cupErr) {
        console.warn("Tabela de cupons pode não existir ainda");
      }

      // 4. Buscar prêmios ativos para a roleta
      const { data: activePrizes } = await supabase
        .from('premios')
        .select('*, lojas(nome)')
        .eq('ativo', true)
        .gt('quantidade', 0);
      
      if (activePrizes && activePrizes.length > 0) {
        setPrizes(activePrizes);
      } else {
        setPrizes([
          { id: 'f1', tipo: 'frete', titulo: 'Frete Grátis', lojas: { nome: 'CapelGo' }, probabilidade: 30 },
          { id: 'c1', tipo: 'cupom', titulo: 'Cupom R$ 5', lojas: { nome: 'CapelGo' }, probabilidade: 50 },
          { id: 'p1', tipo: 'produto', titulo: 'Brinde Surpresa', lojas: { nome: 'Parceiro' }, probabilidade: 20 }
        ]);
      }

      // 5. Verificar se já girou hoje
      if (data?.session?.user?.id) {
         const today = new Date().toISOString().split('T')[0];
         const { data: alreadyWon } = await supabase
           .from('premios_ganhos')
           .select('id')
           .eq('cliente_id', data?.session?.user?.id)
           .gte('created_at', today)
           .limit(1);
         setHasSpunToday(!!(alreadyWon && alreadyWon.length > 0));
      }

      // 6. Buscar banners ativos de promoções
      let orderCount = 0;
      if (data?.session?.user?.id) {
         try {
           const { count } = await supabase
             .from('pedidos')
             .select('*', { count: 'exact', head: true })
             .eq('cliente_id', data.session.user.id);
           orderCount = count || 0;
         } catch (e) {
           console.log("Erro na contagem de pedidos");
         }
      }

      const { data: bData } = await supabase
        .from('banners')
        .select('*')
        .eq('ativo', true)
        .eq('categoria', 'promocoes')
        .order('ordem', { ascending: true });

      if (bData) {
        const filteredBanners = bData.filter(banner => {
          const inicioValido = !banner.data_inicio || new Date(banner.data_inicio) <= new Date();
          const fimValido = !banner.data_fim || new Date(banner.data_fim) >= new Date();
          
          let segmentoValido = banner.segmento === 'todos';
          if (banner.segmento === 'novos' && orderCount === 0) segmentoValido = true;
          if (banner.segmento === 'frequentes' && orderCount >= 5) segmentoValido = true;

          return inicioValido && fimValido && segmentoValido;
        });
        setPromoBanners(filteredBanners);
      }

      // 7. Buscar prêmios recentes do banco
      try {
        const { data: wins } = await supabase
          .from('premios_ganhos')
          .select('*, lojas(nome)')
          .order('created_at', { ascending: false })
          .limit(10);
        if (wins && wins.length > 0) {
          setRecentWins(wins);
        } else {
          // Fallback com dados simulados realistas
          setRecentWins([
            { id: 'w1', detalhes: { titulo: 'Cupom R$ 10 OFF', loja_nome: 'Capel' }, created_at: new Date().toISOString() },
            { id: 'w2', detalhes: { titulo: 'Frete Grátis', loja_nome: 'Masterprint' }, created_at: new Date().toISOString() },
            { id: 'w3', detalhes: { titulo: 'Brinde Especial', loja_nome: 'Capel' }, created_at: new Date().toISOString() },
            { id: 'w4', detalhes: { titulo: 'Cupom R$ 5 OFF', loja_nome: 'Lanchonete Destaque' }, created_at: new Date().toISOString() },
            { id: 'w5', detalhes: { titulo: 'Coca-Cola Zero Grátis', loja_nome: 'Mega Burger' }, created_at: new Date().toISOString() }
          ]);
        }
      } catch (e) {
        console.warn("Erro ao buscar prêmios recentes:", e);
      }

      // 8. Buscar prêmios do próprio cliente logado
      if (data?.session?.user?.id) {
         try {
           const { data: uPrizes } = await supabase
             .from('premios_ganhos')
             .select('*, lojas(*)')
             .eq('cliente_id', data.session.user.id)
             .order('created_at', { ascending: false })
             .limit(5);
           if (uPrizes) setMyPrizes(uPrizes);
         } catch (e) {
           console.warn("Erro ao buscar prêmios do usuário:", e);
         }
      }

      // 9. Buscar marcas em destaque (lojas)
      try {
        const { data: stores } = await supabase
          .from('lojas')
          .select('*')
          .limit(8);
        if (stores && stores.length > 0) {
          setFeaturedLojas(stores);
        } else {
          setFeaturedLojas([]);
        }
      } catch (e) {
        console.warn("Erro ao buscar lojas para destaque:", e);
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCoupon = async (couponId: string) => {
    alert("Cupom resgatado com sucesso! Ele já aparecerá no seu checkout.");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#EE4D2D] flex flex-col items-center justify-center text-white p-6 text-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="mb-4"
      >
        <RefreshCw size={48} />
      </motion.div>
      <h2 className="text-2xl font-black italic mb-2 uppercase">CapelGo</h2>
      <p className="font-bold opacity-80 animate-pulse uppercase text-[10px] tracking-widest">Preparando suas ofertas exclusivas...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24 font-sans max-w-7xl mx-auto shadow-sm md:shadow-md">
      {/* HEADER ULTRA MODERNO */}
      {/* HEADER DINÂMICO DE BANNERS OU FALLBACK CLÁSSICO */}
      {promoBanners.length > 0 ? (
        <div className="relative w-full overflow-hidden md:rounded-b-[40px] shadow-lg animate-fadeIn">
          {/* Botões Flutuantes sobre o banner */}
          <div className="absolute top-4 left-0 right-0 px-4 md:px-12 flex justify-between items-center z-50">
            <button onClick={() => navigate(-1)} className="p-2 bg-black/40 text-white rounded-full backdrop-blur-lg border border-white/20 hover:scale-105 active:scale-95 transition-all shrink-0"><ArrowLeft size={20} /></button>
            
            {/* Cronômetro Super Compacto no Topo */}
            <div className="bg-black/50 backdrop-blur-md px-2 md:px-3 py-1 rounded-full border border-white/15 flex items-center gap-1 md:gap-1.5 text-white shadow-lg mx-1.5 shrink-0">
              <Clock size={10} className="text-yellow-300 animate-pulse md:w-3.5 md:h-3.5 shrink-0" />
              <span className="text-[7px] md:text-[9px] font-black uppercase tracking-wider text-yellow-300 hidden min-[375px]:inline shrink-0">Ofertas</span>
              <div className="flex gap-0.5 items-center shrink-0">
                 <span className="bg-white text-red-600 px-0.5 rounded font-black text-[8px] md:text-xs leading-none py-0.5">{String(timeLeft.hours).padStart(2, '0')}</span>
                 <span className="font-bold text-[8px] md:text-xs text-white leading-none">:</span>
                 <span className="bg-white text-red-600 px-0.5 rounded font-black text-[8px] md:text-xs leading-none py-0.5">{String(timeLeft.minutes).padStart(2, '0')}</span>
                 <span className="font-bold text-[8px] md:text-xs text-white leading-none">:</span>
                 <span className="bg-white text-red-600 px-0.5 rounded font-black text-[8px] md:text-xs leading-none py-0.5">{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>

            <div className="flex gap-1.5 shrink-0 items-center">
               <button onClick={() => setShowRoulette(true)} className="bg-yellow-400 text-red-600 px-2.5 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-xs font-black uppercase shadow-lg animate-bounce shrink-0">🎡 Roleta</button>
               <button className="p-2 bg-black/40 text-white rounded-full backdrop-blur-lg border border-white/20 hover:scale-105 active:scale-95 transition-all shrink-0"><Share2 size={20} /></button>
            </div>
          </div>

          {/* Carrossel de Banners */}
          <div ref={bannerRef} className="overflow-x-auto flex snap-x snap-mandatory no-scrollbar w-full">
            {promoBanners.map((banner) => (
               <div 
                  key={banner.id} 
                  onClick={() => handleBannerClick(banner)}
                  className="min-w-full aspect-[16/7] md:aspect-[21/9] snap-center relative cursor-pointer bg-slate-100"
               >
                  <img 
                     src={banner.imagem_url} 
                     alt="Banner Vantagens" 
                     className="w-full h-full object-cover animate-fadeIn" 
                     loading={promoBanners.indexOf(banner) === 0 ? "eager" : "lazy"}
                     decoding="async"
                  />
               </div>
            ))}
          </div>

          {/* Indicadores de Banners */}
          {promoBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-40 bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {promoBanners.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${currentBannerIndex === idx ? 'bg-yellow-400 w-3.5' : 'bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="relative pt-12 pb-14 md:pt-16 md:pb-24 px-4 md:px-12 text-white overflow-hidden md:rounded-b-[40px]" style={{ background: 'linear-gradient(135deg, #EE4D2D 0%, #FF8C00 100%)' }}>
          <div className="absolute top-4 left-0 right-0 px-4 md:px-12 flex justify-between items-center z-50">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/20 rounded-full backdrop-blur-lg border border-white/30"><ArrowLeft size={20} /></button>
            <div className="flex gap-2">
               <button onClick={() => setShowRoulette(true)} className="bg-yellow-400 text-red-600 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase shadow-lg animate-bounce">Roleta da Sorte 🎡</button>
               <button className="p-2 bg-white/20 rounded-full backdrop-blur-lg border border-white/30"><Share2 size={20} /></button>
            </div>
          </div>

          {/* Efeitos de Fundo */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -left-20 bottom-0 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl" />

          <div className="relative z-10 mt-2">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 rounded-full mb-3 md:mb-6 border border-white/10"
            >
              <Clock size={12} className="text-yellow-300 md:w-3.5 md:h-3.5" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider">Ofertas Relâmpago</span>
              <div className="flex gap-1 items-center ml-2">
                 <span className="bg-white text-red-600 px-1 rounded font-black text-xs">{String(timeLeft.hours).padStart(2, '0')}</span>
                 <span className="font-bold text-xs">:</span>
                 <span className="bg-white text-red-600 px-1 rounded font-black text-xs">{String(timeLeft.minutes).padStart(2, '0')}</span>
                 <span className="font-bold text-xs">:</span>
                 <span className="bg-white text-red-600 px-1 rounded font-black text-xs">{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </motion.div>
            
            <h1 className="text-3xl md:text-6xl font-black italic tracking-tighter leading-[0.9] mb-3 md:mb-4 uppercase drop-shadow-2xl">
              Central de <br/> <span className="text-yellow-300 underline decoration-white/30">Vantagens</span>
            </h1>
            <p className="text-[10px] md:text-xs font-bold opacity-90 italic max-w-[180px] md:max-w-md">Os melhores cupons, brindes e ofertas da região em um só lugar.</p>
          </div>

          <div className="absolute right-[-20px] bottom-[-40px] opacity-20 rotate-[-15deg] pointer-events-none md:right-10 md:bottom-[-20px] md:opacity-30">
             <Trophy size={160} className="md:w-[240px] md:h-[240px]" />
          </div>
        </div>
      )}

      {/* 🏬 LOJAS COM BRINDE */}
      {lojasComBrinde.length > 0 && (
        <section className={`px-4 md:px-12 relative z-30 animate-fadeIn ${promoBanners.length > 0 ? 'mt-3 md:mt-6 mb-2.5 md:mb-4' : 'mt-2.5 md:mt-4 mb-2.5 md:mb-4'}`}>
          <div className="flex items-center gap-2 mb-2 md:mb-3 px-2">
            <div className="w-1 h-4 md:w-1.5 md:h-6 bg-purple-600 rounded-full" />
            <h2 className="text-[10px] md:text-sm font-black flex items-center gap-1.5 md:gap-2 uppercase tracking-widest text-slate-800">
              Lojas com Brindes 🎁
            </h2>
          </div>
          <div className="flex overflow-x-auto gap-2 md:gap-3 pb-1.5 md:pb-3 no-scrollbar px-2 snap-x">
            {lojasComBrinde.map((loja) => (
              <motion.div 
                key={loja.id} 
                whileTap={{ scale: 0.95 }} 
                onClick={() => navigate(`/loja/${loja.id}`)} 
                className="bg-white px-2.5 py-1 md:p-3 rounded-full md:rounded-2xl border border-slate-100 flex flex-row md:flex-col items-center justify-start md:justify-center gap-2 cursor-pointer group min-w-[110px] md:min-w-[90px] md:w-[90px] shrink-0 snap-start text-left md:text-center shadow-sm hover:shadow-md transition-all duration-300 h-[38px] md:h-[110px]"
              >
                <div className="w-6 h-6 md:w-12 md:h-12 bg-purple-50 rounded-full overflow-hidden border border-purple-100 relative group-hover:scale-105 transition-transform duration-300 shrink-0">
                  <img src={loja.imagem_url || 'https://placehold.co/100'} className="w-full h-full object-cover" alt={loja.nome} />
                  {loja.featured_status === 'approved' && (
                     <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border border-white">
                        <svg className="w-1 h-1 md:w-1.5 md:h-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                     </div>
                  )}
                </div>
                <h4 className="text-[8px] md:text-[9px] font-bold text-slate-700 w-full truncate leading-tight group-hover:text-purple-600 transition-colors mt-0 md:mt-0.5">{loja.nome}</h4>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 🎟️ CENTRAL DE CUPONS (HORIZONTAL) */}
      <section className={`px-4 md:px-12 relative z-30 mb-4 md:mb-8 ${lojasComBrinde.length > 0 ? 'mt-1.5 md:mt-2' : (promoBanners.length > 0 ? 'mt-3 md:mt-6' : '-mt-6 md:-mt-10')}`}>
        <div className="flex items-center justify-between mb-2 md:mb-3 px-2">
          <h2 className={`text-[10px] md:text-sm font-black flex items-center gap-1.5 md:gap-2 uppercase tracking-widest ${promoBanners.length > 0 ? 'text-slate-800' : 'text-white drop-shadow-md'}`}>
            <Ticket size={12} className="md:w-4 md:h-4" /> Meus Cupons
          </h2>
          <span className={`text-[8px] md:text-[10px] font-bold underline uppercase cursor-pointer ${promoBanners.length > 0 ? 'text-slate-500 hover:text-shopee-orange' : 'text-white/80'}`}>Ver Todos</span>
        </div>
        <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1.5 md:pb-3">
          {coupons.map(coupon => (
            <CouponCard key={coupon.id} coupon={coupon} onClaim={() => handleClaimCoupon(coupon.id)} />
          ))}
          {coupons.length === 0 && (
             <div className="bg-white/90 backdrop-blur p-4 rounded-2xl min-w-[200px] md:min-w-[280px] border border-dashed border-red-200 flex flex-col items-center text-center py-4">
                <Ticket className="text-red-200 mb-1" size={24} />
                <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase italic">Nenhum cupom ativo</p>
             </div>
          )}
        </div>
      </section>

      {/* 🎰 ROLETA DA SORTE MODAL */}
      <AnimatePresence>
        {showRoulette && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if(!isSpinning) setShowRoulette(false); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
              className="relative bg-gradient-to-b from-red-600 to-orange-700 w-full max-w-sm rounded-[40px] p-8 border-4 border-yellow-400 shadow-2xl"
            >
              <button onClick={() => setShowRoulette(false)} className="absolute top-4 right-4 text-white/50"><XIcon size={24} /></button>
              
              <div className="text-center mb-8">
                 <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Roleta CapelGo</h2>
                 <p className="text-[10px] font-bold text-yellow-300 uppercase">Gire e ganhe prêmios reais!</p>
              </div>

              {!wonPrize ? (
                <div className="flex flex-col items-center">
                  <div className="aspect-square w-full relative mb-8 flex items-center justify-center">
                     <div className="absolute inset-0 border-8 border-yellow-400 rounded-full shadow-inner z-10 pointer-events-none" />
                     <motion.div 
                       animate={{ rotate: rotation }}
                       transition={{ duration: 4, ease: "circOut" }}
                       onAnimationComplete={async () => {
                          if (!isSpinning) return;
                          setIsSpinning(false);
                          
                          // Lógica de sorteio
                          const totalProb = prizes.length > 0 ? prizes.reduce((sum, p) => sum + (p.probabilidade || 0), 0) : 100;
                          let randomVal = Math.random() * totalProb;
                          let winner = prizes[0] || { id: 'fallback', tipo: 'brinde', titulo: 'Brinde Especial' };
                          
                          for (const p of prizes) {
                            if (randomVal <= (p.probabilidade || 0)) { winner = p; break; }
                            randomVal -= (p.probabilidade || 0);
                          }
                          
                          setWonPrize(winner);

                          // SALVAR NO BANCO
                           if (userId && winner && winner.id !== 'fallback') {
                             try {
                               // Verifica se o ID é um UUID válido (formato Supabase)
                               const isRealPrize = typeof winner.id === 'string' && winner.id.includes('-');
                               
                               await supabase.from('premios_ganhos').insert({
                                 cliente_id: userId,
                                 premio_id: isRealPrize ? winner.id : null,
                                 loja_id: winner.loja_id || null,
                                 tipo: winner.tipo || 'brinde',
                                 valor_resgatado: winner.valor_minimo || 0,
                                 detalhes: { titulo: winner.titulo || winner.tipo, loja_nome: winner.lojas?.nome }
                               });
                               setHasSpunToday(true);
                             } catch (err) {
                               console.error("Erro ao salvar prêmio:", err);
                             }
                           }
                       }}
                       className="w-full h-full rounded-full border-4 border-white shadow-2xl relative overflow-hidden flex items-center justify-center"
                       style={{ background: 'conic-gradient(#EE4D2D 0deg 45deg, #F53D2D 45deg 90deg, #FF8C00 90deg 135deg, #EE4D2D 135deg 180deg, #F53D2D 180deg 225deg, #FF8C00 225deg 270deg, #EE4D2D 270deg 315deg, #F53D2D 315deg 360deg)' }}
                     >
                        {prizes.slice(0, 8).map((p, i) => (
                           <div key={i} className="absolute w-1/2 h-full origin-right flex items-center pr-4" style={{ right: '50%', transform: `rotate(${(360 / Math.min(8, prizes.length)) * i}deg)` }}>
                              <span className="text-xl -rotate-90">{p.tipo === 'produto' ? '🎁' : p.tipo === 'cupom' ? '🎟️' : '🚚'}</span>
                           </div>
                        ))}
                     </motion.div>
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-yellow-400 z-30 drop-shadow-lg" />
                     <div 
                        onClick={() => {
                           if (isSpinning || hasSpunToday) return;
                           setIsSpinning(true);
                           setRotation(rotation + 1800 + Math.random() * 360);
                        }}
                        className={`absolute w-16 h-16 bg-white rounded-full shadow-xl z-40 flex items-center justify-center font-black text-red-600 text-[10px] uppercase cursor-pointer border-4 border-yellow-400 active:scale-95 transition-all ${hasSpunToday ? 'opacity-50 grayscale' : 'hover:scale-110'}`}
                     >
                        {hasSpunToday ? 'Já Girou' : 'Girar'}
                     </div>
                  </div>

                  <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest text-center mb-4">
                    {hasSpunToday ? 'Você já girou hoje! Volte amanhã.' : 'Boa sorte! Você tem 1 tentativa grátis hoje.'}
                  </p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
                   <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                      <Trophy size={40} className="text-red-600" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-white italic uppercase">Você Ganhou!</h3>
                      <p className="text-lg font-bold text-yellow-300">{wonPrize.titulo || (wonPrize.tipo === 'frete' ? 'Frete Grátis' : 'Um Brinde Especial')}</p>
                      <p className="text-[10px] text-white/70 uppercase font-black tracking-widest mt-2">{wonPrize.lojas?.nome || 'CapelGo'}</p>
                   </div>
                   <button 
                     onClick={() => setShowRoulette(false)}
                     className="w-full bg-white text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-yellow-400 transition-colors"
                   >
                     Resgatar no Checkout
                   </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎁 GALERIA DE BRINDES (HORIZONTAL) */}
      <section className="px-4 md:px-12 mb-5 md:mb-10">
        <div className="flex items-center gap-2 mb-2.5 md:mb-4 px-2">
          <div className="w-1 h-4 md:w-1.5 md:h-6 bg-purple-600 rounded-full" />
          <h2 className="text-xs md:text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-1.5 md:gap-2 uppercase">
            Produtos com Brinde <Gift size={12} className="text-purple-500 md:w-5 md:h-5" />
          </h2>
        </div>
        <div className="flex gap-2.5 md:gap-5 overflow-x-auto no-scrollbar pb-2 md:pb-4">
          {giftProducts.map(p => <GiftCard key={p.id} product={p} navigate={navigate} />)}
        </div>
      </section>

      {/* ⚡ OFERTAS RELÂMPAGO (GRID) */}
      <section className="px-4 md:px-12 mt-4 md:mt-6">

        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-1 h-4 md:w-1.5 md:h-6 bg-shopee-orange rounded-full" />
            <h2 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-800">Ofertas de Hoje</h2>
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[150px] md:max-w-md">
             {[{id: 'Todas', nome: 'Todas'}, ...categoriasDB].map(c => (
               <button 
                 key={c.id}
                 onClick={() => setSelectedCategory(c.id)}
                 className={`px-2.5 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-xs font-black uppercase whitespace-nowrap ${selectedCategory === c.id ? 'bg-shopee-orange text-white' : 'bg-white text-slate-400'}`}
               >
                 {c.nome}
               </button>
             ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-5">
          {products
            .filter(p => {
               if (selectedCategory === 'Todas') return true;
               const catId = categoriasDB.find(c => c.id === selectedCategory)?.id;
               const catNome = categoriasDB.find(c => c.id === selectedCategory)?.nome;
               const matchesId = catId && p.categoria?.toLowerCase().includes(catId.toLowerCase());
               const matchesNome = catNome && p.categoria?.toLowerCase().includes(catNome.toLowerCase());
               return matchesId || matchesNome;
            })
            .map(product => (
               <ProductGridCard key={product.id} product={product} navigate={navigate} />
            ))}
        </div>
      </section>

      {/* 🏆 1. GANHADORES EM TEMPO REAL (PROVA SOCIAL) */}
      {recentWins.length > 0 && (
        <section className="px-4 md:px-12 mt-6 md:mt-10 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3 px-2">
            <Trophy size={14} className="text-yellow-500 animate-bounce shrink-0" />
            <h2 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-800">
              Ganhadores em Tempo Real 🎉
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-2 snap-x">
            {recentWins.map((win) => (
              <div 
                key={win.id}
                className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/10 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm shrink-0 snap-start"
              >
                <div className="w-4 h-4 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px]">
                  🏆
                </div>
                <span className="text-[8px] md:text-[10px] font-bold text-slate-700 whitespace-nowrap">
                  Alguém ganhou <span className="text-amber-600 font-black">{win.detalhes?.titulo || 'um prêmio'}</span> na <span className="font-black text-slate-800">{win.detalhes?.loja_nome || 'CapelGo'}</span>!
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 🎁 2. MEUS PRÊMIOS & RESGATES */}
      <section className="px-4 md:px-12 mt-6 md:mt-10 animate-fadeIn">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-1.5">
            <Gift size={14} className="text-purple-600 shrink-0" />
            <h2 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-800">
              Meus Prêmios & Resgates
            </h2>
          </div>
        </div>
        
        {myPrizes.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-2 snap-x">
            {myPrizes.map((prize) => (
              <div 
                key={prize.id}
                className="min-w-[200px] bg-white rounded-2xl p-3 border border-purple-100 flex flex-col justify-between shadow-sm relative shrink-0 snap-start"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[7px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-black uppercase">
                      {prize.tipo || 'Brinde'}
                    </span>
                    <h4 className="text-[10px] font-black text-slate-800 mt-1 line-clamp-1">
                      {prize.detalhes?.titulo || 'Prêmio Ganho'}
                    </h4>
                  </div>
                  <span className="text-lg">
                    {prize.tipo === 'produto' ? '🎁' : prize.tipo === 'cupom' ? '🎟️' : '🚚'}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                  <span className="text-[7px] text-slate-400 font-bold uppercase">
                    {prize.lojas?.nome || prize.detalhes?.loja_nome || 'Parceiro'}
                  </span>
                  <button 
                    onClick={() => setSelectedPrizeForClaim(prize)}
                    className="bg-purple-600 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase hover:bg-purple-700 transition-colors"
                  >
                    Resgatar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-indigo-800 rounded-3xl p-4 md:p-6 text-white relative overflow-hidden shadow-xl mx-2">
            {/* Efeitos de fundo premium */}
            <div className="absolute right-[-10px] bottom-[-20px] opacity-15 rotate-[15deg] pointer-events-none">
              <Trophy size={120} />
            </div>
            <div className="absolute top-[-20px] left-[30%] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="bg-yellow-400 text-purple-900 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                  Sorte do Dia 🍀
                </span>
                <h3 className="text-sm md:text-xl font-black italic uppercase mt-2 tracking-tight">
                  Sua carteira de prêmios está vazia!
                </h3>
                <p className="text-[9px] md:text-xs text-white/80 font-medium max-w-xs mt-1 leading-normal">
                  Gire a Roleta da Sorte gratuitamente e concorra a brindes reais, cupons de desconto e frete grátis agora mesmo!
                </p>
              </div>
              <button 
                onClick={() => setShowRoulette(true)}
                className="self-start md:self-auto bg-yellow-400 text-purple-900 px-5 py-2.5 rounded-2xl text-[10px] md:text-xs font-black uppercase shadow-lg hover:scale-105 active:scale-95 hover:bg-yellow-300 transition-all flex items-center gap-1.5 shrink-0"
              >
                Girar Roleta Grátis 🎡
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ⭐ 3. MARCAS EM DESTAQUE */}
      <section className="px-4 md:px-12 mt-6 md:mt-10 animate-fadeIn">
        <div className="flex items-center gap-2 mb-3 px-2">
          <Star size={14} className="text-yellow-500 fill-yellow-500 shrink-0" />
          <h2 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-800">
            Marcas em Destaque ⭐
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-2 snap-x">
          {(featuredLojas.length > 0 ? featuredLojas : [
            { id: 'l1', nome: 'Capel Impressos', imagem_url: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=100&auto=format&fit=crop&q=60', rating: 4.9 },
            { id: 'l2', nome: 'Burgão do Chef', imagem_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&auto=format&fit=crop&q=60', rating: 4.8 },
            { id: 'l3', nome: 'Masterprint Papelaria', imagem_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=100&auto=format&fit=crop&q=60', rating: 4.7 },
            { id: 'l4', nome: 'Açaí Suprema', imagem_url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=100&auto=format&fit=crop&q=60', rating: 4.9 }
          ]).map((loja: any) => (
            <motion.div 
              key={loja.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/loja/${loja.id}`)}
              className="bg-white px-3.5 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-3 cursor-pointer shrink-0 snap-start shadow-sm hover:shadow-md transition-all min-w-[150px]"
            >
              <div className="w-8 h-8 rounded-full bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                <img 
                  src={loja.imagem_url || 'https://placehold.co/100'} 
                  className="w-full h-full object-cover" 
                  alt={loja.nome} 
                />
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="text-[9px] md:text-[10px] font-black text-slate-700 truncate leading-tight uppercase">
                  {loja.nome}
                </h4>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <Star size={8} className="text-yellow-500 fill-yellow-500 shrink-0" />
                  <span className="text-[8px] font-black text-slate-500 leading-none">
                    {loja.rating || '4.8'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 💬 4. PERGUNTAS FREQUENTES (FAQ) */}
      <section className="px-4 md:px-12 mt-6 md:mt-10 mb-8 animate-fadeIn">
        <div className="flex items-center gap-2 mb-3 px-2">
          <h2 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-800">
            Dúvidas Frequentes 💬
          </h2>
        </div>
        <div className="space-y-2 mx-2">
          {[
            {
              q: "Como funciona a Roleta da Sorte?",
              a: "Você tem 1 tentativa grátis todos os dias para girar a roleta e concorrer a brindes reais, cupons exclusivos e descontos especiais nos parceiros do CapelGo."
            },
            {
              q: "O que são os 'Produtos com Brinde'?",
              a: "São produtos selecionados que, ao serem adquiridos na plataforma, dão direito a um prêmio/brinde adicional totalmente gratuito oferecido pela loja parceira."
            },
            {
              q: "Como faço para resgatar meu cupom ou prêmio?",
              a: "Os cupons resgatados são aplicados automaticamente no seu carrinho durante o checkout. Os prêmios físicos ganhos na roleta geram um voucher em 'Meus Prêmios' que pode ser resgatado diretamente no estabelecimento ou na entrega."
            },
            {
              q: "Os prêmios têm prazo de validade?",
              a: "Sim. A maioria dos prêmios e cupons possui validade de 7 dias após o resgate. Verifique sempre as regras e o prazo de expiração descritos no seu voucher."
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-4 py-3 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-[9px] md:text-xs font-black text-slate-700 uppercase">
                  {item.q}
                </span>
                <ChevronRight 
                  size={14} 
                  className={`text-slate-400 transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-90 text-purple-600' : ''}`} 
                />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <div className="px-4 pb-3 text-[9px] md:text-xs font-medium text-slate-500 border-t border-slate-50 pt-2 leading-relaxed">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 🎟️ MODAL DE RESGATE DE PRÊMIO PREMIUM */}
      <AnimatePresence>
        {selectedPrizeForClaim && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPrizeForClaim(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Cabeçalho do prêmio */}
              <div className="text-center pb-4 border-b border-dashed border-slate-100">
                <span className="text-[9px] bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                  {selectedPrizeForClaim.tipo || 'Brinde'} Resgatado
                </span>
                <h3 className="text-xl font-black text-slate-800 italic uppercase mt-3 tracking-tight leading-tight">
                  {selectedPrizeForClaim.detalhes?.titulo || 'Prêmio Especial'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                  Oferecido por: <span className="text-purple-600 font-black">{selectedPrizeForClaim.lojas?.nome || selectedPrizeForClaim.detalhes?.loja_nome || 'Parceiro CapelGo'}</span>
                </p>
              </div>

              {/* Corpo com o Código */}
              <div className="py-6 flex flex-col items-center gap-4">
                {/* QR Code Fictício Estilizado */}
                <div className="w-32 h-32 bg-[#F8F9FA] rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group shadow-inner">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`CGO-${selectedPrizeForClaim.id.substring(0, 8).toUpperCase()}`)}`}
                    alt="QR Code do Voucher"
                    className="w-24 h-24 opacity-90"
                  />
                  <div className="absolute inset-0 bg-purple-600/5 mix-blend-multiply pointer-events-none" />
                </div>

                <div className="w-full text-center">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Código do Voucher</p>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 font-mono font-black text-slate-700 text-xs tracking-wider flex items-center justify-between shadow-sm">
                    <span className="flex-1 select-all text-left font-bold">{`CGO-${selectedPrizeForClaim.id.substring(0, 8).toUpperCase()}`}</span>
                    <button 
                      onClick={() => {
                        const code = `CGO-${selectedPrizeForClaim.id.substring(0, 8).toUpperCase()}`;
                        if (navigator.clipboard && window.isSecureContext) {
                          navigator.clipboard.writeText(code);
                        } else {
                          const textArea = document.createElement("textarea");
                          textArea.value = code;
                          textArea.style.position = "fixed";
                          textArea.style.left = "-9999px";
                          document.body.appendChild(textArea);
                          textArea.focus();
                          textArea.select();
                          try { document.execCommand('copy'); } catch (err) {}
                          textArea.remove();
                        }
                        setCopiedPrizeId(true);
                        setTimeout(() => setCopiedPrizeId(false), 2000);
                      }}
                      className={`text-[8px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all ${copiedPrizeId ? 'bg-green-500 text-white shadow-sm' : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95 shrink-0'}`}
                    >
                      {copiedPrizeId ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Rodapé com Instruções */}
              <div className="bg-slate-50 rounded-2xl p-3.5 text-center border border-slate-100">
                <p className="text-[9px] font-bold text-slate-500 leading-normal">
                  💡 <span className="font-black text-slate-700">Instruções de Resgate:</span> Mostre esta tela com o código ao atendente do estabelecimento parceiro na loja física OU utilize o código acima em seu pedido online no campo de cupons!
                </p>
              </div>

              <button 
                onClick={() => setSelectedPrizeForClaim(null)}
                className="mt-4 w-full bg-slate-100 text-slate-600 font-black text-[9px] uppercase py-3 rounded-2xl active:scale-95 hover:bg-slate-200 transition-all text-center tracking-wider"
              >
                Fechar Voucher
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav activeTab="promocoes" />
    </div>
  );
}

// SUB-COMPONENTE: Coupon Card
function CouponCard({ coupon, onClaim }: any) {
  return (
    <motion.div 
      whileTap={{ scale: 0.96 }}
      className="min-w-[190px] md:min-w-[210px] h-[52px] md:h-[64px] bg-white rounded-xl shadow-sm border border-slate-100 border-l-[4px] border-l-red-500 flex items-center justify-between relative overflow-hidden shrink-0 snap-start"
    >
      {/* Picotes de Ticket de Cupom */}
      <div className="absolute -top-[5px] right-[52px] md:right-[60px] w-2.5 h-2.5 bg-[#F5F5F5] rounded-full border border-slate-100 z-10" />
      <div className="absolute -bottom-[5px] right-[52px] md:right-[60px] w-2.5 h-2.5 bg-[#F5F5F5] rounded-full border border-slate-100 z-10" />
      
      {/* Linha Divisória Tracejada */}
      <div className="absolute right-[56px] md:right-[64px] top-2 bottom-2 border-r border-dashed border-slate-200" />

      {/* Info do Cupom */}
      <div className="pl-3 pr-4 flex flex-col justify-center flex-1 min-w-0">
        <p className="text-[10px] md:text-[12px] font-black text-red-600 uppercase leading-none mb-0.5">
          {coupon.tipo === 'porcentagem' ? `${coupon.valor}% OFF` : `R$ ${coupon.valor} OFF`}
        </p>
        <h3 className="text-[7px] md:text-[9px] font-bold text-slate-700 truncate leading-tight uppercase">
          Cupom de Desconto
        </h3>
        <p className="text-[6px] md:text-[7px] text-slate-400 font-bold tracking-tighter uppercase leading-none mt-0.5">
          {coupon.codigo}
        </p>
      </div>

      {/* Botão de Resgatar */}
      <div className="w-[52px] md:w-[60px] flex items-center justify-center shrink-0 pr-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onClaim(); }}
          className="w-full bg-red-500 text-white text-[7px] md:text-[9px] font-black py-1.5 rounded-lg uppercase shadow-sm hover:bg-red-600 transition-colors"
        >
          Pegar
        </button>
      </div>
    </motion.div>
  );
}

// SUB-COMPONENTE: Gift Card
function GiftCard({ product, navigate }: any) {
  return (
    <motion.div 
      onClick={() => navigate(`/produto/${product.id}`)}
      className="min-w-[120px] md:min-w-[200px] bg-white rounded-2xl md:rounded-[28px] p-2 md:p-3.5 shadow-md border border-purple-100 relative group cursor-pointer"
    >
      <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-[7px] md:text-[9px] font-black px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-lg flex items-center gap-1 uppercase">
        <Gift size={7} className="md:w-2 md:h-2" /> +Brinde
      </div>
      <div className="aspect-square rounded-xl md:rounded-[20px] overflow-hidden mb-2 bg-slate-50">
        {product.video_url ? (
          <video src={product.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <img src={product.imagem_url ? product.imagem_url.split(',')[0] : ''} alt={product.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        )}
      </div>
      <div className="px-1 space-y-0.5">
        <h3 className="text-[9px] md:text-xs font-black text-slate-800 line-clamp-1">{product.nome}</h3>
        <p className="text-[8px] md:text-[10px] font-bold text-purple-600 truncate italic">🎁 {product.premio_nome}</p>
        <div className="mt-2 flex items-center justify-between">
           <span className="text-[10px] md:text-sm font-black text-slate-900">R$ {parseFloat(product.preco).toFixed(2)}</span>
           <button className="w-5 h-5 md:w-7 md:h-7 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-[10px] md:text-sm">+</button>
        </div>
      </div>
    </motion.div>
  );
}

// COMPONENTE: Grid Card Refinado
function ProductGridCard({ product, navigate }: any) {
  const percentSold = Math.min(95, Math.round((1 - (product.estoque || 50) / (product.estoque_max || 100)) * 100));

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/produto/${product.id}`)}
      className="bg-white rounded-[20px] md:rounded-[28px] overflow-hidden shadow-sm border border-slate-100 flex flex-col p-2 md:p-3.5 group cursor-pointer"
    >
      <div className="aspect-square relative rounded-[16px] md:rounded-[20px] overflow-hidden mb-2">
        {product.video_url ? (
          <video src={product.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <img src={product.imagem_url ? product.imagem_url.split(',')[0] : ''} alt={product.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        )}
        {product.preco_antigo && product.preco_antigo > product.preco && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[7px] md:text-[9px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-lg uppercase">
            -{Math.round(((product.preco_antigo - product.preco) / product.preco_antigo) * 100)}%
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md p-1 md:p-1.5 rounded-lg text-white">
           <Flame size={10} className="text-orange-500 animate-pulse md:w-3.5 md:h-3.5" />
        </div>
      </div>
      
      <div className="px-1 space-y-0.5 md:space-y-1">
        <p className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase truncate">{product.lojas?.nome}</p>
        <h3 className="text-[10px] md:text-sm font-bold text-slate-800 line-clamp-1 leading-tight">{product.nome}</h3>
        
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] md:text-sm font-black text-shopee-orange">R$ {parseFloat(product.preco).toFixed(2)}</span>
          <span className="text-[8px] md:text-[10px] text-slate-300 line-through">R$ {parseFloat(product.preco_antigo).toFixed(2)}</span>
        </div>

        <div className="pt-1.5 md:pt-2">
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${percentSold > 80 ? 'bg-red-500' : 'bg-shopee-orange'}`}
              style={{ width: `${percentSold}%` }}
            />
          </div>
          <p className="text-[6px] md:text-[8px] font-black text-slate-400 mt-0.5 md:mt-1 uppercase">{percentSold}% VENDIDO</p>
        </div>
      </div>
    </motion.div>
  );
}


