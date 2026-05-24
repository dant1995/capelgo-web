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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';
import DateFilterBar from './DateFilterBar';

interface FinancialReportsProps {
  pedidos: any[];
  produtos: any[];
}

const COLORS = ['#EE4D2D', '#FDD835', '#2E7D32', '#1976D2', '#9C27B0'];

export default function FinancialReports({ pedidos, produtos }: FinancialReportsProps) {
  const [filterDays, setFilterDays] = useState(15);

  const filteredPedidos = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - (filterDays - 1));
    const startStr = start.toLocaleDateString('en-CA');
    return pedidos.filter(p => p.status === 'entregue' && p.created_at >= startStr);
  }, [pedidos, filterDays]);

  // 1. Faturamento Diário (Últimos 30 dias)
  const salesData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = filterDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      
      const dailyOrders = pedidos.filter(
        (p) => p.status === 'entregue' && p.created_at.startsWith(dateStr)
      );
      
      const gross = dailyOrders.reduce((acc, p) => acc + (p.total || 0), 0);
      const net = gross * 0.9; // Simulação de 10% de taxa
      
      days.push({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        'Faturamento Bruto': gross,
        'Líquido Recebido': net,
      });
    }
    return days;
  }, [pedidos, filterDays]);

  // 2. Top 5 Produtos Mais Vendidos
  const topProducts = useMemo(() => {
    // Para simplificar, usamos a coluna vendidos do próprio produto ou contamos nos pedidos reais
    const sorted = [...produtos].sort((a, b) => (b.vendidos || 0) - (a.vendidos || 0)).slice(0, 5);
    return sorted.map(p => ({
      name: p.nome.length > 20 ? p.nome.substring(0, 20) + '...' : p.nome,
      'Unidades Vendidas': p.vendidos || 0
    }));
  }, [produtos]);

  // 3. Métodos de Pagamento
  const paymentMethods = useMemo(() => {
    const methods: Record<string, number> = {};
    filteredPedidos.forEach(p => {
      const method = p.forma_pagamento || 'PIX';
      methods[method] = (methods[method] || 0) + 1;
    });
    return Object.keys(methods).map(key => ({
      name: key.toUpperCase(),
      value: methods[key]
    }));
  }, [filteredPedidos]);

  // KPIs Resumo
  const totalFaturamento = filteredPedidos.reduce((acc, p) => acc + (p.total || 0), 0);
  const totalPedidos = filteredPedidos.length;
  const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tighter">Relatórios Financeiros</h2>
          <p className="text-gray-500 text-sm">Acompanhe a saúde do seu negócio — últimos {filterDays} dias</p>
        </div>
        <DateFilterBar selectedDays={filterDays} onChange={setFilterDays} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Faturamento Total</p>
            <h3 className="text-2xl font-black text-gray-800">R$ {totalFaturamento.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ticket Médio</p>
            <h3 className="text-2xl font-black text-gray-800">R$ {ticketMedio.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-shopee-orange">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pedidos Entregues</p>
            <h3 className="text-2xl font-black text-gray-800">{totalPedidos}</h3>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Linha - Faturamento */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider">Faturamento (Últimos {filterDays} dias)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, undefined]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Faturamento Bruto" stroke="#EE4D2D" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Líquido Recebido" stroke="#2E7D32" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza - Pagamentos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider">Métodos de Pagamento</h3>
          <div className="h-[300px] w-full">
            {paymentMethods.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentMethods.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sem dados suficientes</div>
            )}
          </div>
        </div>

        {/* Gráfico de Barras - Produtos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-3">
          <h3 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider">Top 5 Produtos Mais Vendidos</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#eee" />
                <XAxis type="number" tick={{fontSize: 10, fill: '#999'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false} width={150} />
                <Tooltip 
                  cursor={{fill: '#f5f5f5'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Unidades Vendidas" fill="#1976D2" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
