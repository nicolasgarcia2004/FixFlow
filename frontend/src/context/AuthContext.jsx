// Contexto de autenticación global
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Al cargar la app, revisar si hay sesión guardada
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token')
    const usuarioGuardado = localStorage.getItem('usuario')

    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado)
      setUsuario(JSON.parse(usuarioGuardado))
    }
    setCargando(false)
  }, [])

  // Guardar sesión después del login
  const login = (datosUsuario, tokenNuevo) => {
    setUsuario(datosUsuario)
    setToken(tokenNuevo)
    localStorage.setItem('token', tokenNuevo)
    localStorage.setItem('usuario', JSON.stringify(datosUsuario))
  }

  // Cerrar sesión
  const logout = () => {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar el contexto en cualquier componente
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
