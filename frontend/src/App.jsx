import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function PlaceholderPage({ title }) {
  return <div className="page-placeholder">{title} - a venir</div>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route path="/catalogue" element={<PlaceholderPage title="Catalogue" />} />
      <Route path="/encheres" element={<PlaceholderPage title="Encheres" />} />
      <Route path="/panier" element={<PlaceholderPage title="Mon panier" />} />
      <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
      <Route path="/profil" element={<PlaceholderPage title="Profil" />} />
      <Route path="/mes-ventes" element={<PlaceholderPage title="Mes ventes" />} />
      <Route path="/mes-negociations" element={<PlaceholderPage title="Mes negociations" />} />
      <Route path="/mes-encheres" element={<PlaceholderPage title="Mes encheres" />} />
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
