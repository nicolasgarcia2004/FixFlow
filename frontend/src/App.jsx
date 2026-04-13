// Configuración de rutas de la aplicación
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import RegistrarPedido from './pages/RegistrarPedido'
import DetallePedido from './pages/DetallePedido'

function App() {
  const { isAuthenticated, cargando } = useAuth()

  // Esperar a que cargue la sesión
  if (cargando) return null

  return (
    <>
      {/* Navbar solo se muestra si hay sesión activa */}
      {isAuthenticated && <Navbar />}

      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/pedidos/nuevo" /> : <Login />
        } />

        {/* Rutas protegidas */}
        <Route path="/pedidos/nuevo" element={
          <ProtectedRoute>
            <RegistrarPedido />
          </ProtectedRoute>
        } />
        
        <Route path="/pedidos/:id" element={
          <ProtectedRoute>
            <DetallePedido />
          </ProtectedRoute>
        } />

        {/* Redirigir la raíz */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  )
}

export default App
