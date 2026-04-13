// Página de inicio de sesión
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginService } from '../services/authService'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validación básica del lado del cliente
    if (!email.trim() || !contrasena.trim()) {
      setError('Ingresa tu email y contraseña')
      return
    }

    setCargando(true)

    try {
      const data = await loginService(email, contrasena)
      login(data.usuario, data.token)
      navigate('/pedidos/nuevo')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Encabezado */}
        <div className="login-header">
          <h1 className="login-brand">
            Fix<span>Flow</span>
          </h1>
          <p className="login-subtitle">
            Gestión de reparaciones de equipos
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contrasena">
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              className="form-input"
              placeholder="Tu contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block login-submit"
            disabled={cargando}
          >
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>Sistema de gestión técnica</p>
        </div>
      </div>
    </div>
  )
}

export default Login
