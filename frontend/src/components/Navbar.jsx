// Barra de navegación principal
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

  return (
    <nav className="navbar">
      <NavLink to="/pedidos/nuevo" className="navbar-brand">
        <span className="navbar-logo">
          Fix<span>Flow</span>
        </span>
      </NavLink>

      {/* Botón hamburguesa para móvil */}
      <button
        className="navbar-toggle"
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-label="Abrir menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Links de navegación */}
      <ul className={`navbar-links ${menuAbierto ? 'open' : ''}`}>
        <li>
          <NavLink to="/pedidos/nuevo" onClick={() => setMenuAbierto(false)}>
            Nuevo Pedido
          </NavLink>
        </li>
        <li>
          <NavLink to="/informes/tabular" onClick={() => setMenuAbierto(false)}>
            Informe Tabular
          </NavLink>
        </li>
        <li>
          <NavLink to="/informes/estadistico" onClick={() => setMenuAbierto(false)}>
            Informe Estadístico
          </NavLink>
        </li>
      </ul>

      {/* Info del usuario y logout */}
      <div className={`navbar-user ${menuAbierto ? 'open' : ''}`}>
        <span className="navbar-user-name">{usuario?.nombre}</span>
        <button className="navbar-logout" onClick={handleLogout}>
          Salir
        </button>
      </div>
    </nav>
  )
}

export default Navbar
