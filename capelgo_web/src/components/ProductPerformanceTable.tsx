import React, { useState } from 'react';
import { Search, ChevronDown, TrendingUp, Package } from 'lucide-react';

interface ProductPerformance {
  id: string;
  nome: string;
  imagem: string;
  vendas: number;
  impressoes: number;
  cliques: number;
  adicoesCarrinho: number;
  ctr: number;
  taxaConversao: number;
  pedidos: number;
  unidades: number;
}

const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1546868871-af0de0ae72b8?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1600080972464-8e5f35f7d1cd?w=100&h=100&fit=crop',
];

const MOCK_DATA: ProductPerformance[] = [
  { id: 'PROD-001', nome: 'Fone Bluetooth TWS com Cancelamento de Ruído Ativo e Carregamento Rápido', imagem: PRODUCT_IMAGES[0], vendas: 1247, impressoes: 45890, cliques: 8921, adicoesCarrinho: 3210, ctr: 19.44, taxaConversao: 13.98, pedidos: 1042, unidades: 1247 },
  { id: 'PROD-002', nome: 'Carregador Turbo 65W USB-C + USB-A Carregamento Rápido', imagem: PRODUCT_IMAGES[1], vendas: 892, impressoes: 32450, cliques: 6543, adicoesCarrinho: 2345, ctr: 20.16, taxaConversao: 13.63, pedidos: 768, unidades: 892 },
  { id: 'PROD-003', nome: 'Power Bank 10000mAh Carrega 3 Dispositivos Simultaneamente', imagem: PRODUCT_IMAGES[2], vendas: 756, impressoes: 28760, cliques: 5432, adicoesCarrinho: 1876, ctr: 18.88, taxaConversao: 13.91, pedidos: 654, unidades: 756 },
  { id: 'PROD-004', nome: 'Cabo USB-C 2m Carregamento Rápido 3A Transmissão de Dados', imagem: PRODUCT_IMAGES[3], vendas: 523, impressoes: 19870, cliques: 3876, adicoesCarrinho: 1432, ctr: 19.50, taxaConversao: 13.49, pedidos: 456, unidades: 523 },
  { id: 'PROD-005', nome: 'Película Vidro 9H Proteção para Telas Resistente a Arranhões', imagem: PRODUCT_IMAGES[4], vendas: 412, impressoes: 15640, cliques: 2987, adicoesCarrinho: 1098, ctr: 19.10, taxaConversao: 13.79, pedidos: 356, unidades: 412 },
  { id: 'PROD-006', nome: 'Mouse Sem Fio 2.4GHz DPI Ajustável Design Ergonômico', imagem: PRODUCT_IMAGES[5], vendas: 345, impressoes: 13450, cliques: 2543, adicoesCarrinho: 876, ctr: 18.91, taxaConversao: 13.56, pedidos: 298, unidades: 345 },
];

export default function ProductPerformanceTable() {
  const [activeTab, setActiveTab] = useState<'desempenho' | 'recentes'>('desempenho');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoria, setCategoria] = useState('');

  const filtered = MOCK_DATA.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
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
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.imagem ? (
                        <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" />
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

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum produto encontrado</p>
          <p className="text-xs mt-1">Tente ajustar sua busca ou filtro</p>
        </div>
      )}
    </div>
  );
}
