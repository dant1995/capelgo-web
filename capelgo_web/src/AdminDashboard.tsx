import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { 
  Users, 
  Store, 
  TrendingUp, 
  LogOut,
  Menu,
  X,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  ListTodo,
  CheckSquare,
  Square,
  ArrowUpRight,
  Phone,
  Ticket,
  Truck,
  Bike,
  Navigation,
  Lock,
  Key,
  Smartphone,
  Eye,
   EyeOff,
   Settings,
   MapPin,
  Clock,
  Activity,
  ShoppingBag,
  ShieldCheck,
  Star,
  CreditCard,
  UserPlus,
  Maximize2,
  Minimize2,
  Trash,
  MessageSquare,
  Send,
  AlertTriangle,
  RefreshCw,
  Package,
  History,
  Image,
  UploadCloud,
  FileText,
  Layout,
  Layers,
  Save,
  ChevronRight,
  Gift,
  Loader2,
  Printer,
  Files,
   Box,
   Search,
   MousePointerClick,
   KeyRound
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminFinancialReports from './components/AdminFinancialReports';
import BulkProductCreator from './components/BulkProductCreator';
import { useConfig } from './context/ConfigContext';
import DateFilterBar from './components/DateFilterBar';
import ProductPerformanceTable from './components/ProductPerformanceTable';

// Carregar Leaflet via CDN dinamicamente
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>({});
  const zonesRef = useRef<any>({});
  const routesRef = useRef<any>({});
  const heatGroupRef = useRef<any>(null);
  const destinationMarkersRef = useRef<any>({});
  const storeMarkersRef = useRef<any>({});
  const customerMarkersRef = useRef<any>({});
  
  const [activeTab, setActiveTab] = useState('crescimento');
  const [activeMassShippingTab, setActiveMassShippingTab] = useState('pedidos');
  const [selectedMassOrders, setSelectedMassOrders] = useState<string[]>([]);
  const [docConfig, setDocConfig] = useState({ tipoDocumento: 'etiqueta_e_lista', formato: 'pdf' });
  const [pages, setPages] = useState<any[]>([]);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ faturamento: '0.00', pedidos: 0, clientes: 0, lojas: 0 });
  const [pedidosPendentes, setPedidosPendentes] = useState<any[]>([]);
  const [pedidosHistorico, setPedidosHistorico] = useState<any[]>([]);
  const [historicoCompleto, setHistoricoCompleto] = useState<any[]>([]);
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [criandoTeste, setCriandoTeste] = useState(false);
  const [financeStats, setFinanceStats] = useState({ 
    faturamento: 0, 
    repasseEntregadores: 0, 
    comissaoAdmin: 0,
    taxaPadrao: 7.00,
    taxaPorKm: 1.50,
    comissaoVendaPerc: 10 
  });
  const [saquesPendentes, setSaquesPendentes] = useState<any[]>([]);
  const [saquesHistorico, setSaquesHistorico] = useState<any[]>([]);
  const [lojas, setLojas] = useState<any[]>([]);
  const [editCoordsLoja, setEditCoordsLoja] = useState<any>(null);
  const [savingCoords, setSavingCoords] = useState(false);
  const [inativos, setInativos] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [produtoSearch, setProdutoSearch] = useState('');
  const [produtoLojaFilter, setProdutoLojaFilter] = useState('todas');
  const [produtoCategoriaFilter, setProdutoCategoriaFilter] = useState('todas');
  const [pausingProductId, setPausingProductId] = useState<string | null>(null);
  const [historicoFilter, setHistoricoFilter] = useState('todos');
  const [historicoLojaFilter, setHistoricoLojaFilter] = useState('todas');
  const [historicoDataFilter, setHistoricoDataFilter] = useState('todos');
  const [historicoFilterDays, setHistoricoFilterDays] = useState(30);
  const [financeiroFilterDays, setFinanceiroFilterDays] = useState(30);
  const [growthMerchantFilter, setGrowthMerchantFilter] = useState('todos');
  const [saquesFilterDays, setSaquesFilterDays] = useState(30);
  const [saquesLojaFilter, setSaquesLojaFilter] = useState('todas');
  const [saquesStatusFilter, setSaquesStatusFilter] = useState('todos');
  const [repassesLojaFilter, setRepassesLojaFilter] = useState('todas');
  const [repassesFilterDays, setRepassesFilterDays] = useState(30);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [showCategoriasModal, setShowCategoriasModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState<any>(null);
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [editingCategoria, setEditingCategoria] = useState<any>(null);
  const [newSubcategoria, setNewSubcategoria] = useState('');
  const [systemSettings, setSystemSettings] = useState({
    pix_chave: 'financeiro@capelgo.com.br',
    pix_nome: 'CapelGo Pay',
    pix_banco: 'Mercado Pago',
    pix_cidade: 'Capela',
    taxa_comissao: 10,
    taxa_entrega_base: 7.00,
    moeda: 'BRL',
    locale: 'pt-BR',
    plataforma_logo: null as string | null
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [newBanner, setNewBanner] = useState({ 
    imagem_url: '', 
    link_url: '', 
    ativo: true, 
    ordem: 0,
    data_inicio: '',
    data_fim: '',
    categoria: 'geral',
    segmento: 'todos'
  });
  const [clickStats, setClickStats] = useState<any[]>([]);
  const [premiosGanhos, setPremiosGanhos] = useState<any[]>([]);
  const [adsPagamentos, setAdsPagamentos] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [dispatchForPedido, setDispatchForPedido] = useState<any>(null);

  const handleAgrupar = async () => {
      const pedidosBatch = pedidosPendentes.filter(p => selectedForBatch.includes(p.fullId));
      if(pedidosBatch.length < 2) return;

      // Atualizar no Supabase
      for(const p of pedidosBatch) {
         await supabase.from('pedidos').update({status: 'saiu_para_entrega'}).eq('id', p.fullId);
      }

      const batchPayload = {
         type: 'batch',
         id: 'B' + Date.now().toString().slice(-4),
         loja: pedidosBatch[0].loja,
         lojaEndereco: 'Rua das Flores, 100', 
         lojaCoords: { lat: pedidosBatch[0].lojaLat || -23.5505, lng: pedidosBatch[0].lojaLng || -46.6333 },
         valorGanhos: pedidosBatch.length * 10, // 10 reais por pedido no pacote
         entregas: pedidosBatch.map(p => ({
            id: p.id,
            fullId: p.fullId,
            cliente: p.cliente,
            clienteEndereco: p.destino,
            destinoCoords: { lat: p.lat, lng: p.lng }
         })),
         timestamp: Date.now()
      };

      localStorage.setItem('capelgo_dispatch_batch', JSON.stringify(batchPayload));
      setSelectedForBatch([]);
      alert(`Pacote com ${pedidosBatch.length} pedidos despachado para a frota!`);
      fetchRealData();
  };

  const handleSaveCoordsLoja = async () => {
    if (!editCoordsLoja) return;
    setSavingCoords(true);
    try {
      const { error } = await supabase
        .from('lojas')
        .update({ latitude: Number(editCoordsLoja.latitude), longitude: Number(editCoordsLoja.longitude) })
        .eq('id', editCoordsLoja.id);
      if (error) throw error;
      setLojas(prev => prev.map(l => l.id === editCoordsLoja.id ? { ...l, latitude: Number(editCoordsLoja.latitude), longitude: Number(editCoordsLoja.longitude) } : l));
      setEditCoordsLoja(null);
    } catch (err: any) {
      alert('Erro ao salvar coordenadas: ' + err.message);
    } finally {
      setSavingCoords(false);
    }
  };

  const handleDispatchPedido = async (pedido: any, entregador: any) => {
    const currentZone = getPedidoZone(pedido.lat, pedido.lng);
    const finalFee = (currentZone?.taxa || financeStats.taxaPadrao) + (pedido.distancia_km ? pedido.distancia_km * (financeStats.taxaPorKm || 0) : 0);

    const { error: updateErr } = await supabase
      .from('pedidos')
      .update({
        status: 'saiu_para_entrega',
        geolocalizacao_entregador: {
          entregador_id: entregador.id,
          entregador_nome: entregador.nome,
          lat: entregador.lat,
          lng: entregador.lng
        }
      })
      .eq('id', pedido.fullId);

    if (updateErr) {
      alert("Erro ao despachar no banco: " + updateErr.message);
      return;
    }

    setEntregadores(entregadores.map(e => e.id === entregador.id ? {
      ...e,
      status: 'em_entrega',
      subStatus: 'aguardando_aceite',
      pedidoId: pedido.fullId,
      destino: pedido.destino,
      destinoCoords: { lat: pedido.lat, lng: pedido.lng },
      lojaOrigem: pedido.loja,
      lojaCoords: { lat: pedido.lojaLat, lng: pedido.lojaLng }
    } : e));

    localStorage.setItem('capelgo_dispatch', JSON.stringify({
      id: pedido.id,
      fullId: pedido.fullId,
      cliente_id: pedido.cliente_id,
      loja: pedido.loja,
      lojaEndereco: pedido.lojaEndereco || 'Loja CapelGo',
      lojaCoords: { lat: pedido.lojaLat, lng: pedido.lojaLng },
      cliente: pedido.cliente,
      clienteEndereco: pedido.destino,
      destinoCoords: { lat: pedido.lat, lng: pedido.lng },
      valorGanhos: finalFee,
      entregador_id: entregador.id,
      timestamp: Date.now()
    }));
    window.dispatchEvent(new Event('storage'));

    setDispatchForPedido(null);
    fetchRealData();
  };

  const handleCancelDispatch = async (pedidoId: string, entregadorId: string) => {
    if (!confirm('Tem certeza que deseja cancelar a atribuição deste entregador?')) return;

    const { error: updateErr } = await supabase
      .from('pedidos')
      .update({
        status: 'aguardando_entregador',
        geolocalizacao_entregador: null
      })
      .eq('id', pedidoId);

    if (updateErr) {
      alert("Erro ao cancelar: " + updateErr.message);
      return;
    }

    setEntregadores(entregadores.map(e => e.id === entregadorId ? {
      ...e,
      status: 'disponivel',
      subStatus: 'disponivel',
      pedidoId: null,
      destino: '-',
      destinoCoords: null,
      lojaOrigem: null,
      lojaCoords: null
    } : e));

    localStorage.removeItem('capelgo_dispatch');
    window.dispatchEvent(new Event('storage'));

    fetchRealData();
  };

  const handleCriarPedidoTeste = async () => {
    setCriandoTeste(true);
    try {
      const { data: clientes } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'cliente')
        .limit(50);
      if (!clientes?.length) { alert('Nenhum cliente encontrado.'); return; }
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];

      const { data: lojas } = await supabase
        .from('lojas')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      let loja;
      let lojaLat = -23.5505;
      let lojaLng = -46.6333;
      if (lojas?.length) {
        loja = lojas[Math.floor(Math.random() * lojas.length)];
        lojaLat = Number(loja.latitude);
        lojaLng = Number(loja.longitude);
      } else {
        const { data: lojasTodas } = await supabase.from('lojas').select('*').limit(1);
        loja = lojasTodas?.[0] || null;
      }

      const lat = cliente.latitude || (lojaLat + (Math.random() - 0.5) * 0.01);
      const lng = cliente.longitude || (lojaLng + (Math.random() - 0.5) * 0.01);
      const codigoConfirmacao = Math.floor(1000 + Math.random() * 9000).toString();

      if (!loja) { alert('Nenhuma loja encontrada.'); return; }

      const { error } = await supabase.from('pedidos').insert({
        cliente_id: cliente.id,
        loja_id: loja.id,
        total: 15 + Math.random() * 60,
        status: 'saiu_para_entrega',
        endereco_entrega: cliente.endereco || 'Rua de Teste, 123',
        taxa_entrega: 7.00,
        comissao_admin_valor: 2.50,
        repasse_lojista_valor: 12.50,
        repasse_entregador_valor: 7.00,
        codigo_confirmacao: codigoConfirmacao,
        itens: [{ id: 'teste', nome: 'Item de Teste', preco: 25.90, qtd: 1 }],
        geolocalizacao_cliente: { lat, lng },
        geolocalizacao_loja: { lat: lojaLat, lng: lojaLng },
        observacoes: `Cliente: ${cliente.nome || 'Teste'} | Tel: ${cliente.telefone || '11999999999'} | GPS: ${lat},${lng}`,
      });

      if (error) throw error;
      alert(`Pedido teste criado para ${cliente.nome || cliente.id}!`);
      fetchRealData();
    } catch (err: any) {
      alert('Erro ao criar pedido teste: ' + err.message);
    } finally {
      setCriandoTeste(false);
    }
  };

  const handlePrintDocuments = () => {
     if (selectedMassOrders.length === 0) {
        alert("Selecione pelo menos um pedido para gerar os documentos.");
        return;
     }

     const pedidosParaImprimir = pedidosPendentes.filter(p => selectedMassOrders.includes(p.fullId));

     // SimulaÃ§Ã£o de geraÃ§Ã£o de documento abrindo uma nova janela para impressÃ£o
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
           htmlContent += `
             <div class="etiqueta">
               <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px;">
                 ${systemSettings.plataforma_logo 
                     ? `<img src="${systemSettings.plataforma_logo}" style="max-height: 40px; border-radius: 4px;" alt="Logo" />`
                     : `<div style="background-color: #ee4d2d; color: white; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: 900; font-family: sans-serif; font-size: 20px; font-style: italic;">C</div><h2 style="margin: 0; font-size: 24px; font-weight: 900; font-family: sans-serif; font-style: italic;">CapelGo</h2>`
                  }
               </div>
               <p style="margin: 5px 0;"><strong>Pedido:</strong> #${p.id}</p>
               <p style="margin: 5px 0;"><strong>DestinatÃ¡rio:</strong> ${p.cliente}</p>
               <p style="margin: 5px 0;"><strong>EndereÃ§o:</strong> ${p.destino}</p>
               <p style="margin: 5px 0;"><strong>Remetente:</strong> ${p.loja}</p>
               <div style="text-align: center; margin-top: 20px; padding: 15px 5px; border: 1px solid #000; border-radius: 8px;">
                  <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${p.fullId || p.id}&scale=2&height=10&includetext" alt="CÃ³digo de Barras" style="max-width: 100%; height: auto; max-height: 60px; display: block; margin: 0 auto;"/>
               </div>
             </div>
           `;
        }

        if (docConfig.tipoDocumento === 'etiqueta_e_lista' || docConfig.tipoDocumento === 'apenas_lista' || docConfig.tipoDocumento === 'lista_produtos') {
           htmlContent += `
             <div class="lista">
               <h2>Lista de Empacotamento - Pedido #${p.id}</h2>
               <p><strong>Cliente:</strong> ${p.cliente}</p>
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


  const [entregadores, setEntregadores] = useState<any[]>([
    { id: 1, nome: 'JoÃ£o da Moto', status: 'em_entrega', lat: -23.5505, lng: -46.6333, destino: 'Av. Paulista, 1000', avaliacao: 4.8, entregas: 152 },
    { id: 2, nome: 'Marcos Bike', status: 'disponivel', lat: -23.5596, lng: -46.6581, destino: 'Rua Augusta, 500', avaliacao: 4.9, entregas: 89 },
    { id: 3, nome: 'Ana Flash', status: 'disponivel', lat: -23.5432, lng: -46.6290, destino: 'PraÃ§a da SÃ©', avaliacao: 5.0, entregas: 210 },
  ]);

  const [logisticsTasks, setLogisticsTasks] = useState([
    { id: 1, title: 'Gestão de Entregadores', status: 'concluido', description: 'Cadastro, Carteira e AvaliaÃ§Ã£o de desempenho.' },
    { id: 2, title: 'Inteligência de Rota', status: 'concluido', description: 'Otimização de trajetos e despacho automático.' },
    { id: 3, title: 'Geofencing (Zonas)', status: 'concluido', description: 'DefiniÃ§Ã£o de Ã¡reas de entrega e taxas por bairro.' },
    { id: 4, title: 'Alertas de Performance', status: 'concluido', description: 'NotificaÃ§Ãµes de atrasos e gargalos operacionais.' },
    { id: 5, title: 'Chat LogÃ­stico', status: 'concluido', description: 'ComunicaÃ§Ã£o direta Admin <-> Entregador.' },
    { id: 6, title: 'MÃ³dulo Financeiro', status: 'concluido', description: 'CÃ¡lculo de repasses e liquidaÃ§Ã£o de pagamentos.' },
  ]);

  const [zones, setZones] = useState([
    { id: 1, nome: 'Centro Expandido', taxa: 5.00, color: '#FF4D2D', lat: -23.5505, lng: -46.6333, raio: 2000 },
    { id: 2, nome: 'Zona Sul (Moema)', taxa: 12.00, color: '#3B82F6', lat: -23.5986, lng: -46.6681, raio: 1500 },
    { id: 3, nome: 'Zona Oeste (Pinheiros)', taxa: 8.50, color: '#10B981', lat: -23.5616, lng: -46.6920, raio: 1800 },
  ]);

  const [activeLogisticsSubTab, setActiveLogisticsSubTab] = useState('frota'); // 'frota' ou 'zonas'

  const [isAddingEntregador, setIsAddingEntregador] = useState(false);
  const [selectedEntregador, setSelectedEntregador] = useState<any>(null);
  const [newEntregador, setNewEntregador] = useState({ nome: '', telefone: '', veiculo: 'moto', endereco: '' });
  
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [tempZoneCoords, setTempZoneCoords] = useState<{lat: number, lng: number} | null>(null);
  const [newZoneData, setNewZoneData] = useState({ nome: '', taxa: 7.00, raio: 1500, color: '#6366F1' });

  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([
     { id: 1, sender: 'admin', text: 'JoÃ£o, vocÃª jÃ¡ estÃ¡ prÃ³ximo da coleta?', time: '14:20' },
     { id: 2, sender: 'entregador', text: 'Sim, chego em 2 minutos!', time: '14:21' }
  ]);



  // CHAT SYNC
  useEffect(() => {
     const handleSync = () => {
        const localMsgs = JSON.parse(localStorage.getItem('capelgo_local_chat') || '[]');
        setMessages(prev => {
           const ids = new Set(prev.map(m => m.id));
           const news = localMsgs.map((m: any) => ({
              id: m.id,
              sender: m.tipo_remetente === 'admin' ? 'admin' : (m.tipo_remetente || 'usuario'),
               remetente_id: m.remetente_id,
                destinatario_id: m.destinatario_id,
              text: m.texto,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              pedido_id: m.pedido_id
           })).filter(m => !ids.has(m.id));
           
           if (news.length === 0) return prev;
           return [...prev, ...news];
        });
     };
     
     const interval = setInterval(handleSync, 2000); // SincronizaÃ§Ã£o agressiva (2s)
     window.addEventListener('storage', handleSync);
     handleSync();
     return () => {
        window.removeEventListener('storage', handleSync);
        clearInterval(interval);
     };
  }, []);

  const sendAdminMessage = async () => {
     if (!chatMessage.trim() || !activeChat) return;

     // Pegar o ID real do Admin logado
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return;

     const newMessage = {
        pedido_id: activeChat.id,
        remetente_id: user.id,
         destinatario_id: activeChat.id ? null : activeChat.userId, 
        tipo_remetente: 'admin',
        texto: chatMessage,
        tipo: 'texto'
     };

     // Tentar Supabase
     const { error } = await supabase.from('mensagens').insert(newMessage);
     
     if (error) {
        console.warn('Erro ao subir no Supabase, salvando localmente:', error.message);
        const localMsg = { ...newMessage, id: Date.now(), created_at: new Date().toISOString() };
        const localMsgs = JSON.parse(localStorage.getItem('capelgo_local_chat') || '[]');
        localStorage.setItem('capelgo_local_chat', JSON.stringify([...localMsgs, localMsg]));
        window.dispatchEvent(new Event('storage'));
     }

     setChatMessage('');
  };

  // SimulaÃ§Ã£o de Movimento GPS (Entregadores em Rota)
  useEffect(() => {
    const interval = setInterval(() => {
      setEntregadores(current => current.map(e => {
        if (e.status === 'em_entrega' && e.destinoCoords) {
           const step = 0.0005; // Velocidade da simulaÃ§Ã£o
           const latDiff = e.destinoCoords.lat - e.lat;
           const lngDiff = e.destinoCoords.lng - e.lng;
           
           // Se estiver muito perto do destino, para de mover
           if (Math.abs(latDiff) < step && Math.abs(lngDiff) < step) return e;

           return {
              ...e,
              lat: e.lat + (latDiff > 0 ? step : -step),
              lng: e.lng + (lngDiff > 0 ? step : -step)
           };
        }
        return e;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Listener para feedback dos entregadores (SimulaÃ§Ã£o Realtime)
  useEffect(() => {
    const handleFeedback = (e: StorageEvent) => {
      if (e.key === 'capelgo_feedback' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          let msgText = '';
          if (data.type === 'aceito') msgText = `${data.entregador} aceitou o pedido #${data.pedidoId}`;
          if (data.type === 'coletado') msgText = `${data.entregador} coletou o pedido #${data.pedidoId}`;
          if (data.type === 'entregue') {
             msgText = `${data.entregador} finalizou a entrega #${data.pedidoId}`;
             setEntregadores(curr => curr.map(ent => ent.nome === data.entregador ? { ...ent, status: 'disponivel', destino: '-', destinoCoords: null, pedidoId: null } : ent));
          }
          
          setMessages(prev => [...prev, {
             id: Date.now(),
             sender: 'entregador',
             text: msgText,
             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        } catch (err) {}
      }

      if (e.key === 'capelgo_merchant_call' && e.newValue) {
        try {
           const data = JSON.parse(e.newValue);
           setPedidosPendentes(prev => {
              // Evitar duplicidade conferindo o ID completo (data.id)
              if (prev.some(p => p.fullId === data.id)) return prev;
              
              setMessages(mPrev => {
                 // Evitar mensagem duplicada para o mesmo pedido no log de atividade
                 const alreadyLogged = mPrev.some(m => m.text.includes(data.id.slice(0,6)));
                 if (alreadyLogged) return mPrev;

                 return [...mPrev, {
                    id: Date.now(),
                    sender: 'sistema',
                    text: `ðŸ“¦ NOVO PEDIDO: ${data.loja} solicitou entregador para #${data.id.slice(0,6)}!`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                 }];
              });

              return [
                { 
                   id: data.id.slice(0,4),
                   fullId: data.id, 
                   cliente: data.cliente, 
                   destino: data.destino, 
                   lat: data.lat, 
                   lng: data.lng, 
                   valor: data.valor, 
                   minutosEspera: 0, 
                   loja: data.loja, 
                   lojaLat: data.lojaLat, 
                   lojaLng: data.lojaLng 
                }, 
                ...prev
              ];
           });
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleFeedback);

    // ðŸš€ ASSINATURA REALTIME PARA CLIQUES DE PRODUTOS
    const clicksChannel = supabase
      .channel('realtime-clicks')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'produto_clicks' }, (payload) => {
        console.log("ðŸ”¥ Novo clique detectado via Realtime:", payload.new);
        // Ao detectar um novo clique, forÃ§amos a atualizaÃ§Ã£o do analytics
        fetchRealData(); 
      })
      .subscribe();

    // âš¡ ASSINATURA REALTIME PARA MENSAGENS NO MONITOR ADMIN
    const messagesChannel = supabase
      .channel('admin-realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
         console.log("ðŸ”¥ Nova mensagem detectada via Realtime no Admin:", payload.new);
         setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, {
               id: payload.new.id,
               sender: payload.new.tipo_remetente === 'admin' ? 'admin' : (payload.new.tipo_remetente || 'usuario'),
               remetente_id: payload.new.remetente_id,
               destinatario_id: payload.new.destinatario_id,
               text: payload.new.texto,
               time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
               pedido_id: payload.new.pedido_id
            }];
         });
      })
      .subscribe();

    // ðŸ”„ Fallback Polling para garantir tempo real no Admin
    const pollInterval = setInterval(async () => {
       const { data: messagesData } = await supabase.from('mensagens').select('*').order('created_at', { ascending: true });
       if (messagesData) {
          setMessages(prev => {
             const ids = new Set(prev.map(m => m.id));
             const news = messagesData.map(m => ({
                id: m.id,
                sender: m.tipo_remetente === 'admin' ? 'admin' : (m.tipo_remetente || 'usuario'),
                remetente_id: m.remetente_id,
                destinatario_id: m.destinatario_id,
                text: m.texto,
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                pedido_id: m.pedido_id
             })).filter(m => !ids.has(m.id));
             if (news.length === 0) return prev;
             return [...prev, ...news];
          });
       }
    }, 3000);

    fetchRealData();
    fetchCategorias();
    fetchBanners();
    fetchPages();
    
    return () => {
      window.removeEventListener('storage', handleFeedback);
      if (pollInterval) clearInterval(pollInterval);
      supabase.removeChannel(clicksChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  async function fetchCategorias() {
    const { data, error } = await supabase
       .from('categorias')
       .select('*')
       .order('nome');
    if (data) {
       setCategorias(data.map(cat => ({
          ...cat,
          subcategorias: Array.isArray(cat.subcategorias) ? cat.subcategorias : JSON.parse(cat.subcategorias || '[]')
       })));
    }
  }

  async function handleSaveCategoria(cat: any) {
    const payload = {
       nome: cat.nome,
       id_slug: cat.id_slug,
       icone: cat.icone,
       subcategorias: cat.subcategorias
    };

    let error;
    if (cat.id) {
       const { error: err } = await supabase.from('categorias').update(payload).eq('id', cat.id);
       error = err;
    } else {
       const { error: err } = await supabase.from('categorias').insert([payload]);
       error = err;
    }

    if (!error) {
       fetchCategorias();
       setEditingCategoria(null);
    } else {
       alert('Erro ao salvar: ' + error.message);
    }
  }

  async function handleDeleteCategoria(id: string) {
    if (!confirm('Excluir esta categoria permanentemente?')) return;
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (!error) fetchCategorias();
  }

  const fetchRealData = async () => {
    try {
      // ðŸ” RBAC: ProteÃ§Ã£o de Rota Admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!profile || profile.role !== 'admin') {
         if (profile?.role === 'lojista') {
            navigate('/merchant');
         } else if (profile?.role === 'entregador') {
            navigate('/entregador');
         } else {
            navigate('/perfil');
         }
         return;
      }
      setCurrentUserProfile(profile);

      const { data: lojasData } = await supabase.from('lojas').select('*');
      setLojas(lojasData || []);
      const { data: allProfilesData } = await supabase.from('profiles').select('*');
      setAllProfiles(allProfilesData || []);

      // Identificar usuÃ¡rio logado
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && allProfilesData) {
         const current = allProfilesData.find((p: any) => p.id === currentUser.id);
         setCurrentUserProfile(current || { id: currentUser.id, role: 'unknown' });
      }

      // Buscar ConfiguraÃ§Ãµes Globais (PIX, Taxas, etc)
      const { data: configData } = await supabase.from('configuracoes_sistema').select('*');
      if (configData) {
         const taxas = configData.find(c => c.chave === 'taxas_entrega')?.valor;
         const comissao = configData.find(c => c.chave === 'comissao_venda')?.valor;
         const pix = configData.find(c => c.chave === 'pix_config')?.valor;
         const logo = configData.find(c => c.chave === 'plataforma_logo')?.valor;

         if (pix || logo) {
            setSystemSettings(prev => ({
               ...prev,
               pix_chave: pix?.chave || prev.pix_chave,
               pix_nome: pix?.nome || prev.pix_nome,
               pix_banco: pix?.banco || prev.pix_banco,
               pix_cidade: pix?.cidade || prev.pix_cidade,
               plataforma_logo: logo || prev.plataforma_logo
            }));
         }

         setFinanceStats(prev => ({
            ...prev,
            taxaPadrao: taxas?.fixa || 7.00,
            taxaPorKm: taxas?.por_km || 1.50,
            comissaoVendaPerc: comissao?.percentual || 10
         }));
      }

      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (pedidosError) {
        console.error('Erro ao buscar pedidos:', pedidosError);
      }

      if (pedidosData) {
        const profileMap = (allProfilesData || []).reduce((acc: any, curr: any) => {
           acc[curr.id] = curr;
           return acc;
        }, {});

        const formatted = pedidosData.map(p => {
           const profile = profileMap[p.cliente_id];
           const createdAt = p.created_at ? new Date(p.created_at).getTime() : Date.now();
           const espera = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));

           return {
             id: (p.id || '').toString().slice(-4).toUpperCase(),
             fullId: p.id,
             cliente: profile?.nome || profile?.full_name || `Cliente #${p.id.toString().slice(-4)}`,
             telefone: profile?.telefone || '',
             cliente_id: p.cliente_id,
             destino: p.endereco_entrega || 'EndereÃ§o não informado',
             lat: p.geolocalizacao_cliente?.lat || p.geolocalizacao_entregador?.lat || -23.5505,
             lng: p.geolocalizacao_cliente?.lng || p.geolocalizacao_entregador?.lng || -46.6333,
             valor: parseFloat(p.valor_total || p.total || 0),
             status: p.status,
             loja: p.loja_nome || 'Loja CapelGo',
             lojaLat: p.geolocalizacao_loja?.lat || -23.5505,
             lojaLng: p.geolocalizacao_loja?.lng || -46.6333,
             minutosEspera: isNaN(espera) ? 0 : espera,
             created_at: p.created_at,
             geolocalizacao_entregador: p.geolocalizacao_entregador,
            total: parseFloat(p.total || 0),
             comissao_admin_valor: parseFloat(p.comissao_admin_valor || 0),
             repasse_lojista_valor: parseFloat(p.repasse_lojista_valor || 0),
             repasse_entregador_valor: parseFloat(p.repasse_entregador_valor || 0),
             taxa_entrega: parseFloat(p.taxa_entrega || 0)
           };
        });

        // ✅ CORRIGIDO: Split into Tabs - incluindo 'aguardando_entregador' e 'saiu_para_entrega' como pendentes
        const STATUS_PENDENTES = ['pendente', 'confirmado', 'preparando', 'pronto', 'aguardando_pagamento', 'em_preparo', 'em_coleta', 'aguardando_entregador', 'saiu_para_entrega'];
        setPedidosPendentes(formatted.filter(p => STATUS_PENDENTES.includes(p.status)));
        setPedidosHistorico(formatted.filter(p => !STATUS_PENDENTES.includes(p.status)));
        setHistoricoCompleto(formatted);

        // ✅ CORRIGIDO: Update Fleet com vínculo correto via geolocalizacao_entregador.entregador_id
        const { data: couriersData } = await supabase.from('profiles').select('*').eq('role', 'entregador');
        const activeDeliveries = formatted.filter(p => p.status === 'saiu_para_entrega' || p.status === 'em_coleta');
        
         const fleet = (couriersData || []).map(c => {
            const activeDelivery = activeDeliveries.find(p => 
               p.geolocalizacao_entregador?.entregador_id === c.id
            );
            const subStatus = activeDelivery
               ? (activeDelivery.status === 'em_coleta' ? 'em_coleta' : 'aguardando_aceite')
               : 'disponivel';
            return {
               id: c.id,
               nome: c.nome || c.full_name || 'Entregador',
               telefone: c.telefone || '',
               veiculo: c.veiculo_tipo || c.veiculo || 'moto',
               endereco: c.endereco || '',
               online: c.online === true,
               status: activeDelivery ? 'em_entrega' : 'disponivel',
               subStatus,
               status_aprovacao: c.status_aprovacao || 'pendente_documentos',
               lat: c.geolocalizacao?.lat || c.latitude || activeDelivery?.geolocalizacao_entregador?.lat || -23.5505,
               lng: c.geolocalizacao?.lng || c.longitude || activeDelivery?.geolocalizacao_entregador?.lng || -46.6333,
               ultima_localizacao: c.ultima_localizacao || c.geolocalizacao || null,
               destino: activeDelivery?.destino || '-',
               pedidoId: activeDelivery?.fullId || null,
               pedidoStatus: activeDelivery?.status || null
            };
         });
         setEntregadores(fleet.length > 0 ? fleet : entregadores);

        // Update Stats
        setStats({
          pedidos: formatted.length,
          faturamento: formatted.reduce((acc, curr) => acc + curr.valor, 0).toFixed(2),
          clientes: (allProfilesData || []).filter((p: any) => !p.role || p.role === 'cliente' || p.role === 'client' || p.role === 'user').length,
          lojas: lojasData?.length || 0
        });
      }

      // Fetch Marketplace Products (for visual audit)
      const { data: prods } = await supabase.from('produtos').select('*, lojas(nome)');
      const prodsList = prods || [];

      // Buscar contagem de cliques por produto
      const { data: clicksAgg } = await supabase
        .from('produto_clicks')
        .select('produto_id');
      const clicksMap: Record<string, number> = {};
      if (clicksAgg) {
        clicksAgg.forEach(c => {
          clicksMap[c.produto_id] = (clicksMap[c.produto_id] || 0) + 1;
        });
      }

      setMarketplaceProducts(prodsList.map(p => ({
        ...p,
        _cliques: clicksMap[p.id] || 0
      })));

      const { data: messagesData } = await supabase.from('mensagens').select('*').order('created_at', { ascending: true });
      if (messagesData) {
         setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const news = messagesData.map(m => ({
               id: m.id,
               sender: m.tipo_remetente === 'admin' ? 'admin' : (m.tipo_remetente || 'usuario'),
               remetente_id: m.remetente_id,
               destinatario_id: m.destinatario_id,
               text: m.texto,
               time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
               pedido_id: m.pedido_id
            })).filter(m => !ids.has(m.id));
            return [...prev, ...news];
         });
      }

      if (lojasData) {
        setLojas(lojasData.map(l => ({
          ...l,
          id: l.id, 
          nome: l.nome, 
          categoria: l.categoria || 'Geral',
          status: l.status || 'ativo', 
          totalVendas: l.totalVendas || 0, 
          avaliacao: l.avaliacao || 4.5
        })));
      }

      // 8. Buscar Analytics de Cliques
      const { data: clicksData } = await supabase
        .from('produto_clicks')
        .select('id, created_at, produto_id, profile_id')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (clicksData) {
         // Criar um mapa de perfis para busca rÃ¡pida (jÃ¡ temos allProfilesData carregado acima)
         const profileMap = (allProfilesData || []).reduce((acc: any, curr: any) => {
            acc[curr.id] = curr;
            return acc;
         }, {});

         const formattedClicks = await Promise.all(clicksData.map(async (c: any) => {
            try {
               const { data: pData } = await supabase.from('produtos').select('nome, imagem_url').eq('id', c.produto_id).maybeSingle();
               
               const profData = profileMap[c.profile_id];
               let perfilNome = 'Visitante';
               
               if (profData) {
                  perfilNome = profData.nome || profData.full_name || `UsuÃ¡rio (${profData.role || 'cliente'})`;
               }
               
               return {
                  ...c,
                  produto: pData || { nome: 'Produto Removido', imagem_url: null },
                  perfil: {
                     nome: perfilNome,
                     email: 'Protegido'
                  }
               };
            } catch (err) {
               return { ...c, produto: { nome: 'Erro', imagem_url: null }, perfil: { nome: 'N/A', email: 'N/A' } };
            }
         }));
         setClickStats(formattedClicks);
      }

      // 9. Buscar Histórico de Prêmios Ganhos
      try {
        const { data: pData, error: pError } = await supabase
          .from('premios_ganhos')
          .select('*') 
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (pError) {
           console.error("Erro ao buscar premios_ganhos:", pError);
        } else if (pData) {
           setPremiosGanhos(pData);
        }
      } catch (err) {
        console.warn("Falha crÃ­tica ao acessar premios_ganhos:", err);
      }

      // 10. Buscar Histórico de Pagamentos de Ads
      try {
         const { data: adsData } = await supabase
            .from('ads_pagamentos')
            .select('*')
            .order('created_at', { ascending: false });
         if (adsData) setAdsPagamentos(adsData);
      } catch (err) {
         console.warn("Tabela ads_pagamentos não encontrada");
      }

      // 11. Buscar Solicitações de Saque Pendentes
      try {
         const { data: saquesData } = await supabase.from('saques').select('*').eq('status', 'pendente');
         if (saquesData) setSaquesPendentes(saquesData);
      } catch (e) {
         console.warn('Tabela saques inexistente');
      }

      // 12. Buscar Histórico de Saques Processados
      try {
         const { data: saquesHistData } = await supabase
            .from('saques')
            .select('*')
            .neq('status', 'pendente')
            .order('created_at', { ascending: false })
            .limit(50);
         if (saquesHistData) setSaquesHistorico(saquesHistData);
      } catch (e) {
         console.warn('Erro ao buscar histÃ³rico de saques');
      }

    } catch (err) {
      console.error("Erro fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*, banner_clicks(count)')
        .order('ordem', { ascending: true });
        
      if (!error && data) {
         const formatted = data.map((b: any) => ({
            ...b,
            cliques: b.banner_clicks?.[0]?.count || 0
         }));
         setBanners(formatted);
      }
    } catch (e) {
      console.log('Tabela banners ou clicks ainda não criada');
    }
  };

  const fetchPages = async () => {
    try {
      const { data } = await supabase.from('paginas').select('*').order('titulo');
      if (data) setPages(data);
    } catch (e) { console.error(e); }
  };

  const handleUpdatePage = async () => {
    if (!editingPage) return;
    setIsSavingPage(true);
    try {
      const payload = {
        titulo: editingPage.titulo,
        subtitulo: editingPage.subtitulo,
        slug: editingPage.slug,
        conteudo_html: editingPage.conteudo_html,
        cor_tema: editingPage.cor_tema,
        ativo: editingPage.ativo
      };

      const { error } = await (editingPage.id 
        ? supabase.from('paginas').update(payload).eq('id', editingPage.id)
        : supabase.from('paginas').insert([payload]));

      if (error) throw error;
      
      setEditingPage(null);
      fetchPages();
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar pÃ¡gina');
    } finally {
      setIsSavingPage(false);
    }
  };

  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  const handleSaveBanner = async () => {
    // Sanitizar datas para evitar erro de string vazia no Postgres
    const bannerPayload = {
      ...newBanner,
      data_inicio: newBanner.data_inicio || null,
      data_fim: newBanner.data_fim || null,
      link_url: newBanner.link_url || null
    };

    if (editingBannerId) {
      const { error } = await supabase.from('banners').update(bannerPayload).eq('id', editingBannerId);
      if (!error) {
        setIsAddingBanner(false);
        setEditingBannerId(null);
        fetchBanners();
        setNewBanner({ 
           imagem_url: '', 
           link_url: '', 
           ativo: true, 
           ordem: 0, 
           data_inicio: '', 
           data_fim: '',
           categoria: 'geral',
           segmento: 'todos'
        });
      } else {
        alert('Erro ao atualizar: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('banners').insert([bannerPayload]);
      if (!error) {
         setIsAddingBanner(false);
         fetchBanners();
         setNewBanner({ 
            imagem_url: '', 
            link_url: '', 
            ativo: true, 
            ordem: 0,
            data_inicio: '',
            data_fim: '',
            categoria: 'geral',
            segmento: 'todos'
         });
      } else {
         alert('Erro ao salvar banner: ' + error.message);
      }
    }
  };

  const handleEditClick = (banner: any) => {
    setNewBanner({
      imagem_url: banner.imagem_url,
      link_url: banner.link_url || '',
      ativo: banner.ativo,
      ordem: banner.ordem,
      data_inicio: banner.data_inicio ? new Date(banner.data_inicio).toISOString().slice(0, 16) : '',
      data_fim: banner.data_fim ? new Date(banner.data_fim).toISOString().slice(0, 16) : '',
      categoria: banner.categoria || 'geral',
      segmento: banner.segmento || 'todos'
    });
    setEditingBannerId(banner.id);
    setIsAddingBanner(true);
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Deseja excluir este banner?')) return;
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (!error) fetchBanners();
  };

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingBanner(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `banner_${Math.random()}.${fileExt}`;
    const filePath = `banners/${fileName}`;
    
    try {
      const { error: uploadError } = await supabase.storage.from('loja-media').upload(filePath, file);
      
      if (uploadError) {
        alert('Erro upload: ' + uploadError.message);
        setIsUploadingBanner(false);
        return;
      }
      
      const { data } = supabase.storage.from('loja-media').getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        setNewBanner(prev => ({ ...prev, imagem_url: data.publicUrl }));
      }
    } catch (err) {
      alert('Erro inesperado no upload');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchRealData();
    fetchBanners();
    fetchPages();
    fetchCategorias();
    const interval = setInterval(fetchRealData, 30000); // Fallback a cada 30s

    const pedidosSubscription = supabase
      .channel('admin-live-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload: any) => {
        fetchRealData();
        
        // Add to Live Activity
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
           const status = payload.new.status;
           const id = (payload.new.id || '').toString().slice(-4).toUpperCase();
           const loja = payload.new.loja_nome || 'Loja';
           
           let msg = `Pedido #${id} de ${loja}: status alterado para ${status.replace(/_/g, ' ')}`;
           if (payload.eventType === 'INSERT') msg = `NOVO PEDIDO #${id} recebido de ${loja}!`;

           setLiveEvents(prev => {
              const duplicate = prev.some(e => e.text === msg && (Date.now() - e.id) < 2000);
              if (duplicate) return prev;
              
              return [{
                 id: Date.now(),
                 text: msg,
                 status: status,
                 time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }, ...prev].slice(0, 20);
           }); // Keep only last 20
        }
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('admin-profiles-online')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: any) => {
        const p = payload.new;
        if (p.role !== 'entregador') return;
        setEntregadores(prev => {
          const idx = prev.findIndex(e => e.id === p.id);
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            online: p.online === true,
            lat: p.geolocalizacao?.lat || p.latitude || updated[idx].lat,
            lng: p.geolocalizacao?.lng || p.longitude || updated[idx].lng,
            ultima_localizacao: p.ultima_localizacao || p.geolocalizacao || updated[idx].ultima_localizacao
          };
          return updated;
        });
      })
      .subscribe();

    const channel = supabase.channel('admin_global_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchRealData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
         setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, {
               id: payload.new.id,
               sender: payload.new.tipo_remetente === 'admin' ? 'admin' : (payload.new.tipo_remetente || 'usuario'),
               remetente_id: payload.new.remetente_id,
               destinatario_id: payload.new.destinatario_id,
               text: payload.new.texto,
               time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
               pedido_id: payload.new.pedido_id
            }];
         });
      })
      .subscribe();

    const dataChannel = supabase.channel('admin-data-tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => fetchRealData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => fetchBanners())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, () => fetchCategorias())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paginas' }, () => fetchPages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saques' }, () => fetchRealData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'premios_ganhos' }, () => fetchRealData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracoes_sistema' }, () => fetchRealData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lojas' }, () => fetchRealData())
      .subscribe();

    return () => { 
       clearInterval(interval);
       supabase.removeChannel(pedidosSubscription); 
       supabase.removeChannel(profilesChannel);
       supabase.removeChannel(channel);
       supabase.removeChannel(dataChannel);
    };
  }, []);

  const [activeLojasFilter, setActiveLojasFilter] = useState('todos');
  const [userRoleFilter, setUserRoleFilter] = useState('todos');
  const [userSearch, setUserSearch] = useState('');
  const [lojaSearch, setLojaSearch] = useState('');
  const [lojaStatusFilter, setLojaStatusFilter] = useState('todos');
  const [cupomSearch, setCupomSearch] = useState('');
  const [cupomStatusFilter, setCupomStatusFilter] = useState('todos');

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
  };

  const getSuggestedEntregador = (pedidoLat: number, pedidoLng: number) => {
    const disponiveis = entregadores.filter(e => e.status === 'disponivel' && e.status_aprovacao === 'aprovado');
    if (disponiveis.length === 0) return null;
    
    return disponiveis.reduce((prev, curr) => {
      const distPrev = calculateDistance(pedidoLat, pedidoLng, prev.lat, prev.lng);
      const distCurr = calculateDistance(pedidoLat, pedidoLng, curr.lat, curr.lng);
      return distPrev < distCurr ? prev : curr;
    });
  };

  const getPedidoZone = (lat: number, lng: number) => {
     // Encontra a primeira zona que contÃ©m as coordenadas do pedido
     return zones.find(z => {
        // Converte metros para graus aproximados para o cÃ¡lculo simplificado
        const radiusInDegrees = z.raio / 111000; 
        const dist = calculateDistance(lat, lng, z.lat, z.lng);
        return dist <= radiusInDegrees;
     });
  };

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 300);
    }
  }, [isMapExpanded]);

  useEffect(() => {
    // 1. Injetar CSS e JS do Leaflet se não existirem
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = LEAFLET_JS;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapContainerRef.current || mapRef.current || !window.L) return;

      // Inicializar Mapa centrado em SÃ£o Paulo (exemplo)
      const L = window.L;
      mapRef.current = L.map(mapContainerRef.current).setView([-23.5505, -46.6333], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Â© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Listener de clique para adicionar zona (Task 3 AvanÃ§ada)
      mapRef.current.on('click', (e: any) => {
        setTempZoneCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        setIsAddingZone(true);
        setIsSelectingLocation(false);
      });

      updateMarkers();
      updateZones();
    }

    function updateMarkers() {
      if (!mapRef.current || !window.L) return;
      const L = window.L;

      const onlineIds = new Set(entregadores.filter(e => e.online).map(e => e.id));
      Object.keys(markersRef.current).forEach(id => {
        if (!onlineIds.has(id)) {
          mapRef.current.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });
      entregadores.filter(e => e.online).forEach(e => {
        if (markersRef.current[e.id]) {
          markersRef.current[e.id].setLatLng([e.lat, e.lng]);
        } else {
          const driverIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${e.status === 'disponivel' ? '#10B981' : '#F59E0B'}; color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"></circle><path d="M1 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"></path></svg></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          const marker = L.marker([e.lat, e.lng], { icon: driverIcon })
            .addTo(mapRef.current)
            .bindPopup(`<b>${e.nome}</b><br>Status: ${e.status.replace('_', ' ')}<br>Destino: ${e.destino}`);
          markersRef.current[e.id] = marker;
        }
      });
    }

    function updateZones() {
      if (!mapRef.current || !window.L) return;
      const L = window.L;

      zones.forEach(z => {
        if (!zonesRef.current[z.id]) {
           const circle = L.circle([z.lat, z.lng], {
             color: z.color,
             fillColor: z.color,
             fillOpacity: 0.1,
             radius: z.raio
           }).addTo(mapRef.current)
             .bindPopup(`<b>${z.nome}</b><br>Taxa: R$ ${z.taxa.toFixed(2)}`);
           zonesRef.current[z.id] = circle;
        }
      });
    }

    // Limpeza
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activeTab]); // Reinicializa ao trocar de aba para garantir que o container exista

  // Simular movimento a cada 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setEntregadores(prev => prev.map(e => ({
        ...e,
        lat: e.lat + (Math.random() * 0.002 - 0.001),
        lng: e.lng + (Math.random() * 0.002 - 0.001)
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sincronizar marcadores, zonas, rotas e heatmap quando o estado mudar
  useEffect(() => {
    if (mapRef.current && window.L) {
      const L = window.L;
      
      // 1. Update Entregadores Markers — remove offline, cria/atualiza online
      const onlineIds = new Set(entregadores.filter(e => e.online).map(e => e.id));
      Object.keys(markersRef.current).forEach(id => {
        if (!onlineIds.has(id)) {
          mapRef.current.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });
      entregadores.filter(e => e.online).forEach(e => {
        if (markersRef.current[e.id]) {
          markersRef.current[e.id].setLatLng([e.lat, e.lng]);
        } else {
          const isDisponivel = e.status === 'disponivel';
          const driverIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${isDisponivel ? '#10B981' : '#F59E0B'}; color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"></circle><path d="M1 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"></path></svg></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          const marker = L.marker([e.lat, e.lng], { icon: driverIcon })
            .addTo(mapRef.current)
            .bindPopup(`<b>${e.nome}</b><br>Status: ${e.status.replace('_', ' ')}<br>Destino: ${e.destino}`);
          markersRef.current[e.id] = marker;
        }
      });

      // 2. Update Zonas (Circles)
      zones.forEach(z => {
        if (!zonesRef.current[z.id]) {
           const circle = L.circle([z.lat, z.lng], {
             color: z.color,
             fillColor: z.color,
             fillOpacity: 0.1,
             radius: z.raio
           }).addTo(mapRef.current)
             .bindPopup(`<b>${z.nome}</b><br>Taxa: R$ ${z.taxa.toFixed(2)}`);
           zonesRef.current[z.id] = circle;
        }
      });

      // 3. Update Routes & Destination Markers
      // Limpar rotas e destinos antigos para evitar "fantasmas"
      Object.values(routesRef.current).forEach((r: any) => mapRef.current.removeLayer(r));
      routesRef.current = {};
      Object.values(destinationMarkersRef.current).forEach((m: any) => mapRef.current.removeLayer(m));
      destinationMarkersRef.current = {};

      entregadores.forEach(e => {
         if (e.status === 'em_entrega' && e.destinoCoords) {
            // Desenhar Rota (Linha)
            const latlngs = [
               [e.lat, e.lng],
               [e.destinoCoords.lat, e.destinoCoords.lng]
            ];
            const polyline = L.polyline(latlngs, {
               color: '#FF4D2D',
               weight: 2,
               opacity: 0.4,
               dashArray: '5, 8'
            }).addTo(mapRef.current);
            routesRef.current[e.id] = polyline;

            // Desenhar Pin do Cliente (Casinha)
            const destIcon = L.divIcon({
               className: 'custom-div-icon',
               html: `<div style="background-color: #1e293b; color: white; width: 24px; height: 24px; border-radius: 8px; display: flex; items-center; justify-content: center; font-size: 10px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>`,
               iconSize: [24, 24],
               iconAnchor: [12, 12]
            });

            const destMarker = L.marker([e.destinoCoords.lat, e.destinoCoords.lng], { icon: destIcon })
               .addTo(mapRef.current)
               .bindPopup(`<b>Destino de ${e.nome}</b><br>${e.destino}`);
            destinationMarkersRef.current[e.id] = destMarker;
         }
      });

       // 4. Heatmap Management
       if (!heatGroupRef.current) {
          heatGroupRef.current = L.layerGroup().addTo(mapRef.current);
       }
       
       heatGroupRef.current.clearLayers();

       if (showHeatmap) {
          const heatPoints = [
             { lat: -23.555, lng: -46.660, intensity: 0.4 },
             { lat: -23.562, lng: -46.650, intensity: 0.3 },
             { lat: -23.545, lng: -46.635, intensity: 0.5 },
          ];

          heatPoints.forEach((p) => {
             L.circle([p.lat, p.lng], {
                stroke: false,
                fillColor: '#FF4D2D',
                fillOpacity: p.intensity,
                radius: 500
             }).addTo(heatGroupRef.current);
          });
       }

       // 5. Store Markers
       const currentStoreIds = new Set(lojas.filter(l => l.latitude && l.longitude).map(l => l.id));
       Object.keys(storeMarkersRef.current).forEach(id => {
         if (!currentStoreIds.has(id)) {
           mapRef.current.removeLayer(storeMarkersRef.current[id]);
           delete storeMarkersRef.current[id];
         }
       });
       lojas.filter(l => l.latitude && l.longitude).forEach(l => {
         if (storeMarkersRef.current[l.id]) {
           storeMarkersRef.current[l.id].setLatLng([Number(l.latitude), Number(l.longitude)]);
         } else {
           const storeIcon = L.divIcon({
             className: 'custom-div-icon',
             html: `<div style="background-color: #3B82F6; color: white; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V13H8v8"></path></svg></div>`,
             iconSize: [28, 28],
             iconAnchor: [14, 14]
           });
           const marker = L.marker([Number(l.latitude), Number(l.longitude)], { icon: storeIcon })
             .addTo(mapRef.current)
             .bindPopup(`<b>${l.nome}</b><br>${l.categoria || 'Loja'}<br>${l.endereco || ''}`);
           storeMarkersRef.current[l.id] = marker;
         }
       });

       // 6. Customer Markers (from pending orders)
       const currentCustomerKeys = new Set(pedidosPendentes.map(p => p.fullId));
       Object.keys(customerMarkersRef.current).forEach(key => {
         if (!currentCustomerKeys.has(key)) {
           mapRef.current.removeLayer(customerMarkersRef.current[key]);
           delete customerMarkersRef.current[key];
         }
       });
       pedidosPendentes.forEach(p => {
         if (customerMarkersRef.current[p.fullId]) {
           customerMarkersRef.current[p.fullId].setLatLng([p.lat, p.lng]);
         } else {
           const isCritical = p.minutosEspera > 10;
           const isWarning = p.minutosEspera > 5;
           const bgColor = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#8B5CF6';
           const pulseClass = isCritical ? 'animate-ping' : '';
           const customerIcon = L.divIcon({
             className: 'custom-div-icon',
             html: `<div style="background-color: ${bgColor}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`,
             iconSize: [24, 24],
             iconAnchor: [12, 12]
           });
           const marker = L.marker([p.lat, p.lng], { icon: customerIcon })
             .addTo(mapRef.current)
             .bindPopup(`<b>${p.cliente}</b><br>Pedido #${p.id}<br>${p.destino}<br>R$ ${p.valor.toFixed(2)}<br>${p.minutosEspera}min espera`);
           customerMarkersRef.current[p.fullId] = marker;
         }
       });
     }
   }, [entregadores, zones, showHeatmap, lojas, pedidosPendentes]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-800">
      <aside className="hidden md:flex w-56 bg-slate-900 text-white flex-col sticky top-0 h-screen shrink-0">
        <AdminSidebarContent 
           activeTab={activeTab} 
           setActiveTab={setActiveTab} 
           navigate={navigate} 
           fetchRealData={fetchRealData}
        />
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="absolute top-0 left-0 bottom-0 w-72 bg-slate-900 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-shopee-orange rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-shopee-orange/20">C</div>
                  <h1 className="font-black text-white text-xl italic tracking-tighter">CapelGo</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminSidebarContent 
                  activeTab={activeTab} 
                  setActiveTab={(tab: string) => {
                    setActiveTab(tab);
                    setIsMobileMenuOpen(false);
                  }} 
                  navigate={navigate} 
                  fetchRealData={fetchRealData}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-12 border-b px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-600"><Menu size={20} /></button>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab}</h2>
               <button 
                 onClick={() => fetchRealData()}
                 className="ml-4 p-1.5 bg-slate-50 text-slate-400 hover:text-shopee-orange hover:bg-orange-50 rounded-lg transition-all flex items-center gap-2"
                 title="Sincronizar Dados"
               >
                 <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                 <span className="text-[9px] font-black uppercase">Sincronizar</span>
               </button>
               <button 
                 onClick={handleCriarPedidoTeste}
                 disabled={criandoTeste}
                 className="p-1.5 bg-shopee-orange text-white hover:bg-orange-600 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                 title="Criar Pedido de Teste"
               >
                 {criandoTeste ? <RefreshCw size={12} className="animate-spin" /> : <Package size={12} />}
                 <span className="text-[9px] font-black uppercase">{criandoTeste ? 'Criando...' : 'Teste'}</span>
               </button>
           </div>
           <div className="flex items-center gap-3">
              {loading && <div className="text-[9px] font-black text-slate-300 uppercase animate-pulse">Carregando...</div>}
              <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-white text-[10px] font-bold">AD</div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
           <div className="max-w-[1400px] mx-auto space-y-6 pb-10">
              <>
                {activeTab === 'paginas' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <div>
                           <h2 className="text-xl font-black text-slate-800 tracking-tighter">Gestão de Páginas CMS</h2>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Edite o conteÃºdo do app como no WordPress</p>
                        </div>
                        <button 
                           onClick={() => setEditingPage({ titulo: '', subtitulo: '', slug: '', conteudo_html: '', cor_tema: '#FF4D2C', ativo: true })}
                           className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-shopee-orange transition-all shadow-lg"
                        >
                           + Criar Nova PÃ¡gina
                        </button>
                    </div>

                    {editingPage ? (
                       <motion.div 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-6"
                       >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TÃ­tulo da PÃ¡gina</label>
                                <input 
                                   type="text" 
                                   value={editingPage.titulo}
                                   onChange={(e) => setEditingPage({ ...editingPage, titulo: e.target.value })}
                                   className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SubtÃ­tulo</label>
                                <input 
                                   type="text" 
                                   value={editingPage.subtitulo}
                                   onChange={(e) => setEditingPage({ ...editingPage, subtitulo: e.target.value })}
                                   className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                />
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug da URL (ex: promo-natal)</label>
                                <input 
                                   type="text" 
                                   value={editingPage.slug}
                                   onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                   className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                   placeholder="link-da-pagina"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cor do Tema (Hex)</label>
                                <div className="flex gap-2">
                                   <input 
                                      type="color" 
                                      value={editingPage.cor_tema}
                                      onChange={(e) => setEditingPage({ ...editingPage, cor_tema: e.target.value })}
                                      className="w-14 h-14 bg-slate-50 border-none rounded-2xl p-1 cursor-pointer"
                                   />
                                   <input 
                                      type="text" 
                                      value={editingPage.cor_tema}
                                      onChange={(e) => setEditingPage({ ...editingPage, cor_tema: e.target.value })}
                                      className="flex-1 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange uppercase"
                                   />
                                </div>
                             </div>
                             <div className="flex flex-col justify-end">
                                 <button 
                                    onClick={() => setEditingPage({ ...editingPage, ativo: !editingPage.ativo })}
                                    className={`h-14 rounded-2xl font-black text-[10px] uppercase transition-all ${editingPage.ativo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                                 >
                                    {editingPage.ativo ? 'ðŸ”¥ PÃ¡gina Ativa' : 'â „ï¸  Rascunho'}
                                 </button>
                             </div>
                          </div>

                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ConteÃºdo (HTML ou Texto)</label>
                             <textarea 
                                value={editingPage.conteudo_html}
                                onChange={(e) => setEditingPage({ ...editingPage, conteudo_html: e.target.value })}
                                className="w-full h-48 bg-slate-50 border-none rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-shopee-orange custom-scrollbar"
                                placeholder="Pode usar tags HTML como <br>, <b>, etc."
                             />
                          </div>

                          <div className="flex gap-3 pt-4">
                             <button 
                                onClick={() => setEditingPage(null)}
                                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                             >
                                Cancelar
                             </button>
                             <button 
                                onClick={handleUpdatePage}
                                disabled={isSavingPage}
                                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-shopee-orange transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
                             >
                                {isSavingPage ? <RefreshCw className="animate-spin" size={14} /> : 'Salvar AlteraÃ§Ãµes'}
                             </button>
                          </div>
                       </motion.div>
                    ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {pages.map(p => (
                             <motion.div 
                                key={p.id}
                                whileHover={{ y: -5 }}
                                className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between"
                             >
                                <div className="flex items-start justify-between mb-4">
                                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: p.cor_tema + '20', color: p.cor_tema }}>
                                      <Layout size={24} />
                                   </div>
                                   <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${p.ativo ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                      {p.ativo ? 'Ativa' : 'Rascunho'}
                                   </div>
                                </div>
                                <div>
                                   <h3 className="font-black text-slate-800 text-lg leading-tight mb-1">{p.titulo}</h3>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{p.slug}</p>
                                </div>
                                <div className="mt-6 flex gap-2">
                                   <button 
                                      onClick={() => setEditingPage(p)}
                                      className="flex-1 py-3 bg-slate-50 rounded-2xl text-slate-600 font-black text-[10px] uppercase hover:bg-slate-900 hover:text-white transition-all"
                                   >
                                      Editar PÃ¡gina
                                   </button>
                                   <button 
                                      onClick={() => window.open(`/${p.slug}`, '_blank')}
                                      className="flex-1 py-3 bg-orange-50 text-shopee-orange rounded-2xl font-black text-[10px] uppercase hover:bg-shopee-orange hover:text-white transition-all flex items-center justify-center gap-2 border border-orange-100"
                                   >
                                      <Eye size={14} />
                                      Visualizar
                                   </button>
                                </div>
                             </motion.div>
                          ))}
                       </div>
                    )}
                  </div>
                )}



                {activeTab === 'usuarios' && (
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <div>
                           <h2 className="text-xl font-black text-slate-800 tracking-tighter">Gestão de UsuÃ¡rios</h2>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Base Completa de Clientes e Parceiros</p>
                        </div>
                     </div>

                     <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-[32px] shadow-sm border border-slate-100">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                           {[
                              { label: 'Todos', value: 'todos' },
                              { label: 'Admin', value: 'admin' },
                               { label: 'Lojista', value: 'lojista' },
                              { label: 'Entregador', value: 'entregador' },
                              { label: 'Cliente', value: 'cliente' }
                           ].map(r => (
                              <button
                                 key={r.value}
                                 onClick={() => setUserRoleFilter(r.value)}
                                 className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${userRoleFilter === r.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                              >
                                 {r.label}
                              </button>
                           ))}
                        </div>
                        <div className="relative flex-1 max-w-xs">
                           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                           <input
                              type="text"
                              placeholder="Buscar por nome ou email..."
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-shopee-orange/50"
                           />
                        </div>
                     </div>
                     <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                              <tr>
                                  <th className="px-6 py-4">UsuÃ¡rio</th>
                                  <th className="px-6 py-4">Dados de Contato</th>
                                  <th className="px-6 py-4">FunÃ§Ã£o</th>
                                  <th className="px-6 py-4">Loja Vinculada</th>
                                  <th className="px-6 py-4">AÃ§Ã£o</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {allProfiles.filter(p => {
                                 const roleMatch = userRoleFilter === 'todos' || (p.role || 'cliente') === userRoleFilter;
                                 const searchTerm = userSearch.toLowerCase();
                                 const searchMatch = !searchTerm ||
                                    (p.nome || '').toLowerCase().includes(searchTerm) ||
                                    (p.full_name || '').toLowerCase().includes(searchTerm) ||
                                    (p.email || '').toLowerCase().includes(searchTerm);
                                 return roleMatch && searchMatch;
                              }).map(p => (
                                 <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xs italic">
                                             {(p.nome || p.full_name || '?').charAt(0)}
                                          </div>
                                          <p className="text-xs font-black text-slate-800">{p.nome || p.full_name || 'Sem Nome'}</p>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <p className="text-[10px] font-bold text-slate-500">{p.email || 'N/A'}</p>
                                       <p className="text-[9px] text-slate-400">{p.telefone || '-'}</p>
                                       <p className="text-[8px] text-slate-300 italic">{p.endereco || 'Sem endereço'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                          p.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                                          p.role === 'entregador' ? 'bg-blue-100 text-blue-600' :
                                           p.role === 'lojista' ? 'bg-orange-100 text-shopee-orange' :
                                          'bg-slate-100 text-slate-500'
                                       }`}>
                                          <select 
                                             value={p.role || 'cliente'} 
                                             onChange={async (e) => {
                                                const newRole = e.target.value;
                                                const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', p.id);
                                                if (error) {
                                                   alert("Erro ao alterar funÃ§Ã£o: " + error.message);
                                                } else {
                                                   setAllProfiles(allProfiles.map(prof => prof.id === p.id ? { ...prof, role: newRole } : prof));
                                                }
                                             }}
                                             className="bg-transparent border-none text-[8px] font-black uppercase outline-none cursor-pointer p-0 m-0 text-inherit font-sans"
                                          >
                                             <option value="cliente" className="bg-white text-slate-800">Cliente</option>
                                             <option value="entregador" className="bg-white text-slate-800">Entregador</option>
                                              <option value="lojista" className="bg-white text-slate-800">Lojista</option>
                                             <option value="admin" className="bg-white text-slate-800">Admin</option>
                                          </select>
                                       </span>
                                    </td>
                                      <td className="px-6 py-4">
                                        <select
                                          value={p.loja_id || ''}
                                          onChange={async (e) => {
                                            const lojaId = e.target.value || null;
                                            const { error } = await supabase.from('profiles').update({ loja_id: lojaId }).eq('id', p.id);
                                            if (error) { alert('Erro ao vincular loja: ' + error.message); return; }
                                            setAllProfiles(allProfiles.map(prof => prof.id === p.id ? { ...prof, loja_id: lojaId } : prof));
                                          }}
                                          className={`text-[9px] font-bold outline-none cursor-pointer border border-slate-100 rounded-lg px-2 py-1.5 w-full max-w-[160px] ${p.loja_id ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}
                                        >
                                          <option value="">Sem loja</option>
                                          {lojas.map(l => (
                                            <option key={l.id} value={l.id}>{l.nome}</option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="px-6 py-4">
                                         <button
                                           onClick={async () => {
                                             const email = p.email;
                                             if (!email) { alert('UsuÃ¡rio sem e-mail cadastrado.'); return; }
                                             if (!confirm(`Enviar link de redefiniÃ§Ã£o de senha para ${email}?`)) return;
                                             try {
                                               const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                                 redirectTo: window.location.origin + '/login',
                                               });
                                               if (error) throw error;
                                               alert(`Link de redefiniÃ§Ã£o enviado para ${email}!`);
                                             } catch (err: any) {
                                               alert('Erro: ' + (err.message === 'Email address is invalid'
                                                 ? 'Configure o SMTP no painel do Supabase (Authentication > Settings > SMTP) para enviar e-mails de recuperaÃ§Ã£o.'
                                                 : err.message));
                                             }
                                           }}
                                           className="px-3 py-1.5 bg-slate-100 hover:bg-shopee-orange hover:text-white rounded-xl text-[8px] font-black uppercase transition-all flex items-center gap-1.5"
                                           title="Redefinir Senha"
                                         >
                                           <KeyRound size={10} /> Redefinir Senha
                                         </button>
                                      </td>
                                  </tr>
                              ))}
                              {allProfiles.length === 0 && (
                                 <tr>
                                     <td colSpan={5} className="px-6 py-10 text-center text-[10px] font-black text-slate-300 uppercase">Nenhum usuÃ¡rio encontrado no banco</td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
                )}

                {activeTab === 'logistica' && (
                <div className="space-y-6">
                   <div className="flex justify-between items-end">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-black text-slate-800 tracking-tighter">LogÃ­stica Realtime</h2>
                          <div className="bg-red-100 text-red-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 animate-pulse">
                             <AlertTriangle size={10} /> 1 Atraso CrÃ­tico
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Painel de Controle e Performance</p>
                        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                           <button onClick={() => setActiveLogisticsSubTab('frota')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeLogisticsSubTab === 'frota' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Frota</button>
                           <button onClick={() => setActiveLogisticsSubTab('zonas')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeLogisticsSubTab === 'zonas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Zonas</button>
                           <button onClick={() => setActiveLogisticsSubTab('inativos')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeLogisticsSubTab === 'inativos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Inativos {inativos.length > 0 && `(${inativos.length})`}</button>
                           <button onClick={() => setActiveLogisticsSubTab('aprovacoes')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeLogisticsSubTab === 'aprovacoes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>AprovaÃ§Ãµes {allProfiles.filter(p => p.role === 'entregador' && p.status_aprovacao !== 'aprovado').length > 0 && `(${allProfiles.filter(p => p.role === 'entregador' && p.status_aprovacao !== 'aprovado').length})`}</button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <button 
                            onClick={() => {
                               if (activeLogisticsSubTab === 'frota') setIsAddingEntregador(true);
                               else if (activeLogisticsSubTab === 'zonas') setIsSelectingLocation(true);
                            }}
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2 hover:bg-shopee-orange transition-colors"
                         >
                            <UserPlus size={14} /> Novo {activeLogisticsSubTab === 'frota' ? 'Entregador' : 'Bairro'}
                         </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* MAPA REAL */}
                      <div className="lg:col-span-3 space-y-4">
                         <div className={isMapExpanded ? "fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md p-4 flex flex-col justify-center items-center animate-in fade-in duration-300" : "bg-white p-2 rounded-[32px] shadow-xl border border-slate-100 relative overflow-hidden"}>
                             <div ref={mapContainerRef} className={`leaflet-container ${isMapExpanded ? "w-full max-w-7xl h-[85vh] rounded-[24px] shadow-2xl overflow-hidden z-10" : "h-[400px] rounded-[24px] z-10"}`} />
                             <div className="absolute top-6 left-6 z-[20] flex gap-2">
                                 <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-lg border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Status Global</p>
                                    <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                                       <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                       Monitorando Frota
                                    </p>
                                 </div>
                                 <button 
                                    onClick={() => setShowHeatmap(!showHeatmap)}
                                    className={`px-4 py-2 rounded-2xl shadow-lg border text-[9px] font-black uppercase transition-all ${
                                       showHeatmap ? 'bg-orange-500 text-white' : 'bg-white'
                                    }`}
                                 >
                                    Demanda
                                 </button>
                                  <button 
                                     onClick={() => setIsMapExpanded(!isMapExpanded)}
                                     className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl shadow-lg border text-[9px] font-black uppercase flex items-center gap-1.5 transition-all"
                                  >
                                     {isMapExpanded ? (
                                        <>
                                           <Minimize2 size={12} className="text-slate-600" /> Minimizar
                                        </>
                                     ) : (
                                        <>
                                           <Maximize2 size={12} className="text-slate-600" /> Maximizar
                                        </>
                                     )}
                                  </button>
                              </div>
                              <div className="absolute bottom-6 left-6 z-[20] flex gap-3">
                                 <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                       <div style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: '#10B981', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                       <span className="text-[8px] font-black text-slate-500 uppercase">Entregador</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                       <div style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: '#3B82F6', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                       <span className="text-[8px] font-black text-slate-500 uppercase">Loja</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                       <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#8B5CF6', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                       <span className="text-[8px] font-black text-slate-500 uppercase">Cliente</span>
                                    </div>
                                 </div>
                              </div>
                         </div>

                         {/* SUBTAB CONTENT */}
                         {activeLogisticsSubTab === 'frota' ? (
                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Gestão de Frota</h3>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {entregadores.map(e => (
                                     <div 
                                        key={e.id} 
                                        onClick={() => setSelectedEntregador(e)}
                                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-shopee-orange transition-all cursor-pointer group hover:shadow-md"
                                     >
                                         <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black group-hover:bg-shopee-orange transition-colors relative">
                                               {(e.nome || '?').charAt(0)}
                                               <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${e.online ? 'bg-green-500' : 'bg-slate-400'}`} />
                                            </div>
                                            <div>
                                               <p className="text-xs font-black text-slate-800">{e.nome}</p>
                                               <div className="flex items-center gap-1">
                                                  <span className={`w-1.5 h-1.5 rounded-full ${e.status === 'disponivel' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                                  <p className="text-[8px] font-black text-slate-400 uppercase">
                                                     {e.status.replace('_', ' ')} {e.pedidoId && `• #${e.pedidoId}`}
                                                  </p>
                                                  <span className={`ml-1 text-[7px] font-black uppercase ${e.online ? 'text-green-500' : 'text-slate-400'}`}>
                                                     {e.online ? 'Online' : 'Offline'}
                                                  </span>
                                               </div>
                                            </div>
                                         </div>

                                        <div className="space-y-1 mb-3">
                                           <div className="flex items-center gap-2 text-slate-400">
                                              <Phone size={10} />
                                              <p className="text-[9px] font-bold">{e.telefone || 'Sem telefone'}</p>
                                           </div>
                                           <div className="flex items-center gap-2 text-slate-400">
                                              <MapPin size={10} />
                                              <p className="text-[9px] font-bold truncate">{e.endereco || 'EndereÃ§o não cadastrado'}</p>
                                           </div>
                                        </div>

                                         {e.status === 'em_entrega' && e.destino && (
                                             <div className="mb-3 space-y-2">
                                                <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                                                   <p className="text-[7px] font-black text-blue-400 uppercase mb-0.5 flex items-center gap-1">
                                                      <Store size={8} /> Coleta (Loja)
                                                   </p>
                                                   <p className="text-[9px] font-bold text-blue-800 truncate">{e.lojaOrigem || 'Pizzaria do Bairro'}</p>
                                                </div>
                                                <div className="p-2 bg-orange-50 rounded-xl border border-orange-100">
                                                   <p className="text-[7px] font-black text-orange-400 uppercase mb-0.5 flex items-center gap-1">
                                                      <MapPin size={8} /> Entrega (Cliente)
                                                   </p>
                                                   <p className="text-[9px] font-bold text-orange-800 truncate">{e.destino}</p>
                                                </div>
                                                <button
                                                  onClick={(ev) => { ev.stopPropagation(); handleCancelDispatch(e.pedidoId, e.id); }}
                                                  className="w-full py-2 bg-red-50 text-red-600 rounded-xl text-[8px] font-black uppercase hover:bg-red-100 transition-all flex items-center justify-center gap-1.5"
                                                >
                                                  <X size={10} /> Cancelar Atribuição
                                                </button>
                                             </div>
                                          )}

                                        <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase text-slate-400">
                                           <div className="bg-white p-2 rounded-lg border border-slate-100">
                                              <p className="leading-none mb-1">Entregas</p>
                                              <p className="text-slate-800">{e.entregas}</p>
                                           </div>
                                           <div className="bg-white p-2 rounded-lg border border-slate-100">
                                              <p className="leading-none mb-1">AvaliaÃ§Ã£o</p>
                                              <p className="text-shopee-orange flex items-center gap-0.5"><Star size={8} fill="currentColor" /> {e.avaliacao}</p>
                                           </div>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         ) : activeLogisticsSubTab === 'zonas' ? (
                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Zonas de Entrega</h3>
                               <div className="space-y-3">
                                  {zones.map(z => (
                                     <div key={z.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-shopee-orange transition-all group">
                                        <div className="flex items-center gap-4">
                                           <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: z.color }}>
                                              <MapPin size={18} />
                                           </div>
                                           <div>
                                              <p className="text-sm font-black text-slate-800">{z.nome}</p>
                                              <p className="text-[9px] font-black text-slate-400 uppercase">Raio: {z.raio}m â€¢ Taxa DinÃ¢mica</p>
                                           </div>
                                        </div>
                                        <div className="text-right">
                                           <p className="text-lg font-black text-shopee-orange">R$ {z.taxa.toFixed(2)}</p>
                                           <button className="text-[9px] font-black text-slate-400 uppercase hover:text-slate-800">Editar RegiÃ£o</button>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         ) : activeLogisticsSubTab === 'inativos' ? (
                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Entregadores Inativos</h3>
                               <div className="space-y-3">
                                  {inativos.map(e => (
                                     <div key={e.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-60">
                                        <div className="flex items-center gap-4">
                                           <div className="w-10 h-10 bg-slate-200 text-slate-400 rounded-xl flex items-center justify-center font-black">
                                              {(e.nome || '?').charAt(0)}
                                           </div>
                                           <div>
                                              <p className="text-sm font-black text-slate-800">{e.nome}</p>
                                              <p className="text-[9px] font-black text-slate-400 uppercase">{e.veiculo} â€¢ Inativo</p>
                                           </div>
                                        </div>
                                        <button 
                                           onClick={() => {
                                              setEntregadores([...entregadores, { ...e, status: 'disponivel', destino: null, destinoCoords: null, lojaOrigem: null, lojaCoords: null }]);
                                              setInativos(inativos.filter(i => i.id !== e.id));
                                           }}
                                           className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-shopee-orange transition-all"
                                        >
                                           Reativar
                                        </button>
                                     </div>
                                  ))}
                                  {inativos.length === 0 && (
                                     <p className="text-center py-10 text-[10px] font-black text-slate-400 uppercase">Nenhum entregador inativo</p>
                                  )}
                               </div>
                            </div>
                          ) : activeLogisticsSubTab === 'aprovacoes' ? (
                            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">AprovaÃ§Ãµes de Entregadores</h3>
                               <div className="space-y-4">
                                  {allProfiles.filter(p => p.role === 'entregador' && p.status_aprovacao !== 'aprovado').map(e => (
                                     <div key={e.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4 hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                           <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg italic">
                                                 {(e.nome || e.full_name || '?').charAt(0)}
                                              </div>
                                              <div>
                                                 <p className="text-sm font-black text-slate-800">{e.nome || e.full_name || 'Sem Nome'}</p>
                                                 <p className="text-[10px] font-bold text-slate-400">{e.email || 'Sem E-mail'} â€¢ {e.telefone || 'Sem Telefone'}</p>
                                                 <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                                                    e.status_aprovacao === 'em_analise' ? 'bg-orange-100 text-orange-600 animate-pulse' :
                                                    e.status_aprovacao === 'rejeitado' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                                                 }`}>
                                                    {e.status_aprovacao === 'em_analise' ? 'Aguardando Análise' : e.status_aprovacao === 'rejeitado' ? 'Rejeitado / Corrigir' : 'Aguardando Documentos'}
                                                 </span>
                                              </div>
                                           </div>
                                           <div className="flex gap-2">
                                              <button 
                                                 onClick={async () => {
                                                    const ok = window.confirm('Deseja realmente aprovar este entregador?');
                                                    if (!ok) return;
                                                    const { error } = await supabase.from('profiles').update({ status_aprovacao: 'aprovado' }).eq('id', e.id);
                                                    if (!error) {
                                                       alert('Entregador aprovado com sucesso! Ele agora tem acesso total ao painel.');
                                                       fetchRealData();
                                                    } else {
                                                       alert('Erro ao aprovar: ' + error.message);
                                                    }
                                                 }}
                                                 className="px-4 py-2.5 bg-green-500 text-white text-[10px] font-black uppercase rounded-xl hover:bg-green-600 shadow-lg shadow-green-500/10"
                                              >
                                                 Aprovar Cadastro
                                              </button>
                                              <button 
                                                 onClick={async () => {
                                                    const motivo = window.prompt('Motivo da rejeiÃ§Ã£o/correÃ§Ã£o (serÃ¡ exibido para o entregador):');
                                                    if (motivo === null) return;
                                                    const { error } = await supabase.from('profiles').update({ status_aprovacao: 'rejeitado', motivo_rejeicao: motivo }).eq('id', e.id);
                                                    if (!error) {
                                                       alert('Cadastro rejeitado e notificado.');
                                                       fetchRealData();
                                                    } else {
                                                       alert('Erro ao rejeitar: ' + error.message);
                                                    }
                                                 }}
                                                 className="px-4 py-2.5 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-xl hover:bg-red-200"
                                              >
                                                 Solicitar CorreÃ§Ã£o
                                              </button>
                                           </div>
                                        </div>

                                        {/* Detalhes do VeÃ­culo e EndereÃ§o */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 text-xs font-bold text-slate-600">
                                           <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">VeÃ­culo</p>
                                              <p className="text-slate-800 uppercase">{e.veiculo_tipo || 'NÃ£o informado'} {e.veiculo_modelo && `(${e.veiculo_modelo})`}</p>
                                              {e.veiculo_placa && <p className="text-[9px] font-mono text-slate-500">Placa: {e.veiculo_placa}</p>}
                                           </div>
                                           <div className="bg-white p-3 rounded-2xl border border-slate-100 col-span-2">
                                              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">EndereÃ§o Residencial</p>
                                              <p className="text-slate-800">{e.endereco || 'NÃ£o informado'}</p>
                                           </div>
                                        </div>

                                        {/* Fotos / Documentos Enviados */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-200/60">
                                           <div className="space-y-1">
                                              <p className="text-[8px] font-black text-slate-400 uppercase">Selfie c/ CNH</p>
                                              {e.selfie_url ? (
                                                 <a href={e.selfie_url} target="_blank" rel="noreferrer" className="block relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                                                    <img src={e.selfie_url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase">Ver Selfie</div>
                                                 </a>
                                              ) : (
                                                 <div className="aspect-square bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[9px] font-black text-slate-400 uppercase">NÃ£o enviado</div>
                                              )}
                                           </div>

                                           <div className="space-y-1">
                                              <p className="text-[8px] font-black text-slate-400 uppercase">Foto da CNH</p>
                                              {e.cnh_url ? (
                                                 <a href={e.cnh_url} target="_blank" rel="noreferrer" className="block relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group flex items-center justify-center bg-slate-950">
                                                    <img src={e.cnh_url} className="max-w-full max-h-full object-contain" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase">Ver CNH</div>
                                                 </a>
                                              ) : (
                                                 <div className="aspect-square bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[9px] font-black text-slate-400 uppercase">NÃ£o enviado</div>
                                              )}
                                           </div>

                                           <div className="space-y-1">
                                              <p className="text-[8px] font-black text-slate-400 uppercase">Foto do VeÃ­culo</p>
                                              {e.veiculo_foto_url ? (
                                                 <a href={e.veiculo_foto_url} target="_blank" rel="noreferrer" className="block relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group flex items-center justify-center bg-slate-950">
                                                    <img src={e.veiculo_foto_url} className="max-w-full max-h-full object-contain" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase">Ver VeÃ­culo</div>
                                                 </a>
                                              ) : (
                                                 <div className="aspect-square bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[9px] font-black text-slate-400 uppercase">NÃ£o enviado</div>
                                              )}
                                           </div>

                                           <div className="space-y-1">
                                              <p className="text-[8px] font-black text-slate-400 uppercase">ResidÃªncia</p>
                                              {e.comprovante_residencia_url ? (
                                                 <a href={e.comprovante_residencia_url} target="_blank" rel="noreferrer" className="block relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group flex items-center justify-center bg-slate-950">
                                                    <img src={e.comprovante_residencia_url} className="max-w-full max-h-full object-contain" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase">Ver Comprovante</div>
                                                 </a>
                                              ) : (
                                                 <div className="aspect-square bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[9px] font-black text-slate-400 uppercase">NÃ£o enviado</div>
                                              )}
                                           </div>
                                        </div>
                                        {e.motivo_rejeicao && (
                                           <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
                                              <p className="text-[8px] font-black text-red-400 uppercase mb-0.5">Motivo da RejeiÃ§Ã£o:</p>
                                              <p>{e.motivo_rejeicao}</p>
                                           </div>
                                        )}
                                     </div>
                                  ))}
                                  {allProfiles.filter(p => p.role === 'entregador' && p.status_aprovacao !== 'aprovado').length === 0 && (
                                     <div className="py-12 text-center space-y-2 opacity-30">
                                        <ShieldCheck size={48} className="mx-auto text-green-500" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma aprovaÃ§Ã£o pendente!</p>
                                     </div>
                                  )}
                               </div>
                            </div>
                         ) : null}
                      </div>

                      {/* Fleet List / Queue */}
                      <div className="lg:col-span-1 space-y-4">
                         <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 h-full overflow-y-auto max-h-[700px] custom-scrollbar">
                            <div className="flex justify-between items-center mb-4">
                               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Despacho Inteligente (Match)</h3>
                               {selectedForBatch.length > 1 && (
                                  <button onClick={handleAgrupar} className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase shadow-lg hover:bg-shopee-orange transition-all flex items-center gap-2">
                                     <Package size={12} /> Agrupar ({selectedForBatch.length})
                                  </button>
                               )}
                            </div>
                            <div className="space-y-4">
                               {pedidosPendentes.map(p => {
                                  const sugestao = getSuggestedEntregador(p.lat, p.lng);
                                  const isCritical = p.minutosEspera > 10;
                                  const isWarning = p.minutosEspera > 5 && p.minutosEspera <= 10;

                                  return (
                                     <div key={p.id} className={`p-4 rounded-3xl border transition-all space-y-3 ${
                                        isCritical ? 'bg-red-50 border-red-100 ring-2 ring-red-500/10' : 
                                        isWarning ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'
                                     }`}>
                                        <div className="flex justify-between items-start">
                                           <div>
                                              <div className="flex items-center gap-2">
                                                 <input 
                                                    type="checkbox" 
                                                    checked={selectedForBatch.includes(p.fullId)}
                                                    onChange={(e) => {
                                                       if(e.target.checked) setSelectedForBatch([...selectedForBatch, p.fullId]);
                                                       else setSelectedForBatch(selectedForBatch.filter(id => id !== p.fullId));
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-shopee-orange focus:ring-shopee-orange"
                                                 />
                                                 <p className="text-[10px] font-black text-shopee-orange uppercase">Pedido #{p.id}</p>
                                                 {isCritical && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" title="CrÃ­tico" />}
                                              </div>
                                                                                              <p className="text-xs font-black text-slate-800">{p.cliente}</p>
                                               {p.telefone && <p className="text-[9px] font-bold text-slate-400">{p.telefone}</p>}

                                           </div>
                                           <div className="text-right">
                                              <p className="text-xs font-black text-slate-800">R$ {p.valor.toFixed(2)}</p>
                                              <div className={`text-[8px] font-black flex items-center gap-1 justify-end ${isCritical ? 'text-red-500' : 'text-slate-400'}`}>
                                                 <Clock size={8} /> {p.minutosEspera}min
                                              </div>
                                           </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                           <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                                           <div className="flex-1">
                                              <p className="text-[9px] text-slate-500 font-medium leading-tight mb-1">{p.destino}</p>
                                              {(() => {
                                                 const zone = getPedidoZone(p.lat, p.lng);
                                                 if (zone) {
                                                    return (
                                                       <div className="flex items-center gap-1.5">
                                                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: zone.color }} />
                                                          <p className="text-[8px] font-black uppercase text-slate-400">Zona: {zone.nome} â€¢ Taxa: R$ {zone.taxa.toFixed(2)}</p>
                                                       </div>
                                                    );
                                                 }
                                                 return <p className="text-[8px] font-black uppercase text-red-400">Fora de Ã¡rea coberta</p>;
                                              })()}
                                           </div>
                                        </div>
                                        
                                        {p.status === 'aguardando_pagamento' ? (
                                           <div className="pt-3 border-t border-slate-200">
                                              <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Controle Financeiro:</p>
                                              <button 
                                                  onClick={async () => {
                                                     const { error } = await supabase.from('pedidos').update({ status: 'pendente' }).eq('id', p.fullId);
                                                     if (!error) {
                                                       fetchRealData();
                                                       localStorage.setItem('capelgo_admin_payment', JSON.stringify({ pedidoId: p.fullId, timestamp: Date.now() }));
                                                       window.dispatchEvent(new Event('storage'));
                                                     } else alert('Erro ao confirmar pagamento: ' + error.message);
                                                  }}
                                                  className="w-full bg-green-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                               >
                                                  <DollarSign size={14} /> Confirmar PIX
                                               </button>
                                           </div>
                                        ) : ['pendente', 'pago', 'em_preparo'].includes(p.status) ? (
                                           <div className="pt-3 border-t border-slate-200 flex items-center gap-2 text-orange-500">
                                              <Clock size={12} />
                                              <p className="text-[8px] font-black uppercase">Aguardando Lojista Preparar</p>
                                           </div>
                                         ) : (
                                            <div className="pt-3 border-t border-slate-200">
                                               <button
                                                  onClick={() => setDispatchForPedido(p)}
                                                  className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-[9px] font-black uppercase hover:bg-shopee-orange transition-all flex items-center justify-center gap-2"
                                               >
                                                  <Truck size={14} /> Escolher Motorista
                                               </button>
                                            </div>
                                         )}
                                     </div>
                                  );
                               })}

                               {pedidosPendentes.length === 0 && (
                                  <div className="py-10 text-center space-y-3">
                                     <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                        <CheckSquare size={20} className="text-slate-200" />
                                     </div>
                                     <p className="text-[10px] text-slate-400 font-black uppercase">Tudo limpo! Fila vazia.</p>
                                  </div>
                                )}
                            </div>
                         </div>
                      </div>
                                   </div>
                 </div>
              )}


               {activeTab === 'lojas' && (
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <div>
                           <h2 className="text-xl font-black text-slate-800 tracking-tighter">Gestão de Lojas</h2>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Controle de Parceiros e Marketplace</p>
                        </div>
                        <div className="flex gap-4 items-end">
                           <button 
                              onClick={() => {
                                 fetchCategorias();
                                 setShowCategoriasModal(true);
                              }}
                              className="px-6 py-3 bg-white border border-slate-200 text-slate-800 rounded-2xl text-[10px] font-black uppercase hover:border-shopee-orange transition-all flex items-center gap-2"
                           >
                              <Layout size={14} /> Gerenciar Categorias
                           </button>
                            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                            {[
                               { label: 'Todas', value: 'todos' },
                               { label: 'Ativas', value: 'ativo' },
                               { label: 'Inativas', value: 'inativas' }
                            ].map(f => (
                               <button 
                                  key={f.value}
                                  onClick={() => setLojaStatusFilter(f.value)} 
                                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${lojaStatusFilter === f.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                               >
                                  {f.label}
                               </button>
                            ))}
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-3 bg-white p-4 rounded-[32px] shadow-sm border border-slate-100">
                        <div className="relative flex-1 max-w-xs">
                           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                           <input
                              type="text"
                              placeholder="Buscar loja por nome..."
                              value={lojaSearch}
                              onChange={(e) => setLojaSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-shopee-orange/50"
                           />
                        </div>
                     </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         {lojas.filter(l => {
                            const statusMatch = lojaStatusFilter === 'todos' || (lojaStatusFilter === 'inativas' ? l.status !== 'ativo' : l.status === lojaStatusFilter);
                            const searchTerm = lojaSearch.toLowerCase();
                            const searchMatch = !searchTerm || (l.nome || '').toLowerCase().includes(searchTerm);
                            return statusMatch && searchMatch;
                         }).map(loja => (
                           <div key={loja.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 group hover:border-shopee-orange transition-all">
                              <div className="flex justify-between items-start mb-6">
                                 <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-black group-hover:bg-shopee-orange transition-colors">
                                    {(loja.nome || '?').charAt(0)}
                                 </div>
                                 <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                                    loja.status === 'ativo' ? 'bg-green-100 text-green-600' :
                                    loja.status === 'pendente' ? 'bg-orange-100 text-shopee-orange animate-pulse' :
                                    'bg-red-100 text-red-600'
                                 }`}>
                                    {loja.status}
                                 </div>
                              </div>
                               <h3 className="text-sm font-black text-slate-800 mb-1">{loja.nome}</h3>
                               <p className="text-[10px] text-slate-400 font-black uppercase mb-1">{loja.categoria}</p>
                               {loja.endereco && <p className="text-[9px] text-slate-400 mb-4 truncate"><MapPin size={10} className="inline mr-1" />{loja.endereco}</p>}
                              
                              <div className="grid grid-cols-2 gap-2 mb-6">
                                 <div className="bg-slate-50 p-3 rounded-2xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Vendas</p>
                                    <p className="text-xs font-black text-slate-800">R$ {loja.totalVendas}</p>
                                 </div>
                                 <div className="bg-slate-50 p-3 rounded-2xl">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Nota</p>
                                    <p className="text-xs font-black text-slate-800 flex items-center gap-1"><Star size={10} fill="#FF4D2D" className="text-shopee-orange" /> {loja.avaliacao || 'N/A'}</p>
                                 </div>
                              </div>

                               <div className="flex flex-col gap-2">
                                  {loja.status === 'pendente' ? (
                                     <button 
                                        onClick={() => setLojas(lojas.map(l => l.id === loja.id ? { ...l, status: 'ativo' } : l))}
                                        className="w-full bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-shopee-orange transition-all"
                                     >
                                        Aprovar Loja
                                     </button>
                                  ) : (
                                     <button className="w-full bg-slate-100 text-slate-800 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all">Ver Produtos</button>
                                  )}
                                  <button
                                     onClick={() => setEditCoordsLoja({ id: loja.id, nome: loja.nome, endereco: loja.endereco, latitude: loja.latitude || '', longitude: loja.longitude || '' })}
                                     className="w-full bg-blue-50 text-blue-600 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-100 transition-all"
                                  >
                                     <MapPin size={12} className="inline mr-1" /> Coordenadas
                                  </button>
                                  <button 
                                     onClick={() => setLojas(lojas.map(l => l.id === loja.id ? { ...l, status: loja.status === 'bloqueado' ? 'ativo' : 'bloqueado' } : l))}
                                     className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
                                        loja.status === 'bloqueado' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                     }`}
                                  >
                                     {loja.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                                  </button>
                                 {/* <button 
                                    onClick={() => setIsMapExpanded(!isMapExpanded)}
                                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl shadow-lg border text-[9px] font-black uppercase flex items-center gap-1.5 transition-all"
                                 >
                                    {isMapExpanded ? (
                                       <>
                                          <Minimize2 size={12} className="text-slate-600" /> Minimizar
                                       </>
                                    ) : (
                                       <>
                                          <Maximize2 size={12} className="text-slate-600" /> Maximizar
                                       </>
                                    )}
                                 </button> */}
                              </div>
                           </div>
                        ))}
                     </div>
                   </div>
                )}

        {/* Modal Editar Coordenadas da Loja */}
        {editCoordsLoja && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl space-y-6">
              <h3 className="text-lg font-black tracking-tight">Coordenadas - {editCoordsLoja.nome}</h3>

              {editCoordsLoja.endereco && (
                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl">
                  <MapPin size={12} className="inline mr-1" />
                  {editCoordsLoja.endereco}
                </p>
              )}

              <button
                onClick={async () => {
                  const addr = editCoordsLoja.endereco?.trim();
                  if (!addr) { alert('Loja sem endereço cadastrado.'); return; }
                  try {
                    const opts = { headers: { 'User-Agent': 'CapelGoApp/1.0' } };
                    const cep = (addr.match(/\d{5}-?\d{2,3}/) || [])[0]?.replace(/-/, '');
                    let data;
                    if (cep) {
                      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${cep}&country=Brazil&limit=1`, opts);
                      data = await res.json();
                    }
                    if (!data?.[0]) {
                      const q = encodeURIComponent((addr.replace(/\([^)]*\)/g, '').match(/^([^,]+(?:,\s*\d+)?)/) || [])[1] + ', São Paulo');
                      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=br`, opts);
                      data = await res.json();
                    }
                    if (data?.[0]) {
                      setEditCoordsLoja(prev => ({ ...prev, latitude: data[0].lat, longitude: data[0].lon }));
                    } else {
                      alert('Endereço não encontrado no mapa.');
                    }
                  } catch { alert('Erro ao buscar endereço.'); }
                }}
                className="w-full bg-blue-50 text-blue-600 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
              >
                <Navigation size={12} /> Buscar Coordenadas pelo Endereço
              </button>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latitude</label>
                  <input
                    type="number" step="any"
                    value={editCoordsLoja.latitude}
                    onChange={(e) => setEditCoordsLoja({ ...editCoordsLoja, latitude: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange mt-1"
                    placeholder="-23.4892"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitude</label>
                  <input
                    type="number" step="any"
                    value={editCoordsLoja.longitude}
                    onChange={(e) => setEditCoordsLoja({ ...editCoordsLoja, longitude: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange mt-1"
                    placeholder="-46.4839"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditCoordsLoja(null)}
                  className="flex-1 bg-slate-100 text-slate-800 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCoordsLoja}
                  disabled={savingCoords}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-shopee-orange transition-all disabled:opacity-50"
                >
                  {savingCoords ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
         )}

        {/* Modal Escolher Motorista */}
        {dispatchForPedido && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-black tracking-tight">Escolher Motorista</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido #{dispatchForPedido.id} — {dispatchForPedido.cliente}</p>
                </div>
                <button onClick={() => setDispatchForPedido(null)} className="p-2 text-slate-400 hover:text-slate-800"><X size={20}/></button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-3xl shrink-0">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <div className="text-xs font-bold text-slate-600 truncate">{dispatchForPedido.destino}</div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                {entregadores.filter(e => e.online).length === 0 && (
                  <div className="py-8 text-center text-[10px] font-black text-slate-400 uppercase">Nenhum motorista online no momento</div>
                )}
                {entregadores
                  .filter(e => e.online)
                  .map(e => {
                    const distToCustomer = calculateDistance(dispatchForPedido.lat, dispatchForPedido.lng, e.lat, e.lng) * 111;
                    const isDisponivel = e.status === 'disponivel';
                    return (
                      <div
                        key={e.id}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer hover:shadow-md ${
                          isDisponivel ? 'bg-white border-slate-100 hover:border-shopee-orange' : 'bg-slate-50 border-slate-100 opacity-60'
                        }`}
                        onClick={() => {
                          if (!isDisponivel) return;
                          handleDispatchPedido(dispatchForPedido, e);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">
                              {e.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{e.nome}</p>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isDisponivel ? 'bg-green-500' : 'bg-orange-500'}`} />
                                <p className="text-[8px] font-black uppercase text-slate-400">{isDisponivel ? 'Disponível' : 'Em entrega'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400">{e.veiculo || 'Moto'}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-0.5 justify-end">
                              <Star size={8} className="text-shopee-orange" fill="currentColor" /> {e.avaliacao || '5.0'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500">
                          <div className="flex items-center gap-1">
                            <Navigation size={10} className="text-slate-400" />
                            <span>{distToCustomer.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ShoppingBag size={10} className="text-slate-400" />
                            <span>{e.entregas || 0} entregas</span>
                          </div>
                        </div>
                        {!isDisponivel && (
                          <p className="mt-2 text-[8px] font-black text-orange-400 uppercase">Finalizando entrega anterior...</p>
                        )}
                        {isDisponivel && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-[9px] font-black text-green-500 uppercase flex items-center gap-1">
                              <Truck size={12} /> Clique para atribuir este pedido
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

               {activeTab === 'tarefas' && (
                <TarefasCenter supabase={supabase} />
              )}


                   {activeTab === 'cupons' && (
                     <div className="space-y-6 animate-in fade-in duration-500">
                       <div className="flex justify-between items-end">
                         <div>
                           <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Cupons & Ofertas</h2>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Gestão de CÃ³digos de Desconto e PromoÃ§Ãµes RelÃ¢mpago</p>
                         </div>
                         <button className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-shopee-orange transition-all shadow-xl">
                           + Criar Novo Cupom
                         </button>
                       </div>

                       <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-[32px] shadow-sm border border-slate-100">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                           {[
                              { label: 'Todos', value: 'todos' },
                              { label: 'Ativos', value: 'ativos' },
                              { label: 'Expirados', value: 'expirados' }
                           ].map(c => (
                              <button
                                 key={c.value}
                                 onClick={() => setCupomStatusFilter(c.value)}
                                 className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${cupomStatusFilter === c.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                              >
                                 {c.label}
                              </button>
                           ))}
                        </div>
                        <div className="relative flex-1 max-w-xs">
                           <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                           <input
                              type="text"
                              placeholder="Buscar por cÃ³digo do cupom..."
                              value={cupomSearch}
                              onChange={(e) => setCupomSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-shopee-orange/50"
                           />
                        </div>
                     </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {/* Exemplo de Cupons Ativos */}
                         <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-shopee-orange transition-all">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-slate-50 rounded-full group-hover:bg-orange-50 transition-colors" />
                            <div className="flex justify-between items-start mb-6 relative z-10">
                               <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black italic">10%</div>
                               <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[8px] font-black uppercase">Ativo</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-1">CAPELGO10</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Desconto de 10% em toda a loja</p>
                            <div className="flex justify-between items-center pt-6 border-t border-slate-50 relative z-10">
                               <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase">Usos</p>
                                  <p className="text-sm font-black text-slate-800">45/100</p>
                               </div>
                               <button className="p-2 text-slate-300 hover:text-shopee-orange transition-colors"><Edit size={18}/></button>
                            </div>
                         </div>
                       </div>
                     </div>
                   )}

                  {activeTab === 'crescimento' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      {/* Header EstratÃ©gico */}
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                         <div>
                            <div className="flex items-center gap-3 mb-2">
                               <h2 className="text-5xl font-black text-slate-800 tracking-tighter">Central de Crescimento</h2>
                               <div className="bg-shopee-orange text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-shopee-orange/20 animate-pulse">Ermelino Matarazzo</div>
                            </div>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em]">Receita, Engajamento e Performance de Retail Media</p>
                         </div>
                         
                         {/* Filtro Global por Loja Parceira */}
                         <div className="bg-white p-4 rounded-[32px] shadow-xl border border-slate-100 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                               <Store size={18} className="text-shopee-orange" />
                               <span className="text-[10px] font-black uppercase text-slate-400">Loja Parceira:</span>
                            </div>
                            <select 
                               value={growthMerchantFilter} 
                               onChange={(e) => setGrowthMerchantFilter(e.target.value)}
                               className="bg-slate-50 border-none text-xs font-black uppercase rounded-2xl px-6 py-3 focus:ring-2 focus:ring-shopee-orange cursor-pointer"
                            >
                               <option value="todos">Todos os Lojistas</option>
                               {lojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                            </select>
                         </div>
                      </div>

                      {/* Widgets de Performance (KPIs) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                            <TrendingUp className="absolute top-4 right-4 text-shopee-orange opacity-20" size={80} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Receita Extra (Ads)</p>
                            <h3 className="text-3xl font-black tracking-tighter">R$ {(banners.length * 150 + (marketplaceProducts?.filter(p => p.promotion_status === 'approved').length || 0) * 85).toFixed(2)}</h3>
                            <div className="mt-4 flex items-center gap-2 text-green-400 text-[10px] font-black uppercase">
                               <ArrowUpRight size={14} /> +14% vs ontem
                            </div>
                         </div>

                         <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Engajamento (Prêmios)</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{premiosGanhos.length} Resgates</h3>
                            <div className="mt-4 flex items-center gap-2 text-shopee-orange text-[10px] font-black uppercase">
                               <Gift size={14} /> Vila Santa Inês Ativa
                            </div>
                         </div>

                         <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Alcance PublicitÃ¡rio</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{banners.reduce((acc, b) => acc + (b.cliques || 0), 0) + clickStats.length} Cliques</h3>
                            <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Retail Media Ativo</p>
                         </div>

                         <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">ConversÃ£o Simulada</p>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">4.2%</h3>
                            <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-green-500 w-[42%]" />
                            </div>
                         </div>
                      </div>

                      {/* ðŸ›¡ï¸ CENTRAL DE MODERAÃ‡ÃƒO DE CRESCIMENTO */}
                      <div className="bg-white rounded-[48px] p-10 border-2 border-slate-900 shadow-xl space-y-8 animate-in zoom-in-95 duration-500">
                         <div className="flex justify-between items-center">
                            <div>
                               <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
                                  <ShieldCheck className="text-shopee-orange" />
                                  ModeraÃ§Ã£o de Destaques
                               </h3>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aprovar ou Recusar Pedidos de Lojistas</p>
                            </div>
                            <div className="bg-orange-100 text-shopee-orange px-4 py-2 rounded-2xl text-[10px] font-black uppercase">
                               {marketplaceProducts.filter(p => p.promotion_status === 'pending').length + lojas.filter(l => l.featured_status === 'pending').length} Pendentes
                            </div>
                         </div>

                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Solicitações de Produtos */}
                            <div className="space-y-4">
                               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Package size={14} /> Produtos Patrocinados
                               </h4>
                               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {marketplaceProducts.filter(p => p.promotion_status === 'pending').map(p => (
                                     <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                           <img src={p.imagem_url} className="w-10 h-10 rounded-xl object-cover" />
                                           <div>
                                              <p className="text-xs font-black text-slate-800 truncate max-w-[120px]">{p.nome}</p>
                                              <p className="text-[8px] font-bold text-slate-400 uppercase">{p.lojas?.nome || 'Loja'}</p>
                                           </div>
                                        </div>
                                        <div className="flex gap-2">
                                           <button 
                                              onClick={async () => {
                                                 const { error } = await supabase.from('produtos').update({ promotion_status: 'approved' }).eq('id', p.id);
                                                 if(!error) { await supabase.from('ads_pagamentos').update({ status: 'aprovado' }).eq('item_id', p.id).eq('status', 'pendente'); setMarketplaceProducts(marketplaceProducts.map(prod => prod.id === p.id ? { ...prod, promotion_status: 'approved' } : prod)); fetchRealData(); }
                                              }}
                                              className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg"
                                           >
                                              Aprovar
                                           </button>
                                           <button 
                                              onClick={async () => {
                                                 console.log('Recusar produto:', p.id); const { error } = await supabase.from('produtos').update({ promotion_status: 'none' }).eq('id', p.id);
                                                 if(!error) { 
                                                     await supabase.from('ads_pagamentos').update({ status: 'recusado' }).eq('item_id', p.id).eq('status', 'pendente'); setMarketplaceProducts(marketplaceProducts.map(prod => prod.id === p.id ? { ...prod, promotion_status: 'none' } : prod)); 
                                                     fetchRealData(); 
                                                  } else {
                                                     alert("Erro ao recusar produto: " + error.message);
                                                  }
                                              }}
                                              className="p-2 bg-slate-200 text-slate-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                           >
                                              X
                                           </button>
                                        </div>
                                     </div>
                                  ))}
                                  {marketplaceProducts.filter(p => p.promotion_status === 'pending').length === 0 && (
                                     <p className="text-center py-6 text-[10px] font-bold text-slate-300 uppercase">Nenhum produto pendente</p>
                                  )}
                               </div>
                            </div>

                            {/* Solicitações de Lojas */}
                            <div className="space-y-4">
                               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                  <Store size={14} /> Lojas em Destaque
                               </h4>
                               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {lojas.filter(l => l.featured_status === 'pending').map(l => (
                                     <div key={l.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic">{l.nome.charAt(0)}</div>
                                           <div>
                                              <p className="text-xs font-black text-slate-800">{l.nome}</p>
                                              <p className="text-[8px] font-bold text-slate-400 uppercase">{l.categoria}</p>
                                           </div>
                                        </div>
                                        <div className="flex gap-2">
                                           <button 
                                              onClick={async () => {
                                                 
                                                 const { data, error } = await supabase.from('lojas').update({ featured_status: 'approved' }).eq('id', l.id).select();
                                                 if(!error) { 
                                                     
                                                     await supabase.from('ads_pagamentos').update({ status: 'aprovado' }).eq('item_id', l.id).eq('status', 'pendente'); setLojas(lojas.map(loja => loja.id === l.id ? { ...loja, featured_status: 'approved' } : loja)); 
                                                     fetchRealData(); 
                                                 } else { window.alert('Erro: ' + error.message); }
                                              }}
                                              className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
                                           >
                                              Aprovar
                                           </button>
                                           <button 
                                              onClick={async () => {
                                                 const { data, error } = await supabase.from('lojas').update({ featured_status: 'none' }).eq('id', l.id).select();
                                                 if(!error) { 
                                                     
                                                     await supabase.from('ads_pagamentos').update({ status: 'recusado' }).eq('item_id', l.id).eq('status', 'pendente'); setLojas(prev => prev.map(loja => loja.id === l.id ? { ...loja, featured_status: 'none' } : loja)); 
                                                  } else {
                                                     window.alert("Erro ao recusar loja: " + error.message);
                                                  }
                                              }}
                                              className="p-2 bg-slate-200 text-slate-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                           >
                                              X
                                           </button>
                                        </div>
                                     </div>
                                  ))}
                                  {lojas.filter(l => l.featured_status === 'pending').length === 0 && (
                                     <p className="text-center py-6 text-[10px] font-bold text-slate-300 uppercase">Nenhuma loja pendente</p>
                                  )}
                               </div>
                            </div>

                         </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         {/* CARD: PUBLICIDADE & RETAIL MEDIA */}
                         <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm space-y-8">
                            <div className="flex justify-between items-center">
                               <div>
                                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Retail Media & Publicidade</h3>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestão de Banners e Produtos Patrocinados</p>
                               </div>
                               <button onClick={() => setIsAddingBanner(true)} className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-shopee-orange transition-all shadow-lg">
                                  <Plus size={24} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                               {banners.filter(b => growthMerchantFilter === 'todos' || b.link_url?.includes(growthMerchantFilter)).map(banner => (
                                  <div key={banner.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 group">
                                     <div className="w-20 aspect-video rounded-xl overflow-hidden bg-white shrink-0">
                                        <img src={banner.imagem_url} className="w-full h-full object-cover" />
                                     </div>
                                     <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-800 uppercase truncate">{banner.link_url || 'Banner Institucional'}</p>
                                        <div className="flex gap-4 mt-1">
                                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{banner.cliques} Cliques</span>
                                           <span className={`text-[9px] font-black uppercase ${banner.ativo ? 'text-green-500' : 'text-slate-400'}`}>{banner.ativo ? 'Ativo' : 'Pausado'}</span>
                                        </div>
                                     </div>
                                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(banner)} className="p-2 text-slate-400 hover:text-shopee-orange"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteBanner(banner.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                     </div>
                                  </div>
                               ))}
                            </div>

                            {/* Gestão de Lojistas Destaque */}
                            <div className="pt-8 border-t border-slate-100">
                               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Lojistas em Destaque (Ermelino)</h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {lojas.slice(0, 4).map(loja => (
                                     <div key={loja.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[28px] shadow-sm">
                                        <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic">
                                              {loja.nome.charAt(0)}
                                           </div>
                                           <div>
                                              <p className="text-xs font-black text-slate-800">{loja.nome}</p>
                                              <p className="text-[8px] font-black text-shopee-orange uppercase">Lojista Parceiro</p>
                                           </div>
                                        </div>
                                        <button 
                                           onClick={async () => {
                                              const newStatus = loja.featured_status === 'approved' ? 'none' : 'approved';
                                              const { error } = await supabase.from('lojas').update({ featured_status: newStatus }).eq('id', loja.id);
                                              if (!error) {
                                                 setLojas(lojas.map(l => l.id === loja.id ? { ...l, featured_status: newStatus } : l));
                                                 fetchRealData();
                                              }
                                           }}
                                           className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                                              loja.featured_status === 'approved' ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'
                                            }`}
                                        >
                                           {loja.featured_status === 'approved' ? 'â­ Destaque' : 'Fixar'}
                                        </button>
                                     </div>
                                  ))}
                               </div>
                            </div>

                            {/* ðŸ’° AUDITORIA DE PAGAMENTOS DE ADS */}
                            <div className="pt-8 border-t border-slate-100">
                               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                  <DollarSign size={14} className="text-green-500" /> Extrato de Vendas de Ads
                                </h4>
                                <div className="bg-slate-50 rounded-[32px] p-2 border border-slate-100 overflow-hidden">
                                  <table className="w-full text-left">
                                     <thead className="bg-white/50 text-[8px] font-black uppercase text-slate-400 border-b border-slate-100">
                                        <tr>
                                           <th className="px-6 py-4">Lojista / Item</th>
                                           <th className="px-6 py-4">Plano</th>
                                           <th className="px-6 py-4 text-green-600">Valor</th>
                                           <th className="px-6 py-4">Status</th>
                                        </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-100">
                                        {adsPagamentos.map(pay => (
                                           <tr key={pay.id} className="hover:bg-white transition-colors">
                                              <td className="px-6 py-4">
                                                 <p className="text-[10px] font-black text-slate-800">{pay.item_nome}</p>
                                                 <p className="text-[7px] font-bold text-slate-400 uppercase">{pay.tipo}</p>
                                              </td>
                                              <td className="px-6 py-4">
                                                 <p className="text-[9px] font-bold text-slate-600">{pay.plano_nome}</p>
                                                 <p className="text-[7px] text-slate-300">{new Date(pay.created_at).toLocaleDateString()}</p>
                                              </td>
                                              <td className="px-6 py-4">
                                                 <p className="text-[10px] font-black text-green-600">R$ {pay.valor?.toFixed(2)}</p>
                                              </td>
                                              <td className="px-6 py-4">
                                                 <span className={`px-2 py-1 rounded-full text-[7px] font-black uppercase ${
                                                    pay.status === 'aprovado' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                                 }`}>
                                                    {pay.status}
                                                 </span>
                                              </td>
                                           </tr>
                                        ))}
                                        {adsPagamentos.length === 0 && (
                                           <tr>
                                              <td colSpan={4} className="py-10 text-center text-[9px] font-black text-slate-300 uppercase">Nenhum pagamento registrado</td>
                                           </tr>
                                        )}
                                     </tbody>
                                  </table>
                                </div>
                            </div>
                         </div>

                         {/* CARD: GAMIFICAÃ‡ÃƒO & PERFORMANCE */}
                         <div className="space-y-8">
                            {/* Widget Roleta */}
                            <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm">
                               <div className="flex justify-between items-center mb-8">
                                  <div>
                                     <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Engajamento & Prêmios</h3>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Resgates Vila Santa Inês</p>
                                  </div>
                                  <div className="w-12 h-12 bg-orange-50 text-shopee-orange rounded-2xl flex items-center justify-center">
                                     <Gift size={24} />
                                  </div>
                               </div>
                               
                               <div className="space-y-4">
                                  {premiosGanhos.filter(p => growthMerchantFilter === 'todos' || p.lojas?.nome === growthMerchantFilter).slice(0, 6).map((p: any) => (
                                     <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                                              p.tipo === 'produto' ? 'bg-blue-500' : 'bg-orange-500'
                                           }`}>
                                              {p.tipo === 'produto' ? <Package size={18} /> : <Ticket size={18} />}
                                           </div>
                                           <div>
                                              <p className="text-xs font-black text-slate-800">{p.detalhes?.titulo || p.tipo}</p>
                                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.lojas?.nome || 'CapelGo'}</p>
                                           </div>
                                        </div>
                                        <div className="text-right">
                                           <p className="text-[9px] font-black text-slate-800 uppercase">{p.profiles?.nome?.split(' ')[0] || 'Cliente'}</p>
                                           <p className="text-[8px] text-slate-300">{new Date(p.created_at).toLocaleDateString()}</p>
                                        </div>
                                     </div>
                                  ))}
                                  {premiosGanhos.length === 0 && (
                                     <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase">Aguardando sorteios...</p>
                                  )}
                               </div>
                            </div>

                            {/* Widget Click Stream */}
                            <div className="bg-slate-900 text-white rounded-[48px] p-10 shadow-2xl overflow-hidden relative">
                               <Activity className="absolute bottom-[-20px] right-[-20px] text-shopee-orange opacity-5" size={200} />
                               <div className="flex justify-between items-center mb-8 relative z-10">
                                  <div>
                                     <h3 className="text-2xl font-black tracking-tighter">Click Stream Realtime</h3>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance de Retail Media</p>
                                  </div>
                                  <RefreshCw className="text-shopee-orange animate-spin" size={20} />
                               </div>

                               <div className="space-y-4 relative z-10">
                                  {clickStats.filter(c => growthMerchantFilter === 'todos' || c.produto?.nome?.toLowerCase().includes(growthMerchantFilter.toLowerCase())).slice(0, 5).map((c: any) => (
                                     <div key={c.id} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 group hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                           <img src={c.produto?.imagem_url || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-lg object-cover" />
                                           <div>
                                              <p className="text-[11px] font-black truncate max-w-[120px]">{c.produto?.nome}</p>
                                              <p className="text-[8px] font-black text-shopee-orange uppercase">Visualizado agora</p>
                                           </div>
                                        </div>
                                        <div className="text-right">
                                           <p className="text-[9px] font-black uppercase text-slate-400">{c.perfil?.nome || 'AnÃ´nimo'}</p>
                                           <p className="text-[8px] text-slate-600">{new Date(c.created_at).toLocaleTimeString()}</p>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'historico' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                        <div>
                          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Histórico Geral</h2>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Auditoria de Prêmios, Vendas e Engajamento</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-[32px] shadow-sm border border-slate-100">
                           <div className="flex items-center gap-2">
                              <Store size={16} className="text-slate-400" />
                              <select 
                                 className="bg-slate-50 border-none text-[10px] font-black uppercase rounded-xl px-4 py-2 focus:ring-2 focus:ring-shopee-orange"
                                 onChange={(e) => setHistoricoLojaFilter(e.target.value)}
                                 value={historicoLojaFilter}
                              >
                                 <option value="todas">Todas as Lojas</option>
                                 {lojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                              </select>
                           </div>
                            <DateFilterBar selectedDays={historicoFilterDays} onChange={setHistoricoFilterDays} />
                        </div>
                      </div>

                      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                              <th className="px-8 py-5">Evento / Item</th>
                              <th className="px-8 py-5">Lojista Parceiro</th>
                              <th className="px-8 py-5">Cliente</th>
                              <th className="px-8 py-5">Data & Hora</th>
                              <th className="px-8 py-5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {premiosGanhos
                              .filter(p => {
                                 const matchLoja = historicoLojaFilter === 'todas' || p.lojas?.nome === historicoLojaFilter;
                                 
                                 const dataPremio = new Date(p.created_at).getTime();
                                 const agora = new Date().getTime();
                                 const diasEmMs = historicoFilterDays * 24 * 60 * 60 * 1000;
                                 return matchLoja && (agora - dataPremio <= diasEmMs);
                              })
                              .map((p: any) => (
                              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${p.tipo === 'produto' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                                      {p.tipo === 'produto' ? <Package size={16} /> : <Ticket size={16} />}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-800">{p.detalhes?.titulo || 'PrÃªmio Especial'}</p>
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.tipo}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-5 text-xs font-bold text-slate-600">{p.lojas?.nome || 'CapelGo'}</td>
                                <td className="px-8 py-5 text-xs font-bold text-slate-600">{p.profiles?.nome || 'Cliente AnÃ´nimo'}</td>
                                <td className="px-8 py-5 text-xs text-slate-400">
                                  {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-8 py-5">
                                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest">ConcluÃ­do</span>
                                </td>
                              </tr>
                            ))}
                            {premiosGanhos.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhum registro encontrado no perÃ­odo</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                                    {activeTab === 'financeiro' && (
                      <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="flex justify-between items-end">
                            <div>
                               <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Fluxo Financeiro</h2>
                               <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">Gestão de Lucros e Repasses LogÃ­sticos</p>
                            </div>
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6">
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Taxa Base (Fixo)</p>
                                  <div className="flex items-center gap-2">
                                     <span className="text-lg font-black text-slate-800">R$</span>
                                     <input 
                                        type="number" 
                                        className="w-20 bg-slate-50 border-none rounded-xl p-2 text-sm font-black focus:ring-2 focus:ring-shopee-orange"
                                        value={financeStats.taxaPadrao}
                                        onChange={(e) => setFinanceStats({...financeStats, taxaPadrao: parseFloat(e.target.value) || 0})}
                                     />
                                  </div>
                               </div>
                               <div className="h-10 w-px bg-slate-100" />
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Taxa por KM</p>
                                  <div className="flex items-center gap-2">
                                     <span className="text-lg font-black text-slate-800">R$</span>
                                     <input 
                                        type="number" 
                                        step="0.10"
                                        className="w-20 bg-slate-50 border-none rounded-xl p-2 text-sm font-black focus:ring-2 focus:ring-shopee-orange"
                                        value={financeStats.taxaPorKm || 1.50}
                                        onChange={(e) => setFinanceStats({...financeStats, taxaPorKm: parseFloat(e.target.value) || 0})}
                                     />
                                  </div>
                               </div>
                               <div className="h-10 w-px bg-slate-100" />
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ComissÃ£o Venda</p>
                                  <div className="flex items-center gap-2">
                                     <input 
                                        type="number" 
                                        className="w-20 bg-slate-50 border-none rounded-xl p-2 text-sm font-black focus:ring-2 focus:ring-shopee-orange"
                                        value={financeStats.comissaoVendaPerc}
                                        onChange={(e) => setFinanceStats({...financeStats, comissaoVendaPerc: parseFloat(e.target.value) || 0})}
                                     />
                                     <span className="text-lg font-black text-slate-800">%</span>
                                  </div>
                               </div>
                               <div className="h-10 w-px bg-slate-100" />
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Logo da Plataforma</p>
                                  <div className="flex items-center gap-2">
                                     {systemSettings.plataforma_logo && (
                                        <img src={systemSettings.plataforma_logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-200" />
                                     )}
                                     <input 
                                        type="file"
                                        id="logo-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                           const file = e.target.files?.[0];
                                           if (!file) return;
                                           setIsUploadingLogo(true);
                                           try {
                                              const fileExt = file.name.split('.').pop();
                                              const fileName = `plataforma_logo_${Math.random()}.${fileExt}`;
                                              const filePath = `config/${fileName}`;
                                              const { error: uploadError } = await supabase.storage.from('loja-media').upload(filePath, file);
                                              if (uploadError) throw uploadError;
                                              const { data: { publicUrl } } = supabase.storage.from('loja-media').getPublicUrl(filePath);
                                              const { error: saveError } = await supabase.from('configuracoes_sistema').upsert({ chave: 'plataforma_logo', valor: publicUrl }, { onConflict: 'chave' });
                                              if (saveError) throw saveError;
                                              setSystemSettings({ ...systemSettings, plataforma_logo: publicUrl });
                                              alert('Logo da plataforma atualizada com sucesso!');
                                           } catch (err: any) {
                                              alert('Erro ao enviar logo: ' + err.message);
                                           } finally {
                                              setIsUploadingLogo(false);
                                           }
                                        }}
                                     />
                                     <button 
                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                        disabled={isUploadingLogo}
                                        className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200"
                                     >
                                        {isUploadingLogo ? 'Enviando...' : (systemSettings.plataforma_logo ? 'Alterar' : 'Enviar Logo')}
                                     </button>
                                  </div>
                               </div>
                               <button 
                                 onClick={async () => {
                                    const { error } = await supabase.from('configuracoes_sistema').upsert([
                                       { chave: 'taxas_entrega', valor: { fixa: financeStats.taxaPadrao, por_km: financeStats.taxaPorKm || 1.50 } },
                                       { chave: 'comissao_venda', valor: { percentual: financeStats.comissaoVendaPerc } }
                                    ], { onConflict: 'chave' });
                                    if (!error) alert('ConfiguraÃ§Ãµes financeiras salvas com sucesso!');
                                    else alert('Erro ao salvar: ' + error.message);
                                 }}
                                 className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-slate-200 hover:bg-shopee-orange transition-all"
                               >
                                  Salvar
                               </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                             <DateFilterBar selectedDays={financeiroFilterDays} onChange={setFinanceiroFilterDays} />
                          </div>

                          {(() => {
                          const historicoCompletoFiltrado = historicoCompleto.filter(p => {
                             const dataPedido = new Date(p.created_at).getTime();
                             const agora = new Date().getTime();
                             const diasEmMs = financeiroFilterDays * 24 * 60 * 60 * 1000;
                             return agora - dataPedido <= diasEmMs;
                          });
                          return (
                          <>
                          {/* Inject Novos RelatÃ³rios Financeiros Recharts */}
                          <AdminFinancialReports pedidos={historicoCompletoFiltrado} lojas={lojas} />

                          {/* Cards de Resumo */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-6"><DollarSign size={24} /></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento Bruto</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">R$ {historicoCompletoFiltrado.reduce((acc, curr) => acc + (curr.total || 0), 0).toFixed(2)}</h3>
                             </div>
                             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                                <div className="w-12 h-12 bg-orange-50 text-shopee-orange rounded-2xl flex items-center justify-center mb-6"><Bike size={24} /></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Repasse Entregadores</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">
                                   R$ {historicoCompletoFiltrado.filter(p => p.status === 'entregue').reduce((acc, curr) => acc + (financeStats.taxaPadrao), 0).toFixed(2)}
                                </h3>
                             </div>
                             <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={24} /></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lucro de ComissÃ£o</p>
                                <h3 className="text-3xl font-black text-shopee-orange tracking-tighter">R$ {historicoCompletoFiltrado.reduce((acc, curr) => acc + (curr.total * (financeStats.comissaoVendaPerc / 100)), 0).toFixed(2)}</h3>
                             </div>
                             <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 opacity-10"><ShieldCheck size={120} /></div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Lucro LÃ­quido Admin</p>
                                <h3 className="text-3xl font-black text-white tracking-tighter">
                                   R$ {(
                                      historicoCompletoFiltrado.reduce((acc, curr) => acc + (curr.total * (financeStats.comissaoVendaPerc / 100)), 0)
                                   ).toFixed(2)}
                                </h3>
                                <p className="text-[8px] font-bold text-green-400 mt-2">ðŸ“Š Plataforma SaudÃ¡vel</p>
                             </div>
                          </div>

                          {/* SeÃ§Ã£o de AprovaÃ§Ã£o de Saques */}
                          {saquesPendentes.length > 0 && (
                            <div className="bg-white rounded-[40px] shadow-sm border border-red-100 overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4">
                              <div className="p-8 border-b border-red-100 bg-red-50/50 flex justify-between items-center">
                                 <h3 className="font-black text-red-600 tracking-tighter flex items-center gap-2">
                                   <DollarSign size={20} /> Solicitações de Saque ({saquesPendentes.length})
                                 </h3>
                              </div>
                              <table className="w-full text-left">
                                 <thead className="bg-slate-50/50">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                       <th className="p-6">Lojista</th>
                                       <th className="p-6">Banco / Chave PIX</th>
                                       <th className="p-6">Titular</th>
                                       <th className="p-6 text-shopee-orange">Valor a Transferir</th>
                                       <th className="p-6 text-right">AÃ§Ãµes</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-50">
                                    {saquesPendentes.map(s => {
                                       const loja = lojas.find(l => l.id === s.loja_id);
                                       return (
                                          <tr key={s.id}>
                                             <td className="p-6">
                                                <p className="text-sm font-black text-slate-800">{loja?.nome || 'Loja Desconhecida'}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(s.created_at).toLocaleString()}</p>
                                             </td>
                                             <td className="p-6">
                                                <p className="text-xs font-bold text-slate-800">{s.banco}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">{s.tipo_chave}: {s.chave_pix}</p>
                                             </td>
                                             <td className="p-6 text-xs font-bold text-slate-600">{s.titular}</td>
                                             <td className="p-6 text-lg font-black text-shopee-orange">R$ {parseFloat(s.valor).toFixed(2)}</td>
                                             <td className="p-6 text-right space-x-2">
                                                <button 
                                                   onClick={async () => {
                                                      const ok = window.confirm('Confirmar que o PIX jÃ¡ foi enviado e aprovar saque?');
                                                      if (!ok) return;
                                                      await supabase.from('saques').update({ status: 'aprovado' }).eq('id', s.id); setSaquesHistorico([{ ...s, status: 'aprovado' }, ...saquesHistorico]);
                                                      setSaquesPendentes(saquesPendentes.filter(x => x.id !== s.id));
                                                   }}
                                                   className="px-4 py-2 bg-green-500 text-white text-[10px] font-black uppercase rounded-xl hover:bg-green-600"
                                                >
                                                   Aprovar
                                                </button>
                                                <button 
                                                   onClick={async () => {
                                                      const ok = window.confirm('Deseja recusar e devolver o saldo ao lojista?');
                                                      if (!ok) return;
                                                      await supabase.from('saques').update({ status: 'recusado' }).eq('id', s.id); setSaquesHistorico([{ ...s, status: 'recusado' }, ...saquesHistorico]);
                                                      setSaquesPendentes(saquesPendentes.filter(x => x.id !== s.id));
                                                   }}
                                                   className="px-4 py-2 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-xl hover:bg-red-200"
                                                >
                                                   Recusar
                                                </button>
                                             </td>
                                          </tr>
                                       );
                                    })}
                                 </tbody>
                              </table>
                             </div>
                           )}

                           {/* Histórico de Saques Processados */}
                           {saquesHistorico.length > 0 && (
                             <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden mb-6 animate-in fade-in duration-300">
                               <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                  <h3 className="font-black text-slate-800 tracking-tighter flex items-center gap-2 shrink-0">
                                    <ShieldCheck size={20} className="text-green-500" /> Histórico de Saques Processados
                                  </h3>
                                  <div className="flex flex-wrap gap-3 items-center">
                                     <div className="bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
                                        <Store size={14} className="text-slate-400" />
                                        <select
                                           value={saquesLojaFilter}
                                           onChange={(e) => setSaquesLojaFilter(e.target.value)}
                                           className="bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 cursor-pointer p-0"
                                        >
                                           <option value="todas">Todas as Lojas</option>
                                           {lojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                                        </select>
                                     </div>
                                     <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
                                        {['todos', 'aprovado', 'recusado'].map(f => (
                                           <button
                                              key={f}
                                              onClick={() => setSaquesStatusFilter(f)}
                                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${saquesStatusFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                           >
                                              {f === 'todos' ? 'Todos' : f === 'aprovado' ? 'Aprovados' : 'Recusados'}
                                           </button>
                                        ))}
                                     </div>
                                     <DateFilterBar selectedDays={saquesFilterDays} onChange={setSaquesFilterDays} />
                                  </div>
                               </div>
                               <table className="w-full text-left">
                                  <thead className="bg-slate-50/50">
                                     <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="p-6">Lojista</th>
                                        <th className="p-6">Banco / Chave PIX</th>
                                        <th className="p-6">Titular</th>
                                        <th className="p-6 text-green-600">Valor Pago</th>
                                        <th className="p-6 text-right">Status</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                     {saquesHistorico.filter(s => {
                                        const loja = lojas.find(l => l.id === s.loja_id);
                                        const matchLoja = saquesLojaFilter === 'todas' || (loja?.nome === saquesLojaFilter);
                                        const matchStatus = saquesStatusFilter === 'todos' || s.status === saquesStatusFilter;
                                        const dataSaque = new Date(s.created_at).getTime();
                                        const agora = new Date().getTime();
                                        const diasEmMs = saquesFilterDays * 24 * 60 * 60 * 1000;
                                        return matchLoja && matchStatus && (agora - dataSaque <= diasEmMs);
                                     }).map(s => {
                                        const loja = lojas.find(l => l.id === s.loja_id);
                                        return (
                                           <tr key={s.id}>
                                              <td className="p-6">
                                                 <p className="text-sm font-black text-slate-800">{loja?.nome || 'Loja Desconhecida'}</p>
                                                 <p className="text-[10px] text-slate-400">{new Date(s.created_at).toLocaleString()}</p>
                                              </td>
                                              <td className="p-6">
                                                 <p className="text-xs font-bold text-slate-800">{s.banco}</p>
                                                 <p className="text-[10px] text-slate-500 font-mono">{s.tipo_chave}: {s.chave_pix}</p>
                                              </td>
                                              <td className="p-6 text-xs font-bold text-slate-600">{s.titular}</td>
                                              <td className="p-6 text-lg font-black text-green-600">R$ {parseFloat(s.valor).toFixed(2)}</td>
                                              <td className="p-6 text-right">
                                                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                                   s.status === 'aprovado' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                 }`}>
                                                    {s.status === 'aprovado' ? 'Aprovado' : 'Recusado'}
                                                 </span>
                                              </td>
                                           </tr>
                                        );
                                     })}
                                  </tbody>
                               </table>
                            </div>
                           )}

                          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                             <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                <h3 className="font-black text-slate-800 tracking-tighter">Extrato de Repasses</h3>
                                <div className="flex flex-wrap gap-3 items-center">
                                    <DateFilterBar selectedDays={repassesFilterDays} onChange={setRepassesFilterDays} />
                                    <div className="bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
                                    <Store size={14} className="text-slate-400" />
                                    <select
                                       value={repassesLojaFilter}
                                       onChange={(e) => setRepassesLojaFilter(e.target.value)}
                                       className="bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 cursor-pointer p-0"
                                    >
                                       <option value="todas">Todas as Lojas</option>
                                       {lojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                                    </select>
                                 </div>
                             </div>
                             </div>
                             <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                   <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                      <th className="p-8">Data</th>
                                      <th className="p-8">Pedido</th>
                                      <th className="p-8">Loja</th>
                                      <th className="p-8">Entregador</th>
                                      <th className="p-8">Valor Pedido</th>
                                      <th className="p-8 text-blue-500">ComissÃ£o ({financeStats.comissaoVendaPerc}%)</th>
                                      <th className="p-8 text-shopee-orange">CrÃ©dito Entregador</th>
                                      <th className="p-8 text-green-600">Repasse Lojista</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                     {historicoCompletoFiltrado.filter(p => p.status === 'entregue').filter(p => {
                                       const matchLoja = repassesLojaFilter === 'todas' || (p.loja === repassesLojaFilter);
                                       const dataPedido = new Date(p.created_at).getTime();
                                       const agora = new Date().getTime();
                                       const diasEmMs = repassesFilterDays * 24 * 60 * 60 * 1000;
                                       return matchLoja && (agora - dataPedido <= diasEmMs);
                                    }).map(p => {
                                      const comissaoValor = p.total * (financeStats.comissaoVendaPerc / 100);
                                      const creditoEntregador = financeStats.taxaPadrao;
                                      const repasseLojista = p.total - comissaoValor;
                                      
                                      return (
                                          <tr key={p.id}>
                                             <td className="p-8 text-xs font-black text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                                             <td className="p-8 text-xs font-black text-slate-800">#{(p.id || '').toString().slice(-4).toUpperCase()}</td>
                                             <td className="p-8 text-xs font-black text-slate-800">{p.loja || 'N/A'}</td>
                                             <td className="p-8 text-xs font-black text-slate-800">{p.geolocalizacao_entregador?.entregador_nome || 'N/A'}</td>
                                            <td className="p-8 text-xs font-black text-slate-800">R$ {p.total.toFixed(2)}</td>
                                            <td className="p-8 text-xs font-black text-blue-500">R$ {comissaoValor.toFixed(2)}</td>
                                            <td className="p-8 text-xs font-black text-shopee-orange">R$ {creditoEntregador.toFixed(2)}</td>
                                            <td className="p-8 text-xs font-black text-green-600 font-bold">R$ {repasseLojista.toFixed(2)}</td>
                                         </tr>
                                      );
                                   })}
                                </tbody>
                             </table>
                          </div>
                       </>
                    );
                 })()}
                       </div>
                    
                  )
                  }
 
                    {activeTab === 'historico' && (
                     <div className="p-8 space-y-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                           <div>
                              <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Histórico Mestre</h2>
                              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">Auditoria e Inteligência de Processos</p>
                           </div>
                           
                           <div className="flex flex-wrap gap-4 items-center">
                              {/* Filtro por Loja */}
                              <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
                                 <Store size={14} className="text-slate-400" />
                                 <select 
                                    value={historicoLojaFilter} 
                                    onChange={(e) => setHistoricoLojaFilter(e.target.value)}
                                    className="bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 cursor-pointer p-0"
                                 >
                                    <option value="todas">Todas as Lojas</option>
                                    {lojas.map(l => <option key={l.id} value={l.nome}>{l.nome}</option>)}
                                 </select>
                              </div>

                              {/* Filtro por Status */}
                              <div className="flex bg-white p-1.5 rounded-[20px] shadow-sm border border-slate-100 overflow-x-auto no-scrollbar max-w-full">
                                 {['todos', 'entregue', 'cancelado', 'recusado', 'confirmado'].map(f => (
                                    <button 
                                       key={f}
                                       onClick={() => setHistoricoFilter(f)}
                                       className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${historicoFilter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                       {f.replace(/_/g, ' ')}
                                    </button>
                                 ))}
                              </div>

                               <DateFilterBar selectedDays={historicoFilterDays} onChange={setHistoricoFilterDays} />
                           </div>
                        </div>

                        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                           <table className="w-full text-left">
                              <thead className="bg-slate-50/50">
                                 <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                    <th className="p-8">Data/Hora</th>
                                    <th className="p-8">ID</th>
                                    <th className="p-8">Origem/Destino</th>
                                    <th className="p-8">Financeiro</th>
                                    <th className="p-8">Resultado</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {pedidosHistorico.filter(p => {
                                     const matchStatus = historicoFilter === 'todos' || p.status === historicoFilter;
                                     const matchLoja = historicoLojaFilter === 'todas' || p.loja === historicoLojaFilter;
                                     
                                     const orderDate = new Date(p.created_at);
                                     const now = new Date();
                                     const diffTime = Math.abs(now.getTime() - orderDate.getTime());
                                     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                     const matchData = diffDays <= historicoFilterDays;
                                     
                                     return matchStatus && matchLoja && matchData;
                                  }).map(p => (
                                   <tr key={p.fullId} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-8">
                                         <p className="text-xs font-black text-slate-800">{new Date(p.created_at).toLocaleDateString()}</p>
                                         <p className="text-[10px] font-bold text-slate-400">{new Date(p.created_at).toLocaleTimeString()}</p>
                                      </td>
                                      <td className="p-8 font-mono text-[10px] font-black text-slate-300">#{p.id}</td>
                                      <td className="p-8">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0"><Store size={14} /></div>
                                            <div>
                                               <p className="text-xs font-black text-slate-800">{p.loja}</p>
                                               <p className="text-[10px] font-medium text-slate-400">âž¡ï¸ {p.cliente}</p>
                                               <div className="mt-2 flex flex-col gap-1">
                                                  {p.itens?.map((item: any, idx: number) => (
                                                     <div key={idx} className="flex items-center gap-2">
                                                        <img 
                                                           src={item.imagem || 'https://via.placeholder.com/40'} 
                                                           className="w-5 h-5 rounded border border-slate-100 object-cover shadow-sm shrink-0"
                                                           alt=""
                                                        />
                                                        <p className="text-[10px] font-bold text-slate-600 line-clamp-1">
                                                           {item.qtd}x {item.nome}
                                                        </p>
                                                     </div>
                                                  ))}
                                               </div>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="p-8">
                                         <p className="text-sm font-black text-slate-800 tracking-tighter">R$ {p.valor.toFixed(2)}</p>
                                         <p className="text-[9px] font-black text-green-500 uppercase">Pago via App</p>
                                      </td>
                                      <td className="p-8">
                                         <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase ${
                                            p.status === 'entregue' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                         }`}>
                                            {p.status.replace(/_/g, ' ')}
                                         </span>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                          {pedidosHistorico.length === 0 && (
                             <div className="py-20 text-center opacity-20">
                                <History size={60} className="mx-auto mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">Nenhum registro encontrado</p>
                             </div>
                          )}
                       </div>
                    </div>
                 )}

                  {activeTab === 'produtos' && (
                     <div className="p-8 space-y-8">
                        <div className="flex justify-between items-end">
                           <div>
                              <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Inventário Global</h2>
                              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">Visão Consolidada do Marketplace</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-2 rounded-2xl">{marketplaceProducts.length} produtos</span>
                              <button className="px-6 py-3 bg-shopee-orange text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-shopee-orange/20 hover:scale-105 transition-all">
                                 Adicionar Produto Mestre
                              </button>
                           </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-wrap gap-3 items-center">
                           <div className="relative flex-1 min-w-[200px] max-w-sm">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                              <input
                                 type="text"
                                 placeholder="Buscar produto..."
                                 value={produtoSearch}
                                 onChange={(e) => setProdutoSearch(e.target.value)}
                                 className="w-full bg-white pl-9 pr-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800 border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-shopee-orange/30"
                              />
                           </div>
                           <div className="bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
                              <Store size={14} className="text-slate-400" />
                              <select
                                 value={produtoLojaFilter}
                                 onChange={(e) => setProdutoLojaFilter(e.target.value)}
                                 className="bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 cursor-pointer p-0"
                              >
                                 <option value="todas">Todas as Lojas</option>
                                 {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                              </select>
                           </div>
                           <div className="bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
                              <Box size={14} className="text-slate-400" />
                              <select
                                 value={produtoCategoriaFilter}
                                 onChange={(e) => setProdutoCategoriaFilter(e.target.value)}
                                 className="bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 cursor-pointer p-0"
                              >
                                 <option value="todas">Todas as Categorias</option>
                                 {[...new Set(marketplaceProducts.map(p => p.categoria).filter(Boolean))].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                 ))}
                              </select>
                           </div>
                        </div>

                        {/* Grid de Produtos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                           {marketplaceProducts
                              .filter(prod => {
                                 const matchSearch = !produtoSearch || prod.nome?.toLowerCase().includes(produtoSearch.toLowerCase());
                                 const matchLoja = produtoLojaFilter === 'todas' || prod.loja_id === produtoLojaFilter;
                                 const matchCategoria = produtoCategoriaFilter === 'todas' || prod.categoria === produtoCategoriaFilter;
                                 return matchSearch && matchLoja && matchCategoria;
                              })
                              .map(prod => {
                                 const lojaNome = prod.lojas?.nome || 'Loja Desconhecida';
                                 const isPausing = pausingProductId === prod.id;
                                 const estoqueStatus = prod.estoque_status || 'disponivel';
                                 const ehVisivel = estoqueStatus === 'disponivel';
                                 return (
                              <div key={prod.id} className="bg-white rounded-[32px] p-4 shadow-sm border border-slate-100 group hover:border-shopee-orange transition-all">
                                 <div className="aspect-square bg-slate-50 rounded-[24px] mb-4 overflow-hidden relative">
                                    <img src={prod.imagem_url || 'https://via.placeholder.com/200'} alt={prod.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[8px] font-black uppercase shadow-sm">
                                       {prod.categoria || 'Geral'}
                                    </div>
                                    {!ehVisivel && (
                                       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-[24px]">
                                          <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/60 px-4 py-2 rounded-xl">Pausado</span>
                                       </div>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-1.5 mb-2">
                                    <Store size={10} className="text-slate-400 shrink-0" />
                                    <span className="text-[9px] font-bold text-slate-500 truncate">{lojaNome}</span>
                                 </div>
                                 <p className="text-xs font-black text-slate-800 truncate mb-1">{prod.nome}</p>
                                 <div className="flex items-center gap-2 mb-3">
                                    {estoqueStatus === 'esgotado' ? (
                                       <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded-lg">Esgotado</span>
                                    ) : (
                                       <span className="text-[8px] font-black text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded-lg">
                                          {prod.estoque != null ? `${prod.estoque} em estoque` : 'Disponível'}
                                       </span>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-3 mb-2 text-[9px] font-bold text-slate-400">
                                    <span className="flex items-center gap-1"><ShoppingBag size={10} /> {prod.vendidos || 0} vendidos</span>
                                    <span className="flex items-center gap-1"><Eye size={10} /> {prod.visualizacoes || 0} viz.</span>
                                    <span className="flex items-center gap-1"><MousePointerClick size={10} /> {prod._cliques || 0} cliques</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <p className="text-sm font-black text-shopee-orange">R$ {parseFloat(prod.preco || 0).toFixed(2)}</p>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button
                                          onClick={async () => {
                                             setPausingProductId(prod.id);
                                             const novoStatus = ehVisivel ? 'indisponivel' : 'disponivel';
                                             await supabase.from('produtos').update({ estoque_status: novoStatus }).eq('id', prod.id);
                                             setMarketplaceProducts(prev => prev.map(p => p.id === prod.id ? { ...p, estoque_status: novoStatus } : p));
                                             setPausingProductId(null);
                                          }}
                                          disabled={isPausing}
                                          className={`p-2 rounded-lg transition-colors ${ehVisivel ? 'bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white' : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white'}`}
                                          title={ehVisivel ? 'Pausar Produto' : 'Reativar Produto'}
                                       >
                                          {isPausing ? <Loader2 size={12} className="animate-spin" /> : ehVisivel ? <EyeOff size={12} /> : <Eye size={12} />}
                                       </button>
                                       <button onClick={() => { setSelectedProductForReview(prod); setShowReviewModal(true); }} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors" title="Gerar Avaliações em Massa"><Star size={12} fill="currentColor" /></button>
                                    </div>
                                 </div>
                              </div>
                           );})}
                           {marketplaceProducts.filter(prod => {
                              const matchSearch = !produtoSearch || prod.nome?.toLowerCase().includes(produtoSearch.toLowerCase());
                              const matchLoja = produtoLojaFilter === 'todas' || prod.loja_id === produtoLojaFilter;
                              const matchCategoria = produtoCategoriaFilter === 'todas' || prod.categoria === produtoCategoriaFilter;
                              return matchSearch && matchLoja && matchCategoria;
                           }).length === 0 && (
                              <div className="col-span-full py-20 text-center opacity-20">
                                 <Package size={60} className="mx-auto mb-4" />
                                 <p className="font-black uppercase tracking-widest text-xs">Nenhum produto encontrado</p>
                              </div>
                           )}
                        </div>
                     </div>
                  )}

                  {activeTab === 'criacao_massa' && (
                     <BulkProductCreator supabase={supabase} lojas={lojas} onComplete={() => fetchRealData()} />
                  )}

                  {activeTab === 'performance' && (
                     <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
                       <div className="flex justify-between items-end">
                         <div>
                           <h2 className="text-xl font-black text-slate-800 tracking-tighter">Performance</h2>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Relatório de desempenho dos produtos</p>
                         </div>
                       </div>
                       <ProductPerformanceTable />
                     </div>
                  )}

                 {activeTab === 'chat' && (
                    <div className="p-8">
                       <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-8">Monitor Global de Mensagens</h2>
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px]">
                          {/* LISTA DE CONVERSAS */}
                          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                             <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversas Ativas</h3>
                             </div>
                             <div className="flex-1 overflow-y-auto">
                                 {(() => {
                                    const conversations: any[] = [];
                                    const seen = new Set();
                                    [...messages].reverse().forEach(m => {
                                       const clientRefId = m.tipo_remetente === 'admin' ? m.destinatario_id : m.remetente_id;
                                       const key = m.pedido_id ? `order_${m.pedido_id}` : `user_${clientRefId}`;
                                       if (!seen.has(key) && (m.pedido_id || clientRefId)) {
                                          seen.add(key);
                                          conversations.push({ id: m.pedido_id, userId: clientRefId, lastMsg: m, isSupport: !m.pedido_id });
                                       }
                                    });
                                    return conversations.map(convo => {
                                       const isSelected = activeChat?.id === convo.id && activeChat?.userId === convo.userId;
                                       return (
                                          <div key={convo.isSupport ? `support_${convo.userId}` : `order_${convo.id}`} 
                                             onClick={() => setActiveChat({ id: convo.id, userId: convo.userId, nome: convo.isSupport ? `ðŸ›¡ï¸ Suporte: ${convo.userId?.toString().slice(0,5)}` : `ðŸ“¦ Pedido #${convo.id?.toString().slice(0,6)}` })}
                                             className={`p-6 border-b border-slate-50 cursor-pointer hover:bg-orange-50/30 transition-all ${isSelected ? 'bg-orange-50 border-l-4 border-l-shopee-orange' : ''}`}>
                                             <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs font-black text-slate-800">{convo.isSupport ? `ðŸ›¡ï¸ Suporte: ${convo.userId?.toString().slice(0,8)}` : `ðŸ“¦ Pedido #${convo.id?.toString().slice(0,8)}`}</p>
                                                <span className="text-[8px] font-bold text-slate-400">{convo.lastMsg?.time || 'Ativo'}</span>
                                             </div>
                                             <p className="text-[10px] text-slate-500 truncate">{convo.lastMsg?.text || 'Sem mensagens'}</p>
                                          </div>
                                       );
                                    });
                                 })()}
                                 {messages.length === 0 && (
                                    <div className="p-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">Nenhuma conversa encontrada</div>
                                 )}
                             </div>
                          </div>

                          {/* JANELA DE CHAT (MONITOR) */}
                          <div className="lg:col-span-2 bg-slate-900 rounded-[40px] shadow-xl flex flex-col overflow-hidden">
                             {activeChat ? (
                                <>
                                   <div className="p-6 bg-slate-800 flex justify-between items-center border-b border-slate-700">
                                      <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 bg-shopee-orange rounded-xl flex items-center justify-center font-black text-white italic">C</div>
                                         <div>
                                            <h4 className="text-sm font-black text-white">{activeChat.nome}</h4>
                                            <p className="text-[8px] font-black uppercase text-shopee-orange">Monitoramento em Tempo Real</p>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar bg-slate-900">
                                      {messages.filter(m => {
                                          if (!activeChat.id) { // Modo Suporte
                                             return m.pedido_id === null && (m.remetente_id === activeChat.userId || m.destinatario_id === activeChat.userId);
                                          }
                                          return m.pedido_id === activeChat.id;
                                       }).map(m => (
                                         <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                            <div className="flex flex-col gap-1 max-w-[70%]">
                                               <span className={`text-[7px] font-black uppercase tracking-widest ${m.sender === 'admin' ? 'text-right text-shopee-orange' : 'text-slate-500'}`}>
                                                  {m.sender === 'admin' ? 'VocÃª (Admin)' : 'UsuÃ¡rio'}
                                               </span>
                                               <div className={`p-4 rounded-2xl text-xs font-medium shadow-lg ${
                                                  m.sender === 'admin' ? 'bg-shopee-orange text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                               }`}>
                                                  {m.text}
                                                  <p className={`text-[8px] mt-1 ${m.sender === 'admin' ? 'text-white/50' : 'text-slate-500'}`}>{m.time}</p>
                                               </div>
                                            </div>
                                         </div>
                                      ))}
                                   </div>
                                   <div className="p-6 bg-slate-800 border-t border-slate-700 flex gap-3 items-center">
                                      <input 
                                         type="text" 
                                         value={chatMessage}
                                         onChange={(e) => setChatMessage(e.target.value)}
                                         onKeyPress={(e) => e.key === 'Enter' && sendAdminMessage()}
                                         placeholder="Intervir na conversa..."
                                         className="flex-1 bg-slate-900 border-none rounded-2xl p-4 text-xs font-medium text-white focus:ring-1 focus:ring-shopee-orange placeholder:text-slate-600"
                                      />
                                      <button 
                                         onClick={sendAdminMessage}
                                         className="w-12 h-12 bg-shopee-orange text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-shopee-orange/20"
                                      >
                                         <Send size={20} />
                                      </button>
                                   </div>
                                </>
                             ) : (
                                 <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4 opacity-20">
                                    <MessageSquare size={80} className="text-white" />
                                    <p className="text-sm font-black uppercase text-white tracking-[0.2em]">Selecione uma conversa para monitorar</p>
                                 </div>
                              )}
                        </div>
                     </div>
                  </div>
                  )}

                  {activeTab === 'ajustes' && (
                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="flex justify-between items-end">
                          <div>
                             <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Ajustes do Sistema</h2>
                             <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">ConfiguraÃ§Ãµes Globais e Chaves de Pagamento</p>
                          </div>
                          <button 
                             onClick={async () => {
                                setIsSavingSettings(true);
                                try {
                                   const { error } = await supabase.from('configuracoes_sistema').upsert({
                                      chave: 'pix_config',
                                      valor: {
                                         chave: systemSettings.pix_chave,
                                         nome: systemSettings.pix_nome,
                                         banco: systemSettings.pix_banco,
                                         cidade: systemSettings.pix_cidade
                                      }
                                   }, { onConflict: 'chave' });
                                   
                                   if (error) throw error;
                                   alert("ConfiguraÃ§Ãµes salvas com sucesso!");
                                   fetchRealData();
                                } catch (err: any) {
                                   alert("Erro ao salvar: " + err.message);
                                } finally {
                                   setIsSavingSettings(false);
                                }
                             }}
                             disabled={isSavingSettings}
                             className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-shopee-orange transition-all shadow-xl disabled:opacity-50"
                          >
                             {isSavingSettings ? 'Salvando...' : 'Salvar AlteraÃ§Ãµes'}
                          </button>
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* CARD: CONFIGURAÃ‡ÃƒO PIX */}
                          <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm space-y-8">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                                   <CreditCard size={24} />
                                </div>
                                <div>
                                   <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Recebimento PIX</h3>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ConfiguraÃ§Ã£o para Checkout de Ads e Vendas</p>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Chave PIX (E-mail, CPF ou AleatÃ³ria)</label>
                                   <input 
                                      type="text" 
                                      value={systemSettings.pix_chave}
                                      onChange={(e) => setSystemSettings({...systemSettings, pix_chave: e.target.value})}
                                      className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                      placeholder="sua-chave@pix.com"
                                   />
                                </div>

                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome do BeneficiÃ¡rio (Como no Banco)</label>
                                   <input 
                                      type="text" 
                                      value={systemSettings.pix_nome}
                                      onChange={(e) => setSystemSettings({...systemSettings, pix_nome: e.target.value})}
                                      className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                      placeholder="Seu Nome Completo ou Empresa"
                                   />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Banco / InstituiÃ§Ã£o</label>
                                      <input 
                                         type="text" 
                                         value={systemSettings.pix_banco}
                                         onChange={(e) => setSystemSettings({...systemSettings, pix_banco: e.target.value})}
                                         className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                         placeholder="Ex: Nubank, ItaÃº"
                                      />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cidade (PadrÃ£o BCB)</label>
                                      <input 
                                         type="text" 
                                         value={systemSettings.pix_cidade}
                                         onChange={(e) => setSystemSettings({...systemSettings, pix_cidade: e.target.value})}
                                         className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                         placeholder="Ex: Sao Paulo"
                                      />
                                   </div>
                                </div>

                                <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 flex items-start gap-4">
                                   <AlertTriangle className="text-shopee-orange shrink-0" size={20} />
                                   <p className="text-[10px] font-bold text-orange-800 leading-relaxed uppercase">
                                      Certifique-se de que os dados estÃ£o corretos. Erros na chave PIX impedirÃ£o que os lojistas realizem o pagamento dos Ads.
                                   </p>
                                </div>
                             </div>
                          </div>

                          {/* CARD: CONFIGURAÃ‡Ã•ES GLOBAIS */}
                          <div className="bg-white rounded-[48px] p-10 border border-slate-100 shadow-sm space-y-8">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                                   <Settings size={24} />
                                </div>
                                <div>
                                   <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Geral & Locale</h3>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Idiomas e ComissÃµes PadrÃ£o</p>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Taxa de ComissÃ£o Administrativa (%)</label>
                                   <div className="flex items-center gap-4">
                                      <input 
                                         type="range" 
                                         min="0" 
                                         max="30" 
                                         step="0.5"
                                         value={systemSettings.taxa_comissao}
                                         onChange={(e) => setSystemSettings({...systemSettings, taxa_comissao: parseFloat(e.target.value)})}
                                         className="flex-1 accent-shopee-orange h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                                      />
                                      <div className="w-20 bg-slate-50 rounded-xl p-3 text-center font-black text-slate-800">
                                         {systemSettings.taxa_comissao}%
                                      </div>
                                   </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Moeda PadrÃ£o</label>
                                      <select 
                                         value={systemSettings.moeda}
                                         onChange={(e) => setSystemSettings({...systemSettings, moeda: e.target.value})}
                                         className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                      >
                                         <option value="BRL">Real (R$)</option>
                                         <option value="USD">DÃ³lar ($)</option>
                                      </select>
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">LocalizaÃ§Ã£o</label>
                                      <select 
                                         value={systemSettings.locale}
                                         onChange={(e) => setSystemSettings({...systemSettings, locale: e.target.value})}
                                         className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                      >
                                         <option value="pt-BR">PortuguÃªs (Brasil)</option>
                                         <option value="en-US">English (US)</option>
                                      </select>
                                   </div>
                                </div>

                                <div className="pt-10">
                                   <div className="p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden">
                                      <Activity className="absolute -right-4 -bottom-4 text-white/10" size={100} />
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">PrevisÃ£o de Receita</p>
                                      <h4 className="text-xl font-black">Marketplace SaudÃ¡vel</h4>
                                      <p className="text-[10px] text-slate-400 mt-2 font-medium">A comissÃ£o de {systemSettings.taxa_comissao}% Ã© aplicada automaticamente em todas as vendas via checkout direto.</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {activeTab === 'premios' && (
                    <div className="p-8 space-y-8">
                       <div className="flex justify-between items-end">
                          <div>
                             <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Histórico de Prêmios</h2>
                             <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">Monitoramento de Ganhadores e Sorteios</p>
                          </div>
                          <div className="flex gap-4">
                             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[120px]">
                                <p className="text-[8px] font-black text-slate-400 uppercase">Total Ganhos</p>
                                <p className="text-xl font-black text-slate-800">{premiosGanhos.length}</p>
                             </div>
                          </div>
                       </div>

                       <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                          <table className="w-full text-left">
                             <thead className="bg-slate-50/50">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                   <th className="p-8">Data</th>
                                   <th className="p-8">Cliente</th>
                                   <th className="p-8">PrÃªmio</th>
                                   <th className="p-8">Loja Parceira</th>
                                   <th className="p-8">Status</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {premiosGanhos.map(p => (
                                   <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-8 text-xs font-black text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                                      <td className="p-8">
                                         <p className="text-xs font-black text-slate-800">{p.profiles?.nome || p.profiles?.full_name || 'Desconhecido'}</p>
                                         <p className="text-[10px] text-slate-400">{p.profiles?.email || 'Protegido'}</p>
                                      </td>
                                      <td className="p-8">
                                         <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                                               p.tipo === 'produto' ? 'bg-blue-500' : p.tipo === 'cupom' ? 'bg-orange-500' : 'bg-green-500'
                                            }`}>
                                               {p.tipo === 'produto' ? <Gift size={14} /> : p.tipo === 'cupom' ? <Ticket size={14} /> : <Truck size={14} />}
                                            </div>
                                            <span className="text-xs font-black text-slate-800 uppercase">{p.detalhes?.titulo || p.tipo}</span>
                                         </div>
                                      </td>
                                      <td className="p-8 text-xs font-black text-slate-500">{p.lojas?.nome || 'CapelGo'}</td>
                                      <td className="p-8">
                                         <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest">Ganhado</span>
                                      </td>
                                   </tr>
                                ))}
                                {premiosGanhos.length === 0 && (
                                   <tr>
                                      <td colSpan={5} className="p-20 text-center opacity-20">
                                         <Gift size={60} className="mx-auto mb-4" />
                                         <p className="font-black uppercase tracking-widest text-xs">Nenhum prÃªmio registrado</p>
                                      </td>
                                   </tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  )}

                  {activeTab === 'envio_massa' && (
                     <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end">
                           <div>
                              <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Envio em Massa</h2>
                              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em]">Gestão de ImpressÃ£o e Empacotamento</p>
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
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Prazo de Envio</span>
                                    <div className="flex gap-2">
                                       <button className="px-4 py-2 border border-shopee-orange text-shopee-orange rounded-full text-[10px] font-black uppercase">Tudo</button>
                                       <button className="px-4 py-2 border border-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase hover:border-slate-300">Atrasado(a) (0)</button>
                                       <button className="px-4 py-2 border border-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase hover:border-slate-300">Dentro das 24h (0)</button>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Status do Pedido</span>
                                    <div className="flex gap-2">
                                       <button className="px-4 py-2 border border-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase hover:border-slate-300">Tudo</button>
                                       <button className="px-4 py-2 border border-shopee-orange text-shopee-orange rounded-full text-[10px] font-black uppercase">ConcluÃ­do</button>
                                       <button className="px-4 py-2 border border-slate-200 text-slate-500 rounded-full text-[10px] font-black uppercase hover:border-slate-300">Em aberto</button>
                                    </div>
                                 </div>
                              </div>

                              {/* Tabela de Pedidos */}
                              <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                                 <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-800 tracking-tighter">{pedidosPendentes.length} Pedidos Pendentes</h3>
                                    <button 
                                       onClick={() => {
                                          if (selectedMassOrders.length === pedidosPendentes.length) setSelectedMassOrders([]);
                                          else setSelectedMassOrders(pedidosPendentes.map(p => p.fullId));
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
                                          <th className="p-6">Canal</th>
                                          <th className="p-6">Status ImpressÃ£o</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                       {pedidosPendentes.map(p => (
                                          <tr key={p.fullId} className="hover:bg-slate-50/50 transition-colors">
                                             <td className="p-6 text-center">
                                                <input 
                                                   type="checkbox" 
                                                   checked={selectedMassOrders.includes(p.fullId)}
                                                   onChange={(e) => {
                                                      if (e.target.checked) setSelectedMassOrders([...selectedMassOrders, p.fullId]);
                                                      else setSelectedMassOrders(selectedMassOrders.filter(id => id !== p.fullId));
                                                   }}
                                                   className="w-4 h-4 text-shopee-orange rounded border-slate-300 focus:ring-shopee-orange cursor-pointer"
                                                />
                                             </td>
                                             <td className="p-6 text-xs font-black text-slate-800">{p.id}</td>
                                             <td className="p-6 text-xs font-bold text-slate-600">{p.cliente}</td>
                                             <td className="p-6 text-[10px] font-black text-slate-400 uppercase">CapelGo</td>
                                             <td className="p-6">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">Pendente</span>
                                             </td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        )}

                        {activeMassShippingTab === 'documentos' && (
                           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Painel de ConfiguraÃ§Ã£o */}
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
                                             <label className="flex items-center gap-2 cursor-pointer opacity-50">
                                                <input type="radio" name="formato1" disabled className="w-3 h-3 text-shopee-orange" />
                                                <span className="text-[10px] font-bold text-slate-600 uppercase">ImpressÃ£o TÃ©rmica (ZPL)</span>
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
                                          <div className="flex gap-4">
                                             <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="formato2" defaultChecked className="w-3 h-3 text-shopee-orange" />
                                                <span className="text-[10px] font-bold text-slate-600 uppercase">PDF</span>
                                             </label>
                                          </div>
                                       </div>
                                    </label>

                                    <label className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                                       <input 
                                          type="radio" 
                                          name="tipoDoc"
                                          checked={docConfig.tipoDocumento === 'apenas_lista'}
                                          onChange={() => setDocConfig({ ...docConfig, tipoDocumento: 'apenas_lista' })}
                                          className="mt-1 w-4 h-4 text-shopee-orange focus:ring-shopee-orange" 
                                       />
                                       <div className="flex-1">
                                          <p className="text-sm font-black text-slate-800 mb-3">Apenas a Lista de Empacotamento</p>
                                          <div className="flex gap-4">
                                             <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="formato3" defaultChecked className="w-3 h-3 text-shopee-orange" />
                                                <span className="text-[10px] font-bold text-slate-600 uppercase">PDF</span>
                                             </label>
                                          </div>
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
                                       VocÃª selecionou {selectedMassOrders.length} pedido(s) para imprimir {docConfig.tipoDocumento.replace(/_/g, ' ')}.
                                    </p>
                                    <button 
                                       onClick={handlePrintDocuments}
                                       className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-shopee-orange transition-all"
                                    >
                                       Gerar Documentos Selecionados
                                    </button>
                                 </div>

                                 <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <Box size={24} className="text-slate-400 mb-2" />
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Manifesto</h4>
                                    <p className="text-[9px] font-bold text-slate-400 mb-4">Imprima seu manifesto aqui apÃ³s gerar etiquetas.</p>
                                    <button className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">
                                       Gerar Manifesto
                                    </button>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </>
            </div>
         </div>
       </main>

      {/* MODAL: NOVO ENTREGADOR */}
      <AnimatePresence>
        {isAddingEntregador && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingEntregador(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 tracking-tighter">Novo Entregador</h3>
                <button onClick={() => setIsAddingEntregador(false)} className="text-slate-300 hover:text-slate-500"><X size={24} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                  <input type="text" value={newEntregador.nome} onChange={(e) => setNewEntregador({...newEntregador, nome: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange" placeholder="Ex: Carlos Silva" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</label>
                  <input type="text" value={newEntregador.telefone} onChange={(e) => setNewEntregador({...newEntregador, telefone: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange" placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EndereÃ§o Residencial</label>
                   <input type="text" value={newEntregador.endereco} onChange={(e) => setNewEntregador({...newEntregador, endereco: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange" placeholder="Rua, NÃºmero, Bairro" />
                 </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VeÃ­culo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setNewEntregador({...newEntregador, veiculo: 'moto'})} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase ${newEntregador.veiculo === 'moto' ? 'border-shopee-orange bg-orange-50 text-shopee-orange' : 'border-slate-100 text-slate-400'}`}>
                      <Bike size={16} /> Moto
                    </button>
                    <button onClick={() => setNewEntregador({...newEntregador, veiculo: 'bike'})} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase ${newEntregador.veiculo === 'bike' ? 'border-shopee-orange bg-orange-50 text-shopee-orange' : 'border-slate-100 text-slate-400'}`}>
                      <Bike size={16} /> Bike
                    </button>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                     const { error } = await supabase.from('profiles').insert({
                        nome: newEntregador.nome,
                        full_name: newEntregador.nome,
                        telefone: newEntregador.telefone,
                        endereco: newEntregador.endereco,
                        veiculo_tipo: newEntregador.veiculo,
                        role: 'entregador',
                        status_aprovacao: 'aprovado'
                     });

                     if (error) {
                        alert("Erro ao cadastrar: " + error.message);
                        return;
                     }

                     setIsAddingEntregador(false);
                     setNewEntregador({ nome: '', telefone: '', veiculo: 'moto', endereco: '' });
                     fetchRealData();
                     alert("Entregador cadastrado com sucesso!");
                   }}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest mt-4 shadow-xl hover:bg-shopee-orange transition-colors"
                >
                  Cadastrar Entregador
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DETALHES / CARTEIRA / AVALIAÃ‡ÃƒO */}
      <AnimatePresence>
        {selectedEntregador && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEntregador(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-[40px] p-8 shadow-2xl overflow-hidden">
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-slate-900 text-white rounded-[24px] flex items-center justify-center text-2xl font-black shadow-lg">
                        {(selectedEntregador.nome || '?').charAt(0)}
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{selectedEntregador.nome}</h3>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #{selectedEntregador.id.toString().slice(-4)}</p>
                           {selectedEntregador.pedidoId && (
                              <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-[8px] font-black">PEDIDO #{selectedEntregador.pedidoId}</span>
                           )}
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setSelectedEntregador(null)} className="text-slate-300 hover:text-slate-500"><X size={24} /></button>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-[24px] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                     <p className="text-sm font-bold text-slate-800">{selectedEntregador.telefone || '-'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-[24px] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">VeÃ­culo</p>
                     <p className="text-sm font-bold text-slate-800 uppercase">{selectedEntregador.veiculo || 'moto'}</p>
                  </div>
                  <div className="col-span-2 p-4 bg-slate-50 rounded-[24px] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">EndereÃ§o Residencial</p>
                     <p className="text-sm font-bold text-slate-800">{selectedEntregador.endereco || 'NÃ£o informado'}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* CARTEIRA */}
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                     <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                           <CreditCard size={16} />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carteira</h4>
                     </div>
                     <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">A Receber</p>
                     <p className="text-3xl font-black text-slate-800 tracking-tighter">R$ 1.240,50</p>
                     <button className="mt-4 w-full bg-white text-slate-800 py-2 rounded-xl text-[10px] font-black uppercase border border-slate-200 hover:bg-slate-900 hover:text-white transition-all">Pagar Entregador</button>
                  </div>

                  {/* PERFORMANCE */}
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                     <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-orange-100 text-shopee-orange rounded-xl flex items-center justify-center">
                           <Star size={16} fill="currentColor" />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AvaliaÃ§Ã£o</h4>
                     </div>
                     <div className="flex items-end gap-2 mb-1">
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{selectedEntregador.avaliacao}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5">/ 5.0</p>
                     </div>
                     <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= Math.floor(selectedEntregador.avaliacao) ? "#FF4D2D" : "#E2E8F0"} className={s <= Math.floor(selectedEntregador.avaliacao) ? "text-shopee-orange" : "text-slate-200"} />)}
                     </div>
                     <p className="mt-2 text-[9px] font-black text-slate-400 uppercase">Baseado em {selectedEntregador.entregas} entregas</p>
                  </div>
               </div>

               <div className="mb-8">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Zona de AtuaÃ§Ã£o (Geofencing)</h4>
                  <select 
                     value={selectedEntregador.zonaId || ''}
                     onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        setEntregadores(entregadores.map(ent => ent.id === selectedEntregador.id ? { ...ent, zonaId: val } : ent));
                        setSelectedEntregador({ ...selectedEntregador, zonaId: val });
                     }}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:border-shopee-orange transition-all hover:bg-slate-100 cursor-pointer"
                  >
                     <option value="">ðŸŒŽ Livre / Sem Zona EspecÃ­fica</option>
                     {zones.map(z => (
                        <option key={z.id} value={z.id}>ðŸ“ {z.nome} (Raio {z.raio}m)</option>
                     ))}
                  </select>
               </div>

               <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">AÃ§Ãµes RÃ¡pidas</h4>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                        onClick={() => {
                           setActiveChat(selectedEntregador);
                           setSelectedEntregador(null);
                        }}
                        className="flex items-center justify-center gap-2 p-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-shopee-orange transition-all"
                     >
                        <MessageSquare size={16} /> Iniciar Chat
                     </button>
                     <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm"><Phone size={14} /></div>
                           <span className="text-sm font-bold text-slate-700">{selectedEntregador.telefone || '(11) 98822-1100'}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <button 
                  onClick={() => {
                     setInativos([...inativos, selectedEntregador]);
                     setEntregadores(entregadores.filter(e => e.id !== selectedEntregador.id));
                     setSelectedEntregador(null);
                  }}
                  className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest mt-8 flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
               >
                  <Trash size={16} /> Desativar Entregador
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NOVA ZONA (GEOFENCING) */}
      <AnimatePresence>
        {isAddingZone && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingZone(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-800 tracking-tighter">Configurar Nova Zona</h3>
                  <button onClick={() => setIsAddingZone(false)} className="text-slate-300 hover:text-slate-500"><X size={24} /></button>
               </div>
               <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-4">
                     <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">LocalizaÃ§Ã£o Capturada</p>
                     <p className="text-[11px] font-bold text-indigo-600 font-mono">{tempZoneCoords?.lat.toFixed(4)}, {tempZoneCoords?.lng.toFixed(4)}</p>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Bairro/RegiÃ£o</label>
                     <input type="text" value={newZoneData.nome} onChange={(e) => setNewZoneData({...newZoneData, nome: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Jardins" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa (R$)</label>
                        <input type="number" value={newZoneData.taxa} onChange={(e) => setNewZoneData({...newZoneData, taxa: parseFloat(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raio (m)</label>
                        <input type="number" value={newZoneData.raio} onChange={(e) => setNewZoneData({...newZoneData, raio: parseInt(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500" />
                     </div>
                  </div>
                  <button 
                     onClick={() => {
                        if (!tempZoneCoords) return;
                        setZones([...zones, { ...newZoneData, id: Date.now(), lat: tempZoneCoords.lat, lng: tempZoneCoords.lng }]);
                        setIsAddingZone(false);
                        setNewZoneData({ nome: '', taxa: 7.00, raio: 1500, color: '#' + Math.floor(Math.random()*16777215).toString(16) });
                     }}
                     className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest mt-4 shadow-xl hover:bg-indigo-700 transition-colors shadow-indigo-200"
                  >
                     Criar Zona de Entrega
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CHAT LOGÃSTICO */}
      <AnimatePresence>
         {activeChat && (
            <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-end p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveChat(null)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-xs" />
               <motion.div 
                  initial={{ x: 300, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  exit={{ x: 300, opacity: 0 }} 
                  className="relative bg-white w-full max-w-sm h-[600px] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
               >
                  <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-shopee-orange rounded-xl flex items-center justify-center font-black">
                           {(activeChat.nome || '?').charAt(0)}
                        </div>
                        <div>
                           <h4 className="text-sm font-black">{activeChat.nome}</h4>
                           <p className="text-[8px] font-black uppercase text-shopee-orange">Online â€¢ Entregador</p>
                        </div>
                     </div>
                     <button onClick={() => setActiveChat(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50">
                     {messages.filter(m => m.pedido_id === activeChat.id || !m.pedido_id).map(m => (
                        <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium shadow-sm ${
                              m.sender === 'admin' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'
                           }`}>
                              {m.text}
                              <p className={`text-[8px] mt-1 ${m.sender === 'admin' ? 'text-slate-400' : 'text-slate-300'}`}>{m.time || 'Agora'}</p>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center">
                     <input 
                        type="text" 
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendAdminMessage()}
                        placeholder="Escreva sua mensagem..."
                        className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-xs font-medium focus:ring-1 focus:ring-shopee-orange"
                     />
                     <button 
                        onClick={sendAdminMessage}
                        className="w-10 h-10 bg-shopee-orange text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-shopee-orange/20"
                     >
                        <Send size={18} />
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* MODAL: NOVO BANNER */}
      <AnimatePresence>
         {isAddingBanner && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddingBanner(false); setEditingBannerId(null); setNewBanner({ imagem_url: '', link_url: '', ativo: true, ordem: 0, data_inicio: '', data_fim: '', categoria: 'geral', segmento: 'todos' }); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-black text-slate-800 tracking-tighter">
                        {editingBannerId ? 'Editar Banner PublicitÃ¡rio' : 'Novo Banner PublicitÃ¡rio'}
                     </h3>
                     <button onClick={() => { setIsAddingBanner(false); setEditingBannerId(null); setNewBanner({ imagem_url: '', link_url: '', ativo: true, ordem: 0, data_inicio: '', data_fim: '', categoria: 'geral', segmento: 'todos' }); }} className="text-slate-300 hover:text-slate-500"><X size={24} /></button>
                  </div>
                  <div className="space-y-6">
                     <div 
                        className="aspect-[16/7] bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
                        onClick={() => !isUploadingBanner && document.getElementById('banner-upload')?.click()}
                     >
                        {isUploadingBanner ? (
                           <div className="flex flex-col items-center gap-2">
                              <RefreshCw className="animate-spin text-shopee-orange" size={24} />
                              <p className="text-[10px] font-black text-slate-400 uppercase">Subindo imagem...</p>
                           </div>
                        ) : newBanner.imagem_url ? (
                           <img src={newBanner.imagem_url} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                           <>
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                 <Plus size={24} />
                              </div>
                              <p className="text-[10px] font-black text-slate-400 uppercase">Clique para subir imagem</p>
                           </>
                        )}
                        <input id="banner-upload" type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                     </div>

                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria de ExibiÃ§Ã£o</label>
                        <select 
                           value={newBanner.categoria}
                           onChange={(e) => setNewBanner({ ...newBanner, categoria: e.target.value })}
                           className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-shopee-orange"
                        >
                           <option value="geral">Geral (Toda a Home)</option>
                           <option value="promocoes">PÃ¡gina de PromoÃ§Ãµes / Vantagens ðŸŽŸï¸</option>
                           <option value="Restaurantes">Restaurantes</option>
                           <option value="Moda">Moda</option>
                           <option value="Beleza">Beleza</option>
                           <option value="EletrÃ´nicos">EletrÃ´nicos</option>
                           <option value="ServiÃ§os">ServiÃ§os</option>
                           <option value="ConstruÃ§Ã£o">ConstruÃ§Ã£o</option>
                           <option value="Pet Shop">Pet Shop</option>
                        </select>
                     </div>

                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PÃºblico-Alvo (SegmentaÃ§Ã£o)</label>
                        <select 
                           value={newBanner.segmento}
                           onChange={(e) => setNewBanner({ ...newBanner, segmento: e.target.value })}
                           className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-shopee-orange"
                        >
                           <option value="todos">Todos os UsuÃ¡rios</option>
                           <option value="novos">Novos UsuÃ¡rios (Zero Compras)</option>
                           <option value="frequentes">Clientes VIP (Frequentes)</option>
                        </select>
                     </div>

                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link de Destino (URL)</label>
                        <input 
                           type="text" 
                           value={newBanner.link_url} 
                           onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })} 
                           className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange" 
                           placeholder="https://capelgo.com.br/promocao" 
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">InÃ­cio (Opcional)</label>
                           <input 
                              type="datetime-local" 
                              value={newBanner.data_inicio}
                              onChange={(e) => setNewBanner({ ...newBanner, data_inicio: e.target.value })}
                              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-[10px] font-bold focus:ring-2 focus:ring-shopee-orange" 
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TÃ©rmino (Opcional)</label>
                           <input 
                              type="datetime-local" 
                              value={newBanner.data_fim}
                              onChange={(e) => setNewBanner({ ...newBanner, data_fim: e.target.value })}
                              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-[10px] font-bold focus:ring-2 focus:ring-shopee-orange" 
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordem de ExibiÃ§Ã£o</label>
                           <input 
                              type="number" 
                              value={newBanner.ordem} 
                              onChange={(e) => setNewBanner({ ...newBanner, ordem: parseInt(e.target.value) })} 
                              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-shopee-orange" 
                           />
                        </div>
                        <div className="flex flex-col justify-end">
                           <button 
                              onClick={() => setNewBanner({ ...newBanner, ativo: !newBanner.ativo })}
                              className={`h-14 rounded-2xl font-black text-[10px] uppercase transition-all ${newBanner.ativo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                           >
                              {newBanner.ativo ? 'ðŸ”¥ Banner Ativo' : 'â„ï¸ Pausado'}
                           </button>
                        </div>
                     </div>

                     <button 
                        onClick={handleSaveBanner}
                        disabled={!newBanner.imagem_url || isUploadingBanner}
                        className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest mt-4 shadow-xl hover:bg-shopee-orange transition-all disabled:opacity-50 disabled:bg-slate-300"
                     >
                        {editingBannerId ? 'Salvar AlteraÃ§Ãµes' : 'Publicar Banner na Home'}
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
      
      {/* ðŸ“‚ GESTOR DE CATEGORIAS E SUBCATEGORIAS */}
      <AnimatePresence>
         {showCategoriasModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowCategoriasModal(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
               />
               <motion.div 
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
               >
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Taxonomia do Marketplace</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Gestão de Categorias e Subcategorias Principais</p>
                     </div>
                     <button onClick={() => setShowCategoriasModal(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:border-shopee-orange transition-all shadow-sm">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Lista de Categorias */}
                        <div className="lg:col-span-1 space-y-4">
                           <div className="flex justify-between items-center">
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorias</h3>
                              <button 
                                 onClick={() => setEditingCategoria({ nome: '', id_slug: '', icone: 'ðŸ“¦', subcategorias: [] })}
                                 className="text-[10px] font-black text-shopee-orange uppercase hover:underline"
                              >
                                 + Nova
                              </button>
                           </div>
                           <div className="space-y-2">
                              {categorias.map(cat => (
                                 <button 
                                    key={cat.id}
                                    onClick={() => setEditingCategoria(cat)}
                                    className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all border ${
                                       editingCategoria?.id === cat.id ? 'bg-shopee-orange text-white border-shopee-orange shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                                    }`}
                                 >
                                    <span className="text-lg">{cat.icone || 'ðŸ“¦'}</span>
                                    <div className="text-left">
                                       <p className="text-xs font-black leading-none">{cat.nome}</p>
                                       <p className={`text-[8px] font-black uppercase mt-1 ${editingCategoria?.id === cat.id ? 'text-white/60' : 'text-slate-400'}`}>
                                          {cat.subcategorias?.length || 0} Subcategorias
                                       </p>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* Editor de Categoria */}
                        <div className="lg:col-span-2">
                           {editingCategoria ? (
                              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-200 space-y-6">
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Categoria</label>
                                       <input 
                                          type="text"
                                          value={editingCategoria.nome}
                                          onChange={(e) => setEditingCategoria({ ...editingCategoria, nome: e.target.value })}
                                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slug (ID do Sistema)</label>
                                       <input 
                                          type="text"
                                          value={editingCategoria.id_slug}
                                          onChange={(e) => setEditingCategoria({ ...editingCategoria, id_slug: e.target.value })}
                                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                          placeholder="ex: eletronicos"
                                       />
                                    </div>
                                 </div>

                                 <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ãcone / Emoji</label>
                                    <input 
                                       type="text"
                                       value={editingCategoria.icone}
                                       onChange={(e) => setEditingCategoria({ ...editingCategoria, icone: e.target.value })}
                                       className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                    />
                                 </div>

                                 <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subcategorias</label>
                                    <div className="flex gap-2">
                                       <input 
                                          type="text"
                                          value={newSubcategoria}
                                          onChange={(e) => setNewSubcategoria(e.target.value)}
                                          placeholder="Adicionar subcategoria..."
                                          className="flex-1 bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-shopee-orange"
                                       />
                                       <button 
                                          onClick={() => {
                                             if (!newSubcategoria.trim()) return;
                                             setEditingCategoria({
                                                ...editingCategoria,
                                                subcategorias: [...(editingCategoria.subcategorias || []), newSubcategoria.trim()]
                                             });
                                             setNewSubcategoria('');
                                          }}
                                          className="bg-slate-900 text-white px-6 rounded-xl text-[10px] font-black uppercase hover:bg-shopee-orange"
                                       >
                                          Add
                                       </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                       {editingCategoria.subcategorias?.map((sub: string, idx: number) => (
                                          <div key={idx} className="bg-white border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-2">
                                             <span className="text-[10px] font-bold text-slate-700">{sub}</span>
                                             <button 
                                                onClick={() => {
                                                   setEditingCategoria({
                                                      ...editingCategoria,
                                                      subcategorias: editingCategoria.subcategorias.filter((_: any, i: number) => i !== idx)
                                                   });
                                                }}
                                                className="text-red-400 hover:text-red-600"
                                             >
                                                <X size={12} />
                                             </button>
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 <div className="flex gap-3 pt-4">
                                    <button 
                                       onClick={() => handleSaveCategoria(editingCategoria)}
                                       className="flex-1 bg-shopee-orange text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-shopee-orange/20"
                                    >
                                       Salvar Categoria
                                    </button>
                                    {editingCategoria.id && (
                                       <button 
                                          onClick={() => handleDeleteCategoria(editingCategoria.id)}
                                          className="px-6 bg-red-50 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-red-100"
                                       >
                                          Excluir
                                       </button>
                                    )}
                                 </div>
                              </div>
                           ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                    <Layout size={32} className="text-slate-200" />
                                 </div>
                                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Selecione uma categoria</h4>
                                 <p className="text-[10px] text-slate-300 font-medium max-w-[200px] mt-2">Clique em uma categoria ao lado para editar ou criar uma nova.</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* MODAL GERADOR DE AVALIAÃ‡Ã•ES EM MASSA */}
      {showReviewModal && selectedProductForReview && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                  <div>
                     <h3 className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
                        <Star className="text-blue-500" fill="currentColor" size={24} /> Gerador de Prova Social
                     </h3>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                        Produto: {selectedProductForReview.nome}
                     </p>
                  </div>
                  <button onClick={() => { setShowReviewModal(false); setReviewPhotos([]); }} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:border-slate-400 transition-all shadow-sm">
                     <X size={16} className="text-slate-400" />
                  </button>
               </div>
               
               <div className="p-8 overflow-y-auto space-y-6">
                  <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-3xl">
                     <h4 className="text-sm font-black text-blue-900 mb-2">Como funciona?</h4>
                     <p className="text-xs text-blue-700/80 leading-relaxed font-medium">
                        Esta ferramenta vai injetar <strong>10 avaliaÃ§Ãµes</strong> no produto selecionado com nota 5 estrelas e comentÃ¡rios extremamente naturais ("Chegou rÃ¡pido", "Ã“tima qualidade"). O nÃºmero de vendas na pÃ¡gina inicial tambÃ©m vai dar um salto, criando escasez!
                     </p>
                  </div>
                  
                  <div>
                     <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3">Adicionar Fotos de Clientes (Opcional)</h4>
                     <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition-colors rounded-[24px] p-6 flex flex-col items-center justify-center cursor-pointer gap-2">
                        <UploadCloud size={24} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">
                           Clique para subir fotos reais de pessoas usando/recebendo o produto<br/>(DÃ¡ muito mais credibilidade e conversÃ£o)
                        </span>
                        <input 
                           type="file" 
                           multiple 
                           accept="image/*" 
                           className="hidden" 
                           onChange={(e) => {
                              if (e.target.files) {
                                 setReviewPhotos(prev => [...prev, ...Array.from(e.target.files!)]);
                              }
                           }}
                        />
                     </label>
                     
                     {reviewPhotos.length > 0 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                           {reviewPhotos.map((f, i) => (
                              <div key={i} className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                 <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
               
               <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => { setShowReviewModal(false); setReviewPhotos([]); }} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all">
                     Cancelar
                  </button>
                  <button 
                     onClick={async () => {
                        setIsGeneratingReviews(true);
                        try {
                           const uploadedUrls = [];
                           for (const file of reviewPhotos) {
                              const fileExt = file.name.split('.').pop();
                              const fileName = `review_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                              const { error: uploadError } = await supabase.storage.from('produtos').upload(fileName, file);
                              if (!uploadError) {
                                 const { data } = supabase.storage.from('produtos').getPublicUrl(fileName);
                                 uploadedUrls.push(data.publicUrl);
                              }
                           }

                           const comments = [
                              "Produto excelente, chegou super rÃ¡pido! Veio muito bem embalado.",
                              "Qualidade surpreendente pelo preÃ§o. Recomendo muito o vendedor.",
                              "Comprei com um pouco de receio, mas me surpreendi positivamente. O material Ã© muito bom.",
                              "Veio tudo certinho. Loja confiÃ¡vel, voltarei a comprar com certeza.",
                              "Perfeito! Exatamente como na foto. Comprarei novamente.",
                              "Ã“timo custo-benefÃ­cio. Atendeu todas as minhas expectativas.",
                              "Entrega antes do prazo estipulado. Muito satisfeito com a compra.",
                              "Simplesmente amei. O acabamento Ã© de primeira, nota 10.",
                              "Tudo nos conformes. Recomendo o vendedor a todos.",
                              "Produto de alta qualidade. Vale cada centavo investido."
                           ];

                           const numReviews = reviewPhotos.length > 0 ? reviewPhotos.length : 10;
                           const newReviews = [];
                           
                           for (let i = 0; i < numReviews; i++) {
                              const temFoto = reviewPhotos.length > 0;
                              newReviews.push({
                                 produto_id: selectedProductForReview.id,
                                 loja_id: selectedProductForReview.loja_id,
                                 nota: 5,
                                 comentario: comments[i % comments.length],
                                 fotos: temFoto ? [uploadedUrls[i]] : [],
                                 midias: temFoto ? [{ url: uploadedUrls[i], tipo: 'foto' }] : [],
                                 created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString()
                              });
                           }

                           await supabase.from('avaliacoes').insert(newReviews);
                           
                            await supabase.from('produtos').update({
                               avaliacao: 5.0,
                               vendidos: (selectedProductForReview.vendidos || 0) + numReviews
                            }).eq('id', selectedProductForReview.id);

                           alert(`ðŸ”¥ ${numReviews} Avaliações geradas e vendas atualizadas com sucesso!`);
                           setShowReviewModal(false);
                           setReviewPhotos([]);
                        } catch (e) {
                           console.error(e);
                           alert("Avaliações geradas! (Mas houve erro ao criar logs. O Produto jÃ¡ foi atualizado na Home).");
                        } finally {
                           setIsGeneratingReviews(false);
                        }
                     }} 
                     disabled={isGeneratingReviews}
                     className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-600/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                     {isGeneratingReviews ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} fill="currentColor" />}
                     {isGeneratingReviews ? 'Gerando...' : 'Gerar 10 Avaliações'}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

// Sub-componentes Sidebar e Stats
function AdminSidebarContent({ activeTab, setActiveTab, navigate, fetchRealData }: any) {
  const { plataformaLogo } = useConfig();
  return (
    <>
      <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          {plataformaLogo ? (
             <img src={plataformaLogo} alt="Logo" className="h-8 object-contain" />
          ) : (
             <>
                <div className="w-8 h-8 bg-shopee-orange rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-shopee-orange/20">C</div>
                <h1 className="font-black text-xl italic tracking-tighter">CapelGo</h1>
             </>
          )}
      </div>
      <nav className="flex-1 p-3 space-y-1">
          <AdminMenuBtn icon={<TrendingUp size={18}/>} label="Crescimento" active={activeTab === 'crescimento'} onClick={() => setActiveTab('crescimento')} />
          <AdminMenuBtn icon={<Store size={18}/>} label="Lojas" active={activeTab === 'lojas'} onClick={() => setActiveTab('lojas')} />
          <AdminMenuBtn icon={<Ticket size={18}/>} label="Cupons" active={activeTab === 'cupons'} onClick={() => setActiveTab('cupons')} />
          <AdminMenuBtn icon={<Navigation size={18}/>} label="LogÃ­stica" active={activeTab === 'logistica'} onClick={() => setActiveTab('logistica')} />
          <AdminMenuBtn icon={<History size={18}/>} label="Histórico" active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} />
          <AdminMenuBtn icon={<FileText size={18}/>} label="Páginas CMS" active={activeTab === 'paginas'} onClick={() => setActiveTab('paginas')} />
          <AdminMenuBtn icon={<DollarSign size={18}/>} label="Financeiro" active={activeTab === 'financeiro'} onClick={() => setActiveTab('financeiro')} />
          <AdminMenuBtn icon={<Package size={18}/>} label="Produtos" active={activeTab === 'produtos'} onClick={() => setActiveTab('produtos')} />
          <AdminMenuBtn icon={<Layers size={18}/>} label="Criação em Massa" active={activeTab === 'criacao_massa'} onClick={() => setActiveTab('criacao_massa')} />
          <AdminMenuBtn icon={<TrendingUp size={18}/>} label="Performance" active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
          <AdminMenuBtn icon={<Printer size={18}/>} label="Envio em Massa" active={activeTab === 'envio_massa'} onClick={() => setActiveTab('envio_massa')} />
          <AdminMenuBtn icon={<MessageSquare size={18}/>} label="Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
          <AdminMenuBtn icon={<Settings size={18}/>} label="Ajustes" active={activeTab === 'ajustes'} onClick={() => setActiveTab('ajustes')} />
          <div className="h-px bg-slate-800 my-4" />
          <AdminMenuBtn icon={<Users size={18}/>} label="UsuÃ¡rios" active={activeTab === 'usuarios'} onClick={() => setActiveTab('usuarios')} />
          <AdminMenuBtn icon={<ListTodo size={18}/>} label="Tarefas" active={activeTab === 'tarefas'} onClick={() => setActiveTab('tarefas')} />
          <AdminMenuBtn icon={<ShieldCheck size={18}/>} label="Segurança" active={activeTab === 'seguranca'} onClick={() => setActiveTab('seguranca')} />
      </nav>
      <div className="p-4 border-t border-slate-800">
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/login'))} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all"><LogOut size={18} /> Sair</button>
      </div>
    </>
  );
}

function AdminMenuBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${active ? 'bg-shopee-orange text-white font-bold shadow-lg shadow-shopee-orange/20' : 'text-slate-500 hover:bg-slate-800'}`}>
      <span className={active ? 'text-white' : 'text-slate-600'}>{icon}</span>
      <span className="text-[11px] uppercase tracking-wider font-black">{label}</span>
    </button>
  );
}

function AdminSquareStat({ label, value, icon, color }: any) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
       <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center mb-2`}>
          {icon}
       </div>
       <p className="text-[8px] text-slate-400 font-black uppercase leading-none mb-1">{label}</p>
       <p className="text-sm font-black text-slate-800 leading-none">{value}</p>
    </div>
  );
}

declare global {
  interface Window {
    L: any;
  }
}

// â”€â”€â”€ CENTRO DE TAREFAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TASK_CATEGORIES_DATA = [
  { id: 'todos',       label: 'Todas',        color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
  { id: 'plataforma',  label: 'Plataforma',   color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  { id: 'marketing',   label: 'Marketing',    color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { id: 'financeiro',  label: 'Financeiro',   color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  { id: 'operacional', label: 'Operacional',  color: 'bg-orange-100 text-orange-700', dot: 'bg-shopee-orange' },
  { id: 'tecnico',     label: 'Tecnico',      color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  { id: 'pessoal',     label: 'Pessoal',      color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
];

const prioridadeMap: Record<string, { label: string; color: string }> = {
  alta:  { label: 'Alta',  color: 'bg-red-100 text-red-600 border border-red-200' },
  media: { label: 'Media', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  baixa: { label: 'Baixa', color: 'bg-green-100 text-green-700 border border-green-200' },
};

function TarefasCenter({ supabase }: { supabase: any }) {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbAvailable, setDbAvailable] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [form, setForm] = useState({ titulo: '', descricao: '', categoria: 'plataforma', prioridade: 'media' });

  // Helpers para localStorage fallback
  const loadLocal = () => {
    try { return JSON.parse(localStorage.getItem('capelgo_tarefas') || '[]'); } catch { return []; }
  };
  const saveLocal = (data: any[]) => {
    localStorage.setItem('capelgo_tarefas', JSON.stringify(data));
  };

  const fetchTarefas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tarefas_admin')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        // Tabela não existe ainda â€” usa localStorage
        setDbAvailable(false);
        setTarefas(loadLocal());
      } else {
        setDbAvailable(true);
        setTarefas(data || []);
      }
    } catch (e) {
      setDbAvailable(false);
      setTarefas(loadLocal());
    }
    setLoading(false);
  };
  useEffect(() => { fetchTarefas(); }, []);

  const handleToggle = async (tarefa: any) => {
    setSavingId(tarefa.id);
    const ns = !tarefa.concluida;
    const updated = tarefas.map(t => t.id === tarefa.id ? { ...t, concluida: ns, concluida_em: ns ? new Date().toISOString() : null } : t);
    if (dbAvailable) {
      await supabase.from('tarefas_admin').update({ concluida: ns, concluida_em: ns ? new Date().toISOString() : null }).eq('id', tarefa.id);
    } else {
      saveLocal(updated);
    }
    setTarefas(updated);
    setSavingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta tarefa?')) return;
    if (dbAvailable) {
      await supabase.from('tarefas_admin').delete().eq('id', id);
    } else {
      saveLocal(tarefas.filter(t => t.id !== id));
    }
    setTarefas(prev => prev.filter(t => t.id !== id));
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) return;
    if (editingTask) {
      if (dbAvailable) {
        await supabase.from('tarefas_admin').update(form).eq('id', editingTask.id);
      }
      const updated = tarefas.map(t => t.id === editingTask.id ? { ...t, ...form } : t);
      if (!dbAvailable) saveLocal(updated);
      setTarefas(updated);
    } else {
      const novaTarefa = { ...form, id: crypto.randomUUID(), concluida: false, created_at: new Date().toISOString() };
      if (dbAvailable) {
        const { data } = await supabase.from('tarefas_admin').insert({ ...form, concluida: false }).select().single();
        if (data) { setTarefas(prev => [data, ...prev]); }
        else { setTarefas(prev => [novaTarefa, ...prev]); }
      } else {
        const updated = [novaTarefa, ...tarefas];
        saveLocal(updated);
        setTarefas(updated);
      }
    }
    setShowForm(false); setEditingTask(null);
    setForm({ titulo: '', descricao: '', categoria: 'plataforma', prioridade: 'media' });
  };

  const openEdit = (t: any) => {
    setEditingTask(t);
    setForm({ titulo: t.titulo, descricao: t.descricao || '', categoria: t.categoria, prioridade: t.prioridade || 'media' });
    setShowForm(true);
  };

  const filtradas = tarefas.filter(t => {
    const catOk = filtroCategoria === 'todos' || t.categoria === filtroCategoria;
    const sOk = filtroStatus === 'todas' || (filtroStatus === 'pendentes' ? !t.concluida : t.concluida);
    return catOk && sOk;
  });

  const pendentes = tarefas.filter(t => !t.concluida).length;
  const concluidas = tarefas.filter(t => t.concluida).length;
  const total = tarefas.length;
  const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Centro de Tarefas</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Gerencie tudo que precisa ser feito na plataforma</p>
        </div>
        <button onClick={() => { setEditingTask(null); setForm({ titulo: '', descricao: '', categoria: 'plataforma', prioridade: 'media' }); setShowForm(true); }}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-shopee-orange transition-all shadow-xl">
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {!dbAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-black text-amber-800">Banco de dados ainda não configurado</p>
            <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
              Execute o SQL abaixo no <strong>Supabase SQL Editor</strong> para habilitar a persistÃªncia. Por enquanto, as tarefas estÃ£o salvas localmente no seu navegador.
            </p>
            <details className="mt-2">
              <summary className="text-[10px] font-black text-amber-700 uppercase cursor-pointer hover:text-amber-900">Ver SQL para copiar</summary>
              <pre className="mt-2 bg-amber-100 rounded-xl p-3 text-[10px] font-mono text-amber-900 overflow-x-auto whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS tarefas_admin (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descricao text,
  categoria text DEFAULT 'plataforma',
  prioridade text DEFAULT 'media',
  concluida boolean DEFAULT false,
  concluida_em timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tarefas_admin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_tarefas" ON tarefas_admin
  FOR ALL USING (true) WITH CHECK (true);`}</pre>
            </details>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso Geral</span>
            <span className="text-sm font-black text-slate-800">{progresso}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progresso}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-shopee-orange rounded-full" />
          </div>
        </div>
        <div className="flex gap-6 shrink-0">
          <div className="text-center"><p className="text-2xl font-black text-slate-800">{total}</p><p className="text-[9px] font-black text-slate-400 uppercase">Total</p></div>
          <div className="text-center"><p className="text-2xl font-black text-shopee-orange">{pendentes}</p><p className="text-[9px] font-black text-slate-400 uppercase">Pendentes</p></div>
          <div className="text-center"><p className="text-2xl font-black text-green-500">{concluidas}</p><p className="text-[9px] font-black text-slate-400 uppercase">Concluidas</p></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap flex-1">
          {TASK_CATEGORIES_DATA.map(cat => (
            <button key={cat.id} onClick={() => setFiltroCategoria(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filtroCategoria === cat.id ? cat.color + ' shadow-sm' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />{cat.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          {['todas', 'pendentes', 'concluidas'].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${filtroStatus === s ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-shopee-orange/30 border-t-shopee-orange rounded-full animate-spin" /></div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4"><CheckSquare size={28} className="text-slate-300" /></div>
          <p className="text-slate-400 font-black text-sm">Nenhuma tarefa encontrada</p>
          <p className="text-slate-300 text-xs mt-1">Crie uma nova tarefa ou ajuste os filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(tarefa => {
            const cat = TASK_CATEGORIES_DATA.find(c => c.id === tarefa.categoria) || TASK_CATEGORIES_DATA[1];
            const prio = prioridadeMap[tarefa.prioridade] || prioridadeMap.media;
            return (
              <motion.div key={tarefa.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border shadow-sm p-5 flex items-start gap-4 transition-all group ${tarefa.concluida ? 'border-slate-100 opacity-60' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'}`}>
                <button onClick={() => handleToggle(tarefa)} disabled={savingId === tarefa.id}
                  className={`mt-0.5 shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${tarefa.concluida ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-shopee-orange'}`}>
                  {savingId === tarefa.id ? <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    : tarefa.concluida ? <Check size={13} className="text-white" strokeWidth={3} /> : null}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${prio.color}`}>{prio.label}</span>
                    {tarefa.concluida && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">Concluida</span>}
                  </div>
                  <h3 className={`font-black text-sm leading-tight ${tarefa.concluida ? 'line-through text-slate-400' : 'text-slate-800'}`}>{tarefa.titulo}</h3>
                  {tarefa.descricao && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{tarefa.descricao}</p>}
                  <p className="text-[9px] text-slate-300 font-black uppercase mt-2">
                    {new Date(tarefa.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => openEdit(tarefa)} className="p-2 text-slate-300 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(tarefa.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"><Trash size={14} /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tighter">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Centro de Tarefas</p>
                </div>
                <button onClick={() => { setShowForm(false); setEditingTask(null); }} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:border-slate-400 transition-all shadow-sm">
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Titulo *</label>
                  <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} autoFocus
                    placeholder="O que precisa ser feito?" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-shopee-orange transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descricao</label>
                  <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3}
                    placeholder="Detalhes adicionais..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-shopee-orange transition-all resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Categoria</label>
                    <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-shopee-orange">
                      {TASK_CATEGORIES_DATA.filter(c => c.id !== 'todos').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Prioridade</label>
                    <select value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-shopee-orange">
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowForm(false); setEditingTask(null); }} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-black text-[11px] uppercase hover:bg-slate-50 transition-all">Cancelar</button>
                  <button onClick={handleSave} disabled={!form.titulo.trim()} className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-black text-[11px] uppercase hover:bg-shopee-orange transition-all shadow-lg disabled:opacity-40">
                    {editingTask ? 'Salvar' : 'Criar Tarefa'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

