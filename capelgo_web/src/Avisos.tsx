import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, ShoppingBag, Tag, Info, Check, CheckSquare, Trash2 } from 'lucide-react';
import BottomNav from './components/BottomNav';

interface Notificacao {
  id: number;
  titulo: string;
  texto: string;
  data: string;
  categoria: 'pedido' | 'promo' | 'sistema';
  lida: boolean;
}

export default function Avisos() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [activeFilter, setActiveFilter] = useState<'tudo' | 'pedido' | 'promo' | 'sistema'>('tudo');

  useEffect(() => {
    const loadNotifications = () => {
      const stored = localStorage.getItem('capelgo_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    };

    loadNotifications();

    window.addEventListener('capelgo_notifications_updated', loadNotifications);
    return () => {
      window.removeEventListener('capelgo_notifications_updated', loadNotifications);
    };
  }, []);

  const saveNotifications = (updated: Notificacao[]) => {
    setNotifications(updated);
    localStorage.setItem('capelgo_notifications', JSON.stringify(updated));
  };

  const handleMarkAsRead = (id: number) => {
    const updated = notifications.map(n => n.id === id ? { ...n, lida: true } : n);
    saveNotifications(updated);
    
    // Ação inteligente com base na categoria
    const selected = notifications.find(n => n.id === id);
    if (selected) {
      if (selected.categoria === 'pedido') {
        navigate('/meus-pedidos');
      } else if (selected.categoria === 'promo') {
        navigate('/promocoes');
      }
    }
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, lida: true }));
    saveNotifications(updated);
  };

  const handleDeleteNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'tudo') return true;
    return n.categoria === activeFilter;
  });

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'pedido':
        return (
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
        );
      case 'promo':
        return (
          <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
            <Tag size={20} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center">
            <Info size={20} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto border-x border-gray-100 pb-20">
      {/* HEADER */}
      <header className="bg-white p-4 border-b sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-shopee-orange transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tighter">Central de Avisos</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Novidades e atualizações</p>
          </div>
        </div>
        
        {notifications.some(n => !n.lida) && (
          <button 
            onClick={handleMarkAllAsRead} 
            className="flex items-center gap-1 text-[10px] font-black text-shopee-orange uppercase tracking-wider bg-orange-50/50 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100 transition-colors"
          >
            <CheckSquare size={12} /> Ler Tudo
          </button>
        )}
      </header>

      {/* FILTROS DE CATEGORIA */}
      <div className="bg-white p-3 border-b flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <FilterBtn active={activeFilter === 'tudo'} label="Tudo" onClick={() => setActiveFilter('tudo')} />
        <FilterBtn active={activeFilter === 'pedido'} label="Pedidos" onClick={() => setActiveFilter('pedido')} />
        <FilterBtn active={activeFilter === 'promo'} label="Promoções" onClick={() => setActiveFilter('promo')} />
        <FilterBtn active={activeFilter === 'sistema'} label="Sistema" onClick={() => setActiveFilter('sistema')} />
      </div>

      {/* LISTA DE NOTIFICAÇÕES */}
      <main className="flex-1 p-4">
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => handleMarkAsRead(n.id)}
                className={`bg-white p-4 rounded-2xl border transition-all duration-300 relative cursor-pointer flex gap-4 ${
                  n.lida ? 'border-slate-100/80 opacity-80' : 'border-orange-100 bg-orange-50/10 shadow-xs'
                } hover:shadow-md`}
              >
                {/* Indicador de Não Lida */}
                {!n.lida && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-shopee-orange rounded-full animate-pulse" />
                )}

                {/* Ícone da Categoria */}
                {getCategoryIcon(n.categoria)}

                {/* Conteúdo */}
                <div className="flex-1 space-y-1 pr-4">
                  <div className="flex justify-between items-baseline">
                    <h3 className={`text-xs font-black tracking-tight text-slate-800 ${!n.lida && 'font-black'}`}>
                      {n.titulo}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {n.texto}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{n.data}</span>
                    <button 
                      onClick={(e) => handleDeleteNotification(n.id, e)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-slate-50"
                      title="Excluir notificação"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center shadow-inner">
              <Bell size={28} className="opacity-60" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Nenhum aviso por aqui</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Você receberá atualizações quando houver novidades.</p>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION */}
      <BottomNav activeTab="avisos" />
    </div>
  );
}

function FilterBtn({ active, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
        active 
          ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
          : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}
