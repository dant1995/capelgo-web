import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { DollarSign, MapPin, Truck } from 'lucide-react';
import DateFilterBar from './DateFilterBar';

interface AdminFinancialReportsProps {
  pedidos: any[];
  lojas: any[];
}

export default function AdminFinancialReports({ pedidos, lojas }: AdminFinancialReportsProps) {
  const [filterDays, setFilterDays] = useState(15);

  const filteredPedidos = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (filterDays - 1));
    const startStr = start.toLocaleDateString('en-CA');
    return pedidos.filter(p => p.status === 'entregue' && p.created_at >= startStr);
  }, [pedidos, filterDays]);

  // 1. Faturamento Total vs Comissões (Últimos 15 dias)
  const platformSales = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = filterDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      
      const dailyOrders = pedidos.filter(
        (p) => p.status === 'entregue' && p.created_at.startsWith(dateStr)
      );
      
      const totalGerado = dailyOrders.reduce((acc, p) => acc + (p.total || 0), 0);
      const comissao = totalGerado * 0.1; // 10% de taxa fixa para exemplo
      
      days.push({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        'Volume Total': totalGerado,
        'Nossa Comissão': comissao,
      });
    }
    return days;
  }, [pedidos, filterDays]);

  // 2. Ranking de Lojas
  const storeRanking = useMemo(() => {
    const ranking: Record<string, number> = {};
    filteredPedidos.forEach(p => {
      const lojaNome = p.lojas?.nome || 'Desconhecida';
      ranking[lojaNome] = (ranking[lojaNome] || 0) + (p.total || 0);
    });
    
    return Object.keys(ranking)
      .map(nome => ({ nome, Faturamento: ranking[nome] }))
      .sort((a, b) => b.Faturamento - a.Faturamento)
      .slice(0, 5);
  }, [filteredPedidos]);

  // 3. Tempo Médio de Entrega (simulação)
  const deliveryData = [
    { bairro: 'Ermelino', tempo: 15 },
    { bairro: 'Vila Inês', tempo: 12 },
    { bairro: 'Ponte Rasa', tempo: 20 },
    { bairro: 'Boturussu', tempo: 18 },
  ];

  // KPIs
  const totalVolume = filteredPedidos.reduce((acc, p) => acc + (p.total || 0), 0);
  const totalComissoes = totalVolume * 0.1;
  const qtdLojas = lojas.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tighter">Visão Macro (Plataforma)</h2>
          <p className="text-gray-500 text-sm">Controle financeiro do ecossistema CapelGo — últimos {filterDays} dias</p>
        </div>
        <DateFilterBar selectedDays={filterDays} onChange={setFilterDays} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-shopee-orange/10 rounded-full flex items-center justify-center text-shopee-orange">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Volume Movimentado</p>
            <h3 className="text-2xl font-black text-gray-800">R$ {totalVolume.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lucro (Comissões)</p>
            <h3 className="text-2xl font-black text-green-600">R$ {totalComissoes.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lojas Ativas</p>
            <h3 className="text-2xl font-black text-gray-800">{qtdLojas} Parceiros</h3>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento Geral */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider">Volume da Plataforma (Últimos {filterDays} dias)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={platformSales} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, undefined]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Volume Total" stroke="#1976D2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Nossa Comissão" stroke="#2E7D32" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking de Lojas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider">Top Lojas (Receita Gerada)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeRanking} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#eee" />
                <XAxis type="number" tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="nome" type="category" tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false} width={100} />
                <Tooltip 
                  cursor={{fill: '#f5f5f5'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Faturamento" fill="#EE4D2D" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tempos de Logística */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider flex items-center gap-2"><Truck size={16}/> Logística: Tempo Médio (min)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deliveryData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="bairro" tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f5f5f5'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} min`, 'Tempo Médio']}
                />
                <Bar dataKey="tempo" fill="#9C27B0" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
