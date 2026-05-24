import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartItem {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem_url?: string;
  loja_id?: string;
  loja_nome?: string;
  variacao?: string; // Ex: "Cor: Rosa, Tamanho: P"
  premio_nome?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: any) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...product, quantidade: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantidade + delta);
        return { ...i, quantidade: newQty };
      }
      return i;
    }));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantidade, 0);
  const totalPrice = items.reduce((sum, i) => sum + (i.preco * i.quantidade), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
