import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import API from './utils/api';

import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Favourites from './pages/Favourites';

import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import AdminForgotPassword from './pages/admin/AdminForgotPassword';
import Dashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/UserManagement';


function App() {
  const { user } = useAuth();
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);

  // Check if current route is an admin page
  const isAdminPage = location.pathname.startsWith('/admin');
  // Admin auth pages (login/register) should have no navbar
  const isAdminAuthPage = location.pathname === '/admin/login' || location.pathname === '/admin/register' || location.pathname === '/admin/forgot-password';

  const fetchCart = async () => {
    if (!user) { setCartItems([]); return; }
    try {
      const { data } = await API.get('/cart');
      setCartItems(data.items || []);
    } catch { setCartItems([]); }
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (productId, qty = 1) => {
    if (!user) {
      alert('Please login to add items to cart');
      window.location.href = '/login';
      return;
    }
    try {
      const { data } = await API.post('/cart', { productId, qty });
      setCartItems(data.items || []);
    } catch (err) {
      console.error('Add to cart error:', err);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  return (
    <>
      {/* Show AdminNavbar for admin pages, customer Navbar for everything else */}
      {!isAdminAuthPage && (
        isAdminPage ? <AdminNavbar /> : <Navbar cartCount={cartItems.length} />
      )}

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home onAddToCart={addToCart} />} />
        <Route path="/products" element={<Products onAddToCart={addToCart} />} />
        <Route path="/products/:id" element={<ProductDetail onAddToCart={addToCart} />} />

        {/* Customer Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Customer */}
        <Route path="/cart" element={<ProtectedRoute><Cart cartItems={cartItems} setCartItems={setCartItems} fetchCart={fetchCart} /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout cartItems={cartItems} setCartItems={setCartItems} /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/favourites" element={<ProtectedRoute><Favourites /></ProtectedRoute>} />

        {/* Admin Auth */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />

        {/* Protected Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute adminOnly><ProductManagement /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute adminOnly><OrderManagement /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
      </Routes>

      {/* Only show footer on customer pages */}
      {!isAdminPage && <Footer />}
    </>
  );
}

export default App;
