import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, TrendingUp, Package, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProductPerformance {
  id: string;
  nome: string;
  imagem_url: string | null;
  vendas: number;
  impressoes: number;
  cliques: number;
  adicoesCarrinho: number;
  ctr: number;
  taxaConversao: number;
  pedidos: number;
  unidades: number;
}

const DATE_PRESETS = [
  { label: 'Hoje', value: 0 },
  { label: 'Ontem', value: -1 },
  { label: '3 Dias', value: 3 },
  { label: '7 Dias', value: 7 },
  { label: '30 Dias', value: 30 },
];

function getDateRange(days: number): { gte: string; lt?: string } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (days === 0) return { gte: startOfToday.toISOString() };
  if (days === -1) {
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    return { gte: startOfYesterday.toISOString(), lt: startOfToday.toISOString() };
  }
  const past = new Date(startOfToday.getTime() - days * 86400000);
  return { gte: past.toISOString() };
}

export default function ProductPerformanceTable() {
  const [activeTab, setActiveTab] = useState<'desempenho' | 'recentes'>('desempenho');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoria, setCategoria] = useState('');
  const [selectedDays, setSelectedDays] = useState(30);
  const [produtos, setProdutos] = useState<ProductPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const range = getDateRange(selectedDays);

    const { data: prodData } = await supabase
      .from('produtos')
      .select('id, nome, imagem_url, visualizacoes, created_at')
      .order('created_at', { ascending: false });

    if (!prodData) { setLoading(false); return; }

    let clicksQuery = supabase.from('produto_clicks').select('produto_id, created_at');
    if (range.gte) clicksQuery = clicksQuery.gte('created_at', range.gte);
    if (range.lt) clicksQuery = clicksQuery.lt('created_at', range.lt);
    const { data: clicksData } = await clicksQuery;

    const clickCount: Record<string, number> = {};
    if (clicksData) {
      for (const c of clicksData) {
        clickCount[c.produto_id] = (clickCount[c.produto_id] || 0) + 1;
      }
    }

    let cartQuery = supabase.from('adicoes_carrinho').select('produto_id, created_at');
    if (range.gte) cartQuery = cartQuery.gte('created_at', range.gte);
    if (range.lt) cartQuery = cartQuery.lt('created_at', range.lt);
    const { data: cartData } = await cartQuery;

    const cartCount: Record<string, number> = {};
    if (cartData) {
      for (const a of cartData) {
        cartCount[a.produto_id] = (cartCount[a.produto_id] || 0) + 1;
      }
    }

    let pedidosQuery = supabase.from('pedidos').select('status, itens, created_at');
    if (range.gte) pedidosQuery = pedidosQuery.gte('created_at', range.gte);
    if (range.lt) pedidosQuery = pedidosQuery.lt('created_at', range.lt);
    const { data: pedidosData } = await pedidosQuery;

    const salesCount: Record<string, { pedidos: number; unidades: number }> = {};
    if (pedidosData) {
      for (const pedido of pedidosData) {
        if (pedido.status === 'cancelado') continue;
        const itens = pedido.itens || [];
        const seen = new Set<string>();
        for (const item of itens) {
          const qtd = item.qtd || item.quantidade || 1;
          if (!salesCount[item.id]) salesCount[item.id] = { pedidos: 0, unidades: 0 };
          salesCount[item.id].unidades += qtd;
          if (!seen.has(item.id)) {
            salesCount[item.id].pedidos += 1;
            seen.add(item.id);
          }
        }
      }
    }

    const mapped: ProductPerformance[] = prodData.map(p => {
      const sales = salesCount[p.id] || { pedidos: 0, unidades: 0 };
      const cliques = clickCount[p.id] || 0;
      const impressoes = p.visualizacoes || 0;
      const adicoesCarrinho = cartCount[p.id] || 0;
      const vendas = sales.unidades;
      const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
      const taxaConversao = cliques > 0 ? (vendas / cliques) * 100 : 0;
      return {
        id: p.id,
        nome: p.nome,
        imagem_url: p.imagem_url?.split(',')[0] || null,
        vendas,
        impressoes,
        cliques,
        adicoesCarrinho,
        ctr,
        taxaConversao,
        pedidos: sales.pedidos,
        unidades: sales.unidades,
      };
    });

    setProdutos(mapped);
    setLoading(false);
  }, [selectedDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = produtos.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const sorted = [...filtered].sort((a, b) =>
    activeTab === 'desempenho' ? b.vendas - a.vendas : 0
  );

  const formatNum = (n: number) => n.toLocaleString('pt-BR');
  const formatPct = (n: number) => n.toFixed(2) + '%';

  return (
    <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-8">
      <h2 className="text-lg text-slate-800 tracking-tight mb-6">Performance do Produto</h2>

      <div className="bg-slate-50 rounded-[24px] p-3 flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative">
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-xs text-slate-600 font-medium outline-none focus:ring-2 focus:ring-shopee-orange/20 focus:border-shopee-orange min-w-[160px] cursor-pointer"
          >
            <option value="">Todas Categorias</option>
            <option value="audio">Áudio</option>
            <option value="acessorios">Acessórios</option>
            <option value="carregadores">Carregadores</option>
            <option value="energia">Energia</option>
            <option value="informatica">Informática</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar Produto"
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-shopee-orange/20 focus:border-shopee-orange placeholder:text-slate-400"
          />
        </div>

        <button className="ml-auto bg-white border border-shopee-orange text-shopee-orange rounded-xl px-5 py-2.5 text-[11px] font-bold hover:bg-shopee-orange hover:text-white transition-all whitespace-nowrap">
          Selecionar Métricas
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Calendar size={14} className="text-gray-400" />
        {DATE_PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => setSelectedDays(p.value)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
              selectedDays === p.value
                ? 'bg-shopee-orange text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-6 border-b border-slate-100 mb-6">
        <button
          onClick={() => setActiveTab('desempenho')}
          className={`pb-3 text-[11px] font-bold tracking-wide border-b-2 transition-colors ${
            activeTab === 'desempenho'
              ? 'text-shopee-orange border-shopee-orange'
              : 'text-slate-400 border-transparent hover:text-slate-600'
          }`}
        >
          Produtos com Melhor Desempenho
        </button>
        <button
          onClick={() => setActiveTab('recentes')}
          className={`pb-3 text-[11px] font-bold tracking-wide border-b-2 transition-colors ${
            activeTab === 'recentes'
              ? 'text-shopee-orange border-shopee-orange'
              : 'text-slate-400 border-transparent hover:text-slate-600'
          }`}
        >
          Produtos Recém-Cadastrados
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Informação do Produto</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Vendas</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Impressões de Produto</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cliques Por Produto</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Adições ao Carrinho</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">CTR</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Taxa de Conversão de Pedidos</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Pedidos</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Unidades</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.imagem_url ? (
                        <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={16} className="text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-700 truncate max-w-[220px] leading-tight">{p.nome}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">ID do Produto: {p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-right text-[12px] font-semibold text-slate-700">{formatNum(p.vendas)}</td>
                <td className="px-5 py-4 text-right text-[12px] font-semibold text-slate-700">{formatNum(p.impressoes)}</td>
                <td className="px-5 py-4 text-right text-[12px] font-semibold text-slate-700">{formatNum(p.cliques)}</td>
                <td className="px-5 py-4 text-right text-[12px] font-semibold text-shopee-orange">{formatNum(p.adicoesCarrinho)}</td>
                <td className="px-5 py-4 text-right text-[12px] font-semibold text-slate-700">{formatPct(p.ctr)}</td>
                <td className="px-5 py-4 text-right text-[12px] font-semibold text-slate-700">{formatPct(p.taxaConversao)}</td>
                <td className="px-5 py-4 text-right text-[12px] font-semibold text-slate-700">{formatNum(p.pedidos)}</td>
                <td className="px-5 py-4 text-right text-[12px] font-semibold text-slate-700">{formatNum(p.unidades)}</td>
                <td className="px-5 py-4 text-center">
                  <button className="text-[11px] font-bold text-blue-500 hover:text-blue-700 hover:underline transition-colors whitespace-nowrap">
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-shopee-orange border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm font-medium">Carregando dados...</p>
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum produto encontrado</p>
          <p className="text-xs mt-1">Tente ajustar sua busca ou filtro</p>
        </div>
      )}
    </div>
  );
}
