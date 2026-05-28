import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profil from './pages/Profil'
import Produit from './pages/Produit'
import Notifications from './pages/Notifications'
import Catalogue from './pages/Catalogue'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/catalogue" element={<Catalogue />} />
      <Route path="/profil" element={<PrivateRoute><Profil /></PrivateRoute>} />
      <Route path="/produit/:id" element={<Produit />} />
      <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} /> 
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
      <AppRoutes />
    </AuthProvider>
  )
}
