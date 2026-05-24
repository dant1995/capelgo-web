import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Search, 
  MessageCircle, 
  Share2, 
  Star, 
  MapPin, 
  Info,
  ShoppingBag,
  Filter,
  Gift,
  X
} from 'lucide-react';
import { useCart } from './context/CartContext';

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const isWinner = searchParams.get('ganhou') === 'true';
  const [showWinnerBanner, setShowWinnerBanner] = useState(isWinner);
  const [loja, setLoja] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('produtos');

  useEffect(() => {
    async function loadStoreData() {
      if (!id) return;

      // 1. Carregar Dados da Loja
      const { data: storeData } = await supabase
        .from('lojas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (storeData) setLoja(storeData);

      // 2. Carregar Produtos da Loja
      const { data: productsData } = await supabase
        .from('produtos')
        .select('*')
        .eq('loja_id', id)
        .order('created_at', { ascending: false });
      
      if (productsData) setProdutos(productsData);
      setLoading(false);
    }
    loadStoreData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!loja) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Loja não encontrada</h2>
      <button onClick={() => navigate('/')} className="text-[#EE4D2D] font-bold">Voltar para o Início</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* ── BANNER DE GANHADOR FLUTUANTE ── */}
      {showWinnerBanner && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-4 left-4 right-4 z-[100] bg-gradient-to-r from-shopee-orange to-[#F53D2D] p-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20 backdrop-blur-sm"
        >
           <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Gift className="text-white animate-bounce" size={24} />
           </div>
           <div className="flex-1">
              <p className="text-white font-black text-xs uppercase tracking-wider leading-none">Parabéns, Ganhador!</p>
              <p className="text-white/80 text-[10px] font-bold mt-1">Seu brinde está te esperando nesta loja. Aproveite!</p>
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

      {/* ── HEADER ── */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img 
          src={loja.capa_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1000'} 
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
          <button onClick={() => navigate(-1)} className="bg-black/20 backdrop-blur-md p-2 rounded-full text-white">
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            <button className="bg-black/20 backdrop-blur-md p-2 rounded-full text-white"><Search size={20} /></button>
            <button className="bg-black/20 backdrop-blur-md p-2 rounded-full text-white"><Share2 size={20} /></button>
          </div>
        </div>
      </div>

      {/* ── STORE INFO CARD ── */}
      <div className="px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-xl p-4 shadow-xl border border-gray-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white rounded-full p-1 -mt-14 shadow-lg border-2 border-white overflow-hidden">
            <img src={loja.imagem_url || 'https://placehold.co/200'} className="w-full h-full object-cover rounded-full" />
          </div>
          
          <div className="mt-3 w-full">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-lg font-black text-gray-800 tracking-tight">{loja.nome}</h1>
              <span className="bg-[#EE4D2D] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm">OFICIAL</span>
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-2 mb-4">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-0.5 text-[#EE4D2D] font-bold text-sm">
                  <Star size={12} className="fill-[#EE4D2D]" />
                  <span>4.9</span>
                </div>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Avaliações</span>
              </div>
              <div className="w-px h-6 bg-gray-100" />
              <div className="flex flex-col items-center">
                <span className="text-gray-800 font-bold text-sm">95%</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Chat</span>
              </div>
              <div className="w-px h-6 bg-gray-100" />
              <div className="flex flex-col items-center">
                <span className="text-gray-800 font-bold text-sm">Ermelino</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Local</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => navigate('/meus-pedidos?tab=chat')}
                className="flex-1 bg-[#EE4D2D] text-white py-2.5 rounded-sm font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-orange-100"
              >
                <MessageCircle size={16} /> Conversar Agora
              </button>
              <button className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-sm font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                Seguir Loja
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="mt-4 bg-white border-b border-gray-100 flex sticky top-0 z-30">
        <button 
          onClick={() => setActiveTab('produtos')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'produtos' ? 'border-[#EE4D2D] text-[#EE4D2D]' : 'border-transparent text-gray-400'}`}
        >
          Produtos
        </button>
        <button 
          onClick={() => setActiveTab('sobre')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'sobre' ? 'border-[#EE4D2D] text-[#EE4D2D]' : 'border-transparent text-gray-400'}`}
        >
          Sobre a Loja
        </button>
      </div>

      {/* ── CONTENT ── */}
      <div className="p-2 mt-2">
        {activeTab === 'produtos' ? (
          <>
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">{produtos.length} Itens disponíveis</span>
              <button className="flex items-center gap-1 text-[#EE4D2D] text-[10px] font-black uppercase">
                <Filter size={12} /> Filtros
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {produtos.map((p) => (
                <motion.div 
                  key={p.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/produto/${p.id}`)}
                  className="bg-white rounded-sm overflow-hidden flex flex-col custom-shadow cursor-pointer group"
                >
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {p.video_url ? (
                      <video 
                        src={p.video_url} 
                        autoPlay loop muted playsInline 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <img 
                        src={p.imagem_url ? p.imagem_url.split(',')[0] : 'https://placehold.co/400x400?text=Sem+Foto'} 
                        alt={p.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {p.desconto && (
                      <div className="absolute top-0 right-0 bg-[#FDD835] text-[#EE4D2D] text-[9px] font-black px-1.5 py-1">
                        -{p.desconto}%
                      </div>
                    )}
                  </div>
                  <div className="p-2 flex flex-col gap-1 flex-1">
                    <p className="text-[11px] line-clamp-2 leading-tight h-8 font-medium text-gray-800">{p.nome}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-sm text-[#EE4D2D] font-bold">R${parseFloat(String(p.preco)).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div className="flex items-center text-[8px] text-gray-400 gap-0.5">
                         <Star size={8} className="fill-[#FDD835] text-[#FDD835]" />
                         <span>4.8 | {p.vendidos || 0} vendidos</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white p-6 rounded-xl space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-3">
                <Info size={14} className="text-[#EE4D2D]" /> Descrição da Loja
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {loja.descricao || 'Bem-vindo à nossa loja oficial! Oferecemos os melhores produtos da região com entrega rápida e garantia de qualidade.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-[#EE4D2D] shrink-0"><MapPin size={16}/></div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Endereço Principal</p>
                    <p className="text-xs font-bold text-gray-700">{loja.endereco || 'Ermelino Matarazzo, São Paulo - SP'}</p>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0"><ShoppingBag size={16}/></div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Membro desde</p>
                    <p className="text-xs font-bold text-gray-700">{new Date(loja.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
