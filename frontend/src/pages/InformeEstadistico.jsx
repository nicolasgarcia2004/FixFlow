import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getInformeEstadistico } from '../services/informeService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import './InformeEstadistico.css'

function InformeEstadistico() {
  const { token } = useAuth()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtroFecha, setFiltroFecha] = useState('todo')

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroFecha])

  const cargarDatos = async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await getInformeEstadistico(token, filtroFecha)
      setDatos(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  // Colores para las gráficas según la paleta del proyecto
  const COLORS = ['#b84246', '#4f6963', '#d4686b', '#6b847e', '#1f2e1f', '#e67e22']

  if (cargando) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Informe Estadístico</h1>
          <p>Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const esErrorAuth = error.includes('Token inválido') || error.includes('expirado')
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">{error}</div>
        {esErrorAuth ? (
          <button className="btn btn-primary" onClick={() => { window.location.href = '/login'; localStorage.clear(); }}>Volver a iniciar sesión</button>
        ) : (
          <button className="btn btn-primary" onClick={cargarDatos}>Reintentar</button>
        )}
      </div>
    )
  }

  if (!datos) return null

  // Formateador de moneda
  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor)
  }

  // Formateador dinámico para el eje Y de ingresos
  const formatearEjeY = (val) => {
    if (val === 0) return '$0'
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`
    return `$${val}`
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h1>Informe Estadístico Consolidado</h1>
          <p>Resumen general del rendimiento del taller</p>
        </div>

        <div className="dashboard-filters">
          <label htmlFor="filtroFechaPeriodo" className="form-label" style={{ marginBottom: 0 }}>Periodo:</label>
          <select
            id="filtroFechaPeriodo"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          >
            <option value="todo">Desde el inicio</option>
            <option value="hoy">Hoy</option>
            <option value="7dias">Últimos 7 días</option>
            <option value="30dias">Últimos 30 días</option>
            <option value="esteAño">Este año</option>
          </select>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-title">Total Servicios</span>
          <span className="kpi-value">{datos.resumen.total_servicios}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Servicios Completados</span>
          <span className="kpi-value">{datos.resumen.servicios_completados}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-title">Ingresos Totales</span>
          <span className="kpi-value money">{formatoMoneda(datos.resumen.ingresos_totales)}</span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">

        {/* Distribución de Estados */}
        <div className="chart-card">
          <h3>Distribución por Estado</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datos.serviciosPorEstado}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#b84246"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {datos.serviciosPorEstado.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tipos de Equipo más frecuentes */}
        <div className="chart-card">
          <h3>Top 5 Equipos Atendidos</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={datos.serviciosPorTipoEquipo}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="tipo_equipo" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="cantidad" name="Cantidad" fill="#4f6963" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ingresos por Mes */}
        <div className="chart-card full-width">
          <h3>Ingresos por Mes (Últimos 6 Meses)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={datos.ingresosPorMes}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mes" />
                <YAxis width={65} tickFormatter={formatearEjeY} />
                <RechartsTooltip formatter={(value) => formatoMoneda(value)} />
                <Bar dataKey="total" name="Ingresos" fill="#b84246" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}

export default InformeEstadistico
