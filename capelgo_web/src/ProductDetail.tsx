import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Share2, 
  Star, 
  ShieldCheck, 
  ChevronRight, 
  MessageCircle, 
  Camera, 
  Send, 
  X, 
  Play, 
  Loader2,
  Gift,
  Ticket,
  CheckCircle2,
  Copy,
  Store,
  Bike,
  Plus,
  Minus,
  MapPin,
  Heart,
  Clock,
  Zap,
  ChevronDown,
  Ruler,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { useCart } from './context/CartContext';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  imagem_url?: string;
  video_url?: string;
  categoria: string;
  descricao?: string;
  loja_id: string;
  variacoes?: any[];
  estoque?: number;
  preco_promocional?: number;
  promocao_ativa?: boolean;
  promocao_data_fim?: string;
  premio_nome?: string;
  visualizacoes?: number;
  vendidos?: number;
  estoque_status?: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToCart, totalItems } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const isWinner = searchParams.get('ganhou') === 'true';
  const [showWinnerBanner, setShowWinnerBanner] = useState(isWinner);
  
  const [produto, setProduto] = useState<Produto | null>(null);
  const [lojaInfo, setLojaInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [novaAvaliacao, setNovaAvaliacao] = useState({ 
    nota: 5, 
    comentario: '', 
    midias: [] as { url: string, tipo: 'foto' | 'video' }[] 
  });
  const [selectedVariacoes, setSelectedVariacoes] = useState<{[key: string]: string}>({});
  const [quantidade, setQuantidade] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [flashTimeLeft, setFlashTimeLeft] = useState({ hours: 2, minutes: 15, seconds: 30 });
  const [cuponsDisponiveis, setCuponsDisponiveis] = useState<any[]>([]);
  const [ofertaRelampago, setOfertaRelampago] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const viewCounted = useRef(false);

  const precoOferta = ofertaRelampago?.preco_promocional;
  const precoPromocionalAtivo = precoOferta || (produto?.promocao_ativa && produto?.preco_promocional ? produto.preco_promocional : null);
  const precoAtual = precoPromocionalAtivo || produto?.preco || 0;
  const estoqueDisponivel = produto?.estoque_status !== 'indisponivel' && (produto?.estoque || 0) > 0;
  const isEsgotado = !estoqueDisponivel;
  const descontoPercentual = produto?.preco && precoPromocionalAtivo
    ? Math.round(100 - (precoPromocionalAtivo * 100 / produto.preco))
    : 0;
  const temFlashSale = !!(ofertaRelampago || (produto?.promocao_ativa && produto?.preco_promocional));

  const allImages = produto?.imagem_url ? produto.imagem_url.split(',').filter(Boolean) : [];
  const mediaItems: { type: 'video' | 'image'; url: string }[] = [];
  if (produto?.video_url) {
    mediaItems.push({ type: 'video', url: produto.video_url });
  }
  allImages.forEach(url => mediaItems.push({ type: 'image', url }));

  const currentMedia = mediaItems[selectedImageIndex] || mediaItems[0] || null;

  const mediaAvaliacoes = avaliacoes.length > 0
    ? (avaliacoes.reduce((sum, r) => sum + r.nota, 0) / avaliacoes.length)
    : 0;

  const mediaEstrelas = Math.round(mediaAvaliacoes * 2) / 2;

  useEffect(() => {
    async function loadProduto() {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setProduto(data);
        const { data: store } = await supabase.from('lojas').select('*').eq('id', data.loja_id).single();
        if (store) setLojaInfo(store);
      }
      
      const { data: reviews } = await supabase
        .from('avaliacoes')
        .select('*, profiles(nome)')
        .eq('produto_id', id)
        .order('created_at', { ascending: false });
      
      if (reviews) setAvaliacoes(reviews);

      const { count: favCount } = await supabase
        .from('favoritos')
        .select('*', { count: 'exact', head: true })
        .eq('produto_id', id);
      if (favCount !== null) setFavoriteCount(favCount);

      const { data: ordersData } = await supabase
        .from('pedidos')
        .select('itens')
        .eq('status', 'entregue');

      let totalVendidos = 0;
      if (ordersData) {
        for (const order of ordersData) {
          const itens = order.itens || [];
          for (const item of itens) {
            if (item.id === id) {
              totalVendidos += item.qtd || 1;
            }
          }
        }
      }
      setProduto(prev => prev ? { ...prev, vendidos: totalVendidos } : prev);

      if (data?.loja_id) {
        const { data: cupons } = await supabase
          .from('cupons')
          .select('*')
          .eq('loja_id', data.loja_id)
          .eq('ativo', true)
          .is('cliente_id', null)
          .limit(5);
        if (cupons) setCuponsDisponiveis(cupons);
      }

      if (data?.id) {
        const agora = new Date().toISOString();
        const { data: oferta } = await supabase
          .from('ofertas_relampago')
          .select('*')
          .eq('produto_id', data.id)
          .eq('ativa', true)
          .lte('data_inicio', agora)
          .gt('data_fim', agora)
          .order('data_fim', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (oferta) setOfertaRelampago(oferta);
      }

      if (data) {
        const stored = localStorage.getItem('capelgo_recently_viewed');
        let recent: any[] = stored ? JSON.parse(stored) : [];
        recent = recent.filter((r: any) => r.id !== data.id);
        recent.unshift({
          id: data.id,
          nome: data.nome,
          preco: data.preco,
          imagem_url: data.imagem_url,
          loja_nome: lojaInfo?.nome || ''
        });
        if (recent.length > 20) recent = recent.slice(0, 20);
        localStorage.setItem('capelgo_recently_viewed', JSON.stringify(recent));
      }

      if (data?.categoria) {
        const { data: related } = await supabase
          .from('produtos')
          .select('*')
          .eq('categoria', data.categoria)
          .neq('id', data.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (related) setRelatedProducts(related);
      }

      setLoading(false);
    }
    loadProduto();
  }, [id]);

  useEffect(() => {
    if (produto && !viewCounted.current) {
      const today = new Date().toISOString().split('T')[0];
      const stored = JSON.parse(localStorage.getItem('capelgo_views') || '{}') as Record<string, string>;
      if (stored[produto.id] === today) return;
      viewCounted.current = true;
      supabase.from('produtos').update({ visualizacoes: (produto.visualizacoes || 0) + 1 }).eq('id', produto.id).then(({ error }) => {
        if (error) console.warn('Erro ao registrar visualizacao:', error.message);
      });
      stored[produto.id] = today;
      localStorage.setItem('capelgo_views', JSON.stringify(stored));
    }
  }, [produto]);

  useEffect(() => {
    if (!temFlashSale) return;
    const calcularDiferenca = () => {
      const dataFim = ofertaRelampago?.data_fim || produto?.promocao_data_fim;
      if (dataFim) {
        const agora = new Date().getTime();
        const fim = new Date(dataFim).getTime();
        const diff = Math.max(0, Math.floor((fim - agora) / 1000));
        if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
        return {
          hours: Math.floor(diff / 3600),
          minutes: Math.floor((diff % 3600) / 60),
          seconds: diff % 60
        };
      }
      return { hours: 2, minutes: 15, seconds: 30 };
    };
    setFlashTimeLeft(calcularDiferenca());
    const interval = setInterval(() => {
      setFlashTimeLeft(calcularDiferenca());
    }, 1000);
    return () => clearInterval(interval);
  }, [temFlashSale, ofertaRelampago?.data_fim, produto?.promocao_data_fim]);

  useEffect(() => {
    if (produto) {
      const checkFavorite = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('favoritos').select('id').eq('produto_id', produto.id).eq('cliente_id', session.user.id).maybeSingle();
        if (data) setIsFavorited(true);
      };
      checkFavorite();
    }
  }, [produto]);

  const handleFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Faça login para favoritar!'); return; }
    if (isFavorited) {
      await supabase.from('favoritos').delete().eq('produto_id', produto!.id).eq('cliente_id', session.user.id);
      setIsFavorited(false);
      setFavoriteCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase.from('favoritos').insert({ produto_id: produto!.id, cliente_id: session.user.id });
      setIsFavorited(true);
      setFavoriteCount(prev => prev + 1);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: produto?.nome, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newMidias = [...novaAvaliacao.midias];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
      const filePath = `reviews/${id}/${fileName}`;
      const tipo: 'foto' | 'video' = file.type.startsWith('video') ? 'video' : 'foto';
      const { error: uploadError } = await supabase.storage.from('avaliacoes').upload(filePath, file);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avaliacoes').getPublicUrl(filePath);
        newMidias.push({ url: publicUrl, tipo });
      }
    }
    setNovaAvaliacao({ ...novaAvaliacao, midias: newMidias });
    setIsUploading(false);
  };

  const handleSubmitReview = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Faça login para avaliar!'); return; }
    setIsSubmittingReview(true);

    const { data: reviewData, error } = await supabase.from('avaliacoes').insert({
      produto_id: id,
      cliente_id: session.user.id,
      nota: novaAvaliacao.nota,
      comentario: novaAvaliacao.comentario,
      fotos: novaAvaliacao.midias.map(m => m.url),
      midias: novaAvaliacao.midias
    }).select().single();

    if (!error && reviewData) {
      if (lojaInfo?.recompensa_review_ativa) {
        const cupomCodigo = `GIFT-${Math.random().toString(36).toUpperCase().substring(2, 6)}`;
        const { data: cupom, error: cupomErr } = await supabase.from('cupons').insert({
          codigo: cupomCodigo,
          valor: lojaInfo.recompensa_valor,
          tipo: lojaInfo.recompensa_tipo,
          loja_id: produto?.loja_id,
          cliente_id: session.user.id
        }).select().single();

        if (!cupomErr && cupom) {
          await supabase.from('avaliacoes').update({ cupom_gerado_id: cupom.id }).eq('id', reviewData.id);
          setGeneratedCoupon(cupom);
          setIsRewardModalOpen(true);
        }
      }

      setIsReviewModalOpen(false);
      setNovaAvaliacao({ nota: 5, comentario: '', midias: [] });
      const { data: reviews } = await supabase.from('avaliacoes').select('*, profiles(nome)').eq('produto_id', id);
      if (reviews) setAvaliacoes(reviews);
    } else {
      alert('Erro ao enviar avaliação.');
    }
    setIsSubmittingReview(false);
  };

  const handleAddToCart = () => {
    const requiredVariations = produto.variacoes?.map(v => v.nome) || [];
    const selectedKeys = Object.keys(selectedVariacoes);
    const missing = requiredVariations.filter(k => !selectedKeys.includes(k));

    if (missing.length > 0) {
      alert(`Por favor, selecione as opções de: ${missing.join(', ')}`);
      return;
    }

    addToCart({
       id: produto.id,
       nome: produto.nome,
        preco: precoAtual,
       imagem_url: produto.imagem_url ? produto.imagem_url.split(',')[0] : '',
       quantidade,
       loja_id: produto.loja_id,
       loja_nome: lojaInfo?.nome,
       variacao: Object.entries(selectedVariacoes).map(([k, v]) => `${k}: ${v}`).join(', '),
       premio_nome: produto.premio_nome
     });
    alert('Produto adicionado ao carrinho!');
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-shopee-orange" size={40} /></div>;
  if (!produto) return <div className="p-10 text-center">Produto não encontrado.</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24 md:pb-16 font-sans">
      {/* BANNER DE GANHADOR FLUTUANTE */}
      {showWinnerBanner && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-lg z-[100] bg-gradient-to-r from-shopee-orange to-[#F53D2D] p-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20 backdrop-blur-sm"
        >
           <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Gift className="text-white animate-bounce" size={24} />
           </div>
           <div className="flex-1">
              <p className="text-white font-black text-xs md:text-sm uppercase tracking-wider leading-none">Parabéns, Ganhador!</p>
              <p className="text-white/80 text-[10px] md:text-xs font-bold mt-1">Este é o seu brinde! Adicione ao carrinho para resgatar.</p>
           </div>
           <button 
             onClick={() => {
                setShowWinnerBanner(false);
                setSearchParams({});
             }} 
             className="text-white/60 hover:text-white"
           >
              <X size={18} />
           </button>
        </motion.div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between p-4 md:px-8 items-center max-w-[1200px] mx-auto">
        <button onClick={() => navigate(-1)} className="bg-black/30 backdrop-blur-md text-white p-2 md:p-3 rounded-full hover:bg-black/50 transition-colors"><ArrowLeft size={20} /></button>
        <button onClick={() => navigate('/carrinho')} className="bg-black/30 backdrop-blur-md text-white p-2 md:p-3 rounded-full relative hover:bg-black/50 transition-colors">
          <ShoppingCart size={20} />
          {totalItems > 0 && <span className="absolute -top-1 -right-1 bg-shopee-orange text-white text-[10px] px-1 rounded-full border border-white">{totalItems}</span>}
        </button>
      </header>

      {/* MAIN CONTENT */}
      <div className="max-w-[1200px] mx-auto md:flex md:gap-6 md:px-8 md:pt-20">
        {/* ─── LEFT COLUMN – MÍDIA ─── */}
        <div className="md:w-[55%] md:sticky md:top-24 md:self-start">
          {/* Imagem Principal / Vídeo */}
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm relative">
            {currentMedia?.type === 'video' ? (
              <div className="relative">
                <video src={currentMedia.url} autoPlay loop muted playsInline className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="text-white fill-white ml-1" size={28} />
                  </div>
                </div>
              </div>
            ) : currentMedia ? (
              <img src={currentMedia.url} alt={produto.nome} className="w-full aspect-square object-cover" />
            ) : (
              <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500" alt={produto.nome} className="w-full aspect-square object-cover" />
            )}

            {/* Badge de desconto */}
            {temFlashSale && (
              <div className="absolute top-4 right-4 bg-gradient-to-br from-shopee-orange to-[#F53D2D] text-white px-3 py-1.5 rounded-full font-black text-xs shadow-lg z-10">
                {descontoPercentual}% OFF
              </div>
            )}

            {/* Badge de prêmio */}
            {produto.premio_nome && (
              <div className="absolute bottom-4 left-4 bg-green-600 text-white px-3 py-1.5 rounded-full font-black text-[10px] shadow-lg flex items-center gap-1.5 z-10">
                <Gift size={12} /> Presente Grátis
              </div>
            )}
          </div>

          {/* Miniaturas */}
          {mediaItems.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
              {mediaItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx 
                      ? 'border-shopee-orange shadow-md shadow-orange-100' 
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                      <img src={mediaItems[1]?.url || ''} alt="video" className="w-full h-full object-cover opacity-60" />
                      <Play className="absolute text-white fill-white" size={16} />
                    </div>
                  ) : (
                    <img src={item.url} alt={`${produto.nome} ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Compartilhar e Favoritar */}
          <div className="flex items-center gap-6 mt-4 px-1">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-gray-500 hover:text-shopee-orange transition-colors text-xs font-bold"
            >
              <Share2 size={16} />
              Compartilhar
            </button>
            <button
              onClick={handleFavorite}
              className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                isFavorited ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <Heart size={16} className={isFavorited ? 'fill-red-500' : ''} />
              Favorito ({favoriteCount})
            </button>
          </div>
        </div>

        {/* ─── RIGHT COLUMN – INFORMAÇÕES E COMPRA ─── */}
        <div className="md:w-[45%] md:sticky md:top-24 md:self-start">
          <div className="bg-white rounded-[32px] shadow-sm p-5 md:p-8 md:space-y-5 space-y-4">

            {/* Badge Oficial / Verificado + Título + Avaliações */}
            {lojaInfo?.parceiro_premium && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-shopee-orange/10 to-orange-50 px-3 py-1 rounded-full border border-shopee-orange/20">
                  <ShieldCheck className="text-shopee-orange" size={14} />
                  <span className="text-[10px] font-black text-shopee-orange uppercase tracking-wider">Oficial / Verificado</span>
                </div>
              </div>
            )}

            <h1 className="text-slate-800 text-lg md:text-xl font-bold leading-tight">{produto.nome}</h1>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Estrelas */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={star <= mediaEstrelas ? 'fill-shopee-orange text-shopee-orange' : 'text-gray-200'}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-1 font-medium">
                  {mediaAvaliacoes > 0 ? mediaAvaliacoes.toFixed(1) : ''} ({avaliacoes.length})
                </span>
              </div>
              <span className="text-gray-200">|</span>
              <span className="text-xs text-gray-500 font-medium">{produto.vendidos || 0} vendidos</span>
            </div>

            {/* OFERTA RELÂMPAGO */}
            {temFlashSale && (
              <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-red-100 -mx-1">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="text-white" size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-xs uppercase tracking-wider leading-none">Oferta Relâmpago</p>
                  <p className="text-white/70 text-[10px] font-bold mt-1">Oferta por tempo limitado</p>
                </div>
                <div className="flex items-center gap-1.5 bg-black/20 px-3 py-2 rounded-xl">
                  <Clock className="text-white" size={14} />
                  <span className="text-white font-black text-sm tabular-nums">
                    {String(flashTimeLeft.hours).padStart(2, '0')}:{String(flashTimeLeft.minutes).padStart(2, '0')}:{String(flashTimeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            {/* PREÇO */}
            <div className="flex items-baseline gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-shopee-orange text-lg md:text-xl font-bold">R$</span>
                <span className="text-3xl md:text-4xl text-shopee-orange font-black">{precoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              {temFlashSale && (
                <span className="text-gray-400 text-sm md:text-base line-through font-medium">R$ {produto.preco.toFixed(2)}</span>
              )}
            </div>

            {/* PRESENTE GRÁTIS */}
            {produto.premio_nome && (
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-3 rounded-2xl border border-green-100 w-full">
                <div className="w-7 h-7 bg-green-600 text-white rounded-xl flex items-center justify-center shrink-0">
                  <Gift size={14} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider">Presente Grátis: {produto.premio_nome}</span>
              </div>
            )}

            {/* VARIAÇÕES */}
            {(Array.isArray(produto.variacoes) ? produto.variacoes : []).length > 0 && (
              <div className="space-y-4 pt-1">
                {(Array.isArray(produto.variacoes) ? produto.variacoes : []).map((v: any, idx: number) => {
                  const opcoes = v.opcoes.split(',').map((o: string) => o.trim());
                  const isColor = v.nome.toLowerCase().includes('cor');
                  return (
                    <div key={idx} className="space-y-2.5">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{v.nome}</p>
                      <div className={`flex flex-wrap gap-2 ${isColor ? 'grid grid-cols-6 sm:grid-cols-8 md:grid-cols-5 gap-2' : ''}`}>
                        {opcoes.map((opcao: string) => {
                          const isSelected = selectedVariacoes[v.nome] === opcao;
                          if (isColor) {
                            const colorMap: Record<string, string> = {
                              'preto': '#1a1a1a', 'branco': '#ffffff', 'vermelho': '#dc2626',
                              'azul': '#2563eb', 'verde': '#16a34a', 'amarelo': '#eab308',
                              'rosa': '#ec4899', 'roxo': '#7c3aed', 'laranja': '#ea580c',
                              'cinza': '#6b7280', 'marrom': '#7c4a2a', 'bege': '#f5e6d3',
                              'nude': '#e8c4a0', 'prata': '#b0b0b0', 'dourado': '#d4a017',
                            };
                            const bgColor = colorMap[opcao.toLowerCase()] || '#e5e7eb';
                            return (
                              <button
                                key={opcao}
                                onClick={() => setSelectedVariacoes({ ...selectedVariacoes, [v.nome]: opcao })}
                                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl border-2 transition-all ${
                                  isSelected 
                                    ? 'border-shopee-orange ring-2 ring-shopee-orange/20 scale-110' 
                                    : 'border-gray-200 hover:border-gray-400'
                                }`}
                                style={{ backgroundColor: bgColor }}
                                title={opcao}
                              />
                            );
                          }
                          return (
                            <button
                              key={opcao}
                              onClick={() => setSelectedVariacoes({ ...selectedVariacoes, [v.nome]: opcao })}
                              className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border ${
                                isSelected 
                                  ? 'bg-shopee-orange text-white border-shopee-orange shadow-md shadow-orange-100' 
                                  : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-300'
                              }`}
                            >
                              {opcao}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TABELA DE MEDIDAS */}
            <button
              onClick={() => setIsSizeGuideOpen(true)}
              className="flex items-center gap-2 text-shopee-orange text-xs font-black uppercase tracking-wider hover:text-orange-600 transition-colors"
            >
              <Ruler size={14} />
              Tabela de Medidas
            </button>

            {/* LOGÍSTICA – ENTREGA E RETIRADA */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Truck size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-blue-700 uppercase leading-tight">Entrega em Ermelino</p>
                  <p className="text-[10px] text-blue-600 font-bold">30-45 min • Frete: R$ 5,00</p>
                </div>
              </div>
              <div className="h-px bg-blue-100/50" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-green-700 uppercase leading-tight">Retirada na Loja</p>
                  <p className="text-[10px] text-green-600 font-bold">Disponível em 30 min • Grátis</p>
                </div>
              </div>
            </div>

            {/* CUPONS DISPONÍVEIS */}
            {cuponsDisponiveis.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Ticket size={14} className="text-purple-600" />
                  <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider">Cupons disponíveis</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cuponsDisponiveis.map((cupom, idx) => (
                    <button
                      key={idx}
                      onClick={async () => {
                        await navigator.clipboard.writeText(cupom.codigo);
                        alert(`Cupom ${cupom.codigo} copiado! Use no carrinho.`);
                      }}
                      className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-purple-200 hover:border-purple-400 transition-all shadow-sm"
                    >
                      <span className="text-xs font-black text-purple-700">{cupom.codigo}</span>
                      <span className="text-[10px] font-bold text-purple-400">
                        {cupom.tipo === 'porcentagem' ? `${cupom.valor}% OFF` : `R$ ${Number(cupom.valor).toFixed(2)} OFF`}
                      </span>
                      <Copy size={12} className="text-purple-300 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RECOMPENSA DE AVALIAÇÃO */}
            {lojaInfo?.recompensa_review_ativa && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-shopee-orange text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-100 shrink-0">
                  <Gift size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-shopee-orange uppercase leading-tight">Presente de Avaliação</p>
                  <p className="text-[10px] text-orange-700 font-bold">Ganhe {lojaInfo.recompensa_valor}{lojaInfo.recompensa_tipo === 'percentual' ? '%' : ' de desconto'} ao avaliar este produto!</p>
                </div>
              </div>
            )}

            {/* LOJA */}
            {lojaInfo && (
              <div className="flex items-center gap-3 pt-1 pb-2 border-t border-gray-50">
                <div className="w-9 h-9 bg-shopee-orange/10 rounded-xl flex items-center justify-center shrink-0">
                  <Store size={16} className="text-shopee-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">
                    Vendido por <span className="font-bold text-gray-800">{lojaInfo.nome}</span>
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/loja/${produto.loja_id}`)}
                  className="shrink-0 text-[10px] font-black text-shopee-orange uppercase bg-orange-50 px-4 py-2 rounded-full border border-orange-100 hover:bg-orange-100 transition-colors"
                >
                  Ver Loja
                </button>
              </div>
            )}

            {/* ─── SELEÇÃO DE QUANTIDADE E BOTÕES DE AÇÃO (DESKTOP) ─── */}
            <div className="hidden md:block space-y-4 pt-3 border-t border-gray-100">
              {/* Quantidade */}
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">Quantidade</span>
                <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-100">
                  <button
                    onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    disabled={isEsgotado}
                    className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-gray-500 hover:text-shopee-orange transition-colors disabled:text-gray-300"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 md:w-11 text-center text-sm font-black text-slate-800">{quantidade}</span>
                  <button
                    onClick={() => setQuantidade(Math.min(produto.estoque || 99, quantidade + 1))}
                    disabled={isEsgotado}
                    className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-gray-500 hover:text-shopee-orange transition-colors disabled:text-gray-300"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {produto.estoque !== undefined && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    {produto.estoque} {produto.estoque === 1 ? 'disponível' : 'disponíveis'}
                  </span>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <button
                  disabled={isEsgotado}
                  onClick={handleAddToCart}
                  className={`flex-1 h-12 rounded-2xl font-black text-xs uppercase transition-all ${
                    isEsgotado
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-shopee-orange text-white shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-[0.98]'
                  }`}
                >
                  {isEsgotado ? 'Esgotado' : `Adicionar ao Carrinho`}
                </button>
                <button
                  disabled={isEsgotado}
                  onClick={() => { handleAddToCart(); navigate('/carrinho'); }}
                  className={`flex-1 h-12 rounded-2xl font-black text-xs uppercase shadow-lg transition-all ${
                    isEsgotado
                      ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                      : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800 active:scale-[0.98]'
                  }`}
                >
                  {isEsgotado ? 'Sem Estoque' : 'Comprar Agora'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── DESCRIÇÃO ─── */}
      <div className="max-w-[1200px] mx-auto md:px-8 mt-2 md:mt-6">
        <section className="bg-white p-5 md:p-8 md:rounded-[32px] md:shadow-sm rounded-none">
          <h3 className="font-black text-sm md:text-base uppercase mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-shopee-orange rounded-full inline-block" />
            Descrição
          </h3>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-wrap">{produto.descricao || 'Produto de alta qualidade.'}</p>
        </section>
      </div>

      {/* ─── AVALIAÇÕES ─── */}
      <div className="max-w-[1200px] mx-auto md:px-8 mt-2 md:mt-4">
        <section className="bg-white p-5 md:p-8 md:rounded-[32px] md:shadow-sm rounded-none">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-sm md:text-base uppercase flex items-center gap-2">
              <span className="w-1 h-5 bg-shopee-orange rounded-full inline-block" />
              Avaliações ({avaliacoes.length})
            </h3>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="text-[10px] font-black text-white uppercase bg-shopee-orange px-5 py-2.5 rounded-full hover:bg-orange-600 transition-colors shadow-md shadow-orange-100"
            >
              Avaliar Agora
            </button>
          </div>

          {avaliacoes.length === 0 ? (
            <div className="text-center py-12">
              <Star className="mx-auto text-gray-200 mb-4" size={40} />
              <p className="text-sm text-gray-400 font-medium">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {avaliacoes.map((rev) => {
                const getFakeName = (id: string) => {
                  const names = ["Ana Silva", "Carlos M.", "Mariana C.", "João S.", "Fernanda L.", "Roberto A.", "Juliana P.", "Lucas", "Beatriz R.", "Gabriel", "Patricia", "Thiago M."];
                  if (!id) return "Cliente Anônimo";
                  const sum = id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                  return names[sum % names.length];
                };
                const authorName = rev.profiles?.nome || getFakeName(rev.id);

                return (
                  <div key={rev.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-shopee-orange to-orange-400 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">{authorName.charAt(0)}</div>
                      <span className="text-xs md:text-sm font-bold text-gray-800">{authorName}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={`${i < rev.nota ? 'fill-shopee-orange text-shopee-orange' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mb-2 leading-relaxed">{rev.comentario}</p>
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-2 no-scrollbar">
                      {(rev.midias || []).map((m: any, idx: number) => (
                        <div key={idx} className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 shadow-sm">
                          {m.tipo === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                              <Play size={18} className="text-white fill-white" />
                            </div>
                          ) : (
                            <img src={m.url} className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                    {rev.resposta_lojista && (
                      <div className="mt-3 ml-4 p-3 bg-orange-50 rounded-xl border-l-4 border-shopee-orange">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Store size={12} className="text-shopee-orange" />
                          <span className="text-[10px] font-black text-shopee-orange uppercase">Resposta da Loja</span>
                        </div>
                        <p className="text-[11px] md:text-sm text-gray-600 italic leading-relaxed">{rev.resposta_lojista}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ─── PRODUTOS RELACIONADOS ─── */}
      {relatedProducts.length > 0 && (
        <div className="max-w-[1200px] mx-auto md:px-8 mt-2 md:mt-4">
          <section className="bg-white p-5 md:p-8 md:rounded-[32px] md:shadow-sm rounded-none">
            <h3 className="font-black text-sm md:text-base uppercase mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-shopee-orange rounded-full inline-block" />
              Produtos Relacionados
            </h3>
            <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x">
              {relatedProducts.map((rp: any) => {
                const rpPreco = rp.promocao_ativa && rp.preco_promocional ? rp.preco_promocional : rp.preco;
                return (
                  <div
                    key={rp.id}
                    onClick={() => {
                      window.scrollTo(0, 0);
                      navigate(`/produto/${rp.id}`);
                    }}
                    className="shrink-0 w-36 md:w-44 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden snap-start cursor-pointer hover:border-shopee-orange hover:shadow-md transition-all group"
                  >
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      <img
                        src={rp.imagem_url?.split(',')[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                        alt={rp.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {rp.promocao_ativa && rp.preco_promocional && (
                        <div className="absolute top-2 right-2 bg-shopee-orange text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                          -{Math.round(100 - (rp.preco_promocional * 100 / rp.preco))}%
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{rp.nome}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-shopee-orange text-xs font-black">
                          R$ {Number(rpPreco).toFixed(2)}
                        </span>
                        {rp.promocao_ativa && rp.preco_promocional && (
                          <span className="text-[8px] text-gray-400 line-through">R$ {rp.preco.toFixed(2)}</span>
                        )}
                      </div>
                      {rp.loja_nome && (
                        <p className="text-[8px] text-gray-400 truncate mt-1 flex items-center gap-0.5">
                          <Store size={8} /> {rp.loja_nome}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ─── MODAL DE TABELA DE MEDIDAS ─── */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                  <Ruler size={16} className="text-shopee-orange" />
                  Tabela de Medidas
                </h3>
                <button onClick={() => setIsSizeGuideOpen(false)} className="text-gray-400 p-2 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Tamanho</th>
                      <th className="p-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Peito (cm)</th>
                      <th className="p-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Cintura (cm)</th>
                      <th className="p-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Quadril (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['PP', 'P', 'M', 'G', 'GG'].map((size) => (
                      <tr key={size} className="border-b border-gray-50">
                        <td className="p-3 font-bold text-gray-800">{size}</td>
                        <td className="p-3 text-gray-600">{Math.round(80 + Math.random() * 20)}</td>
                        <td className="p-3 text-gray-600">{Math.round(60 + Math.random() * 20)}</td>
                        <td className="p-3 text-gray-600">{Math.round(85 + Math.random() * 20)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-400 font-medium mt-4 text-center">
                As medidas podem variar em até 2cm para mais ou para menos.
              </p>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-full bg-slate-900 text-white py-4 rounded-[24px] font-black text-xs uppercase mt-6 shadow-xl hover:bg-slate-800 transition-colors"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL DE AVALIAÇÃO ─── */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Sua Opinião</h3>
                   <button onClick={() => setIsReviewModalOpen(false)} className="text-gray-400 p-2"><X size={24}/></button>
                </div>
                <div className="space-y-6">
                   <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button key={num} onClick={() => setNovaAvaliacao({...novaAvaliacao, nota: num})}>
                           <Star size={40} className={`${num <= novaAvaliacao.nota ? 'fill-shopee-orange text-shopee-orange' : 'text-gray-200'} transition-all`} />
                        </button>
                      ))}
                   </div>
                   <textarea className="w-full bg-gray-50 rounded-3xl p-6 text-sm min-h-[140px] outline-none focus:ring-2 ring-shopee-orange/20" placeholder="O que achou deste produto?" value={novaAvaliacao.comentario} onChange={(e) => setNovaAvaliacao({...novaAvaliacao, comentario: e.target.value})} />
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adicionar Fotos/Vídeos</label>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                         <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-300 hover:text-shopee-orange hover:border-shopee-orange transition-all flex-shrink-0">
                            {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                         </button>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} />
                         {novaAvaliacao.midias.map((m, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                               {m.tipo === 'video' ? <div className="w-full h-full bg-black flex items-center justify-center"><Play size={20} className="text-white fill-white" /></div> : <img src={m.url} className="w-full h-full object-cover" />}
                               <button onClick={() => setNovaAvaliacao({...novaAvaliacao, midias: novaAvaliacao.midias.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"><X size={12}/></button>
                            </div>
                         ))}
                      </div>
                   </div>
                   <button onClick={handleSubmitReview} disabled={isSubmittingReview} className="w-full bg-shopee-orange text-white py-5 rounded-[24px] font-black text-xs uppercase shadow-xl shadow-orange-100 flex items-center justify-center gap-3">
                      {isSubmittingReview ? <Loader2 className="animate-spin" size={18} /> : <>Enviar Avaliação <Send size={16}/></>}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL DE RECOMPENSA (PRESENTE) ─── */}
      <AnimatePresence>
        {isRewardModalOpen && generatedCoupon && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
             <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-50" />
                
                <div className="relative z-10">
                   <div className="w-24 h-24 bg-shopee-orange rounded-[32px] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-orange-200 animate-bounce">
                      <Gift size={48} />
                   </div>
                   <h2 className="text-2xl font-black text-slate-800 leading-tight">Parabéns!<br/>Você Ganhou um Presente! 🎁</h2>
                   <p className="text-sm text-gray-500 font-medium mt-3 px-4">Como agradecimento pela sua avaliação, a loja gerou um cupom exclusivo para você!</p>
                   
                   <div className="mt-8 bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-[32px] relative group">
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-gray-200 rounded-full" />
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-gray-200 rounded-full" />
                      
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Seu Código</p>
                      <div className="flex items-center justify-center gap-2">
                         <span className="text-3xl font-black text-shopee-orange tracking-tighter">{generatedCoupon.codigo}</span>
                         <button onClick={() => { navigator.clipboard.writeText(generatedCoupon.codigo); alert('Copiado!'); }} className="text-gray-300 hover:text-shopee-orange transition-colors"><Copy size={18}/></button>
                      </div>
                      <p className="text-[11px] font-black text-slate-700 mt-4 px-3 py-1.5 bg-white rounded-full inline-block">
                         {generatedCoupon.valor}{generatedCoupon.tipo === 'percentual' ? '%' : ' OFF'} NO PRÓXIMO PEDIDO
                      </p>
                   </div>

                   <button onClick={() => setIsRewardModalOpen(false)} className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-xs uppercase mt-8 shadow-xl">Aproveitar Agora!</button>
                   <p className="text-[9px] text-gray-300 font-bold uppercase mt-4">Válido por 30 dias na sua próxima compra</p>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FOOTER MOBILE – BOTÕES DE AÇÃO ─── */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex gap-3 z-50 md:hidden">
        <div className="max-w-[1200px] mx-auto w-full flex items-center gap-3">
          <button onClick={() => navigate('/meus-pedidos')} className="w-14 h-10 md:w-16 md:h-12 bg-gray-50 flex items-center justify-center text-shopee-orange rounded-2xl hover:bg-orange-50 transition-colors shrink-0">
            <MessageCircle size={20} />
          </button>
          <button
            disabled={isEsgotado}
            onClick={handleAddToCart}
            className={`flex-1 h-11 rounded-2xl font-black text-[10px] uppercase transition-all ${
              isEsgotado
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-shopee-orange text-white shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95'
            }`}
          >
            {isEsgotado ? 'Esgotado' : `Adicionar • R$ ${(precoAtual * quantidade).toFixed(2)}`}
          </button>
          <button
            disabled={isEsgotado}
            onClick={() => { handleAddToCart(); navigate('/carrinho'); }}
            className={`flex-1 h-11 rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all ${
              isEsgotado
                ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800 active:scale-95'
            }`}
          >
            {isEsgotado ? 'Sem Estoque' : 'Comprar'}
          </button>
        </div>
      </footer>
    </div>
  );
}
