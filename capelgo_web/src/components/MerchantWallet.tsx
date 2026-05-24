import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Clock, FileText, Download, Building, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MerchantWalletProps {
  pedidos: any[];
  lojaData: any;
}

export default function MerchantWallet({ pedidos, lojaData }: MerchantWalletProps) {
  const [activeTab, setActiveTab] = useState<'tudo' | 'pendente' | 'liberado'>('tudo');
  const [historicoSaques, setHistoricoSaques] = useState<any[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showSaques, setShowSaques] = useState(false);

  const [taxaPlataforma, setTaxaPlataforma] = useState(0.15);

  const pedidosEntregues = pedidos.filter(p => p.status === 'entregue');
  const pedidosPendentes = pedidos.filter(p => p.status !== 'entregue' && p.status !== 'cancelado');

  const calcularBruto = (lista: any[]) => lista.reduce((acc, p) => acc + (parseFloat(p.total) || 0), 0);
  
  const brutoLiberado = calcularBruto(pedidosEntregues);
  // Simula o cálculo de quanto já foi sacado
  const totalSacado = historicoSaques.filter(s => s.status !== 'recusado').reduce((acc, s) => acc + (parseFloat(s.valor) || 0), 0);
  const liquidoLiberado = (brutoLiberado * (1 - taxaPlataforma)) - totalSacado;
  
  const brutoPendente = calcularBruto(pedidosPendentes);
  const liquidoPendente = brutoPendente * (1 - taxaPlataforma);

  useEffect(() => {
    const fetchComissao = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes_sistema')
          .select('valor')
          .eq('chave', 'comissao_venda')
          .maybeSingle();
        if (!error && data?.valor?.percentual !== undefined) {
          setTaxaPlataforma(parseFloat(data.valor.percentual) / 100);
        }
      } catch (e) {
        console.warn("Erro ao buscar taxa de comissão do sistema", e);
      }
    };
    fetchComissao();
  }, []);

  useEffect(() => {
    if (lojaData?.id) {
      fetchSaques();
    }
  }, [lojaData?.id]);

  const fetchSaques = async () => {
    try {
      const { data, error } = await supabase
        .from('saques')
        .select('*')
        .eq('loja_id', lojaData.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setHistoricoSaques(data);
      }
    } catch (e) {
      console.log('Tabela de saques ainda não existe');
    }
  };

  const handleSolicitarSaque = async () => {
    if (liquidoLiberado <= 0) {
      alert("Você não possui saldo liberado suficiente para solicitar um saque.");
      return;
    }

    const confirmacao = window.confirm(`Deseja solicitar o saque de R$ ${liquidoLiberado.toFixed(2)} para sua conta bancária?`);
    if (!confirmacao) return;

    setIsRequesting(true);
    try {
      const { error } = await supabase.from('saques').insert([
        {
          loja_id: lojaData.id,
          valor: liquidoLiberado,
          status: 'pendente',
          banco: lojaData.banco || 'Conta PIX Principal',
          tipo_chave: lojaData.tipo_chave || 'Não informada',
          chave_pix: lojaData.chave_pix || 'Não informada',
          titular: lojaData.titular || 'Não informado',
        }
      ]);

      if (error) {
        alert("Erro Supabase: " + (error.message || JSON.stringify(error)));
        console.error(error);
      } else {
        alert("Saque solicitado com sucesso! O administrador já foi notificado.");
        fetchSaques();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRequesting(false);
    }
  };

  const formatBRL = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

  const renderPedidos = () => {
    let lista = pedidos;
    if (activeTab === 'pendente') lista = pedidosPendentes;
    if (activeTab === 'liberado') lista = pedidosEntregues;

    return lista.map(p => {
      const bruto = parseFloat(p.total) || 0;
      const taxa = bruto * taxaPlataforma;
      const liquido = bruto - taxa;
      const isLiberado = p.status === 'entregue';

      return (
        <tr key={p.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
          <td className="px-6 py-4">
            <p className="text-xs font-black text-slate-800">#{p.id.toString().slice(-6).toUpperCase()}</p>
            <p className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString()}</p>
          </td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${
              isLiberado ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
            }`}>
              {isLiberado ? 'Liberado' : 'Em Trânsito'}
            </span>
          </td>
          <td className="px-6 py-4 text-xs font-bold text-slate-600">{formatBRL(bruto)}</td>
          <td className="px-6 py-4 text-xs font-bold text-red-500">-{formatBRL(taxa)} ({(taxaPlataforma * 100).toFixed(0)}%)</td>
          <td className="px-6 py-4 text-sm font-black text-green-600">{formatBRL(liquido)}</td>
        </tr>
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Minha Carteira</h2>
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Gestão de saldos e repasses da CapelGo</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-shopee-orange transition-all shadow-lg w-full sm:w-auto">
          <Download size={14} /> Exportar Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saldo Liberado */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <DollarSign size={120} />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 relative z-10">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                Saldo Disponível para Saque <ArrowUpRight size={14} className="text-green-500" />
              </p>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tighter break-all">{formatBRL(liquidoLiberado)}</h3>
            </div>
            <div className="text-left sm:text-right mt-2 sm:mt-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Dados Bancários</p>
              <p className="text-xs font-black text-slate-600 flex items-center gap-1 sm:justify-end">
                <Building size={12} /> {lojaData?.banco || 'Conta PIX Principal'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full">
            <button 
              onClick={handleSolicitarSaque}
              disabled={isRequesting || liquidoLiberado <= 0}
              className="bg-shopee-orange text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase shadow-lg shadow-shopee-orange/20 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 w-full sm:w-auto"
            >
              {isRequesting ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />} 
              Solicitar Saque
            </button>
            <button 
              onClick={() => setShowSaques(!showSaques)}
              className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase transition-all border w-full sm:w-auto text-center ${showSaques ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-100'}`}
            >
              Histórico de Saques
            </button>
          </div>
        </div>

        {/* Saldo Pendente */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden text-white">
          <Clock className="absolute top-4 right-4 text-slate-800" size={60} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Receita Pendente</p>
          <h3 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4 relative z-10">{formatBRL(liquidoPendente)}</h3>
          
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 relative z-10">
            <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
              Este valor será liberado automaticamente para sua carteira assim que os pedidos em trânsito forem marcados como <strong>Entregues</strong> pelos clientes ou entregadores.
            </p>
          </div>
        </div>
      </div>

      {showSaques && (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-black text-slate-800 tracking-tighter mb-6 flex items-center gap-2">
            <DollarSign size={18} className="text-green-500" /> Histórico de Saques Solicitados
          </h3>
          <div className="space-y-3">
            {historicoSaques.length > 0 ? (
              historicoSaques.map(s => (
                <div key={s.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-black text-slate-800">{formatBRL(parseFloat(s.valor))}</p>
                    <p className="text-[10px] text-slate-400">{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                      s.status === 'pendente' ? 'bg-orange-100 text-orange-600' : 
                      s.status === 'aprovado' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs font-black text-slate-400 uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-2xl">
                Nenhum saque solicitado ainda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extrato de Transações */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-black text-slate-800 tracking-tighter flex items-center gap-2">
            <FileText size={18} className="text-shopee-orange" /> Extrato de Pedidos (Taxa CapelGo: {(taxaPlataforma * 100).toFixed(0)}%)
          </h3>
          <div className="flex bg-slate-50 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('tudo')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'tudo' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setActiveTab('liberado')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'liberado' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Liberados
            </button>
            <button 
              onClick={() => setActiveTab('pendente')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'pendente' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pendentes
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Pedido / Data</th>
                <th className="px-6 py-4">Status da Renda</th>
                <th className="px-6 py-4">Valor Bruto</th>
                <th className="px-6 py-4">Taxa CapelGo</th>
                <th className="px-6 py-4 text-green-600">Valor Líquido</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length > 0 ? renderPedidos() : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <FileText size={48} className="mb-4 opacity-20" />
                      <p className="text-xs font-black uppercase tracking-widest">Nenhuma transação encontrada</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
