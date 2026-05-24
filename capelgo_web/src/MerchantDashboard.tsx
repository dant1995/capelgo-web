import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign,
  ChevronRight,
  Search,
  Image as ImageIcon,
  Video,
  X,
  CheckCircle,
  Clock,
  Truck,
  MessageSquare,
  Gift,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  Camera,
  Check,
  Save,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  History,
  Zap,
  Award,
  Store,
  MessageCircle,
  User,
  Ticket,
  Wallet,
  Printer,
  Files,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { CATEGORIAS_SISTEMA } from './lib/constants';
import FinancialReports from './components/FinancialReports';
import MerchantWallet from './components/MerchantWallet';
import { useConfig } from './context/ConfigContext';
import MerchantChatPanel from './components/MerchantChatPanel';
import QrScanner from './components/QrScanner';
import DateFilterBar from './components/DateFilterBar';

interface Product {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  categoria: string;
  subcategoria: string;
  imagem_url: string;
  video_url?: string;
  estoque: number;
  vendas: number;
  loja_id: string;
  variacoes?: any[];
  preco_promocional?: number;
  promocao_ativa?: boolean;
  is_promoted?: boolean;
  promotion_status?: string;
  premio_nome?: string;
  galeria?: string[];
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  cliente_id: string;
  items: any[];
  endereco_entrega?: string;
  geolocalizacao_cliente?: { lat: number, lng: number };
  profiles?: {
    nome: string;
    email: string;
    telefone?: string;
  };
}

interface Review {
  id: string;
  nota: number;
  comentario: string;
  created_at: string;
  produto_id: string;
  cliente_id: string;
  has_media: boolean;
  profiles?: {
    nome: string;
  };
  produtos?: {
    nome: string;
  };
}

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const { plataformaLogo } = useConfig();
  const [activeTab, setActiveTab] = useState('inicio');
  const [activeMassShippingTab, setActiveMassShippingTab] = useState('pedidos');
  const [selectedMassOrders, setSelectedMassOrders] = useState<string[]>([]);
  const [docConfig, setDocConfig] = useState({ tipoDocumento: 'etiqueta_e_lista', formato: 'pdf' });
  const [horarios, setHorarios] = useState<any[]>([]);
  const [isSavingHorarios, setIsSavingHorarios] = useState(false);
  const [marketingView, setMarketingView] = useState('grid'); // 'grid', 'cupons', 'descontos', 'premios', 'ofertas'
  const [loading, setLoading] = useState(true);
  const [lojaData, setLojaData] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>(CATEGORIAS_SISTEMA);
  const [vendasFilterDays, setVendasFilterDays] = useState(7);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackProduto, setFeedbackProduto] = useState('');
  const [feedbackFilterDays, setFeedbackFilterDays] = useState(30);
  const [produtoSearch, setProdutoSearch] = useState('');
  const [produtoCategoria, setProdutoCategoria] = useState('');
  const [produtoStatus, setProdutoStatus] = useState('todos');
  
  // States for modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [premiosAtivos, setPremiosAtivos] = useState<any[]>([]);
  const [ganhadores, setGanhadores] = useState<any[]>([]);
  const [clickStats, setClickStats] = useState<any[]>([]);
  const [ofertasRelampago, setOfertasRelampago] = useState<any[]>([]);
  const [showOfertaModal, setShowOfertaModal] = useState(false);
  const [editingOferta, setEditingOferta] = useState<any>(null);
  const [newOferta, setNewOferta] = useState({
    produto_id: '',
    preco_promocional: '',
    data_inicio: '',
    data_fim: ''
  });
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [prizeStep, setPrizeStep] = useState<'list' | 'edit'>('list');
  const [newPrize, setNewPrize] = useState({
    tipo: 'produto', // 'produto', 'cupom', 'frete', 'customizado'
    produto_id: '',
    variacao: '',
    quantidade: '1',
    valor_minimo: '0',
    probabilidade: '10',
    nome_custom: '',
    imagem_custom: ''
  });
  const [newCoupon, setNewCoupon] = useState({
    codigo: '',
    valor: '',
    tipo: 'fixo',
    quantidade: '100'
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  
  // Ads Checkout States
  const [showAdsModal, setShowAdsModal] = useState(false);
  const [adsTarget, setAdsTarget] = useState<{ id: string, type: 'produto' | 'loja', nome: string } | null>(null);
  const [selectedAdsPlan, setSelectedAdsPlan] = useState<any>(null);
  const [isAdsProcessing, setIsAdsProcessing] = useState(false);

  const [ADS_PLANS] = useState([
    { id: '3_days', nome: 'Destaque Relâmpago', dias: 3, preco: 14.90, cor: 'from-orange-400 to-red-500' },
    { id: '7_days', nome: 'Impulso Semanal', dias: 7, preco: 29.90, cor: 'from-blue-500 to-indigo-600' },
    { id: '30_days', nome: 'Dominação Total', dias: 30, preco: 89.90, cor: 'from-purple-600 to-slate-900' },
  ]);

  const [systemSettings, setSystemSettings] = useState({
    pix_chave: 'financeiro@capelgo.com.br',
    pix_nome: 'CapelGo Pay',
    pix_banco: 'Mercado Pago',
    pix_cidade: 'Capela'
  });

  // Devolucoes States
  const [subTabDev, setSubTabDev] = useState('todos');
  const [searchDev, setSearchDev] = useState('');
  const [devolucaoFilterDays, setDevolucaoFilterDays] = useState(30);
  const [selectedDevMedia, setSelectedDevMedia] = useState<any>(null);

  // Validador de Voucher
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherResult, setVoucherResult] = useState<any>(null);
  const [voucherStatus, setVoucherStatus] = useState<'idle' | 'loading' | 'found' | 'not_found' | 'confirmed'>('idle');
  const [voucherError, setVoucherError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Form States
  const [newProduct, setNewProduct] = useState({
    nome: '',
    preco: '',
    descricao: '',
    categoria: '',
    subcategoria: '',
    estoque: '0',
    imagem_url: '',
    video_url: '',
    variacoes: [] as { nome: string, opcoes: string }[],
    preco_promocional: '',
    promocao_ativa: false,
    promocao_data_fim: '',
    premio_nome: '',
    galeria: [] as string[]
  });

  const fetchHorarios = async (lojaId: string) => {
    const { data } = await supabase.from('horarios_loja').select('*').eq('loja_id', lojaId).order('dia_semana');
    if (data) setHorarios(data);
  };
  
  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .not('id_slug', 'is', null) // 🔥 Filtra para pegar apenas categorias principais
        .order('nome');
      
      if (!error && data && data.length > 0) {
        // Formata os dados para garantir que subcategorias seja um array
        const formatadas = data.map(cat => ({
          ...cat,
          subcategorias: Array.isArray(cat.subcategorias) ? cat.subcategorias : JSON.parse(cat.subcategorias || '[]')
        }));
        setCategorias(formatadas);
      }
    } catch (err) {
      console.error("Erro ao buscar categorias do Supabase:", err);
    }
  };

  const handleUpdateHorario = async (id: string, updates: any) => {
    const { error } = await supabase.from('horarios_loja').update(updates).eq('id', id);
    if (!error) fetchHorarios(lojaData.id);
  };

  const handleSaveCoupon = async () => {
    if (!newCoupon.codigo || !newCoupon.valor) return alert('Preencha todos os campos');
    
    const { error } = await supabase
      .from('cupons')
      .insert({
        codigo: newCoupon.codigo.toUpperCase(),
        valor: parseFloat(newCoupon.valor),
        tipo: newCoupon.tipo,
        loja_id: lojaData.id,
        ativo: true
      });

    if (error) {
      alert('Erro ao salvar cupom: ' + error.message);
    } else {
      alert('Cupom criado com sucesso!');
      setShowCouponModal(false);
      setNewCoupon({ codigo: '', valor: '', tipo: 'fixo', quantidade: '100' });
      // Idealmente aqui daria um refresh na lista de cupons
    }
  };

  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);

   const fetchPremios = async (lojaId: string) => {
     // Buscar prêmios ativos da loja
     const { data: pAtivos } = await supabase
       .from('premios')
       .select('*')
       .eq('loja_id', lojaId);
     if (pAtivos) setPremiosAtivos(pAtivos);

     // Buscar ganhadores (Global)
     const { data: winners, error: winErr } = await supabase
       .from('premios_ganhos')
       .select('*')
       .eq('loja_id', lojaId)
       .order('created_at', { ascending: false });
     
     if (winners) {
        setGanhadores(winners);
     } else if (winErr) {
        console.error("Erro Supabase:", winErr);
      }
    };

  const fetchOfertas = async (lojaId: string) => {
    const { data } = await supabase
      .from('ofertas_relampago')
      .select('*, produtos(nome, preco, imagem_url)')
      .eq('loja_id', lojaId)
      .order('data_inicio', { ascending: false });
    if (data) setOfertasRelampago(data);
  };

  const handleSaveOferta = async () => {
    if (!newOferta.produto_id || !newOferta.preco_promocional || !newOferta.data_inicio || !newOferta.data_fim) {
      return alert('Preencha todos os campos');
    }
    const payload = {
      loja_id: lojaData.id,
      produto_id: newOferta.produto_id,
      preco_promocional: parseFloat(newOferta.preco_promocional),
      data_inicio: new Date(newOferta.data_inicio).toISOString(),
      data_fim: new Date(newOferta.data_fim).toISOString(),
      ativa: true
    };

    if (editingOferta) {
      const { error } = await supabase.from('ofertas_relampago').update(payload).eq('id', editingOferta.id);
      if (error) return alert('Erro ao atualizar: ' + error.message);
    } else {
      const { error } = await supabase.from('ofertas_relampago').insert(payload);
      if (error) return alert('Erro ao criar: ' + error.message);
    }

    setShowOfertaModal(false);
    setEditingOferta(null);
    setNewOferta({ produto_id: '', preco_promocional: '', data_inicio: '', data_fim: '' });
    fetchOfertas(lojaData.id);
    alert(editingOferta ? 'Oferta atualizada!' : 'Oferta criada!');
  };

  const handleDeleteOferta = async (id: string) => {
    if (!confirm('Excluir esta oferta relâmpago?')) return;
    const { error } = await supabase.from('ofertas_relampago').delete().eq('id', id);
    if (!error) {
      setOfertasRelampago(prev => prev.filter(o => o.id !== id));
    }
  };

  const handleValidateVoucher = async () => {
    if (!voucherInput.trim()) return;
    setVoucherStatus('loading');
    setVoucherResult(null);
    setVoucherError('');
    try {
      // Normaliza: aceita com ou sem prefixo CGO-
      const rawCode = voucherInput.trim().toUpperCase().replace(/^CGO-/, '');
      // Busca por todos prêmios pendentes da loja (sem join pra evitar RLS)
      const { data: allWins } = await supabase
        .from('premios_ganhos')
        .select('*')
        .eq('loja_id', lojaData?.id)
        .eq('resgatado', false);
      // Merge manual dos perfis
      let allWinsWithProfiles = allWins || [];
      if (allWinsWithProfiles.length > 0) {
        const clientIds = [...new Set(allWinsWithProfiles.map(w => w.cliente_id).filter(Boolean))];
        if (clientIds.length > 0) {
          const { data: profs } = await supabase.from('profiles').select('id, nome, email').in('id', clientIds);
          allWinsWithProfiles = allWinsWithProfiles.map(w => ({
            ...w,
            profiles: profs?.find(p => p.id === w.cliente_id) || null
          }));
        }
      }
      // Tenta encontrar por prefixo do id
      const found = allWinsWithProfiles.find(w => w.id.substring(0, 8).toUpperCase() === rawCode);
      if (found) {
        setVoucherResult(found);
        setVoucherStatus('found');
      } else {
        setVoucherStatus('not_found');
        setVoucherError('Voucher não encontrado. Verifique se o código está correto ou se já foi resgatado.');
      }
    } catch (e) {
      setVoucherStatus('not_found');
      setVoucherError('Erro ao consultar o banco de dados.');
    }
  };

  const handleConfirmVoucherDelivery = async () => {
    if (!voucherResult) return;
    setVoucherStatus('loading');
    const { error } = await supabase
      .from('premios_ganhos')
      .update({ resgatado: true })
      .eq('id', voucherResult.id);
    if (error) {
      setVoucherError('Erro ao confirmar entrega: ' + error.message);
      setVoucherStatus('found');
    } else {
      setVoucherStatus('confirmed');
      if (lojaData?.id) fetchPremios(lojaData.id);
    }
  };

  const handleSavePrize = async () => {
    if (!lojaData?.id) return;

    // Validações
    if (newPrize.tipo === 'produto' && !newPrize.produto_id) {
      alert('Por favor, selecione um produto do seu inventário.');
      return;
    }
    if (newPrize.tipo === 'customizado' && (!newPrize.nome_custom || !newPrize.imagem_custom)) {
      alert('Para brindes avulsos, você precisa de um nome e uma foto.');
      return;
    }

    const prizeData: any = {
      ...newPrize,
      loja_id: lojaData.id,
      quantidade: parseInt(newPrize.quantidade),
      probabilidade: parseFloat(newPrize.probabilidade),
      valor_minimo: parseFloat(newPrize.valor_minimo),
      produto_id: newPrize.produto_id === '' ? null : newPrize.produto_id
    };

    let result;
    if (editingPrizeId) {
      result = await supabase.from('premios').update(prizeData).eq('id', editingPrizeId);
    } else {
      result = await supabase.from('premios').insert(prizeData);
    }

    if (result.error) {
      alert('Erro ao salvar: ' + result.error.message);
    } else {
      alert('Prêmio salvo com sucesso!');
      setShowPrizeModal(false);
      setEditingPrizeId(null);
      fetchPremios(lojaData.id);
      setNewPrize({
        tipo: 'produto',
        produto_id: '',
        variacao: '',
        quantidade: '1',
        valor_minimo: '0',
        probabilidade: '10',
        nome_custom: '',
        imagem_custom: ''
      });
    }
  };

  const handlePrizeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `prize_${Math.random()}.${fileExt}`;
    const filePath = `prizes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('loja-media')
      .upload(filePath, file);

    if (uploadError) {
      alert('Erro no upload da imagem: ' + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('loja-media')
      .getPublicUrl(filePath);

    setNewPrize({ ...newPrize, imagem_custom: publicUrl });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lojaData?.id) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo_${lojaData.id}_${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('loja-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('loja-media')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('lojas')
        .update({ logo: publicUrl })
        .eq('id', lojaData.id);

      if (updateError) throw updateError;
      
      setLojaData({ ...lojaData, logo: publicUrl });
      alert('Logo atualizada com sucesso!');
    } catch (err: any) {
      alert('Erro ao fazer upload da logo: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePrize = async (id: string) => {
    if (!confirm('Deseja realmente excluir este prêmio?')) return;
    const { error } = await supabase.from('premios').delete().eq('id', id);
    if (!error) {
      setPremiosAtivos(premiosAtivos.filter(p => p.id !== id));
    }
  };

  useEffect(() => {
    loadStoreData();

    // Escutar eventos de pagamento e feedback via localStorage
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'capelgo_feedback' || e.key === 'capelgo_admin_payment') {
        loadStoreData();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const loadStoreDataRef = useRef(false);

  async function loadStoreData() {
    if (loadStoreDataRef.current) return;
    loadStoreDataRef.current = true;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setCurrentUserProfile(profileData);

      // 🔐 RBAC: Proteção de Rota
      if (profileData) {
        if (profileData.role === 'admin' || profileData.role === 'lojista') {
           // Acesso permitido
        } else if (profileData.role === 'entregador') {
           navigate('/entregador');
           return;
        } else {
           navigate('/perfil');
           return;
        }
      }

      const profile = profileData;

      if (!profile?.loja_id) {
        setLoading(false);
        // Se for lojista mas não tiver loja_id, apenas paramos o carregamento dos dados da loja
        return;
      }

      const { data: loja } = await supabase
        .from('lojas')
        .select('*')
        .eq('id', profile.loja_id)
        .single();

      if (loja) {
        setLojaData({
          ...loja,
          recompensa_review_ativa: loja.recompensa_review_ativa === true || loja.recompensa_review_ativa === 'true' || !!loja.recompensa_review_ativa,
          recompensa_valor: loja.recompensa_valor || 0,
          recompensa_tipo: loja.recompensa_tipo || 'fixo'
        });
        fetchPremios(loja.id);
        fetchOfertas(loja.id);
        fetchHorarios(loja.id);
        fetchCategorias();
      }

      // Buscar Configurações Globais (PIX, etc)
      const { data: configData } = await supabase.from('configuracoes_sistema').select('*');
      if (configData) {
         const pix = configData.find(c => c.chave === 'pix_config')?.valor;
         if (pix) {
            setSystemSettings(prev => ({
               ...prev,
               pix_chave: pix.chave || prev.pix_chave,
               pix_nome: pix.nome || prev.pix_nome,
               pix_banco: pix.banco || prev.pix_banco,
               pix_cidade: pix.cidade || prev.pix_cidade
            }));
         }
      }

      const { data: prodData } = await supabase
        .from('produtos')
        .select('*')
        .eq('loja_id', profile.loja_id)
        .order('created_at', { ascending: false });
      
      // 1. Buscar Pedidos
      const { data: pedData, error: pedError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('loja_id', profile.loja_id)
        .order('created_at', { ascending: false });
      
      // Calcular vendas para cada produto a partir dos pedidos
      const safePedData = pedData || [];
      const mappedProducts = (prodData || []).map((p: any) => {
         let totalVendas = 0;
         safePedData.forEach((pedido: any) => {
            if (pedido.status !== 'cancelado') {
               const itens = pedido.itens || [];
               itens.forEach((item: any) => {
                  if (item.id === p.id) {
                     totalVendas += (item.qtd || item.quantidade || 0);
                  }
               });
            }
         });
         return { ...p, vendas: totalVendas };
      });
      setProdutos(mappedProducts);

      if (pedError) {
        console.error('Erro na query de pedidos:', pedError);
        setPedidos([]);
      } else if (pedData) {
        // 2. Buscar Perfis dos Clientes (Merge Manual)
        const clientIds = [...new Set(pedData.map(p => p.cliente_id).filter(Boolean))];
        
        if (clientIds.length > 0) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('id, nome, email, telefone')
            .in('id', clientIds);
          
          const ordersWithProfiles = pedData.map(pedido => ({
            ...pedido,
            profiles: profData?.find(p => p.id === pedido.cliente_id)
          }));
          
          setPedidos(ordersWithProfiles);
        } else {
          setPedidos(pedData);
        }
      }

      // 3. Buscar Avaliações (Merge Manual para evitar erro 400)
      const { data: revData, error: revError } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('loja_id', profile.loja_id)
        .order('created_at', { ascending: false });
      
      if (revError) {
        console.warn('Aviso: Tabela de avaliações ainda não contém dados ou não existe.', revError.message);
        setReviews([]);
        return;
      }

      if (revData && revData.length > 0) {
        const clientIdsRev = [...new Set(revData.map(r => r.cliente_id).filter(Boolean))];
        const productIdsRev = [...new Set(revData.map(r => r.produto_id))];

        const { data: profsRev } = await supabase.from('profiles').select('id, nome').in('id', clientIdsRev);
        const { data: prodsRev } = await supabase.from('produtos').select('id, nome').in('id', productIdsRev);

        const revWithData = revData.map(r => ({
          ...r,
          profiles: profsRev?.find(p => p.id === r.cliente_id),
          produtos: prodsRev?.find(p => p.id === r.produto_id)
        }));
        setReviews(revWithData);
      } else {
        setReviews([]);
      }

      // 📊 4. Buscar Analytics de Cliques (Específico desta Loja)
      fetchAnalytics(profile.loja_id);

      // 📦 5. Buscar Devoluções e Reembolsos
      try {
        const { data: devData } = await supabase
          .from('devolucoes')
          .select('*')
          .eq('loja_id', profile.loja_id)
          .order('created_at', { ascending: false });
        
        if (devData) {
          const clientIdsDev = [...new Set(devData.map(d => d.cliente_id).filter(Boolean))];
          if (clientIdsDev.length > 0) {
             const { data: profsDev } = await supabase.from('profiles').select('id, nome, email, telefone').in('id', clientIdsDev);
             const devWithProfiles = devData.map(d => ({
                ...d,
                profiles: profsDev?.find(p => p.id === d.cliente_id)
             }));
             setDevolucoes(devWithProfiles);
          } else {
             setDevolucoes(devData);
          }
        } else {
          setDevolucoes([]);
        }
      } catch (errDev) {
         console.warn('Erro ao buscar devoluções:', errDev);
         setDevolucoes([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      loadStoreDataRef.current = false;
    }
  }

  async function fetchAnalytics(lojaId: string) {
     try {
        // Buscar IDs dos produtos da loja para filtrar os cliques
        const { data: storeProds } = await supabase.from('produtos').select('id').eq('loja_id', lojaId);
        const productIds = storeProds?.map(p => p.id) || [];

        if (productIds.length > 0) {
           const { data: clicks } = await supabase
              .from('produto_clicks')
              .select('id, created_at, produto_id, profile_id')
              .in('produto_id', productIds)
              .order('created_at', { ascending: false })
              .limit(100);
           
           if (clicks) {
              const formatted = await Promise.all(clicks.map(async (c: any) => {
                 const { data: pInfo } = await supabase.from('produtos').select('nome, imagem_url').eq('id', c.produto_id).maybeSingle();
                 
                 let profInfo = { nome: 'Visitante' };
                 if (c.profile_id) {
                    const { data: pData } = await supabase.from('profiles').select('nome').eq('id', c.profile_id).maybeSingle();
                    if (pData) profInfo = pData;
                 }
                 
                 return { ...c, produto: pInfo, perfil: profInfo };
              }));
              setClickStats(formatted);
           }
        }

        // Buscar prêmios ganhos específicos desta loja (sem join pra evitar RLS)
        const { data: winners } = await supabase
           .from('premios_ganhos')
           .select('*')
           .eq('loja_id', lojaId)
           .order('created_at', { ascending: false });
        if (winners && winners.length > 0) {
           const clientIds = [...new Set(winners.map(w => w.cliente_id).filter(Boolean))];
           if (clientIds.length > 0) {
              const { data: profs } = await supabase.from('profiles').select('id, nome, email, telefone').in('id', clientIds);
              setGanhadores(winners.map(w => ({
                 ...w,
                 profiles: profs?.find(p => p.id === w.cliente_id) || null
              })));
           } else {
              setGanhadores(winners);
           }
        } else {
           setGanhadores([]);
        }

      } catch (err) {
         console.error("Erro ao buscar analytics:", err);
      }
   }

   useEffect(() => {
     if (!lojaData?.id) return;

     const channel = supabase.channel('merchant-novos-pedidos')
       .on('postgres_changes',
         { event: 'INSERT', schema: 'public', table: 'pedidos', filter: `loja_id=eq.${lojaData.id}` },
         (payload) => {
           const novoPedido = payload.new as any;

           // Buscar perfil do cliente e adicionar ao estado
           supabase.from('profiles').select('id, nome, email, telefone').eq('id', novoPedido.cliente_id).single().then(({ data: prof }) => {
             const pedidoComPerfil = { ...novoPedido, profiles: prof || null };
             setPedidos(prev => [pedidoComPerfil, ...prev]);
           });

           // Som de alerta
           const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
           audio.play().catch(() => {});

           // Notificação do sistema
           if ('Notification' in window && Notification.permission === 'granted') {
             new Notification('🛵 Novo Pedido!', {
               body: `${novoPedido.observacoes?.split('|')[0]?.replace('Cliente: ', '') || 'Novo pedido'} - R$ ${parseFloat(novoPedido.total || 0).toFixed(2)}`,
               icon: '/vite.svg',
               tag: 'novo-pedido',
               requireInteraction: true,
             });
           }
         }
       )
       .subscribe();

     // Solicitar permissão de notificação
     if ('Notification' in window && Notification.permission === 'default') {
       Notification.requestPermission();
     }

     return () => {
       supabase.removeChannel(channel);
     };
   }, [lojaData?.id]);

   async function handleTogglePromoted(productId: string, currentStatus: string) {
      if (currentStatus === 'approved') {
         // Se já está aprovado, lojista pode remover (opcional)
         if (!confirm("Deseja remover o destaque deste produto?")) return;
         try {
            await supabase.from('produtos').update({ promotion_status: 'none' }).eq('id', productId);
            setProdutos(produtos.map(p => p.id === productId ? { ...p, promotion_status: 'none' } : p));
         } catch (e) { alert("Erro ao remover destaque."); }
         return;
      }

      // Se não está aprovado, abre o Checkout de Ads
      const product = produtos.find(p => p.id === productId);
      if (product) {
         setAdsTarget({ id: productId, type: 'produto', nome: product.nome });
         setSelectedAdsPlan(ADS_PLANS[1]); // Padrão 7 dias
         setShowAdsModal(true);
      }
   }

   async function handleConfirmAdsPayment() {
      if (!adsTarget || !selectedAdsPlan) return;
      
      try {
         setIsAdsProcessing(true);
         
         const table = adsTarget.type === 'produto' ? 'produtos' : 'lojas';
         const column = adsTarget.type === 'produto' ? 'promotion_status' : 'featured_status';

         const { error } = await supabase
            .from(table)
            .update({ [column]: 'pending' })
            .eq('id', adsTarget.id);
         
         if (error) throw error;

         // Registrar Histórico de Pagamento de Ads
         await supabase.from('ads_pagamentos').insert([{
            loja_id: lojaData.id,
            item_id: adsTarget.id,
            tipo: adsTarget.type,
            item_nome: adsTarget.nome,
            plano_nome: selectedAdsPlan.nome,
            valor: selectedAdsPlan.preco,
            dias: selectedAdsPlan.dias,
            status: 'pendente'
         }]);

         if (adsTarget.type === 'produto') {
            setProdutos(produtos.map(p => p.id === adsTarget.id ? { ...p, promotion_status: 'pending' } : p));
         } else {
            setLojaData({ ...lojaData, featured_status: 'pending' });
         }

         setShowAdsModal(false);
         alert("Pagamento PIX registrado! Sua solicitação está em análise pelo Administrador.");
      } catch (err: any) {
         alert("Erro ao registrar solicitação: " + err.message);
      } finally {
         setIsAdsProcessing(false);
      }
   }

  async function handleMarkPrizeDelivered(prizeId: string) {
     try {
        const { error } = await supabase
           .from('premios_ganhos')
           .update({ status: 'entregue' })
           .eq('id', prizeId);
        
        if (error) throw error;
        
        setGanhadores(ganhadores.map(g => g.id === prizeId ? { ...g, status: 'entregue' } : g));
        alert("Prêmio marcado como entregue ao cliente!");
     } catch (err) {
        alert("Erro ao atualizar status do prêmio.");
     }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `produtos/${lojaData.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('produtos')
        .getPublicUrl(filePath);

      if (file.type.startsWith('video')) {
        setNewProduct(prev => ({ ...prev, video_url: publicUrl }));
      } else {
        setNewProduct(prev => {
          if (!prev.imagem_url) {
            return { ...prev, imagem_url: publicUrl };
          } else {
            return { ...prev, galeria: [...(prev.galeria || []), publicUrl] };
          }
        });
      }
      alert('Upload concluído!');
    } catch (error: any) {
      console.error('Erro no upload:', error.message);
      alert('Erro ao subir imagem. Verifique se o bucket "produtos" existe no Supabase.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      const allImages = [newProduct.imagem_url, ...(newProduct.galeria || [])].filter(Boolean);
      const combinedImageUrl = allImages.length > 0 ? allImages.join(',') : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

      const productPayload: any = {
        nome: newProduct.nome,
        preco: parseFloat(newProduct.preco),
        descricao: newProduct.descricao,
        categoria: newProduct.categoria,
        subcategoria: newProduct.subcategoria,
        estoque: parseInt(newProduct.estoque),
        imagem_url: combinedImageUrl,
        video_url: newProduct.video_url,
        loja_id: lojaData.id,
        variacoes: newProduct.variacoes
      };

      if (newProduct.preco_promocional) {
        productPayload.preco_promocional = parseFloat(newProduct.preco_promocional);
        productPayload.promocao_ativa = true;
        if (newProduct.promocao_data_fim) {
          productPayload.promocao_data_fim = newProduct.promocao_data_fim;
        }
      }
      if (newProduct.premio_nome) {
        productPayload.premio_nome = newProduct.premio_nome;
      }

      let finalProductId = editingProduct?.id;

      if (editingProduct) {
        const { error } = await supabase
          .from('produtos')
          .update(productPayload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('produtos')
          .insert([productPayload])
          .select();
        if (error) throw error;
        finalProductId = data[0].id;
      }

      // Salvar Variações na tabela dedicada
      if (finalProductId) {
         // 1. Limpar variações antigas (se for edição)
         await supabase.from('produto_variacoes').delete().eq('produto_id', finalProductId);

         // 2. Inserir novas variações
         if (newProduct.variacoes && newProduct.variacoes.length > 0) {
            const variacoesPayload = newProduct.variacoes
               .filter(v => v.nome && v.opcoes)
               .map(v => ({
                  produto_id: finalProductId,
                  nome: v.nome,
                  opcoes: v.opcoes
               }));
            
            if (variacoesPayload.length > 0) {
               await supabase.from('produto_variacoes').insert(variacoesPayload);
            }
         }
      }

      setShowProductModal(false);
      setEditingProduct(null);
      setNewProduct({
        nome: '',
        preco: '',
        descricao: '',
        categoria: '',
        subcategoria: '',
        estoque: '0',
        imagem_url: '',
        video_url: '',
        variacoes: [],
        preco_promocional: '',
        promocao_ativa: false,
        promocao_data_fim: '',
        premio_nome: '',
        galeria: []
      });
      alert('Produto salvo com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto: ' + (error.message || 'Erro desconhecido'));
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      alert('Erro ao excluir produto');
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    try {
      const { data: currentOrder } = await supabase.from('pedidos').select('*').eq('id', id).single();

      const { error } = await supabase
        .from('pedidos')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      
      // Lógica de Cashback ao entregar
      if (status === 'entregue' && currentOrder) {
         await awardCashback(currentOrder.cliente_id, currentOrder.id, currentOrder.total);
      }

    } catch (error) {
      alert('Erro ao atualizar status');
    }
  }

  async function awardCashback(profileId: string, orderId: string, orderTotal: number) {
     const cashbackPercent = 0.05; // 5% de cashback padrão
     const cashbackAmount = orderTotal * cashbackPercent;

     // 1. Atualizar saldo do perfil
     const { data: profile } = await supabase.from('profiles').select('saldo_cashback').eq('id', profileId).single();
     const novoSaldo = (profile?.saldo_cashback || 0) + cashbackAmount;
     
     await supabase.from('profiles').update({ saldo_cashback: novoSaldo }).eq('id', profileId);

     // 2. Registrar no histórico
     await supabase.from('cashback_historico').insert({
        profile_id: profileId,
        pedido_id: orderId,
        valor: cashbackAmount,
        tipo: 'ganho'
     });
  }

  const handleSolicitarEntregador = async (pedido: Order) => {
    try {
      const callPayload = {
        id: pedido.id,
        cliente: pedido.profiles?.nome,
        destino: pedido.endereco_entrega,
        valor: pedido.total,
        loja: lojaData.nome,
        lojaLat: lojaData.lat || -23.5505,
        lojaLng: lojaData.lng || -46.6333,
        lat: pedido.geolocalizacao_cliente?.lat || -23.555,
        lng: pedido.geolocalizacao_cliente?.lng || -46.660
      };

      // Notificar Admin/Central Logística via LocalStorage (Coordenação entre abas)
      localStorage.setItem('capelgo_merchant_call', JSON.stringify(callPayload));
      window.dispatchEvent(new Event('storage'));

      // ✅ CORRIGIDO: Muda para 'aguardando_entregador' para que o pedido continue
      // visível no Despacho Inteligente do Admin (não vai direto para 'saiu_para_entrega')
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'aguardando_entregador' })
        .eq('id', pedido.id);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Erro ao solicitar entregador:', error);
      alert('Erro ao solicitar entregador.');
    }
  };

  async function handleUpdateMarketing() {
    try {
      console.log('📦 Salvando Marketing:', {
        id: lojaData.id,
        ativa: lojaData.recompensa_review_ativa,
        valor: lojaData.recompensa_valor,
        tipo: lojaData.recompensa_tipo
      });

      const { error } = await supabase
        .from('lojas')
        .update({
          recompensa_review_ativa: lojaData.recompensa_review_ativa,
          recompensa_valor: lojaData.recompensa_valor,
          recompensa_tipo: lojaData.recompensa_tipo
        })
        .eq('id', lojaData.id);
      
      if (error) {
        console.error('❌ Erro Supabase Marketing:', error);
        throw error;
      }
      
      console.log('✅ Marketing salvo com sucesso!');
      await loadStoreData();
      alert('Configurações de marketing atualizadas!');
    } catch (error: any) {
      alert('Erro ao atualizar marketing: ' + (error.message || 'Erro de permissão'));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-shopee-orange"></div>
      </div>
    );
  }

  if (!lojaData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-800">Loja não encontrada</h1>
        <p className="text-gray-500 text-center mt-2">Você ainda não possui uma loja vinculada ao seu perfil.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-6 bg-shopee-orange text-white px-6 py-2 rounded-full font-bold shadow-lg"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  const getSalesForDays = (days: number) => {
    const daysArr = [];
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    for (let i = days - 1; i >= 0; i--) {
       const d = new Date(now);
       d.setDate(d.getDate() - i);
       d.setHours(0,0,0,0);
       
       const endD = new Date(d);
       endD.setHours(23, 59, 59, 999);
       
       const dailyTotal = pedidos
         .filter(p => {
           if (p.status === 'cancelado' || !p.created_at) return false;
           const orderDate = new Date(p.created_at);
           return orderDate >= d && orderDate <= endD;
         })
         .reduce((acc, p) => acc + (parseFloat(p.total) || parseFloat(p.valor_total) || 0), 0);
         
       daysArr.push({
         label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
         value: dailyTotal
       });
    }
    
    const maxVal = Math.max(...daysArr.map(d => d.value), 1);
    
    return daysArr.map(d => ({
       ...d,
       height: Math.max((d.value / maxVal) * 100, 5)
    }));
  };

  // ==========================================
  // 🔄 MÉTODOS DE DEVOLUÇÕES E REEMBOLSOS
  // ==========================================

  // Filtro de solicitações de devolução
  const filtrarDevolucoes = () => {
    return devolucoes.filter(d => {
      // Filtro de SubTab
      if (subTabDev === 'pendente' && d.status_solicitacao !== 'pendente') return false;
      if (subTabDev === 'em_devolucao' && d.status_solicitacao !== 'em_devolucao') return false;
      if (subTabDev === 'aprovada' && d.status_solicitacao !== 'aprovada' && d.status_solicitacao !== 'reembolso_pago') return false;
      if (subTabDev === 'recusada' && d.status_solicitacao !== 'recusada') return false;

      // Date filter
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - devolucaoFilterDays);
      if (new Date(d.created_at) < cutoff) return false;

      // Filtro de Pesquisa
      if (searchDev) {
        const query = searchDev.toLowerCase();
        const matchesId = d.solicitacao_id?.toLowerCase().includes(query) || d.id?.toLowerCase().includes(query) || d.pedido_id?.toLowerCase().includes(query);
        const matchesClient = d.profiles?.nome?.toLowerCase().includes(query) || d.cliente_id?.toLowerCase().includes(query);
        const matchesProdName = d.produtos?.some((p: any) => p.nome?.toLowerCase().includes(query));
        return matchesId || matchesClient || matchesProdName;
      }

      return true;
    });
  };

  // Cores dos badges de status estilo Shopee
  const renderStatusSolicitacaoBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider">Em análise pelo lojista</span>;
      case 'em_devolucao':
        return <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-[10px] font-black uppercase tracking-wider">Em devolução</span>;
      case 'reembolso_pago':
      case 'aprovada':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">Reembolso Pago</span>;
      case 'recusada':
        return <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-wider">Recusada</span>;
      case 'cancelada':
        return <span className="px-3 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full text-[10px] font-black uppercase tracking-wider">Cancelado</span>;
      default:
        return <span className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  const renderStatusEntregaBadge = (status: string) => {
    switch (status) {
      case 'nao_iniciado':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-wider">Não Iniciado</span>;
      case 'coleta_agendada':
        return <span className="px-2.5 py-1 bg-cyan-50 text-cyan-600 border border-cyan-150 rounded-full text-[10px] font-bold uppercase tracking-wider">Retirada pelo Comprador</span>;
      case 'em_transito':
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-150 rounded-full text-[10px] font-bold uppercase tracking-wider">Em Trânsito</span>;
      case 'entregue':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-full text-[10px] font-bold uppercase tracking-wider">Entregue</span>;
      case 'cancelado':
        return <span className="px-2.5 py-1 bg-red-50 text-red-500 border border-red-100 rounded-full text-[10px] font-bold uppercase tracking-wider">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  // Aprovar ou Recusar Devolução
  const handleDecisaoDevolucao = async (devolucaoId: string, decisao: 'aprovada' | 'recusada') => {
    try {
      setLoading(true);
      const ok = window.confirm(`Deseja realmente marcar esta devolução como ${decisao === 'aprovada' ? 'APROVADA' : 'RECUSADA'}?`);
      if (!ok) return;

      // Chama a RPC processar_financeiro_devolucao no Supabase
      const { error } = await supabase.rpc('processar_financeiro_devolucao', {
        p_devolucao_id: devolucaoId,
        p_decisao: decisao
      });

      if (error) {
        console.warn('Erro ao chamar a RPC processar_financeiro_devolucao, usando fallback:', error);
        
        // Fallback local caso a migração de RPC ainda não esteja rodada no Supabase
        const newStatus = decisao === 'aprovada' ? 'reembolso_pago' : 'recusada';
        const newEntrega = decisao === 'aprovada' ? 'entregue' : 'cancelado';
        
        const { error: fallbackError } = await supabase
          .from('devolucoes')
          .update({
            status_solicitacao: newStatus,
            status_entrega: newEntrega,
            updated_at: new Date().toISOString()
          })
          .eq('id', devolucaoId);
          
        if (fallbackError) throw fallbackError;
      }

      alert(`Solicitação de devolução ${decisao === 'aprovada' ? 'aprovada com reembolso pago' : 'recusada e enviada para disputa'} com sucesso!`);
      await loadStoreData();
    } catch (e: any) {
      alert('Erro ao processar devolução: ' + (e.message || JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  };



  const handlePrintDocuments = () => {
     if (selectedMassOrders.length === 0) {
        alert("Selecione pelo menos um pedido para gerar os documentos.");
        return;
     }

     const pedidosParaImprimir = pedidos.filter(p => selectedMassOrders.includes(p.id));

     const printWindow = window.open('', '_blank');
     if (!printWindow) return;

     let htmlContent = `
       <html>
         <head>
           <title>Documentos de Envio - CapelGo</title>
           <style>
             body { font-family: monospace; padding: 20px; }
             .etiqueta { border: 2px dashed #000; padding: 20px; margin-bottom: 20px; width: 300px; page-break-after: always; }
             .lista { border: 1px solid #000; padding: 20px; margin-bottom: 20px; }
             table { width: 100%; border-collapse: collapse; margin-top: 10px; }
             th, td { border: 1px solid #000; padding: 5px; text-align: left; }
             @media print { button { display: none; } }
           </style>
         </head>
         <body>
           <button onclick="window.print()" style="padding: 10px 20px; margin-bottom: 20px; cursor: pointer;">Imprimir Agora</button>
     `;

     pedidosParaImprimir.forEach(p => {
        if (docConfig.tipoDocumento === 'etiqueta_e_lista' || docConfig.tipoDocumento === 'apenas_etiqueta') {
           const logoHtml = plataformaLogo
              ? `<img src="${plataformaLogo}" style="max-height: 40px; border-radius: 4px;" alt="Logo" />`
              : `<div style="background-color: #ee4d2d; color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: 900; font-family: sans-serif; font-size: 20px; font-style: italic;">C</div><h2 style="margin: 0; font-size: 24px; font-weight: 900; font-family: sans-serif; font-style: italic;">CapelGo</h2>`;
           htmlContent += `
             <div class="etiqueta">
               <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                 ${logoHtml}
               </div>
               <p style="margin: 5px 0;"><strong>Pedido:</strong> #${p.id}</p>
               <p style="margin: 5px 0;"><strong>Destinatário:</strong> ${p.profiles?.nome || 'Cliente'}</p>
               <p style="margin: 5px 0;"><strong>Endereço:</strong> ${p.endereco_entrega || 'Endereço não informado'}</p>
               <p style="margin: 5px 0;"><strong>Remetente:</strong> ${lojaData?.nome || 'Sua Loja'}</p>
               <div style="text-align: center; margin-top: 20px; padding: 15px 5px; border: 1px solid #000; border-radius: 8px;">
                  <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${p.id}&scale=2&height=10&includetext" alt="Código de Barras" style="max-width: 100%; height: auto; max-height: 60px; display: block; margin: 0 auto;"/>
               </div>
             </div>
           `;
        }

        if (docConfig.tipoDocumento === 'etiqueta_e_lista' || docConfig.tipoDocumento === 'apenas_lista' || docConfig.tipoDocumento === 'lista_produtos') {
           htmlContent += `
             <div class="lista">
               <h2>Lista de Empacotamento - Pedido #${p.id}</h2>
               <p><strong>Cliente:</strong> ${p.profiles?.nome || 'Cliente'}</p>
               <table>
                  <tr><th>Produto</th><th>Qtd</th></tr>
                  ${(p.itens || []).map((item: any) => `<tr><td>${item.nome}</td><td>${item.qtd}</td></tr>`).join('')}
               </table>
             </div>
           `;
        }
     });

     htmlContent += `
         </body>
       </html>
     `;

     printWindow.document.write(htmlContent);
     printWindow.document.close();
  };

  const salesData = getSalesForDays(vendasFilterDays);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-shopee-orange rounded-lg flex items-center justify-center text-white font-bold text-xl">
            C
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-tight">CapelGo</h1>
            <span className="text-[10px] text-shopee-orange font-bold uppercase tracking-wider">Merchant Central</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'inicio'} 
            onClick={() => setActiveTab('inicio')} 
          />
          <SidebarLink 
            icon={<ShoppingBag size={20} />} 
            label="Vendas" 
            active={activeTab === 'pedidos'} 
            onClick={() => setActiveTab('pedidos')} 
          />
          <SidebarLink 
            icon={<Printer size={20} />} 
            label="Envio em Massa" 
            active={activeTab === 'envio_massa'} 
            onClick={() => setActiveTab('envio_massa')} 
          />
          <SidebarLink 
            icon={<DollarSign size={20} />} 
            label="Relatórios" 
            active={activeTab === 'relatorios'} 
            onClick={() => setActiveTab('relatorios')} 
          />
          <SidebarLink 
            icon={<Wallet size={20} />} 
            label="Minha Carteira" 
            active={activeTab === 'carteira'} 
            onClick={() => setActiveTab('carteira')} 
          />
          <SidebarLink 
            icon={<MessageCircle size={20} />} 
            label="Chat com Clientes" 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')} 
          />
          <SidebarLink 
            icon={<Package size={20} />} 
            label="Meus Produtos" 
            active={activeTab === 'produtos'} 
            onClick={() => setActiveTab('produtos')} 
          />
          <SidebarLink 
            icon={<TrendingUp size={20} />} 
            label="Crescimento" 
            active={activeTab === 'crescimento'} 
            onClick={() => setActiveTab('crescimento')} 
          />
          <SidebarLink 
            icon={<Gift size={20} />} 
            label="Marketing" 
            active={activeTab === 'marketing'} 
            onClick={() => setActiveTab('marketing')} 
          />
          <SidebarLink 
            icon={<MessageSquare size={20} />} 
            label="Feedbacks" 
            active={activeTab === 'feedback'} 
            onClick={() => setActiveTab('feedback')} 
          />
          <SidebarLink 
            icon={<RefreshCw size={20} />} 
            label="Devoluções" 
            active={activeTab === 'devolucoes'} 
            onClick={() => setActiveTab('devolucoes')} 
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={async () => {
              try { await supabase.auth.signOut(); } 
              catch(e) { console.error(e); } 
              finally { localStorage.clear(); window.location.href = '/login'; }
            }}
            className="flex items-center gap-3 text-gray-500 hover:text-red-500 transition-colors w-full p-3 rounded-lg hover:bg-red-50"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-shopee-orange rounded-lg flex items-center justify-center text-white font-bold">C</div>
                  <h1 className="font-bold text-gray-800">CapelGo</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400"><X size={20}/></button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                <SidebarLink icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeTab === 'inicio'} onClick={() => { setActiveTab('inicio'); setIsMobileMenuOpen(false); }} />
                <SidebarLink icon={<ShoppingBag size={20}/>} label="Vendas" active={activeTab === 'pedidos'} onClick={() => { setActiveTab('pedidos'); setIsMobileMenuOpen(false); }} />
                <SidebarLink icon={<Printer size={20}/>} label="Envio em Massa" active={activeTab === 'envio_massa'} onClick={() => { setActiveTab('envio_massa'); setIsMobileMenuOpen(false); }} />
                <SidebarLink icon={<MessageCircle size={20}/>} label="Chat com Clientes" active={activeTab === 'chat'} onClick={() => { setActiveTab('chat'); setIsMobileMenuOpen(false); }} />
                <SidebarLink icon={<DollarSign size={20}/>} label="Relatórios" active={activeTab === 'relatorios'} onClick={() => { setActiveTab('relatorios'); setIsMobileMenuOpen(false); }} />
                <SidebarLink icon={<Package size={20}/>} label="Meus Produtos" active={activeTab === 'produtos'} onClick={() => { setActiveTab('produtos'); setIsMobileMenuOpen(false); }} />
                <SidebarLink icon={<TrendingUp size={20}/>} label="Crescimento" active={activeTab === 'crescimento'} onClick={() => { setActiveTab('crescimento'); setIsMobileMenuOpen(false); }} />
                <SidebarLink icon={<Gift size={20}/>} label="Marketing" active={activeTab === 'marketing'} onClick={() => { setActiveTab('marketing'); setIsMobileMenuOpen(false); }} />
                <SidebarLink icon={<MessageSquare size={20}/>} label="Feedbacks" active={activeTab === 'feedback'} onClick={() => { setActiveTab('feedback'); setIsMobileMenuOpen(false); }} />
                <SidebarLink icon={<RefreshCw size={20}/>} label="Devoluções" active={activeTab === 'devolucoes'} onClick={() => { setActiveTab('devolucoes'); setIsMobileMenuOpen(false); }} />
              </nav>
              <div className="p-4 border-t border-gray-100 mt-auto">
                <button 
                  onClick={async () => {
                    try { await supabase.auth.signOut(); } 
                    catch(e) { console.error(e); } 
                    finally { localStorage.clear(); window.location.href = '/login'; }
                  }}
                  className="flex items-center gap-3 text-gray-500 hover:text-red-500 transition-colors w-full p-3 rounded-lg hover:bg-red-50"
                >
                  <LogOut size={20} />
                  <span className="font-medium text-sm">Sair da Conta</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LayoutDashboard size={24} />
            </button>
            <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-4">
              <h2 className="font-black text-gray-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
                {activeTab === 'produtos' && <><Package size={14}/> PRODUTOS</>}
                {activeTab === 'pedidos' && <><ShoppingBag size={14}/> VENDAS</>}
                {activeTab === 'envio_massa' && <><Printer size={14}/> ENVIO EM MASSA</>}
                {activeTab === 'chat' && <><MessageCircle size={14}/> CHAT COM CLIENTES</>}
                
                {/* ESTADO: SEM LOJA VINCULADA */}
             {!lojaData?.id && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col items-center justify-center py-20 text-center"
               >
                 <div className="w-24 h-24 bg-orange-50 text-shopee-orange rounded-full flex items-center justify-center mb-6">
                    <Store size={48} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-800 mb-2">Sua Loja ainda não está pronta!</h2>
                 <p className="text-slate-500 max-w-sm mb-8 text-sm">
                   Seu perfil já está como <b>Lojista</b>, mas ainda não vinculamos uma loja ao seu usuário.
                   Entre em contato com o administrador para finalizar seu cadastro.
                 </p>
                 <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                   ID do seu Perfil: {currentUserProfile?.id || 'Carregando...'}
                 </div>
               </motion.div>
             )}

             {lojaData?.id && activeTab === 'inicio' && (<><LayoutDashboard size={14}/> DASHBOARD</>)}
                {activeTab === 'crescimento' && <><TrendingUp size={14}/> CENTRAL DE CRESCIMENTO</>}
                {activeTab === 'relatorios' && <><DollarSign size={14}/> RELATÓRIOS FINANCEIROS</>}
                {activeTab === 'marketing' && <><Gift size={14}/> MARKETING</>}
                {activeTab === 'feedback' && <><MessageSquare size={14}/> FEEDBACKS</>}
                {activeTab === 'devolucoes' && <><RefreshCw size={14}/> DEVOLUÇÕES E REEMBOLSOS</>}
              </h2>
              <button 
                onClick={loadStoreData}
                className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-50 text-[9px] font-black uppercase text-gray-500 rounded-full border border-gray-200 hover:bg-shopee-orange/5 hover:text-shopee-orange hover:border-shopee-orange/20 transition-all"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                Sincronizar
              </button>
              <button
                onClick={async () => {
                  const newStatus = !isOnline;
                  setIsOnline(newStatus);
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await supabase.from('profiles').update({ online: newStatus }).eq('id', user.id);
                  }
                }}
                className={`hidden sm:flex items-center gap-2 px-3 py-1 text-[9px] font-black uppercase rounded-full border transition-all ${isOnline ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
          </div>
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 hover:opacity-85 active:scale-95 transition-all text-left"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-gray-800 uppercase leading-none">{lojaData.nome}</p>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mt-1">Lojista Central</span>
            </div>
            <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black shadow-lg relative">
              {(lojaData.nome || 'AD').substring(0, 2).toUpperCase()}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </button>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'relatorios' && (
              <motion.div 
                key="relatorios"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <FinancialReports pedidos={pedidos} produtos={produtos} />
              </motion.div>
            )}

            {activeTab === 'inicio' && (
              <motion.div 
                key="inicio"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                 {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                  <StatCard 
                    title="Receita Líquida" 
                    value={`R$ ${pedidos.filter(p => p.status !== 'cancelado').reduce((acc, curr) => acc + (curr.repasse_lojista_valor || (curr.total * 0.9)), 0).toFixed(2)}`} 
                    icon={<DollarSign className="text-green-600" />} 
                    color="bg-green-50" 
                  />
                  <StatCard 
                    title="Vendas" 
                    value={pedidos.filter(p => p.status !== 'cancelado').length.toString()} 
                    icon={<ShoppingBag className="text-purple-600" />} 
                    color="bg-purple-50" 
                  />
                  <StatCard 
                    title="Avaliação" 
                    value={reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.nota, 0) / reviews.length).toFixed(1) : '5.0'} 
                    icon={<Star className="text-yellow-600" fill="currentColor" />} 
                    color="bg-yellow-50" 
                  />
                  <StatCard 
                    title="Brindes Ganhos" 
                    value={ganhadores.length.toString()} 
                    icon={<Gift className="text-[#EE4D2D]" />} 
                    color="bg-orange-50" 
                  />
                  <StatCard 
                    title="Produtos" 
                    value={produtos.length.toString()} 
                    icon={<Package className="text-blue-600" />} 
                    color="bg-blue-50" 
                  />
                </div>

                {/* Performance Chart & Marketing Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                       <h3 className="font-bold text-gray-800 text-sm sm:text-base">Performance de Vendas</h3>
                       <DateFilterBar selectedDays={vendasFilterDays} onChange={setVendasFilterDays} />
                    </div>
                    <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 relative">
                       {/* Gráfico Dinâmico */}
                       <div className="flex items-end justify-center gap-2 sm:gap-3 h-32 mb-4 w-full px-2 sm:px-4">
                          {salesData.map((data, i) => (
                             <div key={i} className="flex flex-col items-center justify-end gap-1.5 h-full">
                               <motion.div 
                                 initial={{ height: 0 }}
                                 animate={{ height: `${data.height}%` }}
                                 className="w-6 sm:w-8 bg-shopee-orange/40 rounded-t-sm relative group cursor-pointer hover:bg-shopee-orange transition-colors"
                               >
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                     R$ {data.value.toFixed(2)}
                                  </div>
                               </motion.div>
                               <span className="text-[8px] font-bold text-gray-400">{data.label}</span>
                             </div>
                          ))}
                       </div>
                       <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-300">Vendas Diárias</p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Últimas Avaliações</h3>
                    <div className="space-y-4">
                      {reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-gray-700">{review.profiles?.nome}</span>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={10} fill={i < review.nota ? "#FFC107" : "none"} color={i < review.nota ? "#FFC107" : "#DDD"} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 italic line-clamp-2">"{review.comentario}"</p>
                        </div>
                      ))}
                      {reviews.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Sem avaliações recentes</p>}
                    </div>
                  </div>
                </div>

                {/* Lucky Wheel Activity Summary */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                   <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                         <Gift size={18} className="text-[#EE4D2D]" />
                         Atividade da Roleta
                      </h3>
                      <button onClick={() => setActiveTab('marketing')} className="text-[#EE4D2D] text-[9px] sm:text-[10px] font-black uppercase hover:underline text-left">Ver Central de Prêmios</button>
                   </div>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {ganhadores.slice(0, 4).map((ganhador, idx) => (
                         <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm border border-gray-50 shrink-0">
                               {ganhador.tipo === 'produto' ? '🎁' : ganhador.tipo === 'cupom' ? '🎟️' : '🚚'}
                            </div>
                            <div className="min-w-0">
                               <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Novo Ganhador!</p>
                               <p className="text-xs font-bold text-gray-800 truncate">
                                  {(ganhador.tipo || '').toUpperCase()}
                               </p>
                               <p className="text-[9px] text-gray-400">{new Date(ganhador.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                         </div>
                      ))}
                      {ganhadores.length === 0 && (
                         <div className="col-span-full py-8 text-center">
                            <p className="text-gray-400 text-sm italic">Nenhum prêmio distribuído ainda. Incentive seus clientes!</p>
                         </div>
                      )}
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'carteira' && (
              <motion.div 
                key="carteira"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <MerchantWallet pedidos={pedidos} lojaData={lojaData} />
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <MerchantChatPanel 
                  pedidos={pedidos} 
                  currentUserProfile={currentUserProfile} 
                  lojaData={lojaData} 
                  onNavigateToOrder={(orderId) => {
                    setActiveTab('pedidos');
                  }} 
                />
              </motion.div>
            )}

            {activeTab === 'crescimento' && (
              <motion.div 
                key="crescimento"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8 animate-in fade-in duration-500"
              >
                {/* Header Estratégico do Lojista */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                   <div>
                      <div className="flex items-center gap-3 mb-2">
                         <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Central de Crescimento</h2>
                         <div className="bg-shopee-orange text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-shopee-orange/20">Self-Service</div>
                      </div>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Ferramentas para turbinar sua visibilidade e vendas</p>
                   </div>
                </div>

                {/* Resumo de Performance Local */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                      <TrendingUp className="absolute top-4 right-4 text-shopee-orange opacity-20" size={80} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Interesse (Última Semana)</p>
                      <h3 className="text-3xl font-black tracking-tighter">{clickStats.length} Visualizações</h3>
                      <div className="mt-4 flex items-center gap-2 text-green-400 text-[10px] font-black uppercase">
                         <ArrowUpRight size={14} /> +8% cliques em anúncios
                      </div>
                   </div>

                   <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group hover:border-shopee-orange transition-all">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Engajamento com sua Loja</p>
                      <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{ganhadores.length} Clientes Premiados</h3>
                      <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Gift size={12} className="text-shopee-orange" /> Roleta da Sorte Ativa
                      </p>
                   </div>

                   <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Taxa de Conversão Local</p>
                      <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{(pedidos.length / (clickStats.length || 1) * 100).toFixed(1)}%</h3>
                      <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-green-500 w-[15%]" />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* GESTÃO DE DESTAQUES (Retail Media Self-Service) */}
                   <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm space-y-8">
                      <div className="flex justify-between items-center">
                         <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Produtos Patrocinados</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coloque seus melhores produtos no topo</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <button 
                               onClick={() => loadStoreData()}
                               className="p-3 bg-slate-100 text-slate-400 hover:text-shopee-orange rounded-2xl transition-all"
                               title="Sincronizar Dados"
                            >
                               <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                               <Zap size={24} />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                         {produtos.length > 0 ? produtos.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100 group">
                               <div className="flex items-center gap-4">
                                  <div className="w-14 aspect-square rounded-xl overflow-hidden bg-white shrink-0">
                                     <img src={p.imagem_url} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                     <p className="text-xs font-black text-slate-800 truncate max-w-[150px]">{p.nome}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase">R$ {p.preco.toFixed(2)}</p>
                                  </div>
                               </div>
                               <button 
                                 disabled={p.promotion_status === 'pending'}
                                 onClick={() => handleTogglePromoted(p.id, p.promotion_status || 'none')}
                                 className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase transition-all shadow-md ${
                                    p.promotion_status === 'approved'
                                      ? 'bg-shopee-orange text-white' 
                                      : p.promotion_status === 'pending'
                                      ? 'bg-yellow-400 text-slate-800'
                                      : 'bg-white text-slate-400 hover:text-shopee-orange'
                                 }`}
                               >
                                  {p.promotion_status === 'approved' ? '🚀 Patrocinado' : p.promotion_status === 'pending' ? '⏳ Pendente' : 'Solicitar Destaque'}
                                </button>
                            </div>
                         )) : (
                            <div className="py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                               <Package className="mx-auto text-slate-300 mb-2" size={32} />
                               <p className="text-xs text-slate-400 font-bold uppercase">Nenhum produto para impulsionar</p>
                            </div>
                         )}
                      </div>
                      
                      {/* Gestão de Destaque da Loja */}
                      <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[32px] text-white">
                         <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                               <Star size={18} className="text-yellow-400" fill="currentColor" />
                               <h4 className="text-sm font-black italic uppercase tracking-tighter">Selo Loja Destaque</h4>
                            </div>
                            <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${lojaData?.featured_status === 'approved' ? 'bg-green-500' : 'bg-white/10'}`}>
                               {lojaData?.featured_status === 'approved' ? 'Ativo' : lojaData?.featured_status === 'pending' ? 'Aguardando Admin' : 'Inativo'}
                            </div>
                         </div>
                         <p className="text-[10px] text-slate-400 mb-4 font-medium uppercase tracking-tight">Ganhe um selo de verificado e apareça no topo das buscas do bairro.</p>
                         <button 
                            onClick={() => {
                               if (lojaData.featured_status === 'approved') {
                                  if (!confirm("Deseja remover o selo de destaque da sua loja?")) return;
                                  supabase.from('lojas').update({ featured_status: 'none' }).eq('id', lojaData.id).then(() => {
                                     setLojaData({ ...lojaData, featured_status: 'none' });
                                  });
                               } else {
                                  setAdsTarget({ id: lojaData.id, type: 'loja', nome: lojaData.nome });
                                  setSelectedAdsPlan(ADS_PLANS[1]);
                                  setShowAdsModal(true);
                               }
                            }}
                            className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lojaData?.featured_status === 'approved' ? 'bg-red-500/20 text-red-400' : lojaData?.featured_status === 'pending' ? 'bg-yellow-400 text-slate-800' : 'bg-shopee-orange text-white shadow-lg shadow-shopee-orange/20'}`}
                         >
                            {lojaData?.featured_status === 'approved' ? 'Desativar Selo Destaque' : lojaData?.featured_status === 'pending' ? 'Solicitação em Análise' : 'Solicitar Selo Destaque'}
                         </button>
                      </div>

                      <div className="p-6 bg-slate-100 rounded-[32px] border border-slate-200">
                         <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle size={18} className="text-slate-400" />
                            <h4 className="text-sm font-black italic text-slate-600">Quer Banners na Home?</h4>
                         </div>
                         <p className="text-[10px] text-slate-500 mb-4 font-medium uppercase tracking-tight">A gestão de banners em destaque na página inicial é feita pelo Admin. Entre em contato para saber valores!</p>
                         <button className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400">
                            Falar com Suporte
                         </button>
                      </div>
                   </div>

                   {/* CONFIGURADOR DE ROLETA & HISTÓRICO DE PRÊMIOS */}
                   <div className="space-y-8">
                      {/* Widget Gerenciar Roleta */}
                      <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm">
                         <div className="flex justify-between items-center mb-8">
                            <div>
                               <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Sua Roleta</h3>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brindes e Cupons exclusivos</p>
                            </div>
                            <button 
                              onClick={() => {
                                setEditingPrizeId(null);
                                setPrizeStep('edit');
                                setShowPrizeModal(true);
                              }}
                              className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-lg"
                            >
                               <Plus size={24} />
                            </button>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {premiosAtivos.map(premio => (
                               <div key={premio.id} className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-between group">
                                  <div className="flex justify-between items-start mb-4">
                                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">
                                        {premio.tipo === 'produto' ? '🎁' : '🎟️'}
                                     </div>
                                     <button onClick={() => handleDeletePrize(premio.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={16} />
                                     </button>
                                  </div>
                                  <div>
                                     <p className="text-[11px] font-black text-slate-800 truncate">{premio.nome_custom || 'Prêmio de Inventário'}</p>
                                     <div className="flex justify-between items-center mt-2">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{premio.quantidade} Unid.</span>
                                        <span className="text-[9px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full">{premio.probabilidade}% Chance</span>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Histórico de Prêmios Local */}
                      <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm overflow-hidden relative">
                         <div className="flex justify-between items-center mb-8">
                            <div>
                               <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Últimos Ganhadores</h3>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resgates realizados na sua loja</p>
                            </div>
                            <History size={20} className="text-slate-300" />
                         </div>

                         <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {ganhadores.map((win: any) => (
                               <div key={win.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black">
                                        {(win.profiles?.nome || 'U').charAt(0).toUpperCase()}
                                     </div>
                                     <div>
                                        <p className="text-xs font-black text-slate-800">{win.profiles?.nome || 'Cliente'}</p>
                                        <p className="text-[9px] font-bold text-shopee-orange uppercase">{win.tipo}</p>
                                     </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                     <span className="text-[8px] text-slate-400 font-bold">{new Date(win.created_at).toLocaleDateString()}</span>
                                     {win.status === 'entregue' ? (
                                        <span className="flex items-center gap-1 text-[8px] font-black text-green-600 uppercase">
                                           <CheckCircle size={10} /> Entregue
                                        </span>
                                     ) : (
                                        <button 
                                          onClick={() => handleMarkPrizeDelivered(win.id)}
                                          className="px-3 py-1 bg-shopee-orange text-white rounded-lg text-[8px] font-black uppercase shadow-lg shadow-shopee-orange/20"
                                        >
                                           Marcar Entrega
                                        </button>
                                     )}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'pedidos' && (
              <motion.div 
                key="pedidos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg">Gerenciar Pedidos</h3>
                    <div className="flex gap-2">
                      <button className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">Exportar CSV</button>
                      <button className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-lg bg-shopee-orange text-white hover:bg-shopee-red transition-colors">Atualizar Tudo</button>
                    </div>
                  </div>
                  <DateFilterBar selectedDays={vendasFilterDays} onChange={setVendasFilterDays} />
                </div>
                
                {/* Desktop View: Standard Table */}
                <div className="hidden md:block overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                  <table className="w-full text-left min-w-[950px]">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">ID Pedido</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4 text-green-600">Líquido</th>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pedidos.filter(p => { const d = new Date(p.created_at); const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - vendasFilterDays); return d >= cutoff; }).map((pedido) => (
                        <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">#{pedido.id.slice(0, 8)}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-gray-800">{pedido.profiles?.nome}</div>
                            <div className="text-[10px] text-gray-400 mb-2">{pedido.profiles?.email}</div>
                            <div className="flex flex-col gap-2 max-w-[250px]">
                              {pedido.itens?.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                  <div className="relative shrink-0">
                                    <img 
                                      src={item.imagem || 'https://via.placeholder.com/40'} 
                                      alt={item.nome}
                                      className="w-10 h-10 rounded-md object-cover border border-white shadow-sm"
                                    />
                                    <span className="absolute -top-1 -right-1 bg-shopee-orange text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                                      {item.qtd}x
                                    </span>
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold text-gray-700 truncate">{item.nome}</span>
                                    {item.variacao && (
                                      <span className="text-[9px] text-shopee-orange font-medium bg-orange-50 px-1 rounded inline-block w-fit">
                                        {item.variacao}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                                                     <td className="px-6 py-4 font-bold text-sm text-gray-400">R$ {pedido.total.toFixed(2)}</td>
                           <td className="px-6 py-4 font-black text-sm text-green-600">R$ {(pedido.repasse_lojista_valor || (pedido.total * 0.9)).toFixed(2)}</td>

                          <td className="px-6 py-4 text-xs text-gray-500">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                              pedido.status === 'aguardando_pagamento' ? 'bg-red-100 text-red-600' :
                              pedido.status === 'pendente' ? 'bg-teal-100 text-teal-700' :
                              pedido.status === 'em_preparo' ? 'bg-blue-100 text-blue-600' :
                              pedido.status === 'saiu_para_entrega' ? 'bg-purple-100 text-purple-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {pedido.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              {(pedido.status === 'aguardando_pagamento') && (
                                <button 
                                  disabled
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg font-bold text-[9px] uppercase border border-gray-200 cursor-not-allowed"
                                  title="Aguardando Administrador confirmar o PIX"
                                >
                                  <AlertTriangle size={12} /> Aguardando Pix
                                </button>
                              )}
                              {(pedido.status === 'pendente' || pedido.status === 'pago') && (
                                <button 
                                  onClick={() => updateOrderStatus(pedido.id, 'em_preparo')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-shopee-orange rounded-lg font-bold text-[10px] uppercase border border-orange-100 hover:bg-orange-100 transition-all shadow-sm"
                                >
                                  <Clock size={12} /> Preparar
                                </button>
                              )}
                              {pedido.status === 'em_preparo' && (
                                <button 
                                  onClick={() => handleSolicitarEntregador(pedido)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                                >
                                  <Truck size={12} /> Solicitar Entregador
                                </button>
                              )}
                              {pedido.status === 'saiu_para_entrega' && (
                                <div className="flex flex-col gap-2">
                                  <span className="flex items-center gap-1 text-[10px] font-black text-purple-600 uppercase">
                                    <RefreshCw size={10} className="animate-spin" /> Entregador a Caminho
                                  </span>
                                  <button 
                                    onClick={() => updateOrderStatus(pedido.id, 'entregue')}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg font-bold text-[9px] uppercase shadow-md"
                                  >
                                    Confirmar Entrega Manual
                                  </button>
                                </div>
                              )}
                              {pedido.status !== 'entregue' && pedido.status !== 'em_preparo' && pedido.status !== 'pendente' && pedido.status !== 'aguardando_pagamento' && (
                                <button 
                                  onClick={() => updateOrderStatus(pedido.id, 'entregue')}
                                  className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Concluir"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {pedidos.filter(p => { const d = new Date(p.created_at); const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - vendasFilterDays); return d >= cutoff; }).length === 0 && (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                      <ShoppingBag className="mb-2 opacity-20" size={48} />
                      <p>Nenhum pedido recebido ainda.</p>
                    </div>
                  )}
                </div>

                {/* Mobile View: Shopee-style Card List */}
                <div className="md:hidden space-y-4 p-1 sm:p-2 bg-gray-50/30">
                  {pedidos.filter(p => { const d = new Date(p.created_at); const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - vendasFilterDays); return d >= cutoff; }).map((pedido) => (
                    <div key={pedido.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col p-4 space-y-3">
                      {/* Header: User avatar + name & status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-shopee-orange/10 flex items-center justify-center text-shopee-orange font-black text-[10px] uppercase">
                            {pedido.profiles?.nome?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-800 block leading-tight">{pedido.profiles?.nome}</span>
                            <span className="text-[8px] text-gray-400 font-medium block leading-none">{pedido.profiles?.email}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          pedido.status === 'aguardando_pagamento' ? 'bg-red-50 text-red-600' :
                          pedido.status === 'pendente' ? 'bg-teal-50 text-teal-700' :
                          pedido.status === 'em_preparo' ? 'bg-blue-50 text-blue-600' :
                          pedido.status === 'saiu_para_entrega' ? 'bg-purple-50 text-purple-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {pedido.status === 'aguardando_pagamento' ? 'Aguardando Pagamento' :
                           pedido.status === 'pendente' ? 'Pendente' :
                           pedido.status === 'em_preparo' ? 'Em Preparo' :
                           pedido.status === 'saiu_para_entrega' ? 'A Caminho' :
                           pedido.status === 'entregue' ? 'Concluído' :
                           pedido.status}
                        </span>
                      </div>

                      {/* Product list inside card */}
                      <div className="space-y-3 pt-2">
                        {pedido.itens?.map((item: any, idx: number) => (
                          <div key={idx} className="flex gap-3 items-start bg-slate-50/50 p-2 rounded-2xl border border-slate-100/50">
                            <div className="relative shrink-0 w-14 h-14 bg-white rounded-xl border border-slate-100 overflow-hidden">
                              <img 
                                src={item.imagem || 'https://via.placeholder.com/60'} 
                                alt={item.nome}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-snug">{item.nome}</h4>
                              {item.variacao && (
                                <span className="text-[8px] text-shopee-orange font-bold bg-orange-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                  {item.variacao}
                                </span>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-gray-400 font-bold block">x{item.qtd}</span>
                              <span className="text-[10px] font-black text-gray-800 block mt-1">R$ {(item.preco || (pedido.total / item.qtd)).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total counts and values */}
                      <div className="flex justify-between items-center py-2.5 border-t border-gray-50 text-[10px]">
                        <div className="text-gray-400 font-bold">
                          {pedido.itens?.length || 0} item(ns)
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500">Total: <strong className="text-xs font-black text-gray-700">R$ {pedido.total.toFixed(2)}</strong></span>
                          <span className="block text-[9px] text-green-600 font-bold">Líquido: R$ {(pedido.repasse_lojista_valor || (pedido.total * 0.9)).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Actions and Order ID */}
                      <div className="flex flex-col gap-3 pt-2.5 border-t border-gray-50">
                        <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-widest font-black">
                          <span>ID do pedido</span>
                          <span className="font-mono text-gray-500 font-bold">#{pedido.id.slice(0, 8)}</span>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          {(pedido.status === 'aguardando_pagamento') && (
                            <button 
                              disabled
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 text-gray-400 rounded-xl font-bold text-[9px] uppercase border border-gray-100 cursor-not-allowed"
                            >
                              <AlertTriangle size={12} /> Aguardando Pix
                            </button>
                          )}
                          {(pedido.status === 'pendente' || pedido.status === 'pago') && (
                            <button 
                              onClick={() => updateOrderStatus(pedido.id, 'em_preparo')}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-orange-50 text-shopee-orange rounded-xl font-bold text-[10px] uppercase border border-orange-100 hover:bg-orange-100 transition-all shadow-sm"
                            >
                              <Clock size={12} /> Preparar Pedido
                            </button>
                          )}
                          {pedido.status === 'em_preparo' && (
                            <button 
                              onClick={() => handleSolicitarEntregador(pedido)}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                            >
                              <Truck size={12} /> Solicitar Entregador
                            </button>
                          )}
                          {pedido.status === 'saiu_para_entrega' && (
                            <div className="w-full flex flex-col gap-2">
                              <span className="flex items-center justify-center gap-1 text-[10px] font-black text-purple-600 uppercase">
                                <RefreshCw size={10} className="animate-spin" /> Entregador a Caminho
                              </span>
                              <button 
                                onClick={() => updateOrderStatus(pedido.id, 'entregue')}
                                className="w-full py-2 bg-green-600 text-white rounded-xl font-bold text-[9px] uppercase shadow-md text-center"
                              >
                                Confirmar Entrega Manual
                              </button>
                            </div>
                          )}
                          {pedido.status !== 'entregue' && pedido.status !== 'em_preparo' && pedido.status !== 'pendente' && pedido.status !== 'aguardando_pagamento' && (
                            <button 
                              onClick={() => updateOrderStatus(pedido.id, 'entregue')}
                              className="w-full py-2 bg-green-600 text-white rounded-xl font-bold text-[10px] uppercase shadow-md text-center flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle size={14} /> Concluir Entrega
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {pedidos.filter(p => { const d = new Date(p.created_at); const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - vendasFilterDays); return d >= cutoff; }).length === 0 && (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                      <ShoppingBag className="mb-2 opacity-20" size={48} />
                      <p>Nenhum pedido recebido ainda.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'envio_massa' && (
              <motion.div 
                key="envio_massa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="flex justify-between items-end">
                   <div>
                      <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Envio em Massa</h2>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">Gestão de Impressão e Empacotamento</p>
                   </div>
                   <button className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                      <Files size={14} /> Organizar Tarefas
                   </button>
                </div>

                {/* Sub-Abas do Envio em Massa */}
                <div className="flex gap-6 border-b border-slate-200 mb-6">
                   <button 
                      onClick={() => setActiveMassShippingTab('pedidos')}
                      className={`pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeMassShippingTab === 'pedidos' ? 'text-shopee-orange border-shopee-orange' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                   >
                      Pedidos a Enviar
                   </button>
                   <button 
                      onClick={() => setActiveMassShippingTab('documentos')}
                      className={`pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeMassShippingTab === 'documentos' ? 'text-shopee-orange border-shopee-orange' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                   >
                      Gerar Documentos
                   </button>
                </div>

                {activeMassShippingTab === 'pedidos' && (
                   <div className="space-y-6">
                      {/* Filtros */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                         <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Status do Pedido</span>
                            <div className="flex gap-2">
                               <button className="px-4 py-2 border border-shopee-orange text-shopee-orange rounded-full text-[10px] font-black uppercase">Pendentes</button>
                               <button className="px-4 py-2 border border-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase hover:border-slate-300">Todos ({pedidos.length})</button>
                            </div>
                         </div>
                      </div>

                      {/* Tabela de Pedidos */}
                      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                         <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-800 tracking-tighter">{pedidos.length} Pedidos Recentes</h3>
                            <button 
                               onClick={() => {
                                  if (selectedMassOrders.length === pedidos.length) setSelectedMassOrders([]);
                                  else setSelectedMassOrders(pedidos.map(p => p.id));
                               }}
                               className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-shopee-orange transition-colors"
                            >
                               Selecionar Todos
                            </button>
                         </div>
                         <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                               <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                  <th className="p-6 w-12 text-center">Sel.</th>
                                  <th className="p-6">ID do Pedido</th>
                                  <th className="p-6">Comprador</th>
                                  <th className="p-6">Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               {pedidos.map(p => (
                                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                     <td className="p-6 text-center">
                                        <input 
                                           type="checkbox" 
                                           checked={selectedMassOrders.includes(p.id)}
                                           onChange={(e) => {
                                              if (e.target.checked) setSelectedMassOrders([...selectedMassOrders, p.id]);
                                              else setSelectedMassOrders(selectedMassOrders.filter(id => id !== p.id));
                                           }}
                                           className="w-4 h-4 text-shopee-orange rounded border-slate-300 focus:ring-shopee-orange cursor-pointer"
                                        />
                                     </td>
                                     <td className="p-6 text-xs font-black text-slate-800">{p.id.slice(0, 8)}</td>
                                     <td className="p-6 text-xs font-bold text-slate-600">{p.profiles?.nome || 'Cliente'}</td>
                                     <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                          p.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                                          p.status === 'em_preparo' ? 'bg-blue-100 text-blue-700' :
                                          'bg-slate-100 text-slate-500'
                                        }`}>
                                          {p.status}
                                        </span>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                         {pedidos.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-xs">Nenhum pedido para mostrar.</div>
                         )}
                      </div>
                   </div>
                )}

                {activeMassShippingTab === 'documentos' && (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Painel de Configuração */}
                      <div className="lg:col-span-2 bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-8">
                         <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tighter mb-2">Gerar Documentos de Envio</h3>
                            <p className="text-[10px] font-black text-shopee-orange uppercase tracking-widest">Selecione as encomendas para gerar os documentos de envio</p>
                         </div>
                         
                         <div className="space-y-4">
                            <label className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                               <input 
                                  type="radio" 
                                  name="tipoDoc" 
                                  checked={docConfig.tipoDocumento === 'lista_produtos'}
                                  onChange={() => setDocConfig({ ...docConfig, tipoDocumento: 'lista_produtos' })}
                                  className="mt-1 w-4 h-4 text-shopee-orange focus:ring-shopee-orange" 
                               />
                               <div>
                                  <p className="text-sm font-black text-slate-800">Lista de Produtos</p>
                               </div>
                            </label>
                            
                            <label className="flex items-start gap-4 p-4 border border-shopee-orange bg-orange-50/30 rounded-2xl cursor-pointer transition-colors">
                               <input 
                                  type="radio" 
                                  name="tipoDoc"
                                  checked={docConfig.tipoDocumento === 'etiqueta_e_lista'}
                                  onChange={() => setDocConfig({ ...docConfig, tipoDocumento: 'etiqueta_e_lista' })}
                                  className="mt-1 w-4 h-4 text-shopee-orange focus:ring-shopee-orange" 
                               />
                               <div className="flex-1">
                                  <p className="text-sm font-black text-slate-800 mb-3">Etiqueta de Envio e Lista de Empacotamento</p>
                                  <div className="flex gap-4">
                                     <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="formato1" checked={docConfig.formato === 'pdf'} onChange={() => setDocConfig({ ...docConfig, formato: 'pdf' })} className="w-3 h-3 text-shopee-orange" />
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">PDF</span>
                                     </label>
                                  </div>
                               </div>
                            </label>

                            <label className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                               <input 
                                  type="radio" 
                                  name="tipoDoc"
                                  checked={docConfig.tipoDocumento === 'apenas_etiqueta'}
                                  onChange={() => setDocConfig({ ...docConfig, tipoDocumento: 'apenas_etiqueta' })}
                                  className="mt-1 w-4 h-4 text-shopee-orange focus:ring-shopee-orange" 
                               />
                               <div className="flex-1">
                                  <p className="text-sm font-black text-slate-800 mb-3">Apenas a Etiqueta de Envio</p>
                               </div>
                            </label>
                         </div>
                      </div>

                      {/* Sidebar Resumo */}
                      <div className="space-y-6">
                         <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-orange-50 text-shopee-orange rounded-2xl flex items-center justify-center mb-4">
                               <Printer size={32} />
                            </div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Detalhes do Arquivo</h4>
                            <p className="text-[10px] font-bold text-slate-400 mb-6 px-4">
                               Você selecionou {selectedMassOrders.length} pedido(s) para imprimir {docConfig.tipoDocumento.replace(/_/g, ' ')}.
                            </p>
                            <button 
                               onClick={handlePrintDocuments}
                               className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-shopee-orange transition-all"
                            >
                               Gerar Documentos Selecionados
                            </button>
                         </div>
                      </div>
                   </div>
                )}
              </motion.div>
            )}

            {activeTab === 'produtos' && (
              <motion.div 
                key="produtos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="mb-3 md:mb-10 flex flex-col md:block">
                  <h1 className="text-lg md:text-5xl font-black text-slate-800 tracking-tight leading-none md:leading-tight">
                    <span className="md:hidden">Inventário Lojista</span>
                    <span className="hidden md:inline">Inventário<br/>Lojista</span>
                  </h1>
                  <p className="hidden md:block text-xs md:text-sm font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Visão Consolidada da sua Loja</p>
                </div>

                {/* Alerta de Estoque Baixo */}
                {produtos.some(p => p.estoque <= 5) && (
                   <div className="bg-red-50 border border-red-100 rounded-[32px] p-5 sm:p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 shrink-0">
                            <AlertTriangle size={24} />
                         </div>
                         <div>
                            <h3 className="text-base sm:text-lg font-black text-red-800">Atenção ao Estoque!</h3>
                            <p className="text-xs sm:text-sm text-red-600">Você tem {produtos.filter(p => p.estoque <= 5).length} produtos com estoque crítico.</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => {
                           // Filtrar a visualização ou rolar até os produtos
                           document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full sm:w-auto bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-200 text-center"
                      >
                         Ver Produtos
                      </button>
                   </div>
                )}

                <div className="flex items-center gap-2" id="product-grid">
                  <div className="relative flex-1 md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Buscar produto..." 
                      value={produtoSearch}
                      onChange={e => setProdutoSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-shopee-orange/20"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setEditingProduct(null);
                      setNewProduct({
                        nome: '',
                        preco: '',
                        descricao: '',
                        categoria: '',
                        estoque: '0',
                        imagem_url: '',
                        video_url: '',
                        variacoes: []
                      });
                      setShowProductModal(true);
                    }}
                    className="shrink-0 flex items-center gap-1 bg-shopee-orange text-white px-3 py-1.5 rounded-xl font-bold text-[11px] hover:bg-shopee-red transition-all shadow-md shadow-shopee-orange/20"
                  >
                    <Plus size={14} />
                    <span className="hidden sm:inline">Adicionar Produto</span>
                    <span className="sm:hidden">Adicionar</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={produtoCategoria}
                    onChange={e => setProdutoCategoria(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-shopee-orange/20"
                  >
                    <option value="">Todas Categorias</option>
                    {categorias.map(cat => (
                      <option key={cat.id || cat} value={cat.id || cat}>{cat.nome || cat}</option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    {['todos', 'promovidos', 'normais'].map(status => (
                      <button
                        key={status}
                        onClick={() => setProdutoStatus(status)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                          produtoStatus === status
                            ? 'bg-shopee-orange text-white shadow-sm shadow-shopee-orange/20'
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-shopee-orange/30'
                        }`}
                      >
                        {status === 'todos' ? 'Todos' : status === 'promovidos' ? 'Promovidos' : 'Normais'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {produtos
                    .filter(p => !produtoSearch || p.nome.toLowerCase().includes(produtoSearch.toLowerCase()))
                    .filter(p => !produtoCategoria || p.categoria === produtoCategoria)
                    .filter(p => {
                      if (produtoStatus === 'todos') return true;
                      if (produtoStatus === 'promovidos') return p.promocao_ativa === true;
                      if (produtoStatus === 'normais') return !p.promocao_ativa;
                      return true;
                    })
                    .map((produto) => (
                    <div key={produto.id} className="bg-white rounded-[32px] p-4 shadow-sm border border-slate-100 group hover:border-shopee-orange transition-all">
                      <div className="aspect-square bg-slate-50 rounded-[24px] mb-4 overflow-hidden relative">
                        <img 
                          src={produto.imagem_url} 
                          alt={produto.nome} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[8px] font-black uppercase shadow-sm">
                           {produto.categoria}
                        </div>
                        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingProduct(produto);
                              const imageUrls = produto.imagem_url ? produto.imagem_url.split(',') : [];
                              setNewProduct({
                                nome: produto.nome,
                                preco: produto.preco.toString(),
                                descricao: produto.descricao || '',
                                categoria: produto.categoria,
                                subcategoria: produto.subcategoria || '',
                                estoque: produto.estoque.toString(),
                                imagem_url: imageUrls[0] || '',
                                galeria: imageUrls.slice(1),
                                video_url: produto.video_url || '',
                                variacoes: produto.variacoes || [],
                                 preco_promocional: produto.preco_promocional?.toString() || '',
                                 promocao_ativa: produto.promocao_ativa || false,
                                 promocao_data_fim: produto.promocao_data_fim || '',
                                 premio_nome: produto.premio_nome || ''
                              });
                              setShowProductModal(true);
                            }}
                            className="p-2 bg-white text-blue-500 rounded-lg shadow-lg hover:bg-blue-50"
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(produto.id)}
                            className="p-2 bg-white text-red-500 rounded-lg shadow-lg hover:bg-red-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-black text-slate-800 truncate text-xs">{produto.nome}</h4>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            {produto.promocao_ativa && produto.preco_promocional ? (
                               <div className="flex flex-col">
                                  <span className="text-[10px] text-slate-400 line-through">R$ {produto.preco.toFixed(2)}</span>
                                  <span className="text-shopee-orange font-black text-sm">R$ {produto.preco_promocional.toFixed(2)}</span>
                               </div>
                            ) : (
                               <span className="text-shopee-orange font-black text-sm">R$ {produto.preco.toFixed(2)}</span>
                            )}
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${produto.estoque <= 5 ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                {produto.estoque <= 5 ? 'Crítico: ' : 'Estoque: '} {produto.estoque}
                            </span>
                          </div>
                          
                          {produto.premio_nome && (
                             <div className="bg-green-50 text-green-600 text-[8px] font-black uppercase px-2 py-1 rounded-lg border border-green-100 flex items-center gap-1">
                                <span>🎁 {produto.premio_nome}</span>
                             </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold bg-slate-50 p-2 rounded-xl">
                          <TrendingUp size={10} className="text-green-500" />
                          <span>{produto.vendas || 0} vendas realizadas</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {produtos.length === 0 && (
                  <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                    <Package className="w-16 h-16 text-gray-200 mb-4" />
                    <p className="text-gray-400 font-medium">Nenhum produto cadastrado.</p>
                    <button 
                      onClick={() => setShowProductModal(true)}
                      className="mt-4 text-shopee-orange font-bold hover:underline"
                    >
                      Começar agora
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'marketing' && (
              <motion.div 
                key="marketing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Cabeçalho da Central */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-gray-800 mb-2">Central de Marketing</h2>
                    <p className="text-sm text-gray-500">Aumente suas vendas e o engajamento dos seus clientes com nossas ferramentas.</p>
                  </div>
                  {marketingView !== 'grid' && (
                    <button 
                      onClick={() => setMarketingView('grid')}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
                    >
                      <ArrowLeft size={16} /> Voltar para Central
                    </button>
                  )}
                </div>

                {marketingView === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Card: Cupons */}
                    <div 
                      onClick={() => setMarketingView('cupons')}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-shopee-orange transition-all group cursor-pointer"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-shopee-orange group-hover:bg-shopee-orange group-hover:text-white transition-colors">
                          <Gift size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">Meus Cupons</h3>
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Aumente suas vendas</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">Crie cupons de desconto para sua loja e atraia mais compradores no checkout.</p>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        <span className="text-xs font-bold text-gray-400">Clique para gerenciar</span>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </div>

                    {/* Card: Descontos */}
                    <div 
                      onClick={() => setMarketingView('descontos')}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-shopee-orange transition-all group cursor-pointer"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                          <TrendingDown size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">Desconto de Produto</h3>
                          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Preço De/Por</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">Defina preços promocionais em seus produtos e exiba etiquetas de OFF para os clientes.</p>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        <span className="text-xs font-bold text-gray-400">Gerenciar agora</span>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </div>

                    {/* Card: Prêmios */}
                    <div 
                      onClick={() => setMarketingView('premios')}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-shopee-orange transition-all group cursor-pointer"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                          <Package size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">Prêmios (Brindes)</h3>
                          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Melhore o engajamento</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">Ofereça brindes em produtos específicos (ex: Compre fone, ganhe case).</p>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        <span className="text-xs font-bold text-gray-400">Ativar brindes</span>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </div>

                    {/* Card: Ofertas Relâmpago */}
                    <div 
                      onClick={() => setMarketingView('ofertas')}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-shopee-orange transition-all group cursor-pointer"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                          <Zap size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">Ofertas Relâmpago</h3>
                          <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Urgência e Conversão</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">Programe ofertas por tempo limitado com timer regressivo. Crie múltiplas ofertas agendadas.</p>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        <span className="text-xs font-bold text-gray-400">Agendar ofertas</span>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </div>
                  </div>
                )}

                {/* VISÃO: CUPONS */}
                {marketingView === 'cupons' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                     <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-6">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="font-bold text-gray-800 text-lg">Gerenciar Cupons</h3>
                           <button 
                             onClick={() => setShowCouponModal(true)}
                             className="bg-shopee-orange text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-shopee-orange/20"
                           >
                              + Criar Novo Cupom
                           </button>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                 <tr>
                                    <th className="px-6 py-4">Nome/Código</th>
                                    <th className="px-6 py-4">Valor</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Uso</th>
                                    <th className="px-6 py-4">Ação</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                 <tr className="text-sm">
                                    <td className="px-6 py-4"><span className="font-bold">BOASVINDAS5</span></td>
                                    <td className="px-6 py-4"><span className="text-shopee-orange font-bold">R$ 5,00</span></td>
                                    <td className="px-6 py-4"><span className="bg-green-50 text-green-600 px-2 py-1 rounded-lg text-[10px] font-bold">ATIVO</span></td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">0 / 100</td>
                                    <td className="px-6 py-4"><button className="text-blue-500 font-bold text-xs">Detalhes</button></td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
                )}

                {/* VISÃO: DESCONTOS */}
                {marketingView === 'descontos' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                     <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-800 text-lg mb-6">Meus Descontos de Produto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {produtos.slice(0, 9).map(p => (
                             <div key={p.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex gap-4 items-center">
                                <img src={p.imagem_url} className="w-12 h-12 rounded-lg object-cover" />
                                <div className="flex-1">
                                   <p className="text-xs font-bold text-gray-800 truncate">{p.nome}</p>
                                   <p className="text-[10px] text-gray-400">Normal: R$ {p.preco.toFixed(2)}</p>
                                   <button 
                                     onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                                     className="text-shopee-orange text-[10px] font-black uppercase mt-1"
                                   >
                                      Definir Promoção
                                   </button>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                )}

                {/* VISÃO: PRÊMIOS */}
                {marketingView === 'premios' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                     {/* Banner de Ativação */}
                     <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm text-center">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                           <Gift size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Gerenciador de Brindes</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">Ofereça prêmios e aumente o ticket médio da sua loja.</p>
                        <button 
                          onClick={() => setShowPrizeModal(true)}
                          className="bg-green-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-green-100 hover:scale-105 transition-all"
                        >
                           + Configurar Novo Prêmio
                        </button>
                     </div>

                     {/* Lista de Prêmios Ativos */}
                     <div className="mb-8">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Prêmios da Campanha Atual</h4>
                        {premiosAtivos.length > 0 ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {premiosAtivos.map((p, idx) => (
                                 <div 
                                   key={p.id || idx} 
                                   className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-shopee-orange transition-all cursor-pointer group"
                                   onClick={() => {
                                      setNewPrize({
                                        tipo: p.tipo,
                                        produto_id: p.produto_id || '',
                                        variacao: p.variacao || '',
                                        quantidade: p.quantidade.toString(),
                                        valor_minimo: p.valor_minimo.toString(),
                                        probabilidade: p.probabilidade.toString(),
                                        nome_custom: p.nome_custom || '',
                                        imagem_custom: p.imagem_custom || ''
                                      });
                                      setEditingPrizeId(p.id);
                                      setShowPrizeModal(true);
                                   }}
                                 >
                                    <div className="w-14 h-14 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-50">
                                       {p.tipo === 'produto' ? (
                                          <img src={produtos.find(prod => prod.id === p.produto_id)?.imagem_url} className="w-full h-full object-cover" />
                                       ) : p.tipo === 'customizado' ? (
                                          <img src={p.imagem_custom} className="w-full h-full object-cover" />
                                       ) : (
                                          <span className="text-2xl">{p.tipo === 'cupom' ? '🎟️' : '🚚'}</span>
                                       )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-xs font-bold text-gray-800 truncate">
                                          {p.tipo === 'produto' ? produtos.find(prod => prod.id === p.produto_id)?.nome : p.nome_custom || (p.tipo || '').toUpperCase()}
                                       </p>
                                       <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-black">{p.probabilidade}% de chance</span>
                                                                                     <span className={`text-[9px] font-bold ${p.quantidade < 3 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>Qtd: {p.quantidade} {p.quantidade < 3 && '(Repor!)'}</span>
                                       </div>
                                    </div>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePrize(p.id);
                                      }}
                                      className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                       <X size={16} />
                                    </button>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12 text-center">
                              <p className="text-sm text-gray-400 font-medium italic">Nenhum prêmio configurado ainda. Comece criando um!</p>
                           </div>
                        )}
                     </div>

                     {/* Central de Ganhadores */}
                     <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mt-8">
                        <div className="flex justify-between items-center mb-6">
                           <div>
                              <h4 className="font-bold text-gray-800 text-lg">Central de Ganhadores</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Histórico Real de Prêmios</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setVoucherInput('');
                                  setVoucherResult(null);
                                  setVoucherStatus('idle');
                                  setVoucherError('');
                                  setShowVoucherModal(true);
                                }}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black px-4 py-2.5 rounded-full transition-all uppercase tracking-widest shadow-lg shadow-purple-200"
                              >
                                <Camera size={12} />
                                Validar Voucher
                              </button>
                              <button 
                                 onClick={() => {
                                    if (lojaData?.id) fetchPremios(lojaData.id);
                                    else loadStoreData();
                                 }}
                                 className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-[10px] font-black text-gray-400 px-4 py-2 rounded-full border border-gray-100 transition-all uppercase tracking-widest"
                               >
                                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                                  Sincronizar
                               </button>
                           </div>
                        </div>

                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                 <tr>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Prêmio</th>
                                    <th className="px-6 py-4">Código</th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Status</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                 {ganhadores.length > 0 ? ganhadores.map((g) => (
                                    <tr key={g.id} className="text-sm">
                                       <td className="px-6 py-4">
                                          <div className="flex flex-col">
                                             <span className="font-bold text-gray-800">{g.profiles?.nome || 'Cliente'}</span>
                                             <span className="text-[10px] text-gray-400">{g.profiles?.email || g.cliente_id}</span>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                             <span className="text-xl">{g.tipo === 'produto' ? '🎁' : g.tipo === 'cupom' ? '🎟️' : '🚚'}</span>
                                             <span className="font-medium text-gray-600">
                                                {g.detalhes?.titulo || g.premios?.nome_custom || (g.tipo || '').toUpperCase()}
                                             </span>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4">
                                          <span className="font-mono text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                                            CGO-{g.id.substring(0,8).toUpperCase()}
                                          </span>
                                       </td>
                                       <td className="px-6 py-4 text-xs text-gray-400">
                                          {new Date(g.created_at).toLocaleString('pt-BR')}
                                       </td>
                                       <td className="px-6 py-4">
                                           <div className="flex items-center gap-2">
                                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${g.resgatado ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-shopee-orange'}`}>
                                                 {g.resgatado ? 'Entregue' : 'Pendente'}
                                              </span>
                                              {!g.resgatado && (
                                                <button 
                                                  onClick={async (e) => {
                                                     const btn = e.currentTarget;
                                                     btn.disabled = true;
                                                     btn.style.opacity = '0.5';
                                                     
                                                     const { error } = await supabase
                                                       .from('premios_ganhos')
                                                       .update({ resgatado: true })
                                                       .eq('id', g.id);
                                                     
                                                     if (error) {
                                                        console.error("Erro ao entregar:", error);
                                                        alert("Erro ao marcar como entregue. Verifique sua conexão.");
                                                        btn.disabled = false;
                                                        btn.style.opacity = '1';
                                                     } else {
                                                        if (lojaData?.id) fetchPremios(lojaData.id);
                                                        else loadStoreData();
                                                     }
                                                  }}
                                                  className="p-1.5 bg-gray-50 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:cursor-not-allowed"
                                                  title="Marcar como Entregue"
                                                >
                                                   <Check size={14} />
                                                </button>
                                              )}
                                           </div>
                                       </td>
                                    </tr>
                                 )) : (
                                    <tr>
                                       <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic text-xs">
                                          Nenhum prêmio ganho ainda.
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                   </div>
                 )}

                 {/* VISÃO: OFERTAS RELÂMPAGO */}
                 {marketingView === 'ofertas' && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                     <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                       <div className="flex justify-between items-center mb-6">
                         <div>
                           <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                             <Zap size={20} className="text-yellow-500" />
                             Ofertas Relâmpago
                           </h3>
                           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Programe ofertas com timer regressivo</p>
                         </div>
                         <button
                           onClick={() => {
                             setEditingOferta(null);
                             setNewOferta({ produto_id: '', preco_promocional: '', data_inicio: '', data_fim: '' });
                             setShowOfertaModal(true);
                           }}
                           className="bg-shopee-orange text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-shopee-orange/20"
                         >
                           + Nova Oferta
                         </button>
                       </div>

                       <div className="overflow-x-auto">
                         <table className="w-full text-left">
                           <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                             <tr>
                               <th className="px-6 py-4">Produto</th>
                               <th className="px-6 py-4">Preço Promocional</th>
                               <th className="px-6 py-4">Início</th>
                               <th className="px-6 py-4">Fim</th>
                               <th className="px-6 py-4">Status</th>
                               <th className="px-6 py-4">Ação</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                             {ofertasRelampago.length === 0 ? (
                               <tr>
                                 <td colSpan={6} className="px-6 py-12 text-center">
                                   <Zap size={32} className="mx-auto text-gray-200 mb-3" />
                                   <p className="text-sm text-gray-400 font-medium">Nenhuma oferta relâmpago agendada.</p>
                                   <p className="text-[10px] text-gray-300 mt-1">Crie ofertas por tempo limitado para aumentar a urgência.</p>
                                 </td>
                               </tr>
                             ) : (
                               ofertasRelampago.map((oferta) => {
                                 const agora = new Date().getTime();
                                 const inicio = new Date(oferta.data_inicio).getTime();
                                 const fim = new Date(oferta.data_fim).getTime();
                                 const isAtiva = oferta.ativa && inicio <= agora && fim > agora;
                                 const isAgendada = oferta.ativa && inicio > agora;
                                 const isExpirada = fim <= agora;
                                 const produtoNome = oferta.produtos?.nome || 'Produto removido';
                                 const produtoImg = oferta.produtos?.imagem_url?.split(',')[0] || '';
                                 return (
                                   <tr key={oferta.id} className="text-sm hover:bg-gray-50 transition-colors">
                                     <td className="px-6 py-4">
                                       <div className="flex items-center gap-3">
                                         {produtoImg && (
                                           <img src={produtoImg} className="w-10 h-10 rounded-xl object-cover" />
                                         )}
                                         <span className="font-bold text-gray-800 truncate max-w-[200px]">{produtoNome}</span>
                                       </div>
                                     </td>
                                     <td className="px-6 py-4">
                                       <span className="text-shopee-orange font-bold">
                                         R$ {Number(oferta.preco_promocional).toFixed(2)}
                                       </span>
                                     </td>
                                     <td className="px-6 py-4 text-xs text-gray-500">
                                       {new Date(oferta.data_inicio).toLocaleString('pt-BR')}
                                     </td>
                                     <td className="px-6 py-4 text-xs text-gray-500">
                                       {new Date(oferta.data_fim).toLocaleString('pt-BR')}
                                     </td>
                                     <td className="px-6 py-4">
                                       {isAtiva && (
                                         <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Ativa</span>
                                       )}
                                       {isAgendada && (
                                         <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Agendada</span>
                                       )}
                                       {isExpirada && (
                                         <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">Expirada</span>
                                       )}
                                       {!oferta.ativa && (
                                         <span className="bg-red-50 text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">Desativada</span>
                                       )}
                                     </td>
                                     <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                         <button
                                           onClick={() => {
                                             setEditingOferta(oferta);
                                             setNewOferta({
                                               produto_id: oferta.produto_id,
                                               preco_promocional: oferta.preco_promocional.toString(),
                                               data_inicio: oferta.data_inicio?.slice(0, 16),
                                               data_fim: oferta.data_fim?.slice(0, 16)
                                             });
                                             setShowOfertaModal(true);
                                           }}
                                           className="text-blue-500 font-bold text-xs hover:text-blue-700 transition-colors"
                                         >
                                           Editar
                                         </button>
                                         <button
                                           onClick={() => handleDeleteOferta(oferta.id)}
                                           className="text-red-400 font-bold text-xs hover:text-red-600 transition-colors"
                                         >
                                           Excluir
                                         </button>
                                       </div>
                                     </td>
                                   </tr>
                                 );
                               })
                             )}
                           </tbody>
                         </table>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Configurações de Recompensa de Avaliação (O que já fizemos) */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-shopee-orange">
                         <Star size={20} />
                      </div>
                      <div>
                         <h3 className="font-bold text-gray-800">Recompensa por Avaliação</h3>
                         <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Configuração Atual</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                        <div 
                          onClick={() => setLojaData({...lojaData, recompensa_review_ativa: !lojaData.recompensa_review_ativa})}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${lojaData.recompensa_review_ativa ? 'bg-orange-50 border-shopee-orange/30 text-shopee-orange' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                        >
                           <span className="text-xs font-bold">{lojaData.recompensa_review_ativa ? 'Ativado' : 'Desativado'}</span>
                           <div className={`w-8 h-4 rounded-full relative transition-colors ${lojaData.recompensa_review_ativa ? 'bg-shopee-orange' : 'bg-gray-300'}`}>
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${lojaData.recompensa_review_ativa ? 'translate-x-4' : 'translate-x-1'}`} />
                           </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</label>
                        <select 
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-shopee-orange/20"
                          value={lojaData.recompensa_tipo || 'fixo'}
                          onChange={(e) => setLojaData({...lojaData, recompensa_tipo: e.target.value})}
                        >
                          <option value="fixo">Valor Fixo (R$)</option>
                          <option value="porcentagem">Porcentagem (%)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor do Brinde</label>
                        <div className="flex gap-2">
                           <input 
                             type="number" 
                             className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-shopee-orange/20"
                             value={lojaData.recompensa_valor || ''}
                             onChange={(e) => setLojaData({...lojaData, recompensa_valor: parseFloat(e.target.value)})}
                           />
                           <button 
                             onClick={handleUpdateMarketing}
                             className="bg-shopee-orange text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-shopee-orange/20"
                           >
                             Salvar
                           </button>
                        </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'feedback' && (
              <motion.div 
                key="feedback"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-8 border-b border-gray-50">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-bold text-gray-800 text-2xl mb-1">Feedbacks Recebidos</h3>
                      <p className="text-sm text-gray-500 font-medium">Acompanhe a satisfação dos seus clientes.</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-yellow-500 justify-end mb-1">
                        <Star fill="currentColor" size={24} />
                        <span className="text-3xl font-black">{reviews.length > 0 ? (reviews.reduce((acc, curr) => acc + curr.nota, 0) / reviews.length).toFixed(1) : '0.0'}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rating Geral da Loja</p>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-4 border-b border-gray-50 bg-gray-50/50 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[0, 5, 4, 3, 2, 1].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            feedbackRating === star
                              ? 'bg-shopee-orange text-white'
                              : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {star === 0 ? 'Todas' : `${star}★`}
                        </button>
                      ))}
                    </div>

                    <select
                      value={feedbackProduto}
                      onChange={(e) => setFeedbackProduto(e.target.value)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-shopee-orange/20 focus:border-shopee-orange"
                    >
                      <option value="">Todos os Produtos</option>
                      {produtos.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>

                    <DateFilterBar selectedDays={feedbackFilterDays} onChange={setFeedbackFilterDays} />
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {reviews
                    .filter((review) => {
                      if (feedbackRating !== 0 && review.nota !== feedbackRating) return false;
                      if (feedbackProduto && review.produto_id !== feedbackProduto) return false;
                      if (feedbackFilterDays > 0) {
                        const cutoff = new Date();
                        cutoff.setDate(cutoff.getDate() - feedbackFilterDays);
                        if (new Date(review.created_at) < cutoff) return false;
                      }
                      return true;
                    })
                    .map((review) => (
                    <div key={review.id} className="p-8 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-shopee-orange/10 rounded-full flex items-center justify-center text-shopee-orange font-bold text-lg">
                            {review.profiles?.nome?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{review.profiles?.nome}</p>
                            <p className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} fill={i < review.nota ? "#FFC107" : "none"} color={i < review.nota ? "#FFC107" : "#DDD"} />
                          ))}
                        </div>
                      </div>
                      
                      <div className="pl-15">
                        <div className="mb-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Produto Avaliado</span>
                          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{review.produtos?.nome}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-4 italic">"{review.comentario}"</p>
                        
                        {review.has_media && (
                          <div className="flex gap-3">
                            <div className="w-24 h-24 bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center relative group cursor-pointer">
                              <ImageIcon className="text-gray-400" size={24} />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">Ver Mídia</div>
                            </div>
                          </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100 flex gap-4">
                          <button className="text-xs font-bold text-shopee-orange hover:bg-shopee-orange/5 px-4 py-2 rounded-lg transition-colors">Responder</button>
                          <button className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">Reportar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <div className="p-20 text-center">
                      <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-gray-400 font-medium">Nenhuma avaliação recebida ainda.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'devolucoes' && (
              <motion.div 
                key="devolucoes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Abas Superiores Estilo Shopee */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex border-b border-gray-150 bg-[#FAFAFA] overflow-x-auto scrollbar-none">
                    {[
                      { id: 'todos', label: 'Todos', count: devolucoes.length },
                      { id: 'pendente', label: 'Em análise pelo Lojista', count: devolucoes.filter(d => d.status_solicitacao === 'pendente').length },
                      { id: 'em_devolucao', label: 'Em devolução', count: devolucoes.filter(d => d.status_solicitacao === 'em_devolucao').length },
                      { id: 'aprovada', label: 'Aprovadas', count: devolucoes.filter(d => d.status_solicitacao === 'aprovada' || d.status_solicitacao === 'reembolso_pago').length },
                      { id: 'recusada', label: 'Recusadas / Em disputa', count: devolucoes.filter(d => d.status_solicitacao === 'recusada').length }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSubTabDev(tab.id)}
                        className={`px-8 py-5 text-xs font-bold whitespace-nowrap border-b-2 transition-all relative ${
                          subTabDev === tab.id 
                            ? 'border-shopee-orange text-shopee-orange bg-white' 
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {tab.label}
                        {tab.count > 0 && (
                          <span className="ml-2 bg-[#EE4D2D]/10 text-[#EE4D2D] px-2 py-0.5 rounded-full text-[10px] font-black">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Filtros e Barra de Pesquisa */}
                  <div className="p-6 bg-white border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 flex gap-3 max-w-lg">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Buscar por ID do pedido, ID da solicitação ou comprador..."
                          value={searchDev}
                          onChange={(e) => setSearchDev(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3 text-xs focus:ring-2 focus:ring-shopee-orange outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DateFilterBar selectedDays={devolucaoFilterDays} onChange={setDevolucaoFilterDays} />
                      <button 
                        onClick={loadStoreData}
                        className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Sincronizar
                      </button>
                    </div>
                  </div>

                  {/* Lista de Solicitações */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          <th className="p-6 pl-8">Produto(s)</th>
                          <th className="p-6">Valor Reembolso</th>
                          <th className="p-6">Motivo da Devolução</th>
                          <th className="p-6">Solução</th>
                          <th className="p-6">Status Solicitação</th>
                          <th className="p-6">Status Entrega</th>
                          <th className="p-6 pr-8 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filtrarDevolucoes().map((dev) => (
                          <tr key={dev.id} className="hover:bg-gray-50/50 transition-colors">
                            {/* Produtos e Comprador */}
                            <td className="p-6 pl-8 max-w-sm">
                              <div className="flex items-center gap-2 mb-3 bg-gray-100/50 px-3 py-1.5 rounded-xl border border-gray-100/80 w-fit">
                                <User size={12} className="text-gray-500" />
                                <span className="text-[10px] font-black text-gray-600">
                                  {dev.profiles?.nome || dev.cliente_id.substring(0, 12)}
                                </span>
                                <span className="text-[10px] text-gray-300">|</span>
                                <span className="text-[9px] font-bold text-gray-400">
                                  ID Pedido: #{dev.pedido_id.substring(0, 8).toUpperCase()}
                                </span>
                              </div>

                              {(dev.produtos || []).map((prod: any, idx: number) => (
                                <div key={idx} className="flex gap-3 mt-2 first:mt-0">
                                  <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center">
                                    {prod.imagem ? (
                                      <img src={prod.imagem} alt={prod.nome} className="w-full h-full object-cover" />
                                    ) : (
                                      <ImageIcon className="text-gray-400" size={16} />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">
                                      {prod.nome}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 mt-1 font-semibold">
                                      {prod.variacao ? `Variação: ${prod.variacao}` : 'Sem variação'} • Qtd: {prod.qtd || 1}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </td>

                            {/* Valor */}
                            <td className="p-6">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800">
                                  R$ {parseFloat(dev.valor_reembolso || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                                  Valor Integral
                                </span>
                              </div>
                            </td>

                            {/* Motivo */}
                            <td className="p-6">
                              <div className="flex flex-col gap-1.5 max-w-xs">
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <span className="text-xs font-bold text-gray-700 bg-orange-50 text-shopee-orange px-2 py-0.5 rounded-lg w-fit text-[10px] uppercase font-black tracking-wide border border-shopee-orange/10">
                                    {dev.motivo}
                                  </span>
                                  {dev.quem_paga_frete && (
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                      dev.quem_paga_frete === 'merchant'
                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                    }`}>
                                      {dev.quem_paga_frete === 'merchant' ? 'Lojista Paga' : 'Cliente Paga'}
                                    </span>
                                  )}
                                  {dev.custo_coleta > 0 && (
                                    <span className="text-[9px] font-bold text-gray-400">
                                      (R$ {parseFloat(dev.custo_coleta).toFixed(2)})
                                    </span>
                                  )}
                                </div>
                                {dev.detalhes && (
                                  <p className="text-[10px] text-gray-500 italic mt-0.5 font-medium line-clamp-2">
                                    "{dev.detalhes}"
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Solução */}
                            <td className="p-6">
                              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider">
                                {dev.solucao === 'apenas_reembolso' ? 'Apenas Reembolso' : 'Devolução e Reembolso'}
                              </span>
                            </td>

                            {/* Status Solicitação */}
                            <td className="p-6">
                              {renderStatusSolicitacaoBadge(dev.status_solicitacao)}
                            </td>

                            {/* Status Entrega */}
                            <td className="p-6">
                              {renderStatusEntregaBadge(dev.status_entrega)}
                            </td>

                            {/* Ações */}
                            <td className="p-6 pr-8 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {dev.fotos && dev.fotos.length > 0 && (
                                  <button
                                    onClick={() => setSelectedDevMedia(dev)}
                                    className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center"
                                    title="Ver Imagens de Evidência"
                                  >
                                    <ImageIcon size={14} />
                                  </button>
                                )}

                                {dev.status_solicitacao === 'pendente' && (
                                  <>
                                    <button
                                      onClick={() => handleDecisaoDevolucao(dev.id, 'aprovada')}
                                      className="px-3 py-1.5 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-green-600 transition-all"
                                    >
                                      Aprovar
                                    </button>
                                    <button
                                      onClick={() => handleDecisaoDevolucao(dev.id, 'recusada')}
                                      className="px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-200 transition-all"
                                    >
                                      Recusar
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filtrarDevolucoes().length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-20 text-center text-gray-400">
                              <div className="flex flex-col items-center">
                                <RefreshCw size={48} className="text-gray-200 mb-4 animate-spin-slow" />
                                <h3 className="font-bold text-gray-800 text-lg mb-1">Nenhuma solicitação encontrada</h3>
                                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                                  Use os filtros acima ou simule solicitações Shopee no botão superior para testar o sistema.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Lightbox / Modal de Evidências */}
            {selectedDevMedia && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
                <div className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-scale-up">
                  {/* Foto de Evidência */}
                  <div className="md:w-1/2 bg-black flex items-center justify-center p-6 relative">
                    <img 
                      src={selectedDevMedia.fotos?.[0] || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600'} 
                      alt="Evidência de devolução" 
                      className="max-h-[400px] md:max-h-[500px] object-contain rounded-2xl" 
                    />
                    <button 
                      onClick={() => setSelectedDevMedia(null)}
                      className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all md:hidden"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {/* Informações da Solicitação */}
                  <div className="md:w-1/2 p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-shopee-orange bg-orange-50 px-3 py-1 rounded-full border border-shopee-orange/15">
                            {selectedDevMedia.motivo}
                          </span>
                          {selectedDevMedia.quem_paga_frete && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              selectedDevMedia.quem_paga_frete === 'merchant'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              {selectedDevMedia.quem_paga_frete === 'merchant' ? 'Lojista Paga' : 'Cliente Paga'}
                            </span>
                          )}
                          {selectedDevMedia.custo_coleta > 0 && (
                            <span className="text-[10px] font-black text-gray-400">
                              R$ {parseFloat(selectedDevMedia.custo_coleta).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => setSelectedDevMedia(null)}
                          className="hidden md:block text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <h3 className="text-lg font-black text-slate-800 mb-2">Detalhes da Evidência</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">
                        Pedido ID: #{selectedDevMedia.pedido_id?.toUpperCase()}
                      </p>

                      <div className="space-y-4">
                        <div>
                          <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Comentário do Comprador</span>
                          <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs italic text-gray-600 leading-relaxed">
                            "{selectedDevMedia.detalhes || 'Nenhum detalhe adicional fornecido pelo comprador.'}"
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-black uppercase text-gray-400 block mb-1">Produtos do Retorno</span>
                          <div className="space-y-2">
                            {selectedDevMedia.produtos?.map((prod: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                                <img src={prod.imagem} alt={prod.nome} className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                                <div className="flex-1">
                                  <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{prod.nome}</h4>
                                  <p className="text-[9px] text-gray-500 font-semibold">{prod.variacao || 'Sem variação'} • Qtd: {prod.qtd || 1}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                      {selectedDevMedia.status_solicitacao === 'pendente' ? (
                        <>
                          <button
                            onClick={() => {
                              handleDecisaoDevolucao(selectedDevMedia.id, 'aprovada');
                              setSelectedDevMedia(null);
                            }}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                          >
                            Aceitar Reembolso
                          </button>
                          <button
                            onClick={() => {
                              handleDecisaoDevolucao(selectedDevMedia.id, 'recusada');
                              setSelectedDevMedia(null);
                            }}
                            className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                          >
                            Recusar / Disputar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedDevMedia(null)}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                        >
                          Fechar Evidências
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'configuracoes' && (
                  <motion.div 
                    key="configuracoes"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                     <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                              <Clock size={24} />
                           </div>
                           <div>
                              <h2 className="text-xl font-black text-slate-800 tracking-tighter">Horário de Funcionamento</h2>
                              <p className="text-[10px] font-black text-slate-400 uppercase">Defina quando sua loja está aberta para receber pedidos</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                           {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, idx) => {
                              const horario = horarios.find(h => h.dia_semana === idx) || { id: '', aberto: false, hora_abertura: '08:00', hora_fechamento: '18:00' };
                              return (
                                 <div key={idx} className="flex flex-wrap items-center justify-between p-4 bg-slate-50 rounded-3xl gap-4">
                                    <div className="flex items-center gap-4 min-w-[140px]">
                                       <button 
                                          type="button"
                                          onClick={() => handleUpdateHorario(horario.id, { aberto: !horario.aberto })}
                                          className={`w-12 h-6 rounded-full relative transition-all ${horario.aberto ? 'bg-green-500' : 'bg-slate-300'}`}
                                       >
                                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${horario.aberto ? 'translate-x-6' : 'translate-x-1'}`} />
                                       </button>
                                       <span className="text-xs font-black text-slate-700 uppercase">{dia}</span>
                                    </div>

                                    {horario.aberto ? (
                                       <div className="flex items-center gap-2">
                                          <input 
                                             type="time" 
                                             value={horario.hora_abertura?.slice(0, 5) || '08:00'}
                                             onChange={(e) => handleUpdateHorario(horario.id, { hora_abertura: e.target.value })}
                                             className="bg-white border border-slate-100 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-slate-900"
                                          />
                                          <span className="text-slate-400 font-bold text-xs">às</span>
                                          <input 
                                             type="time" 
                                             value={horario.hora_fechamento?.slice(0, 5) || '18:00'}
                                             onChange={(e) => handleUpdateHorario(horario.id, { hora_fechamento: e.target.value })}
                                             className="bg-white border border-slate-100 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-slate-900"
                                          />
                                       </div>
                                    ) : (
                                       <span className="text-[10px] font-black text-slate-400 uppercase italic">Loja Fechada neste dia</span>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-40 pb-safe">
        <MobileNavLink 
          icon={<LayoutDashboard size={20} />} 
          label="Início" 
          active={activeTab === 'inicio'} 
          onClick={() => setActiveTab('inicio')} 
        />
        <MobileNavLink 
          icon={<ShoppingBag size={20} />} 
          label="Vendas" 
          active={activeTab === 'pedidos'} 
          onClick={() => setActiveTab('pedidos')} 
        />
        <MobileNavLink 
          icon={<Package size={20} />} 
          label="Produtos" 
          active={activeTab === 'produtos'} 
          onClick={() => setActiveTab('produtos')} 
        />
        <MobileNavLink 
          icon={<MessageCircle size={20} />} 
          label="Chat" 
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')} 
        />
        <MobileNavLink 
          icon={<Settings size={20} />} 
          label="Config" 
          active={activeTab === 'configuracoes'} 
          onClick={() => setActiveTab('configuracoes')} 
        />
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowProductModal(false)}
          ></motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <p className="text-xs text-gray-500">Preencha as informações do item para o catálogo.</p>
              </div>
              <button 
                onClick={() => setShowProductModal(false)}
                className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-gray-800 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nome do Produto</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Camiseta Slim Fit Algodão"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-shopee-orange/20 transition-all"
                    value={newProduct.nome}
                    onChange={(e) => setNewProduct({...newProduct, nome: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Preço de Venda</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                    <input 
                      type="number" 
                      required
                      step="0.01"
                      placeholder="0,00"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-shopee-orange/20 transition-all font-bold text-shopee-orange"
                      value={newProduct.preco}
                      onChange={(e) => setNewProduct({...newProduct, preco: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Descrição Detalhada</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Descreva as características técnicas, material, garantia..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-shopee-orange/20 transition-all resize-none"
                  value={newProduct.descricao}
                  onChange={(e) => setNewProduct({...newProduct, descricao: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Categoria Principal</label>
                  <select 
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-shopee-orange/20 transition-all"
                    value={newProduct.categoria}
                    onChange={(e) => setNewProduct({...newProduct, categoria: e.target.value, subcategoria: ''})}
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id_slug || cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Subcategoria</label>
                  <select 
                    required
                    disabled={!newProduct.categoria}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-shopee-orange/20 transition-all disabled:opacity-50"
                    value={newProduct.subcategoria}
                    onChange={(e) => setNewProduct({...newProduct, subcategoria: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {newProduct.categoria && categorias.find(c => (c.id_slug || c.id) === newProduct.categoria)?.subcategorias?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Quantidade em Estoque</label>
                  <input 
                    type="number" 
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-shopee-orange/20"
                    value={newProduct.estoque}
                    onChange={(e) => setNewProduct({...newProduct, estoque: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Link da Imagem</label>
                  <input 
                    type="text" 
                    placeholder="https://..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-shopee-orange/20"
                    value={newProduct.imagem_url}
                    onChange={(e) => setNewProduct({...newProduct, imagem_url: e.target.value})}
                  />
                </div>
              </div>

              {/* Seção de Variações Dinâmicas */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Variações do Produto</label>
                    <p className="text-[10px] text-gray-400 ml-1">Ex: Cor, Tamanho, Material...</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setNewProduct({
                      ...newProduct, 
                      variacoes: [...(newProduct.variacoes || []), { nome: '', opcoes: '' }]
                    })}
                    className="text-xs font-bold text-shopee-orange flex items-center gap-1 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Plus size={14} /> Adicionar Variação
                  </button>
                </div>
                
                {(newProduct.variacoes || []).map((v, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-gray-50 p-4 rounded-2xl border border-gray-100 relative group animate-in fade-in slide-in-from-top-2">
                    <div className="flex-1 space-y-3">
                      <input 
                        type="text" 
                        placeholder="Nome (Ex: Cor, Tamanho)" 
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-shopee-orange/20 outline-none"
                        value={v.nome}
                        onChange={(e) => {
                          const newV = [...newProduct.variacoes];
                          newV[idx].nome = e.target.value;
                          setNewProduct({ ...newProduct, variacoes: newV });
                        }}
                      />
                      <input 
                        type="text" 
                        placeholder="Opções separadas por vírgula (Ex: Rosa, Azul, Branco)" 
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-shopee-orange/20 outline-none"
                        value={v.opcoes}
                        onChange={(e) => {
                          const newV = [...newProduct.variacoes];
                          newV[idx].opcoes = e.target.value;
                          setNewProduct({ ...newProduct, variacoes: newV });
                        }}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const newV = newProduct.variacoes.filter((_, i) => i !== idx);
                        setNewProduct({ ...newProduct, variacoes: newV });
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors bg-white rounded-lg shadow-sm border border-gray-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                {(!newProduct.variacoes || newProduct.variacoes.length === 0) && (
                  <div className="text-center py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-[10px] text-gray-400 font-medium italic">Nenhuma variação cadastrada para este produto.</p>
                  </div>
                )}
              </div>

              {/* Ferramentas de Marketing do Produto */}
              <div className="space-y-4 p-6 bg-orange-50/50 rounded-[32px] border border-orange-100/50">
                <div className="flex items-center gap-2 mb-2">
                   <TrendingDown size={18} className="text-shopee-orange" />
                   <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Ações de Marketing</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço Promocional (Opcional)</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                         <input 
                           type="number" 
                           placeholder="Ex: 89,90"
                           className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-shopee-orange/20 transition-all font-bold text-green-600"
                           value={newProduct.preco_promocional || ''}
                           onChange={(e) => setNewProduct({...newProduct, preco_promocional: e.target.value, promocao_ativa: !!e.target.value})}
                          />
                       </div>
                    </div>

                    {newProduct.preco_promocional && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Expiração da Promoção</label>
                         <input
                           type="datetime-local"
                           className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-shopee-orange/20 transition-all font-bold"
                           value={newProduct.promocao_data_fim}
                           onChange={(e) => setNewProduct({...newProduct, promocao_data_fim: e.target.value})}
                         />
                      </div>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brinde Grátis (Opcional)</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🎁</span>
                         <input 
                           type="text" 
                           placeholder="Ex: Ganhe 1 Case"
                           className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-shopee-orange/20 transition-all font-medium"
                           value={newProduct.premio_nome || ''}
                           onChange={(e) => setNewProduct({...newProduct, premio_nome: e.target.value})}
                         />
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 block">Fotos e Vídeos</label>
                <div className="grid grid-cols-4 gap-4">
                  <button 
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-shopee-orange hover:bg-shopee-orange/5 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-shopee-orange"></div>
                    ) : (
                      <>
                        <Plus size={20} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Foto</span>
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Video size={20} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Vídeo</span>
                  </button>
                  
                  {newProduct.imagem_url && (
                    <div className="aspect-square rounded-2xl overflow-hidden border border-gray-100 relative group">
                      <img src={newProduct.imagem_url} alt="Preview Foto Principal" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setNewProduct({...newProduct, imagem_url: ''})}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] px-1 rounded font-bold uppercase">Capa</span>
                    </div>
                  )}
                  {newProduct.galeria?.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-gray-100 relative group">
                      <img src={url} alt={`Preview Galeria ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setNewProduct({...newProduct, galeria: newProduct.galeria?.filter((_, i) => i !== idx)})}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {newProduct.video_url && (
                    <div className="aspect-square rounded-2xl overflow-hidden border border-gray-100 relative group bg-black flex items-center justify-center">
                      <Video size={32} className="text-white" />
                      <button 
                        type="button"
                        onClick={() => setNewProduct({...newProduct, video_url: ''})}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      <span className="absolute bottom-1 left-1 text-[8px] text-white font-bold bg-shopee-orange px-1 rounded">VÍDEO OK</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*,video/*"
                  multiple
                  onChange={handleImageUpload}
                />
                <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed">
                  <strong>Importante:</strong> Produtos com vídeos têm até 80% mais conversão. O upload real será processado pelo Supabase Storage.
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all border border-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-shopee-orange text-white py-4 rounded-2xl font-bold shadow-lg shadow-shopee-orange/30 hover:bg-shopee-red transition-all flex items-center justify-center gap-2"
                >
                  {editingProduct ? 'Atualizar Produto' : 'Cadastrar Produto'}
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
       )}

      {/* MODAL: CRIAR CUPOM */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden"
           >
              <div className="p-8 bg-gradient-to-br from-shopee-orange to-shopee-red text-white flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-black mb-1">Criar Novo Cupom</h3>
                    <p className="text-white/80 text-xs font-medium">Configure as regras de desconto para sua loja.</p>
                 </div>
                 <button onClick={() => setShowCouponModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Código do Cupom</label>
                    <input 
                      type="text" 
                      placeholder="Ex: PROMO20"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold uppercase focus:ring-2 focus:ring-shopee-orange/20 transition-all"
                      value={newCoupon.codigo}
                      onChange={(e) => setNewCoupon({...newCoupon, codigo: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo</label>
                       <select 
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange/20 transition-all"
                         value={newCoupon.tipo}
                         onChange={(e) => setNewCoupon({...newCoupon, tipo: e.target.value})}
                       >
                          <option value="fixo">R$ Fixo</option>
                          <option value="porcentagem">% Desconto</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor</label>
                       <input 
                         type="number" 
                         placeholder="10.00"
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange/20 transition-all"
                         value={newCoupon.valor}
                         onChange={(e) => setNewCoupon({...newCoupon, valor: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Limite de Uso</label>
                    <input 
                      type="number" 
                      placeholder="100"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange/20 transition-all"
                      value={newCoupon.quantidade}
                      onChange={(e) => setNewCoupon({...newCoupon, quantidade: e.target.value})}
                    />
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setShowCouponModal(false)}
                      className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
                    >
                       Cancelar
                    </button>
                    <button 
                      onClick={handleSaveCoupon}
                      className="flex-1 bg-shopee-orange text-white py-4 rounded-2xl font-bold shadow-lg shadow-shopee-orange/20 hover:bg-shopee-red transition-all"
                    >
                       Criar Cupom
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}

      {/* MODAL: CRIAR OFERTA RELÂMPAGO */}
      {showOfertaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <motion.div
             initial={{ scale: 0.9, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden"
           >
              <div className="p-8 bg-gradient-to-br from-yellow-500 to-orange-500 text-white flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-black mb-1 flex items-center gap-2">
                      <Zap size={24} />
                      {editingOferta ? 'Editar Oferta' : 'Nova Oferta'}
                    </h3>
                    <p className="text-white/80 text-xs font-medium">Programe uma oferta por tempo limitado.</p>
                 </div>
                 <button onClick={() => setShowOfertaModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Produto</label>
                    <select
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange/20 transition-all"
                      value={newOferta.produto_id}
                      onChange={(e) => setNewOferta({...newOferta, produto_id: e.target.value})}
                    >
                       <option value="">Selecione um produto...</option>
                       {produtos.map(p => (
                         <option key={p.id} value={p.id}>{p.nome} — R$ {p.preco.toFixed(2)}</option>
                       ))}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço Promocional</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                       <input
                         type="number"
                         placeholder="Ex: 39,90"
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-bold text-shopee-orange focus:ring-2 focus:ring-shopee-orange/20 transition-all"
                         value={newOferta.preco_promocional}
                         onChange={(e) => setNewOferta({...newOferta, preco_promocional: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Início</label>
                       <input
                         type="datetime-local"
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange/20 transition-all"
                         value={newOferta.data_inicio}
                         onChange={(e) => setNewOferta({...newOferta, data_inicio: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data de Fim</label>
                       <input
                         type="datetime-local"
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange/20 transition-all"
                         value={newOferta.data_fim}
                         onChange={(e) => setNewOferta({...newOferta, data_fim: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setShowOfertaModal(false)}
                      className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
                    >
                       Cancelar
                    </button>
                    <button
                      onClick={handleSaveOferta}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:brightness-110 transition-all"
                    >
                       {editingOferta ? 'Atualizar' : 'Criar Oferta'}
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}

      {/* MODAL: CONFIGURAR PRÊMIO (VERSÃO COMPLETA) */}
      {showPrizeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
           >
              <div className="p-8 bg-green-600 text-white flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-black mb-1">Configurar Prêmios</h3>
                    <p className="text-white/80 text-xs font-medium">Gerencie o que seus clientes podem ganhar na loja.</p>
                 </div>
                 <button onClick={() => setShowPrizeModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 {/* Seleção de Tipo de Prêmio */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'produto', label: 'Do Inventário', emoji: '🎁' },
                      { id: 'customizado', label: 'Brinde Avulso', emoji: '📸' },
                      { id: 'cupom', label: 'Cupom', emoji: '🎟️' },
                      { id: 'frete', label: 'Frete Grátis', emoji: '🚚' }
                    ].map((t) => (
                       <button 
                         key={t.id}
                         onClick={() => setNewPrize({...newPrize, tipo: t.id})}
                         className={`p-4 rounded-2xl border-2 transition-all text-center ${newPrize.tipo === t.id ? 'border-green-600 bg-green-50' : 'border-gray-100 bg-gray-50'}`}
                       >
                          <span className="text-2xl block mb-1">{t.emoji}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest block">{t.label}</span>
                       </button>
                    ))}
                 </div>

                 {/* Configuração Específica: BRINDE AVULSO */}
                 {newPrize.tipo === 'customizado' && (
                    <div className="space-y-6 animate-in slide-in-from-top-2">
                       <div className="flex gap-6 items-center">
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePrizeImageUpload}
                          />
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all overflow-hidden"
                          >
                             {newPrize.imagem_custom ? (
                                <img src={newPrize.imagem_custom} className="w-full h-full object-cover" />
                             ) : (
                                <>
                                   <Camera size={24} className="text-gray-400 mb-2" />
                                   <span className="text-[9px] font-bold text-gray-400 uppercase">Foto do Brinde</span>
                                </>
                             )}
                          </div>
                          <div className="flex-1 space-y-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Brinde</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Chaveiro Exclusivo"
                                  className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold"
                                  value={newPrize.nome_custom}
                                  onChange={(e) => setNewPrize({...newPrize, nome_custom: e.target.value})}
                                />
                             </div>
                             <p className="text-[10px] text-gray-400 italic">* Este brinde será exclusivo para esta campanha e não aparecerá na vitrine normal.</p>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Configuração Específica: PRODUTO */}
                 {newPrize.tipo === 'produto' && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecionar Produto do Inventário</label>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {produtos.map(p => (
                             <div 
                               key={p.id} 
                               onClick={() => setNewPrize({...newPrize, produto_id: p.id})}
                               className={`p-3 rounded-xl border cursor-pointer flex gap-3 items-center transition-all ${newPrize.produto_id === p.id ? 'border-green-600 bg-green-50 ring-2 ring-green-600/20' : 'border-gray-100 hover:border-gray-300'}`}
                             >
                                <img src={p.imagem_url} className="w-10 h-10 rounded-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                   <p className="text-[10px] font-bold text-gray-800 truncate">{p.nome}</p>
                                   <p className="text-[9px] text-gray-400">Estoque: {p.estoque || 0}</p>
                                </div>
                             </div>
                          ))}
                       </div>

                       {newPrize.produto_id && (
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variação Específica (Ex: Tamanho G, Cor Azul)</label>
                                <input 
                                  type="text" 
                                  placeholder="Deixe em branco para qualquer uma"
                                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold"
                                  value={newPrize.variacao}
                                  onChange={(e) => setNewPrize({...newPrize, variacao: e.target.value})}
                                />
                             </div>
                          </div>
                       )}
                    </div>
                 )}

                 {/* Regras de Distribuição */}
                 <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qtd. de Brindes</label>
                       <input 
                         type="number" 
                         className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold"
                         value={newPrize.quantidade}
                         onChange={(e) => setNewPrize({...newPrize, quantidade: e.target.value})}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Probabilidade (%)</label>
                       <div className="relative">
                          <input 
                            type="number" 
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold pr-10"
                            value={newPrize.probabilidade}
                            onChange={(e) => setNewPrize({...newPrize, probabilidade: e.target.value})}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Mínimo do Carrinho para Ganhar</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                       <input 
                         type="number" 
                         className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 pl-12 text-sm font-bold text-green-600"
                         placeholder="Ex: 100.00"
                         value={newPrize.valor_minimo}
                         onChange={(e) => setNewPrize({...newPrize, valor_minimo: e.target.value})}
                       />
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                 <button 
                   onClick={() => setShowPrizeModal(false)}
                   className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-white transition-all"
                 >
                    Cancelar
                 </button>
                 <button 
                   onClick={handleSavePrize}
                   className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                 >
                    {editingPrizeId ? 'Atualizar Alterações' : 'Salvar Configuração'}
                    <ArrowRight size={18} />
                 </button>
              </div>
           </motion.div>
        </div>
      )}
       {/* MODAL: CHECKOUT DE ADS (NOVO) */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white w-full max-w-lg rounded-[36px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header com Gradiente Lindo */}
              <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-start relative overflow-hidden shrink-0">
                <div className="absolute right-[-20px] top-[-20px] w-36 h-36 bg-white/5 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur border border-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {(lojaData.nome || 'AD').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight leading-tight">{lojaData.nome || 'Minha Loja'}</h3>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider block mt-1 w-fit">Loja Ativa & Online</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfileModal(false)} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Conteúdo com scroll */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Seção 1: Dados da Loja */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Store size={14} className="text-shopee-orange" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informações Comerciais</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4 text-xs font-bold text-slate-800">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                      <span className="text-gray-400 font-medium">Logo da Loja</span>
                      <div className="flex items-center gap-3">
                         {lojaData.logo ? (
                            <img src={lojaData.logo} alt="Logo" className="w-8 h-8 rounded bg-gray-100 object-cover" />
                         ) : (
                            <span className="text-[10px] text-gray-400">Sem logo</span>
                         )}
                         <input 
                            type="file" 
                            ref={logoInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                         />
                         <button 
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploading}
                            className="text-[10px] font-bold text-shopee-orange bg-shopee-orange/10 px-3 py-1.5 rounded-lg hover:bg-shopee-orange/20 transition-colors"
                         >
                            {isUploading ? 'Enviando...' : 'Alterar'}
                         </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                      <span className="text-gray-400 font-medium">Nome Comercial</span>
                      <span>{lojaData.nome || 'Não cadastrado'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                      <span className="text-gray-400 font-medium">ID da Loja</span>
                      <span className="font-mono text-gray-500 text-[10px]">#{lojaData.id?.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                      <span className="text-gray-400 font-medium">Telefone</span>
                      <span>{lojaData.telefone || '(21) 99999-9999'}</span>
                    </div>
                    <div className="flex flex-col gap-1 py-1.5">
                      <span className="text-gray-400 font-medium">Endereço de Coleta (Logística)</span>
                      <span className="text-slate-600 font-medium text-[11px] leading-relaxed mt-1">{lojaData.endereco || 'Avenida Governador Roberto Silveira, 123 - Centro'}</span>
                    </div>
                  </div>
                </div>

                {/* Seção 2: Dados do Lojista Proprietário */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-shopee-orange" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Proprietário da Conta</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4 text-xs font-bold text-slate-800">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
                      <span className="text-gray-400 font-medium">Nome</span>
                      <span>{currentUserProfile?.nome || 'Lojista Principal'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-400 font-medium">E-mail de Login</span>
                      <span>{currentUserProfile?.email || 'lojista@capelgo.com.br'}</span>
                    </div>
                  </div>
                </div>

                {/* Seção 3: Taxas e Comissões */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-shopee-orange" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Configuração Financeira</span>
                  </div>
                  <div className="bg-orange-50/50 border border-orange-100/50 rounded-2xl p-4 space-y-4 text-xs font-bold text-slate-800">
                    <div className="flex justify-between items-center py-1.5 border-b border-orange-200/20">
                      <span className="text-gray-500 font-medium">Taxa de Comissão Administrativa</span>
                      <span className="text-shopee-orange font-black">{lojaData.comissao_porcentagem || 10}%</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-500 font-medium">Repasse Líquido por Venda</span>
                      <span className="text-green-600 font-black">{100 - (lojaData.comissao_porcentagem || 10)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações e Rodapé */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-3 shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={async () => {
                      await loadStoreData();
                      alert("Dados da loja sincronizados com sucesso!");
                    }}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-3 rounded-2xl font-bold text-xs uppercase transition-all shadow-sm"
                  >
                    <RefreshCw size={14} /> Sincronizar
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowProfileModal(false);
                      setActiveTab('carteira');
                    }}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-2xl font-bold text-xs uppercase transition-all shadow-md"
                  >
                    <Wallet size={14} /> Minha Carteira
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={async () => {
                    try { await supabase.auth.signOut(); } 
                    catch(e) { console.error(e); } 
                    finally { localStorage.clear(); window.location.href = '/login'; }
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all mt-1"
                >
                  <LogOut size={16} /> Sair da Conta
                </button>
              </div>
            </motion.div>
          </div>
        )}
       {showAdsModal && adsTarget && (
         <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
               {/* Lado Esquerdo: Planos */}
               <div className="p-10 md:w-1/2 bg-slate-50 space-y-6">
                  <div>
                     <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Impulsionar {adsTarget.type === 'produto' ? 'Produto' : 'Loja'}</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Selecione o tempo de exibição</p>
                  </div>
                  
                  <div className="space-y-3">
                     {ADS_PLANS.map((plan) => (
                        <button 
                           key={plan.id}
                           onClick={() => setSelectedAdsPlan(plan)}
                           className={`w-full p-4 rounded-3xl border-2 transition-all flex justify-between items-center ${selectedAdsPlan?.id === plan.id ? 'border-shopee-orange bg-white shadow-xl shadow-shopee-orange/10 ring-4 ring-shopee-orange/5' : 'border-white bg-white/50 hover:bg-white'}`}
                        >
                           <div className="text-left">
                              <p className={`text-[9px] font-black uppercase tracking-widest ${selectedAdsPlan?.id === plan.id ? 'text-shopee-orange' : 'text-slate-400'}`}>{plan.nome}</p>
                              <p className="text-lg font-black text-slate-800">{plan.dias} dias</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-black text-slate-800">R$ {plan.preco.toFixed(2)}</p>
                           </div>
                        </button>
                     ))}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                     <p className="text-[9px] text-blue-600 font-bold leading-relaxed">
                        Ao patrocinar, seu {adsTarget.type} aparecerá no topo da página inicial e nas buscas relacionadas do bairro.
                     </p>
                  </div>
               </div>

               {/* Lado Direito: Pagamento PIX */}
               <div className="p-10 md:w-1/2 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-48 h-48 bg-slate-50 rounded-[32px] p-4 border-2 border-slate-100 relative group">
                     {/* QR Code Placeholder */}
                     <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PIX-PAYMENT-KEY-${systemSettings.pix_chave}-AMOUNT-${selectedAdsPlan?.preco || 0}`} 
                        className="w-full h-full object-contain mix-blend-multiply opacity-80"
                        alt="PIX QR Code"
                     />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-[32px]">
                        <p className="text-[10px] font-black text-slate-800 uppercase">Escaneie o PIX</p>
                     </div>
                  </div>

                  <div className="w-full space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ou copie a chave</p>
                     <div className="flex gap-2">
                        <input 
                           readOnly 
                           value={systemSettings.pix_chave}
                           className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] font-bold text-slate-800"
                        />
                        <button 
                           onClick={() => {
                              navigator.clipboard.writeText(systemSettings.pix_chave);
                              alert("Chave PIX copiada!");
                           }}
                           className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all"
                        >
                           <RefreshCw size={14} />
                        </button>
                     </div>
                  </div>

                  <div className="w-full pt-4 space-y-4">
                     <button 
                        onClick={handleConfirmAdsPayment}
                        disabled={isAdsProcessing}
                        className="w-full py-4 bg-shopee-orange text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-shopee-orange/30 hover:bg-shopee-red transition-all flex items-center justify-center gap-3"
                     >
                        {isAdsProcessing ? <RefreshCw className="animate-spin" /> : <CheckCircle size={18} />}
                        Já realizei o PIX
                     </button>
                     <button 
                        onClick={() => setShowAdsModal(false)}
                        className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600 transition-colors"
                     >
                        Cancelar e Voltar
                     </button>
                  </div>
               </div>
            </motion.div>
         </div>
       )}
      {/* ✅ MODAL: VALIDAR VOUCHER DE PRÊMIO */}
      <AnimatePresence>
        {showVoucherModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowVoucherModal(false); setShowCamera(false); }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Fechar */}
              <button
                onClick={() => { setShowVoucherModal(false); setShowCamera(false); }}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all z-10"
              >
                <X size={18} />
              </button>

              {/* Cabeçalho */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                  <Camera size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800">Validar Voucher</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Escaneie ou digite o código CGO-</p>
                </div>
              </div>

              {/* Abas: Câmera / Manual */}
              {voucherStatus === 'idle' || voucherStatus === 'not_found' ? (
                <>
                  <div className="flex bg-gray-100 rounded-2xl p-1 mb-5 gap-1">
                    <button
                      onClick={() => setShowCamera(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                        showCamera ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Camera size={13} /> Câmera
                    </button>
                    <button
                      onClick={() => setShowCamera(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                        !showCamera ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Search size={13} /> Manual
                    </button>
                  </div>

                  {/* ABA: CÂMERA */}
                  {showCamera && (
                    <div className="mb-4">
                      <QrScanner
                        onScan={async (code) => {
                          try {
                            const normalized = code.trim().toUpperCase();
                            setVoucherInput(normalized);
                            setShowCamera(false);
                            setVoucherStatus('loading');

                            const rawCode = normalized.replace(/^CGO-/, '');
                            const { data: allWins, error } = await supabase
                              .from('premios_ganhos')
                              .select('*')
                              .eq('loja_id', lojaData?.id)
                              .eq('resgatado', false);

                            if (error) throw error;

                            let allWinsWithProfiles = allWins || [];
                            if (allWinsWithProfiles.length > 0) {
                              const clientIds = [...new Set(allWinsWithProfiles.map(w => w.cliente_id).filter(Boolean))];
                              if (clientIds.length > 0) {
                                const { data: profs } = await supabase.from('profiles').select('id, nome, email').in('id', clientIds);
                                allWinsWithProfiles = allWinsWithProfiles.map(w => ({
                                  ...w,
                                  profiles: profs?.find(p => p.id === w.cliente_id) || null
                                }));
                              }
                            }

                            const found = allWinsWithProfiles.find((w: any) =>
                              w.id.substring(0, 8).toUpperCase() === rawCode
                            );

                            if (found) {
                              setVoucherResult(found);
                              setVoucherStatus('found');
                            } else {
                              setVoucherStatus('not_found');
                              setVoucherError('Voucher não encontrado ou já foi resgatado.');
                            }
                          } catch (err: any) {
                            console.error('Erro ao validar voucher via QR:', err);
                            setVoucherStatus('not_found');
                            setVoucherError('Erro ao consultar o banco de dados. Tente digitar o código manualmente.');
                          }
                        }}
                        onError={() => setShowCamera(false)}
                      />
                    </div>
                  )}

                  {/* ABA: MANUAL */}
                  {!showCamera && (
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleValidateVoucher()}
                        placeholder="CGO-A1B2C3D4"
                        autoFocus
                        className="flex-1 bg-gray-50 border-2 border-gray-200 focus:border-purple-500 rounded-2xl px-4 py-3 font-mono font-black text-sm text-gray-800 outline-none transition-colors tracking-widest uppercase"
                      />
                      <button
                        onClick={handleValidateVoucher}
                        disabled={voucherStatus === 'loading' || !voucherInput.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-200 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {voucherStatus === 'loading' ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                        Buscar
                      </button>
                    </div>
                  )}

                  {/* Resultado: NÃO ENCONTRADO */}
                  {voucherStatus === 'not_found' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3"
                    >
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="text-sm font-black text-red-700">Voucher Inválido</p>
                        <p className="text-[10px] text-red-500 mt-0.5">{voucherError}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Dica */}
                  {voucherStatus === 'idle' && !showCamera && (
                    <p className="text-[10px] text-gray-400 text-center mt-1 leading-relaxed">
                      Digite o código exibido na tela do cliente (ex: <span className="font-mono font-black text-purple-500">CGO-A1B2C3D4</span>) ou use a câmera para ler o QR Code.
                    </p>
                  )}
                </>
              ) : null}

              {/* Resultado: ENCONTRADO / CONFIRMADO */}
              {(voucherStatus === 'found' || voucherStatus === 'confirmed' || voucherStatus === 'loading') && voucherResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-5 flex flex-col gap-4 ${
                    voucherStatus === 'confirmed' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {voucherStatus === 'confirmed' ? (
                      <CheckCircle className="text-green-600" size={22} />
                    ) : (
                      <Gift className="text-purple-600" size={22} />
                    )}
                    <span className={`text-sm font-black ${
                      voucherStatus === 'confirmed' ? 'text-green-700' : 'text-purple-700'
                    }`}>
                      {voucherStatus === 'confirmed' ? '✅ Brinde Entregue com Sucesso!' : '🎁 Voucher Válido Encontrado!'}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-white/80 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Prêmio</span>
                      <span className="text-[10px] font-black text-gray-700">{voucherResult.detalhes?.titulo || (voucherResult.tipo || '').toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cliente</span>
                      <span className="text-[10px] font-black text-gray-700">{voucherResult.profiles?.nome || 'Cliente'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</span>
                      <span className="text-[10px] font-medium text-gray-500 truncate max-w-[160px]">{voucherResult.profiles?.email || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Código</span>
                      <span className="font-mono text-[10px] font-black text-purple-600">CGO-{voucherResult.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ganho em</span>
                      <span className="text-[10px] text-gray-500">{new Date(voucherResult.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {voucherStatus === 'found' && (
                    <button
                      onClick={handleConfirmVoucherDelivery}
                      className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Check size={18} />
                      Confirmar Entrega do Brinde
                    </button>
                  )}

                  {voucherStatus === 'confirmed' && (
                    <button
                      onClick={() => {
                        setShowVoucherModal(false);
                        setVoucherInput('');
                        setVoucherStatus('idle');
                        setVoucherResult(null);
                        setShowCamera(false);
                      }}
                      className="w-full py-3 bg-green-100 text-green-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-all hover:bg-green-200"
                    >
                      Fechar e Validar Próximo
                    </button>
                  )}
                </motion.div>
              )}

              {/* Loading sem resultado ainda */}
              {voucherStatus === 'loading' && !voucherResult && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <RefreshCw size={20} className="animate-spin text-purple-500" />
                  <p className="text-sm font-black text-gray-600">Consultando banco de dados...</p>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>

  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-shopee-orange text-white shadow-lg shadow-shopee-orange/30 font-bold' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
      }`}
    >
      {icon}
      <span className="text-sm tracking-tight">{label}</span>
      {active && <motion.div layoutId="activeTab" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
    </button>
  );
}

function MobileNavLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 transition-colors ${
        active ? 'text-shopee-orange' : 'text-gray-400'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
      {active && <motion.div layoutId="mobileActiveTab" className="w-1 h-1 bg-shopee-orange rounded-full" />}
    </button>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 sm:gap-4 group hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 sm:w-12 sm:h-12 ${color} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 truncate">{title}</p>
        <p className="text-sm sm:text-xl font-black text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
