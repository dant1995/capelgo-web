import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, MessageCircle, Home, ShoppingBag, Bell, User, Star, ChevronRight, Gift, X, Check, Zap, Clock, History, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useCart } from './context/CartContext';
import { useConfig } from './context/ConfigContext';
import { CATEGORIAS_SISTEMA } from './lib/constants';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  imagem_url?: string;
  categoria: string;
  vendidos?: number;
  desconto?: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { plataformaLogo } = useConfig();
  const [categoriasDB, setCategoriasDB] = useState<any[]>([]);
  const [lojaInfo, setLojaInfo] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inicio');
  const [showWheel, setShowWheel] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<any>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lojas, setLojas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [realSalesMap, setRealSalesMap] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 15, seconds: 30 });
  const viewCounted = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
            else return { hours: 2, minutes: 15, seconds: 30 };
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadClientData() {
      const { data: cats } = await supabase.from('categorias').select('*').order('nome');
      if (cats) setCategoriasDB(cats);

      const { data: stores } = await supabase
        .from('lojas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (stores) setLojas(stores);
      
      const { data: prodData, error: prodError } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!prodError && prodData) setProdutos(prodData);

      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('itens')
        .eq('status', 'entregue');
      const salesMap: Record<string, number> = {};
      if (pedidosData) {
        for (const pedido of pedidosData) {
          const itens = pedido.itens || [];
          for (const item of itens) {
            const qtd = item.qtd || item.quantidade || 1;
            salesMap[item.id] = (salesMap[item.id] || 0) + qtd;
          }
        }
      }
      setRealSalesMap(salesMap);

      const { data: activePrizes, error: prizesError } = await supabase
        .from('premios')
        .select('*, lojas(nome)')
        .eq('ativo', true)
        .gt('quantidade', 0) // SÓ COM ESTOQUE
        .limit(8);
      
      if (!prizesError && activePrizes && activePrizes.length > 0) {
        setPrizes(activePrizes);
      } else {
        setPrizes([
          { tipo: 'cupom', lojas: { nome: 'CapelGo' }, probabilidade: 50 },
          { tipo: 'frete', lojas: { nome: 'CapelGo' }, probabilidade: 30 },
          { tipo: 'produto', lojas: { nome: 'CapelGo' }, probabilidade: 20 },
          { tipo: 'cupom', lojas: { nome: 'Loja Oficial' }, probabilidade: 50 }
        ]);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const today = new Date().toISOString().split('T')[0];
        const { data: alreadyWon } = await supabase
          .from('premios_ganhos')
          .select('*')
          .eq('cliente_id', session.user.id)
          .gte('created_at', today)
          .limit(1);
        
        setHasSpunToday(alreadyWon && alreadyWon.length > 0);
      }
      
      const stored = localStorage.getItem('capelgo_recently_viewed');
      if (stored) {
        try { setRecentlyViewed(JSON.parse(stored)); } catch {}
      }

      setWonPrize(null);
      setShowWheel(false);
      setIsSpinning(false);
      setLoading(false);
    }
    loadClientData();
  }, [navigate]);

  useEffect(() => {
    if (produtos.length > 0 && !viewCounted.current) {
      viewCounted.current = true;
      produtos.forEach(p => {
        supabase.from('produtos').update({ visualizacoes: (p.visualizacoes || 0) + 1 }).eq('id', p.id).then(({ error }) => {
          if (error) console.warn('Erro ao registrar visualizacao:', error.message);
        });
      });
    }
  }, [produtos]);

  const handleProfileClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login'); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'lojista') navigate('/merchant');
    else if (profile?.role === 'admin') navigate('/admin');
    else navigate('/perfil');
  };

  const filteredProducts = produtos.filter(p => {
    const matchesSearch = searchTerm ? p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    
    if (!selectedCategory) return matchesSearch;

    const cat = categoriasDB.find(c => c.id === selectedCategory);
    const catValues = [cat?.nome, cat?.id_slug, cat?.id].filter(Boolean).map(s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const matchesCat = p.categoria ? catValues.includes(norm(p.categoria)) : false;
    
    return matchesSearch && matchesCat;
  });

  const [banners, setBanners] = useState<any[]>([]);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const loadHomeData = async () => {
    const categoryToFilter = selectedCategory || 'geral';
    
    // 1. Buscar total de pedidos do usuário para segmentação
    let orderCount = 0;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .eq('cliente_id', user.id);
        orderCount = count || 0;
      }
    } catch (e) {
      console.log("Usuário não logado ou erro na contagem");
    }

    // 2. Busca banners ativos da categoria
    let query = supabase
      .from('banners')
      .select('*')
      .eq('ativo', true)
      .eq('categoria', categoryToFilter)
      .order('ordem', { ascending: true });

    const { data: bData } = await query;
    
    if (bData) {
      const filteredBanners = bData.filter(banner => {
        // Filtro de Datas
        const inicioValido = !banner.data_inicio || new Date(banner.data_inicio) <= new Date();
        const fimValido = !banner.data_fim || new Date(banner.data_fim) >= new Date();
        
        // Filtro de Segmentação
        let segmentoValido = banner.segmento === 'todos';
        if (banner.segmento === 'novos' && orderCount === 0) segmentoValido = true;
        if (banner.segmento === 'frequentes' && orderCount >= 5) segmentoValido = true;

        return inicioValido && fimValido && segmentoValido;
      });
      setBanners(filteredBanners);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, [selectedCategory]);

  // Auto-scroll logic
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => {
        const next = (prev + 1) % banners.length;
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
  }, [banners]);   
  
  const handleBannerClick = async (banner: any) => {
      // 1. Registrar o clique no banco
      try {
         const { data: { user } } = await supabase.auth.getUser();
         await supabase.from('banner_clicks').insert({
            banner_id: banner.id,
            cliente_id: user?.id || null
         });
      } catch (e) {
         console.error("Erro ao registrar clique");
      }

      // 2. Navegar para o link
      if (!banner.link_url) return;
      if (banner.link_url.startsWith('http')) {
         window.open(banner.link_url, '_blank');
      } else {
         navigate(banner.link_url);
      }
    };

    const handleProductClick = async (p: any) => {
       try {
          console.log("Registrando clique no produto:", p.nome);
          const { data: { session } } = await supabase.auth.getSession();
          const { error } = await supabase.from('produto_clicks').insert({
             produto_id: p.id,
             profile_id: session?.user.id || null
          });
          
          if (error) {
        console.error("❌ [Analytics] Erro ao registrar clique:", error.message);
      } else {
        console.log("✅ [Analytics] Clique registrado com sucesso!");
      }
    } catch (e) {
      console.error("⚠️ [Analytics] Erro crítico ao registrar clique:", e);
    }
       navigate(`/produto/${p.id}`);
    };

   return (
    <div className="min-h-screen pb-20 bg-[#F5F5F5] font-sans">
      <header className="shopee-gradient pt-2 pb-3 px-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-[1200px] mx-auto w-full flex items-center gap-3 mb-2">
          {plataformaLogo ? (
             <img src={plataformaLogo} alt="Logo" className="h-10 object-contain" />
          ) : (
             <>
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/20">
                 <span className="text-shopee-orange font-black text-2xl italic tracking-tighter">C</span>
               </div>
               <h1 className="text-3xl font-black text-white italic tracking-tighter hidden md:block">CapelGo</h1>
             </>
          )}
          <div className="flex-1 bg-white rounded-sm flex items-center px-3 py-1.5 shadow-inner max-w-2xl">
            <Search size={18} className="text-[#EE4D2D] mr-2" />
            <input 
               type="text" 
               placeholder="Buscar no CapelGo" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#EE4D2D]/60 font-medium" 
            />
          </div>

          {/* Atalhos Desktop */}
          <div className="hidden md:flex items-center gap-6 ml-4 text-white text-sm font-bold">
            <span className="cursor-pointer hover:text-gray-200 transition-colors" onClick={() => navigate('/')}>Início</span>
            <span className="cursor-pointer hover:text-gray-200 transition-colors" onClick={() => navigate('/promocoes')}>Vantagens</span>
            <span className="cursor-pointer hover:text-gray-200 transition-colors" onClick={() => navigate('/avisos')}>Avisos</span>
            <span className="cursor-pointer hover:text-gray-200 transition-colors" onClick={() => navigate('/perfil')}>Eu</span>
          </div>

          <div className="relative cursor-pointer ml-auto md:ml-4" onClick={() => navigate('/carrinho')}>
            <ShoppingCart className="text-white" size={24} />
            {totalItems > 0 && <span className="absolute -top-2 -right-2 bg-white text-[#EE4D2D] text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[#EE4D2D] shadow-lg">{totalItems}</span>}
          </div>
          <MessageCircle className="text-white cursor-pointer ml-2" size={24} onClick={() => navigate('/meus-pedidos?tab=chat')} />
        </div>
      </header>

      <main className="w-full md:px-4">
      {/* BANNERS DINÂMICOS */}
      <div className="w-full bg-white md:bg-transparent mb-4">
        <section ref={bannerRef} className="max-w-[1200px] mx-auto overflow-x-auto flex snap-x snap-mandatory no-scrollbar md:rounded-b-sm">
           {banners.length > 0 ? (
              banners.map((banner) => (
                 <div 
                    key={banner.id} 
                    onClick={() => handleBannerClick(banner)}
                    className="min-w-full aspect-[16/7] md:aspect-[21/6] snap-center relative cursor-pointer bg-slate-100"
                 >
                    <img 
                       src={banner.imagem_url} 
                       alt="Banner" 
                       className="w-full h-full object-cover" 
                       loading={banners.indexOf(banner) === 0 ? "eager" : "lazy"}
                       decoding="async"
                    />
                 </div>
              ))
           ) : (
              <div className="min-w-full aspect-[16/7] md:aspect-[21/6] bg-gradient-to-br from-[#EE4D2D] to-[#F53D2D] flex items-center justify-between px-6 text-white shadow-inner snap-center relative overflow-hidden">
                 <div className="z-10">
                    <div className="flex items-center gap-1 mb-1">
                       <span className="bg-white/20 px-2 py-0.5 rounded text-[8px] font-black uppercase">Exclusivo</span>
                    </div>
                    <h2 className="text-4xl font-black italic tracking-tighter leading-none mb-1">5.5</h2>
                    <p className="text-sm font-bold uppercase tracking-widest opacity-90">Festival CapelGo</p>
                    <button className="mt-3 bg-white text-[#EE4D2D] text-[9px] font-black px-4 py-2 rounded-sm uppercase shadow-lg">Resgatar Cupons</button>
                 </div>
                 <div className="absolute right-[-10%] bottom-[-10%] opacity-20"><ShoppingBag size={180} /></div>
              </div>
           )}
        </section>
      </div>

      <section className="bg-white mb-4 py-4 px-4 custom-shadow max-w-[1200px] mx-auto md:rounded-sm">
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-10 gap-4">
          {categoriasDB.map((cat) => (
            <div key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)} className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div className={`w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-100 group-hover:scale-105 transition-transform ${selectedCategory === cat.id ? 'ring-2 ring-[#EE4D2D]' : ''}`}>{cat.icone || '📦'}</div>
              <span className={`text-[9px] font-black uppercase tracking-tight text-center ${selectedCategory === cat.id ? 'text-[#EE4D2D]' : 'text-gray-500'}`}>{cat.nome}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- 👁️ VISTO RECENTEMENTE --- */}
      {recentlyViewed.length > 0 && (
        <div className="max-w-[1200px] mx-auto w-full px-2 mb-4">
          <div className="flex items-center gap-2 mb-3 px-1">
            <History size={14} className="text-shopee-orange" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Visto Recentemente</h3>
          </div>
          <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar snap-x">
            {recentlyViewed.slice(0, 8).map((item: any) => (
              <div
                key={item.id}
                onClick={() => navigate(`/produto/${item.id}`)}
                className="shrink-0 w-28 md:w-32 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden snap-start cursor-pointer hover:border-shopee-orange transition-all"
              >
                <div className="aspect-square bg-gray-50">
                  <img
                    src={item.imagem_url?.split(',')[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={item.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">{item.nome}</p>
                  <p className="text-shopee-orange text-[11px] font-black mt-0.5">
                    R$ {Number(item.preco).toFixed(2)}
                  </p>
                  {item.loja_nome && (
                    <p className="text-[8px] text-gray-400 truncate mt-0.5 flex items-center gap-0.5">
                      <Store size={8} /> {item.loja_nome}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-2 max-w-[1200px] mx-auto w-full">
        {searchTerm.length > 0 || selectedCategory ? (
          <>
            <div className="flex items-center gap-2 mb-3 px-1 mt-2">
              <div className="h-[1px] flex-1 bg-gray-200"></div>
              <button onClick={() => setSelectedCategory(null)} className="text-[#EE4D2D] font-bold uppercase text-[10px] tracking-wider hover:underline">{searchTerm ? `"${searchTerm}"` : categoriasDB.find(c => c.id === selectedCategory)?.nome || 'Categoria'}</button>
              <span className="text-gray-300 text-[10px]">|</span>
              <span className="text-gray-500 text-[10px]">{filteredProducts.length} produtos</span>
              <div className="h-[1px] flex-1 bg-gray-200"></div>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 mb-6">
                {filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((p: any) => (
                  <motion.div key={p.id} whileTap={{ scale: 0.98 }} onClick={() => handleProductClick(p)} className="bg-white rounded-sm overflow-hidden flex flex-col custom-shadow cursor-pointer group relative">
                    {p.is_promoted && <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur-md text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter border border-white/20">Patrocinado</div>}
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {p.video_url ? <video src={p.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <img src={p.imagem_url ? p.imagem_url.split(',')[0] : 'https://placehold.co/400x400?text=Sem+Foto'} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <div className="p-2 flex flex-col gap-1 flex-1">
                      <p className="text-[11px] line-clamp-2 leading-tight h-8 font-medium text-gray-800">{p.nome}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-[#EE4D2D] font-bold">R${parseFloat(String(p.preco)).toFixed(2)}</span>
                        <div className="flex items-center gap-0.5 text-[8px] text-gray-500 font-medium">
                          <Star size={8} className="text-yellow-400" fill="currentColor" />
                          <span>{p.avaliacao || '5.0'}</span>
                          <span className="ml-1 border-l border-gray-300 pl-1">{p.vendidos || 0} vendidos</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Search size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum produto encontrado</p>
                <p className="text-xs mt-1">Tente buscar por outro termo ou categoria</p>
              </div>
            )}
          </>
        ) : (
        <>
        {/* --- ⚡ OFERTAS RELÂMPAGO --- */}
        <div className="mb-6">
           <div className="bg-gradient-to-r from-[#EE4D2D] to-red-600 rounded-lg p-2.5 mx-1 mb-3 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl translate-x-10 -translate-y-10"></div>
              <div className="flex items-center gap-1.5 relative z-10">
                 <Zap className="text-yellow-300 fill-yellow-300 animate-pulse" size={16} />
                 <h3 className="text-white font-black italic uppercase text-xs tracking-wider">Ofertas Relâmpago</h3>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                 <div className="bg-black/30 backdrop-blur-md text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-inner">{String(timeLeft.hours).padStart(2, '0')}</div>
                 <span className="text-white font-bold text-[10px]">:</span>
                 <div className="bg-black/30 backdrop-blur-md text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-inner">{String(timeLeft.minutes).padStart(2, '0')}</div>
                 <span className="text-white font-bold text-[10px]">:</span>
                 <div className="bg-black/30 backdrop-blur-md text-white font-black text-[10px] px-1.5 py-0.5 rounded shadow-inner">{String(timeLeft.seconds).padStart(2, '0')}</div>
              </div>
           </div>
           
           {produtos.filter(p => !p.oculto && p.promocao_ativa && p.preco_promocional).length > 0 && (
             <div className="flex overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4 pb-2 no-scrollbar px-1 snap-x">
                {produtos
                  .filter(p => !p.oculto && p.promocao_ativa && p.preco_promocional)
                  .slice(0, 8)
                  .map((p: any) => (
                  <motion.div 
                     key={`flash-${p.id}`} 
                     whileTap={{ scale: 0.98 }} 
                     onClick={() => handleProductClick(p)} 
                     className="bg-white rounded-lg overflow-hidden flex flex-col custom-shadow cursor-pointer relative min-w-[110px] w-[110px] md:w-auto md:min-w-0 shrink-0 snap-start border border-gray-100"
                  >
                    <div className="absolute top-0 left-0 bg-yellow-400 text-[#EE4D2D] text-[8px] font-black px-1.5 py-0.5 rounded-br-lg z-10 shadow-sm border-r border-b border-yellow-500">
                       -{Math.round(100 - (p.preco_promocional * 100 / p.preco))}%
                    </div>
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {p.video_url ? (
                        <video src={p.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={p.imagem_url ? p.imagem_url.split(',')[0] : 'https://placehold.co/400x400?text=Sem+Foto'} alt={p.nome} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-2 flex flex-col gap-0.5">
                      <span className="text-xs text-[#EE4D2D] font-bold">R${parseFloat(String(p.preco_promocional)).toFixed(2)}</span>
                      <span className="text-[8px] text-gray-400 line-through">R${parseFloat(String(p.preco)).toFixed(2)}</span>
                      <div className="w-full bg-red-100 rounded-full h-1.5 mt-1.5 overflow-hidden relative">
                         <div className="absolute top-0 left-0 h-full bg-[#EE4D2D] rounded-full" style={{ width: `${70 + Math.random() * 25}%` }}></div>
                      </div>
                      <span className="text-[7px] font-black text-[#EE4D2D] text-center mt-0.5 uppercase tracking-tighter">Quase Esgotado</span>
                    </div>
            </motion.div>
          ))}
             </div>
             )}
        </div>

        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="h-[1px] flex-1 bg-gray-200"></div>
          <h3 className="text-[#EE4D2D] font-bold uppercase text-[10px] tracking-wider">Descobertas do Dia</h3>
          <div className="h-[1px] flex-1 bg-gray-200"></div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 mb-6">
          {filteredProducts
            .sort((a, b) => {
              if (a.is_promoted && !b.is_promoted) return -1;
              if (!a.is_promoted && b.is_promoted) return 1;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .map((p: any) => (
            <motion.div 
               key={p.id} 
               whileTap={{ scale: 0.98 }} 
               onClick={() => handleProductClick(p)} 
               className="bg-white rounded-sm overflow-hidden flex flex-col custom-shadow cursor-pointer group relative"
            >
              {p.is_promoted && (
                <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur-md text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter border border-white/20">
                   Patrocinado
                </div>
              )}
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {p.video_url ? (
                  <video src={p.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <img src={p.imagem_url ? p.imagem_url.split(',')[0] : 'https://placehold.co/400x400?text=Sem+Foto'} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
              </div>
              <div className="p-2 flex flex-col gap-1 flex-1">
                <p className="text-[11px] line-clamp-2 leading-tight h-8 font-medium text-gray-800">{p.nome}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-[#EE4D2D] font-bold">R${parseFloat(String(p.preco)).toFixed(2)}</span>
                  <div className="flex items-center gap-0.5 text-[8px] text-gray-500 font-medium">
                     <Star size={8} className="text-yellow-400" fill="currentColor" />
                     <span>{p.avaliacao || '5.0'}</span>
                     <span className="ml-1 border-l border-gray-300 pl-1">{p.vendidos || 0} vendidos</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3 px-1 mt-8">
          <div className="h-[1px] flex-1 bg-gray-200"></div>
          <h3 className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Lojas Oficiais</h3>
          <div className="h-[1px] flex-1 bg-gray-200"></div>
        </div>

        <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar px-1 snap-x">
          {lojas
            .sort((a, b) => {
              const isAApproved = a.featured_status === 'approved';
              const isBApproved = b.featured_status === 'approved';
              if (isAApproved && !isBApproved) return -1;
              if (!isAApproved && isBApproved) return 1;
              return 0;
            })
            .slice(0, 10)
            .map((loja) => (
            <motion.div key={loja.id} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/loja/${loja.id}`)} className="bg-white py-3 px-2 rounded-xl custom-shadow flex flex-col items-center justify-center gap-2 cursor-pointer group min-w-[85px] w-[85px] shrink-0 snap-start text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden border border-gray-100 relative">
                <img src={loja.imagem_url || 'https://placehold.co/100'} className="w-full h-full object-cover" />
                {loja.featured_status === 'approved' && (
                   <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white">
                      <Check size={6} strokeWidth={4} />
                   </div>
                )}
              </div>
              <div className="w-full flex flex-col items-center">
                 <h4 className="text-[9px] font-bold text-gray-800 w-full truncate leading-tight">{loja.nome}</h4>
                 {loja.featured_status === 'approved' ? (
                    <span className="bg-blue-50 text-blue-600 text-[6px] font-black px-1 py-[1px] rounded-[4px] uppercase tracking-tighter mt-1 inline-block">Oficial</span>
                 ) : (
                    <span className="h-[12px] inline-block mt-1"></span>
                 )}
              </div>
            </motion.div>
          ))}

          {lojas.length > 10 && (
             <motion.div 
               whileTap={{ scale: 0.98 }} 
               onClick={() => navigate('/todas-as-lojas')} 
               className="bg-slate-50 border border-slate-200 py-3 px-2 rounded-xl custom-shadow flex flex-col items-center justify-center gap-2 cursor-pointer group min-w-[85px] w-[85px] shrink-0 snap-start hover:bg-slate-100 transition-colors"
             >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-shopee-orange group-hover:scale-110 transition-all shadow-sm">
                   <ChevronRight size={20} />
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center group-hover:text-shopee-orange transition-colors">Ver Mais</span>
             </motion.div>
          )}
        </div>

        {/* --- 🔥 MAIS VENDIDOS --- */}
        {Object.keys(realSalesMap).length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3 px-1 mt-6">
              <div className="h-[1px] flex-1 bg-gray-200"></div>
              <h3 className="text-[#EE4D2D] font-bold uppercase text-[10px] tracking-wider">🔥 Mais Vendidos</h3>
              <div className="h-[1px] flex-1 bg-gray-200"></div>
            </div>
            <div className="flex overflow-x-auto md:grid md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4 pb-4 no-scrollbar px-1 snap-x">
              {produtos
                .filter(p => !p.oculto)
                .filter(p => (realSalesMap[p.id] || 0) > 0)
                .sort((a, b) => (realSalesMap[b.id] || 0) - (realSalesMap[a.id] || 0))
                .slice(0, 8)
                .map((p: any) => (
                <motion.div 
                   key={`mais-vendidos-${p.id}`} 
                   whileTap={{ scale: 0.98 }} 
                   onClick={() => handleProductClick(p)} 
                   className="bg-white rounded-sm overflow-hidden flex flex-col custom-shadow cursor-pointer relative min-w-[130px] w-[130px] md:w-auto md:min-w-0 shrink-0 snap-start"
                >
                  <div className="absolute top-0 left-0 bg-yellow-400 text-[#EE4D2D] text-[8px] font-black px-2 py-0.5 rounded-br-lg z-10 shadow-sm border-r border-b border-yellow-500">
                     TOP VENDAS
                  </div>
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {p.video_url ? (
                      <video src={p.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={p.imagem_url ? p.imagem_url.split(',')[0] : 'https://placehold.co/400x400?text=Sem+Foto'} alt={p.nome} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-2 flex flex-col gap-1 flex-1 justify-between">
                    <p className="text-[10px] line-clamp-2 leading-tight font-medium text-gray-800">{p.nome}</p>
                    <div className="flex flex-col mt-1 border-t border-gray-50 pt-1">
                      <span className="text-xs text-[#EE4D2D] font-bold">R${parseFloat(String(p.preco)).toFixed(2)}</span>
                      <div className="flex items-center gap-1 text-[8px] text-gray-500 font-medium mt-0.5">
                         <span>{realSalesMap[p.id] || 0} vendidos</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* --- ✨ ACABARAM DE CHEGAR --- */}
        <div className="flex items-center gap-2 mb-3 px-1 mt-6">
          <div className="h-[1px] flex-1 bg-gray-200"></div>
          <h3 className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">✨ Acabaram de Chegar</h3>
          <div className="h-[1px] flex-1 bg-gray-200"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 mb-8 px-1">
          {produtos
            .filter(p => !p.oculto)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 6)
            .map((p: any) => (
            <motion.div 
               key={`novidade-${p.id}`} 
               whileTap={{ scale: 0.98 }} 
               onClick={() => handleProductClick(p)} 
               className="bg-white rounded-sm overflow-hidden flex flex-col custom-shadow cursor-pointer relative"
            >
              <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm">
                 NOVO
              </div>
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {p.video_url ? (
                  <video src={p.video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={p.imagem_url ? p.imagem_url.split(',')[0] : 'https://placehold.co/400x400?text=Sem+Foto'} alt={p.nome} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-2 flex flex-col gap-1 flex-1">
                <p className="text-[11px] line-clamp-2 leading-tight h-8 font-medium text-gray-800">{p.nome}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-[#EE4D2D] font-bold">R${parseFloat(String(p.preco)).toFixed(2)}</span>
                  <div className="flex items-center gap-0.5 text-[8px] text-gray-500 font-medium">
                     <Star size={8} className="text-yellow-400" fill="currentColor" />
                     <span>{p.avaliacao || '5.0'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </>
      )}
      </div>
      </main>

      {!hasSpunToday && (
        <motion.div onClick={() => setShowWheel(true)} className="fixed right-6 bottom-24 z-[60] cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-[#EE4D2D] rounded-full animate-ping opacity-25"></div>
            <div className="bg-gradient-to-br from-[#EE4D2D] to-[#F53D2D] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-2 border-white relative">
              <Gift className="text-white" size={28} />
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-[#EE4D2D] text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white animate-bounce">GANHE!</span>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showWheel && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl relative flex flex-col items-center p-8 text-center">
              <button onClick={() => setShowWheel(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><X size={20} /></button>
              <h3 className="text-2xl font-black text-gray-800 italic">ROLETA DA SORTE</h3>
              
              <div className="relative w-64 h-64 my-10">
                <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20"><div className="w-6 h-8 bg-[#EE4D2D] clip-path-polygon-[50%_100%,0_0,100%_0] border-x-2 border-t-2 border-white shadow-md"></div></div>
                <motion.div 
                  animate={{ rotate: rotation }}
                  transition={{ duration: 4, ease: "circOut" }}
                  onAnimationComplete={async () => {
                    if (!isSpinning) return;
                    setIsSpinning(false);
                    
                    const totalProb = prizes.reduce((sum, p) => sum + (p.probabilidade || 0), 0);
                    let randomVal = Math.random() * totalProb;
                    let winner = prizes[0];
                    for (const p of prizes) {
                      if (randomVal <= (p.probabilidade || 0)) { winner = p; break; }
                      randomVal -= (p.probabilidade || 0);
                    }
                    setWonPrize(winner);

                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                      await supabase.from('premios_ganhos').insert({
                        cliente_id: session.user.id,
                        premio_id: winner.id,
                        loja_id: winner.loja_id,
                        tipo: winner.tipo,
                        valor_resgatado: winner.valor_minimo || 0
                      });
                      if (winner.id) {
                        await supabase.from('premios').update({ quantidade: Math.max(0, (winner.quantidade || 1) - 1) }).eq('id', winner.id);
                      }
                    }
                    try {
                      await fetch('https://n8n.capelgo.com.br/webhook/premio-ganho', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tipo: winner.tipo, loja: winner.lojas?.nome || 'Loja Parceira', data: new Date().toISOString() })
                      });
                    } catch (e) { console.log('Webhook error'); }
                  }}
                  className="w-full h-full rounded-full border-[10px] border-[#EE4D2D] bg-white shadow-2xl relative overflow-hidden flex items-center justify-center"
                >
                  {prizes.map((p, i) => {
                    const colors = ['#FF5722', '#FFC107', '#F44336', '#E91E63', '#9C27B0', '#3F51B5'];
                    return (
                      <div key={i} className="absolute w-1/2 h-full origin-right flex items-center pr-4" style={{ right: '50%', transform: `rotate(${(360 / prizes.length) * i}deg)`, backgroundColor: colors[i % colors.length] }}>
                        <div className="flex flex-col items-center gap-1 -rotate-90">
                          <span className="text-xl">{p.tipo === 'produto' ? '🎁' : p.tipo === 'cupom' ? '🎟️' : '🚚'}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div onClick={() => {
                    if (isSpinning) return;
                    setIsSpinning(true);
                    setRotation(rotation + 1800 + Math.random() * 360);
                  }} className="absolute inset-0 flex items-center justify-center cursor-pointer group"><div className="w-12 h-12 bg-white rounded-full shadow-lg border-4 border-[#EE4D2D] z-10 flex items-center justify-center font-black text-[10px] text-[#EE4D2D] group-hover:scale-110 transition-transform">GO</div></div>
                </motion.div>
              </div>

              {wonPrize && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 w-full">
                  <div className="bg-green-50 p-6 rounded-3xl border-2 border-dashed border-green-200">
                    <p className="text-[10px] font-black text-green-600 uppercase mb-2">Parabéns! Você ganhou:</p>
                    <h4 className="text-xl font-black text-gray-800">{wonPrize.tipo === 'produto' ? 'Produto Grátis!' : wonPrize.tipo === 'cupom' ? 'Cupom Exclusivo' : 'Frete Grátis'}</h4>
                    <p className="text-xs text-gray-500">Oferecido por: <span className="font-bold text-[#EE4D2D]">{wonPrize.lojas?.nome}</span></p>
                  </div>
                  <button onClick={() => { setShowWheel(false); setWonPrize(null); navigate(wonPrize.produto_id ? `/produto/${wonPrize.produto_id}?ganhou=true` : `/loja/${wonPrize.loja_id}?ganhou=true`); }} className="w-full bg-[#EE4D2D] text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl hover:bg-orange-600 transition-all">Resgatar Agora</button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
      <BottomNav activeTab="inicio" />
    </div>
  );
}

function NavBtn({ icon, label, active, onClick, badge }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 flex-1 py-1 relative ${active ? 'text-shopee-orange' : 'text-gray-500'}`}>
      <div className="relative">
        {icon}
        {badge && <span className="absolute -top-1.5 -right-2 bg-shopee-orange text-white text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-white">{badge}</span>}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
