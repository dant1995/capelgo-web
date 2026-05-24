import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, CreditCard, ChevronRight, CheckCircle2, Copy, Ticket, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './context/CartContext';
import { motion } from 'framer-motion';
import { supabase } from './lib/supabase';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pedidoId, setPedidoId] = useState('');
  const [savedTotal, setSavedTotal] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [availablePrizes, setAvailablePrizes] = useState<any[]>([]);
  const [appliedPrize, setAppliedPrize] = useState<any>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [saldoCashback, setSaldoCashback] = useState(0);
  const [useCashback, setUseCashback] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        
        // Buscar dados adicionais do perfil (Endereço e Telefone)
        const { data: profile } = await supabase
          .from('profiles')
          .select('endereco, telefone, saldo_cashback')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          if (profile.endereco) setEndereco(profile.endereco);
          if (profile.telefone) setTelefone(profile.telefone);
          if (profile.saldo_cashback) setSaldoCashback(profile.saldo_cashback);
        }

        // Buscar prêmios da roleta ativos para esta loja
        try {
          const { data: wins } = await supabase
            .from('premios_ganhos')
            .select('*')
            .eq('cliente_id', session.user.id)
            .eq('loja_id', items[0]?.loja_id);
          if (wins) {
            setAvailablePrizes(wins);
          }
        } catch (e) {
          console.warn("Erro ao buscar prêmios da roleta no checkout:", e);
        }

        // Buscar cupons disponíveis para esta loja
        try {
          const { data: cupons } = await supabase
            .from('cupons')
            .select('*')
            .eq('loja_id', items[0]?.loja_id)
            .eq('ativo', true)
            .is('cliente_id', null)
            .limit(5);
          if (cupons) setAvailableCoupons(cupons);
        } catch (e) {
          console.warn("Erro ao buscar cupons no checkout:", e);
        }
      }
    }
    checkUser();
  }, [navigate]);

  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('pix');

  const geocodeAddress = async (address: string, cep?: string) => {
    try {
      if (!address) return null;
      const opts = { headers: { 'User-Agent': 'CapelGoApp/1.0' } };
      let data;
      if (cep) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${cep}&country=Brazil&limit=1`, opts);
        data = await res.json();
      }
      if (!data?.[0]) {
        const q = encodeURIComponent((address.replace(/\([^)]*\)/g, '').match(/^([^,]+(?:,\s*\d+)?)/) || [])[1] + ', São Paulo');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=br`, opts);
        data = await res.json();
      }
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.error("Geocoding erro:", e);
    }
    return null;
  };

  const handleFinalizar = async () => {
    if (!endereco || !telefone) {
      alert('Por favor, preencha o endereço e o telefone para entrega.');
      return;
    }

    setLoading(true);
    try {
      // 1. Buscar dados do perfil do cliente
      const { data: profile } = await supabase.from('profiles').select('nome, telefone, latitude, longitude').eq('id', user.id).single();

      // 2. Buscar perfil do lojista e dados da loja
      const lojaId = items[0]?.loja_id;
      const { data: lojaProfile } = await supabase.from('profiles').select('endereco, latitude, longitude').eq('loja_id', lojaId).eq('role', 'lojista').maybeSingle();
      const { data: lojaData } = await supabase.from('lojas').select('latitude, longitude, endereco').eq('id', lojaId).maybeSingle();

      // 3. Geocodificar Endereços (Traduzir Texto para GPS)
      let cliCoords = { lat: profile?.latitude || -23.5505, lng: profile?.longitude || -46.6333 };
      const cepCli = endereco.match(/CEP:\s*(\d{5}-?\d{2,3})/i)?.[1];
      const geoCli = await geocodeAddress(endereco, cepCli);
      if (geoCli) cliCoords = geoCli;

      // Coordenadas da loja: 1º profile do lojista, 2º tabela lojas, 3º geocoding, 4º fallback
      let lojaCoords = { lat: lojaProfile?.latitude || lojaData?.latitude || -23.5505, lng: lojaProfile?.longitude || lojaData?.longitude || -46.6333 };
      if (!lojaProfile?.latitude && !lojaData?.latitude) {
        const addrLoja = lojaProfile?.endereco || lojaData?.endereco;
        if (addrLoja) {
          const cepLoja = addrLoja.match(/CEP:\s*(\d{5}-?\d{2,3})/i)?.[1];
          const geoLoja = await geocodeAddress(addrLoja, cepLoja);
          if (geoLoja) lojaCoords = geoLoja;
        }
      }

      // Cálculos Financeiros
      const comissaoPerc = 0.10; // 10% de comissão marketplace
      const comissaoAdminValor = totalPrice * comissaoPerc;
      const repasseLojistaValor = totalPrice - comissaoAdminValor;
      const taxaEntregaValor = 7.00;
      const repasseEntregadorValor = 7.00; // Valor que vai para o entregador

      // Criar pedido no Supabase
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .insert({
          total: finalTotal,
          status: 'aguardando_pagamento',
          cliente_id: user.id,
          endereco_entrega: endereco,
          geolocalizacao_cliente: { lat: cliCoords.lat, lng: cliCoords.lng },
          geolocalizacao_loja: { lat: lojaCoords.lat, lng: lojaCoords.lng },
          observacoes: `Cliente: ${profile?.nome || 'Não informado'} | Tel: ${profile?.telefone || 'Não informado'}${couponApplied ? ` | Cupom: ${couponApplied.codigo}` : ''}${items.some(i => i.premio_nome) ? ` | BRINDES: ${items.filter(i => i.premio_nome).map(i => i.premio_nome).join(', ')}` : ''}${appliedPrize ? ` | BRINDE DA ROLETA: ${appliedPrize.detalhes?.titulo || 'Brinde'} (CGO-${appliedPrize.id.substring(0, 8).toUpperCase()})` : ''} | GPS: ${cliCoords.lat},${cliCoords.lng}`,
          loja_id: lojaId, 
          loja_nome: items[0]?.loja_nome || 'Loja CapelGo',
          taxa_entrega: taxaEntregaValor,
          comissao_admin_valor: comissaoAdminValor,
          repasse_lojista_valor: Math.max(0, finalTotal - comissaoAdminValor),
          repasse_entregador_valor: repasseEntregadorValor,
          codigo_confirmacao: Math.floor(1000 + Math.random() * 9000).toString(),
          imagem: items[0]?.imagem_url, 
          itens: items.map(i => ({ 
            id: i.id, 
            nome: i.nome, 
            preco: i.preco, 
            qtd: i.quantidade,
            loja_id: i.loja_id,
            imagem: i.imagem_url,
            variacao: i.variacao,
            premio_nome: i.premio_nome
          }))
        })
        .select()
        .single();

      if (error) throw error;

      // Se usou cupom, marcar como usado
      if (couponApplied) {
        await supabase.from('cupons').update({ usado: true }).eq('id', couponApplied.id);
      }

      // Se aplicou brinde da roleta, consumir da tabela premios_ganhos
      if (appliedPrize) {
        await supabase.from('premios_ganhos').delete().eq('id', appliedPrize.id);
      }

      // 2. Atualizar perfil do usuário com telefone e coordenadas (Persistência)
      await supabase
        .from('profiles')
        .update({ telefone: telefone, latitude: cliCoords.lat, longitude: cliCoords.lng })
        .eq('id', user.id);

      // 3. Disparar Webhook n8n
      try {
        fetch('https://n8n.capelgo.com.br/webhook/713600f6-950c-4034-9721-e3e786b40345', {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'novo_pedido',
            pedido_id: pedido.id,
            total: pedido.total,
            cliente: user.user_metadata?.nome || user.email,
            telefone: telefone,
            endereco: endereco,
            itens: pedido.itens
          })
        });
      } catch (e) {
        console.warn("Aviso n8n falhou:", e);
      }

      // 3.5 Deduzir cashback usado
      if (cashbackUsado > 0) {
        try {
          const { data: perfil } = await supabase.from('profiles').select('saldo_cashback').eq('id', user.id).single();
          if (perfil) {
            const novoSaldo = Math.max(0, (perfil.saldo_cashback || 0) - cashbackUsado);
            await supabase.from('profiles').update({ saldo_cashback: novoSaldo }).eq('id', user.id);
            await supabase.from('cashback_historico').insert({
              profile_id: user.id,
              pedido_id: pedido.id,
              valor: -cashbackUsado,
              tipo: 'utilizado'
            });
          }
        } catch (e) {
          console.error('Erro ao deduzir cashback:', e);
        }
      }

      setPedidoId(pedido.id.toString());

      // 4. Dar baixa no estoque e atualizar vendidos de cada produto
      try {
        for (const item of items) {
          const { data: currentProd } = await supabase
            .from('produtos')
            .select('estoque, vendidos')
            .eq('id', item.id)
            .single();

          if (currentProd) {
            const novoEstoque = currentProd.estoque !== null
              ? Math.max(0, (currentProd.estoque || 0) - item.quantidade)
              : 0;
            const novosVendidos = (currentProd.vendidos || 0) + (item.quantidade || 1);
            await supabase
              .from('produtos')
              .update({ estoque: novoEstoque, vendidos: novosVendidos })
              .eq('id', item.id);
          }
        }
      } catch (stockError) {
        console.error('Erro ao atualizar estoque/vendidos:', stockError);
      }

      setSavedTotal(finalTotal);
      setSuccess(true);
      clearCart();
    } catch (err) {
      alert('Erro ao finalizar pedido: ' + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    try {
      const { data: cupom, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', couponCode.toUpperCase())
        .eq('usado', false)
        .eq('loja_id', items[0]?.loja_id)
        .eq('cliente_id', user.id)
        .single();

      if (error || !cupom) {
        setCouponError('Cupom inválido ou já utilizado.');
        setCouponApplied(null);
        return;
      }

      setCouponApplied(cupom);
      alert('Cupom aplicado com sucesso!');
    } catch (err) {
      setCouponError('Erro ao validar cupom.');
    }
  };

  const calculateDiscount = () => {
    if (!couponApplied) return 0;
    if (couponApplied.tipo === 'porcentagem') {
      return totalPrice * (couponApplied.valor / 100);
    }
    return couponApplied.valor;
  };

  const cashbackUsado = useCashback ? Math.min(saldoCashback, totalPrice - calculateDiscount()) : 0;
  const finalTotal = Math.max(0, totalPrice - calculateDiscount() - cashbackUsado);

  if (success) return <SuccessView pedidoId={pedidoId} finalTotal={savedTotal} />;

  const tempoMin = 15 + (items.length * 2);
  const tempoMax = tempoMin + 20;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <header className="bg-white p-4 sticky top-0 z-50 flex items-center gap-4 border-b">
        <button onClick={() => navigate(-1)} className="text-shopee-orange">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-medium">Finalizar Pedido</h1>
      </header>

      <main className="p-3 flex flex-col gap-3">
         {/* Estimativa de Entrega */}
         <section className="bg-emerald-50 border border-emerald-100 p-3 rounded-sm shadow-sm flex flex-col gap-1">
            <div className="flex items-center gap-2 text-emerald-700">
               <CheckCircle2 size={16} />
               <p className="text-sm font-bold">Chega em {tempoMin} a {tempoMax} minutos</p>
            </div>
            <p className="text-[10px] text-emerald-600 ml-6">Entrega Rápida Local • Motorista Parceiro</p>
         </section>
        {/* Endereço e Telefone */}
        <section className="bg-white p-4 rounded-sm shadow-sm space-y-4">
           <div className="flex items-start gap-3">
              <MapPin className="text-shopee-orange mt-1" size={20} />
              <div className="flex-1">
                 <h3 className="text-sm font-bold mb-1">Endereço de Entrega</h3>
                 <input 
                   type="text"
                   value={endereco}
                   onChange={(e) => setEndereco(e.target.value)}
                   className="text-xs text-gray-600 w-full bg-transparent border-none outline-none focus:ring-0 p-0"
                   placeholder="Rua, número, bairro e cidade..."
                 />
              </div>
           </div>
           
           <div className="flex items-start gap-3 pt-3 border-t border-gray-50">
              <div className="w-5 h-5 flex items-center justify-center text-shopee-orange">📞</div>
              <div className="flex-1">
                 <h3 className="text-sm font-bold mb-1">Telefone (WhatsApp)</h3>
                 <input 
                   type="text"
                   value={telefone}
                   onChange={(e) => setTelefone(e.target.value)}
                   className="text-xs text-gray-600 w-full bg-transparent border-none outline-none focus:ring-0 p-0"
                   placeholder="(00) 00000-0000"
                 />
              </div>
           </div>
        </section>

        {/* Resumo do Pedido */}
        <section className="bg-white p-4 rounded-sm shadow-sm">
           <h3 className="text-sm font-bold mb-3 border-b pb-2">Resumo do Pedido</h3>
           {items.map(item => (
             <div key={item.id} className="flex flex-col mb-3 last:mb-0">
               <div className="flex justify-between text-xs">
                  <span className="text-gray-600 font-medium">{item.quantidade}x {item.nome}</span>
                  <span className="font-bold text-gray-800">R${(item.preco * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               </div>
               {item.premio_nome && (
                 <div className="text-[9px] text-green-600 font-black uppercase flex items-center gap-1 mt-0.5 ml-4">
                   <span>🎁 Ganhe {item.premio_nome}</span>
                 </div>
               )}
             </div>
           ))}
        </section>

        {/* Cashback */}
        {saldoCashback > 0 && (
          <section className="bg-white p-4 rounded-sm shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-green-600" />
                <div>
                  <h3 className="text-sm font-bold">Usar Cashback</h3>
                  <p className="text-[10px] text-gray-500">Saldo disponível: R$ {saldoCashback.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={() => setUseCashback(!useCashback)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${useCashback ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
              >
                {useCashback ? 'Ativo' : 'Usar'}
              </button>
            </div>
            {useCashback && (
              <div className="mt-2 bg-green-50 p-2 rounded-sm border border-green-100">
                <p className="text-[10px] text-green-700 font-bold">R$ {cashbackUsado.toFixed(2)} será deduzido do total</p>
              </div>
            )}
          </section>
        )}

        {/* Cupom de Desconto */}
        <section className="bg-white p-4 rounded-sm shadow-sm">
           <h3 className="text-sm font-bold mb-3 border-b pb-2">Cupom de Desconto</h3>
           <div className="flex gap-2">
              <input 
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={!!couponApplied}
                placeholder="Digite seu cupom aqui"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-xs focus:ring-1 focus:ring-shopee-orange outline-none uppercase"
              />
              <button 
                onClick={handleApplyCoupon}
                disabled={!!couponApplied || !couponCode}
                className="bg-shopee-orange text-white px-4 py-2 text-xs font-bold rounded-sm disabled:opacity-50"
              >
                Aplicar
              </button>
           </div>
           {couponError && <p className="text-[10px] text-red-500 mt-1">{couponError}</p>}
           {couponApplied && (
              <div className="mt-2 flex justify-between items-center bg-green-50 p-2 rounded-sm border border-green-100">
                 <p className="text-[10px] text-green-700 font-bold">Cupom {couponApplied.codigo} aplicado!</p>
                 <button onClick={() => { setCouponApplied(null); setCouponCode(''); }} className="text-[10px] text-red-500 font-bold underline">Remover</button>
              </div>
           )}

           {/* Cupons Disponíveis */}
           {availableCoupons.length > 0 && (
             <section className="bg-white p-4 rounded-sm shadow-sm border border-purple-100">
               <h3 className="text-sm font-bold mb-3 border-b pb-2 flex items-center gap-1.5 text-purple-700">
                 <Ticket size={14} /> Cupons Disponíveis
               </h3>
               <div className="flex flex-wrap gap-2">
                 {availableCoupons.map((cupom, idx) => (
                   <button
                     key={idx}
                     onClick={() => {
                       setCouponCode(cupom.codigo);
                       setCouponApplied(null);
                       setCouponError('');
                     }}
                     className="flex items-center gap-2 bg-purple-50 px-4 py-2.5 rounded-xl border border-purple-200 hover:border-purple-400 transition-all"
                   >
                     <span className="text-xs font-black text-purple-700">{cupom.codigo}</span>
                     <span className="text-[10px] font-bold text-purple-500">
                       {cupom.tipo === 'porcentagem' ? `${cupom.valor}% OFF` : `R$ ${Number(cupom.valor).toFixed(2)} OFF`}
                     </span>
                     <ChevronRight size={12} className="text-purple-300" />
                   </button>
                 ))}
               </div>
               <p className="text-[9px] text-gray-400 font-medium mt-2">Clique em um cupom para preencher o código acima.</p>
             </section>
           )}
          </section>

          {/* 🎁 Brindes da Roleta Disponíveis */}
         {availablePrizes.length > 0 && (
           <section className="bg-white p-4 rounded-sm shadow-sm border border-purple-100">
             <h3 className="text-sm font-bold mb-3 border-b pb-2 flex items-center gap-1.5 text-purple-700">
               🎁 Resgatar Brindes da Roleta
             </h3>
             <div className="flex flex-col gap-2">
               {availablePrizes.map(prize => (
                 <div 
                   key={prize.id} 
                   onClick={() => setAppliedPrize(appliedPrize?.id === prize.id ? null : prize)}
                   className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${appliedPrize?.id === prize.id ? 'bg-purple-50 border-purple-500 shadow-sm' : 'bg-gray-50 border-gray-100'}`}
                 >
                   <div>
                     <p className="text-[10px] font-black text-purple-700 uppercase leading-none">{prize.detalhes?.titulo || 'Brinde Especial'}</p>
                     <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-1">{`Código: CGO-${prize.id.substring(0, 8).toUpperCase()}`}</p>
                   </div>
                   <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${appliedPrize?.id === prize.id ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'}`}>
                     {appliedPrize?.id === prize.id && <span className="text-[8px] font-black">✓</span>}
                   </div>
                 </div>
               ))}
             </div>
           </section>
         )}

        {/* Método de Pagamento */}
        <section className="bg-white p-4 rounded-sm shadow-sm">
           <h3 className="text-sm font-bold mb-3 border-b pb-2">Método de Pagamento</h3>
           <div className="flex items-center gap-3 bg-orange-50 p-3 rounded-sm border border-shopee-orange/20">
              <CreditCard className="text-shopee-orange" size={20} />
              <div className="flex-1">
                 <p className="text-sm font-bold">Pix</p>
                 <p className="text-[10px] text-gray-500">Pagamento instantâneo com 5% OFF</p>
              </div>
              <div className="w-4 h-4 rounded-full border-4 border-shopee-orange"></div>
           </div>
        </section>

        {/* Detalhes do Pagamento */}
        <section className="bg-white p-4 rounded-sm shadow-sm flex flex-col gap-2">
           <h3 className="text-sm font-bold mb-1">Detalhes de Pagamento</h3>
           <div className="flex justify-between text-xs">
              <span className="text-gray-500">Total dos Produtos</span>
              <span className="text-gray-800">R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
           </div>
           <div className="flex justify-between text-xs">
              <span className="text-gray-500">Total do Frete</span>
              <span className="text-gray-800">R$ 0,00</span>
           </div>
           {couponApplied && (
             <div className="flex justify-between text-xs">
                <span className="text-gray-500">Cupom de desconto</span>
                <span className="text-shopee-orange">-R$ {calculateDiscount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
           )}
           <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-dashed">
              <span>Pagamento Total</span>
              <span className="text-shopee-orange">R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
           </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex items-stretch shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
         <div className="flex-1 flex flex-col justify-center items-end px-4 py-2 bg-[#FAFAFA]">
            <p className="text-xs text-gray-700 font-medium">
               Total: <span className="text-shopee-orange font-bold text-lg ml-1">R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </p>
            {couponApplied && (
               <p className="text-[10px] text-shopee-orange font-medium tracking-wide">
                  Economizou R$ {calculateDiscount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </p>
            )}
         </div>
         <button 
           onClick={handleFinalizar}
           disabled={loading}
           className="bg-shopee-orange text-white px-8 py-0 font-black text-sm active:scale-[0.98] transition-transform disabled:opacity-70 flex items-center justify-center"
         >
           {loading ? 'PROCESSANDO...' : 'FAZER PEDIDO'}
         </button>
      </footer>
    </div>
  );
}

function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc = crc << 1;
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function generatePix(chave: string, nome: string, cidade: string, valor: number, txid: string): string {
  const payloadFormat = '000201';
  const pixGui = '0014br.gov.bcb.pix';
  const chavePix = `01${String(chave.length).padStart(2, '0')}${chave}`;
  const merchantAccountInfo = `26${String(pixGui.length + chavePix.length).padStart(2, '0')}${pixGui}${chavePix}`;
  const mcc = '52040000';
  const currency = '5303986';
  const amountStr = parseFloat(String(valor)).toFixed(2);
  const amount = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;
  const country = '5802BR';
  const nameSafe = nome.substring(0, 25).replace(/[^\w\s]/gi, '').trim() || 'CapelGo';
  const merchantName = `59${String(nameSafe.length).padStart(2, '0')}${nameSafe}`;
  const citySafe = cidade.substring(0, 15).replace(/[^\w\s]/gi, '').trim() || 'Brasil';
  const merchantCity = `60${String(citySafe.length).padStart(2, '0')}${citySafe}`;
  const txidSafe = (txid || 'CAPELGO').substring(0, 25).replace(/[^\w]/gi, '') || 'CAPELGO'; // Sem espaços
  const additionalDataField = `62${String(txidSafe.length + 4).padStart(2, '0')}05${String(txidSafe.length).padStart(2, '0')}${txidSafe}`;
  
  const payloadStr = `${payloadFormat}${merchantAccountInfo}${mcc}${currency}${amount}${country}${merchantName}${merchantCity}${additionalDataField}6304`;
  return payloadStr + crc16(payloadStr);
}

function SuccessView({ pedidoId, finalTotal }: { pedidoId: string, finalTotal: number }) {
  const navigate = useNavigate();
  const [pixPayload, setPixPayload] = useState('capelgo-pix-demo');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    async function fetchPixConfig() {
      const { data } = await supabase.from('configuracoes_plataforma').select('valor').eq('chave', 'pix_config').single();
      if (data && data.valor) {
        const { chave, nome, cidade } = data.valor;
        if (chave) {
           const payload = generatePix(chave, nome || 'CapelGo', cidade || 'Brasil', finalTotal, pedidoId);
           setPixPayload(payload);
        }
      }
    }
    fetchPixConfig();
  }, [finalTotal, pedidoId]);

  const handleCopy = () => {
    if (navigator.clipboard && window.isSecureContext) {
       navigator.clipboard.writeText(pixPayload);
    } else {
       const textArea = document.createElement("textarea");
       textArea.value = pixPayload;
       textArea.style.position = "fixed";
       textArea.style.left = "-999999px";
       document.body.appendChild(textArea);
       textArea.focus();
       textArea.select();
       try { document.execCommand('copy'); } catch (error) {}
       textArea.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 pt-20 pb-10 overflow-y-auto">
       <motion.div 
         initial={{ scale: 0 }}
         animate={{ scale: 1 }}
         className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-4xl mb-6 shadow-xl shadow-green-200"
       >
         <CheckCircle2 size={40} />
       </motion.div>
       
       <h1 className="text-2xl font-bold text-shopee-text mb-2">Pedido Recebido!</h1>
       <p className="text-gray-500 text-center text-sm mb-8">
         Seu pedido <span className="font-bold text-shopee-text">#{pedidoId.substring(0, 6).toUpperCase()}</span> foi criado com sucesso e a loja já foi notificada.
       </p>

       {/* Área do Pix */}
       <div className="w-full bg-[#F5F5F5] rounded-xl p-6 flex flex-col items-center gap-4 mb-10 border-2 border-dashed border-gray-200 shadow-inner">
          <div className="text-center">
             <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">Pague com Pix</p>
             <h2 className="text-2xl font-black text-[#EE4D2D] mt-1">R$ {finalTotal.toFixed(2)}</h2>
          </div>
          
          <div className="w-48 h-48 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`} alt="QR Code PIX" className="w-full h-full" />
          </div>
          
          <button 
            onClick={handleCopy}
            className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full border shadow-sm transition-all active:scale-95 ${copiado ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-shopee-orange border-shopee-orange/20'}`}
          >
             {copiado ? <CheckCircle2 size={18} /> : <Copy size={18} />} 
             {copiado ? 'Código Copiado!' : 'Copiar Código Pix'}
          </button>
          
          <p className="text-[10px] text-gray-400 text-center leading-tight mt-2 max-w-[200px]">
             Abra o app do seu banco e escolha a opção Pix Copia e Cola para pagar.
          </p>
       </div>

       <div className="w-full flex flex-col gap-3">
         <button 
           onClick={() => navigate(`/rastreio/${pedidoId}`)}
           className="w-full bg-shopee-orange text-white py-4 font-bold rounded-xl active:scale-[0.98] shadow-lg shadow-shopee-orange/20 transition-transform"
         >
           Acompanhar Pedido
         </button>
         <button 
           onClick={() => navigate('/')}
           className="w-full bg-gray-100 text-gray-600 py-4 font-bold rounded-xl active:scale-[0.98] transition-transform"
         >
           Voltar para o Início
         </button>
       </div>
    </div>
  );
}
