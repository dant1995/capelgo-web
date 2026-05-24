import { ArrowLeft, Trash2, Plus, Minus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* ── HEADER ── */}
      <header className="bg-white p-4 sticky top-0 z-50 flex items-center gap-4 border-b">
        <button onClick={() => navigate(-1)} className="text-shopee-orange">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-medium flex-1">Carrinho ({totalItems})</h1>
        <button className="text-shopee-orange text-sm font-medium">Editar</button>
      </header>

      {/* ── LISTA DE ITENS ── */}
      <main className="p-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="text-6xl opacity-20">🛒</div>
             <p className="text-gray-500 font-medium">Seu carrinho está vazio</p>
             <button 
               onClick={() => navigate('/')}
               className="border border-shopee-orange text-shopee-orange px-6 py-2 rounded-sm"
             >
               Ir às compras
             </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="bg-white p-3 rounded-sm shadow-sm flex gap-3 relative"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-sm overflow-hidden flex items-center justify-center">
                    {item.imagem_url ? (
                      <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-3xl grayscale opacity-20">📦</div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm line-clamp-1 font-medium">{item.nome}</h3>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <p className="text-[10px] text-gray-400">Variação: {item.variacao || 'Padrão'}</p>
                        {item.premio_nome && (
                          <div className="flex items-center gap-1 text-green-600 font-bold text-[9px] uppercase bg-green-50 px-1.5 py-0.5 rounded w-fit">
                            <span>🎁 Brinde: {item.premio_nome}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <span className="text-shopee-orange font-bold text-sm">
                        R${item.preco.toLocaleString('pt-BR')}
                      </span>
                      
                      <div className="flex items-center border rounded-sm">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 px-2 border-r text-gray-500 active:bg-gray-50"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-xs font-bold">{item.quantidade}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 px-2 border-l text-gray-500 active:bg-gray-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Garantia Shopee */}
            <div className="bg-orange-50/50 p-3 rounded-sm flex items-center gap-2 border border-orange-100">
               <ShieldCheck size={16} className="text-shopee-orange" />
               <span className="text-[10px] text-gray-600">Garantia CapelGo: Receba seu pedido ou seu dinheiro de volta.</span>
            </div>
          </div>
        )}
      </main>

      {/* ── RODAPÉ DE CHECKOUT ── */}
      {items.length > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
          <div className="flex items-center justify-between p-3">
             <div className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="accent-shopee-orange" />
                <span className="text-xs">Tudo</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="text-right">
                   <p className="text-xs">Total</p>
                   <p className="text-shopee-orange font-bold">R${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <button 
                  onClick={() => navigate('/checkout')}
                  className="bg-shopee-orange text-white px-8 py-3 font-bold text-sm active:opacity-90"
                >
                  Continuar ({totalItems})
                </button>
             </div>
          </div>
        </footer>
      )}
    </div>
  );
}
