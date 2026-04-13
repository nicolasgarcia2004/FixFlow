// Barra de navegación moderna con pills
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

function Navbar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Obtener las iniciales del nombre
  const iniciales = usuario?.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <NavLink to="/pedidos/nuevo" className="navbar-brand">
          <span className="navbar-logo">Fix<span>Flow</span></span>
        </NavLink>

        {/* Links tipo pill - centro */}
        <div className="navbar-pill-container">
          <NavLink to="/pedidos/nuevo">Nuevo Pedido</NavLink>
          <NavLink to="/informes/tabular">Informe Tabular</NavLink>
          <NavLink to="/informes/estadistico">Estadístico</NavLink>
        </div>

        {/* Zona derecha: usuario */}
        <div className="navbar-right">
          <div className="navbar-user-badge">
            <div className="navbar-avatar">{iniciales}</div>
            <span className="navbar-user-name">{usuario?.nombre}</span>
          </div>
          <button className="navbar-logout" onClick={handleLogout}>
            Salir
          </button>
          {/* Hamburguer para móvil */}
          <button
            className="navbar-toggle"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Panel de navegación móvil (fullscreen) */}
      <div className={`navbar-mobile-panel ${menuAbierto ? 'open' : ''}`}>
        <div className="navbar-mobile-header">
          <span className="navbar-logo">Fix<span>Flow</span></span>
          <button className="navbar-mobile-close" onClick={() => setMenuAbierto(false)}>
            ✕
          </button>
        </div>

        <div className="navbar-mobile-links">
          <NavLink to="/pedidos/nuevo" onClick={() => setMenuAbierto(false)}>
            Nuevo Pedido
          </NavLink>
          <NavLink to="/informes/tabular" onClick={() => setMenuAbierto(false)}>
            Informe Tabular
          </NavLink>
          <NavLink to="/informes/estadistico" onClick={() => setMenuAbierto(false)}>
            Informe Estadístico
          </NavLink>
        </div>

        <div className="navbar-mobile-footer">
          <div className="navbar-user-badge">
            <div className="navbar-avatar">{iniciales}</div>
            <span className="navbar-user-name">{usuario?.nombre}</span>
          </div>
          <button className="navbar-logout" onClick={() => { handleLogout(); setMenuAbierto(false) }}>
            Salir
          </button>
        </div>
      </div>
    </>
  )
}

export default Navbar
