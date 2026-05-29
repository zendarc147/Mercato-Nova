import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profil from './pages/Profil'
import Produit from './pages/Produit'
import Notifications from './pages/Notifications'
import Catalogue from './pages/Catalogue'
import Encheres from './pages/Encheres'
import Enchere from './pages/Enchere'
import Negociation from './pages/Negociation'
import Paiement from './pages/Paiement'
import Panier from './pages/Panier'
import MesNegociations from './pages/MesNegociations'
import MesVentes from './pages/MesVentes'
import MesEncheres from './pages/MesEncheres'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function SellerRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  return user.role === 'vendeur' || user.role === 'admin'
    ? children
    : <Navigate to="/profil" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/catalogue" element={<Catalogue />} />
      <Route path="/encheres" element={<Encheres />} />
      <Route path="/enchere/:produitId" element={<Enchere />} />
      <Route path="/profil" element={<PrivateRoute><Profil /></PrivateRoute>} />
      <Route path="/produit/:id" element={<Produit />} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
      <Route path="/negociation/:produitId" element={<PrivateRoute><Negociation /></PrivateRoute>} />
      <Route path="/paiement" element={<PrivateRoute><Paiement /></PrivateRoute>} />
      <Route path="/panier" element={<PrivateRoute><Panier /></PrivateRoute>} />
      <Route path="/mes-ventes" element={<SellerRoute><MesVentes /></SellerRoute>} />
      <Route path="/mes-negociations" element={<PrivateRoute><MesNegociations /></PrivateRoute>} />
      <Route path="/mes-encheres" element={<SellerRoute><MesEncheres /></SellerRoute>} />
      {/* Pages Astrid a brancher ici */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <div className="page-placeholder">Espace connecte - a venir</div>
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  )
}
