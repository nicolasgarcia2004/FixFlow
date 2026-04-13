// Componente que protege rutas: redirige al login si no hay sesión
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, cargando } = useAuth()

  // Mientras carga la sesión, no mostrar nada
  if (cargando) return null

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
