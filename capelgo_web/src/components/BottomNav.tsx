import React, { useEffect, useState } from 'react';
import { Home, Bell, User, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface BottomNavProps {
  activeTab: string;
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 1. Atualizar o contador local
    const updateCount = () => {
      const stored = localStorage.getItem('capelgo_notifications');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const unread = parsed.filter((n: any) => !n.lida).length;
          setUnreadCount(unread);
        } catch (e) {
          setUnreadCount(0);
        }
      }
    };

    // Inicializa notificações no localStorage se não existirem
    const stored = localStorage.getItem('capelgo_notifications');
    if (!stored) {
      const defaultNotifications = [
        {
          id: 1,
          titulo: "🎉 Recompensa Disponível!",
          texto: "Parabéns! Você ganhou Frete Grátis na Roleta de Prêmios. Resgate agora na sua página de cupons.",
          data: "Hoje, 10:15",
          categoria: "promo",
          lida: false
        },
        {
          id: 2,
          titulo: "📦 Pedido em Preparação",
          texto: "Seu pedido na Masterprint foi confirmado e já está sendo preparado com muito carinho pelo lojista.",
          data: "Hoje, 09:30",
          categoria: "pedido",
          lida: false
        },
        {
          id: 3,
          titulo: "🚚 Entrega Realizada com Sucesso!",
          texto: "O entregador Lucas entregou seu pedido anterior #A4B1. Avalie sua experiência para nos ajudar a melhorar!",
          data: "Ontem, 16:45",
          categoria: "pedido",
          lida: false
        },
        {
          id: 4,
          titulo: "🏪 Nova Loja na Área",
          texto: "A Masterprint agora faz parte da rede CapelGo! Aproveite as promoções exclusivas de inauguração.",
          data: "15 de Mai, 11:00",
          categoria: "sistema",
          lida: true
        }
      ];
      localStorage.setItem('capelgo_notifications', JSON.stringify(defaultNotifications));
      setUnreadCount(3);
    } else {
      updateCount();
    }

    // Ouvir eventos globais de atualização
    window.addEventListener('capelgo_notifications_updated', updateCount);

    // 2. Ouvinte de Realtime Supabase para novos status de Pedidos do cliente logado
    let channel: any;
    async function setupRealtime() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      channel = supabase.channel(`client_notifications_${userId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `cliente_id=eq.${userId}` },
          (payload: any) => {
            console.log('Realtime Notification Payload:', payload);
            const orderIdShort = payload.new.id.toString().slice(-4).toUpperCase();
            let title = 'Status do Pedido Atualizado';
            let desc = `Seu pedido #${orderIdShort} mudou de status para: ${getStatusLabel(payload.new.status)}.`;

            if (payload.new.status === 'em_preparo') {
              title = '📦 Pedido em Preparação';
              desc = `O lojista começou a preparar o seu pedido #${orderIdShort}!`;
            } else if (payload.new.status === 'saiu_para_entrega') {
              title = '🚚 Pedido a Caminho!';
              desc = `Excelente notícia! Seu pedido #${orderIdShort} saiu para rota de entrega com o nosso motorista parceiro.`;
            } else if (payload.new.status === 'entregue') {
              title = '✅ Entrega Concluída!';
              desc = `Seu pedido #${orderIdShort} foi entregue com sucesso. Obrigado por comprar no CapelGo!`;
            }

            const newNotif = {
              id: Date.now(),
              titulo: title,
              texto: desc,
              data: "Agora mesmo",
              categoria: 'pedido',
              lida: false
            };

            const current = JSON.parse(localStorage.getItem('capelgo_notifications') || '[]');
            const updated = [newNotif, ...current];
            localStorage.setItem('capelgo_notifications', JSON.stringify(updated));

            // Dispara evento para reatividade global
            window.dispatchEvent(new Event('capelgo_notifications_updated'));
          }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      window.removeEventListener('capelgo_notifications_updated', updateCount);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeTab]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmado': return 'Confirmado';
      case 'em_preparo': return 'Em Preparação';
      case 'pronto': return 'Pronto para Coleta';
      case 'em_coleta': return 'Em Coleta';
      case 'saiu_para_entrega': return 'Saiu para Entrega';
      case 'entregue': return 'Entregue';
      default: return status;
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-1 px-1 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <NavBtn 
        icon={<Home size={22} />} 
        label="Início" 
        active={activeTab === 'inicio'} 
        onClick={() => navigate('/')} 
      />
      <NavBtn 
        icon={<Zap size={22} />} 
        label="Vantagens" 
        active={activeTab === 'promocoes'} 
        onClick={() => navigate('/promocoes')} 
      />
      <NavBtn 
        icon={<Bell size={22} />} 
        label="Avisos" 
        badge={unreadCount > 0 ? String(unreadCount) : undefined} 
        active={activeTab === 'avisos'} 
        onClick={() => navigate('/avisos')} 
      />
      <NavBtn 
        icon={<User size={22} />} 
        label="Eu" 
        active={activeTab === 'perfil'} 
        onClick={() => navigate('/perfil')} 
      />
    </nav>
  );
}

function NavBtn({ icon, label, active, onClick, badge }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-0.5 flex-1 py-1 relative transition-all ${active ? 'text-[#EE4D2D] scale-110' : 'text-gray-400'}`}
    >
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-1.5 -right-2 bg-[#EE4D2D] text-white text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full border border-white shadow-sm">
            {badge}
          </span>
        )}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
      {active && (
        <div className="absolute -bottom-1 w-1 h-1 bg-[#EE4D2D] rounded-full" />
      )}
    </button>
  );
}
