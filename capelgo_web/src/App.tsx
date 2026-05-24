import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ConfigProvider } from './context/ConfigContext';
import Home from './Home';
import StoreDetail from './StoreDetail';
import ProductDetail from './ProductDetail';
import CartPage from './Cart';
import CheckoutPage from './Checkout';
import LoginPage from './Login';
import RegisterPage from './Register';
import MerchantDashboard from './MerchantDashboard';
import AdminDashboard from './AdminDashboard';
import EntregadorDashboard from './EntregadorDashboard';
import MyOrders from './MyOrders';
import Profile from './Profile';
import Rastreio from './Rastreio';
import Promocoes from './Promocoes';
import Avisos from './Avisos';
import Institucional from './Institucional';

function App() {
  return (
    <ConfigProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/loja/:id" element={<StoreDetail />} />
            <Route path="/produto/:id" element={<ProductDetail />} />
            <Route path="/carrinho" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/merchant" element={<MerchantDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/entregador" element={<EntregadorDashboard />} />
            <Route path="/meus-pedidos" element={<MyOrders />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/rastreio/:pedidoId" element={<Rastreio />} />
            <Route path="/promocoes" element={<Promocoes />} />
            <Route path="/avisos" element={<Avisos />} />
            <Route path="/institucional/:topico" element={<Institucional />} />
          </Routes>
        </Router>
      </CartProvider>
    </ConfigProvider>
  );
}

export default App;
