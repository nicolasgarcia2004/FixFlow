import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getInformeTabular, getTecnicosLista } from '../services/informeService'
import './InformeTabular.css'

const ESTADOS = ['Todos', 'Recibido', 'Diagnóstico', 'Reparando', 'Listo']
const ITEMS_POR_PAGINA = 10

// Mapa de clases CSS para cada estado
const estadoClase = {
  'Recibido': 'estado-recibido',
  'Diagnóstico': 'estado-diagnostico',
  'Reparando': 'estado-reparando',
  'Listo': 'estado-listo'
}

export default function InformeTabular() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [servicios, setServicios] = useState([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroTecnico, setFiltroTecnico] = useState('Todos')
  const [tecnicosDisponibles, setTecnicosDisponibles] = useState(['Todos'])

  // Ordenamiento
  const [ordenCol, setOrdenCol] = useState('id_servicio')
  const [ordenDir, setOrdenDir] = useState('desc')

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)

  // Cargar técnicos una sola vez
  useEffect(() => {
    async function cargarTecnicos() {
      try {
        const data = await getTecnicosLista(token)
        setTecnicosDisponibles(['Todos', ...data])
      } catch (err) {
        console.error('No se pudieron cargar técnicos', err)
      }
    }
    cargarTecnicos()
  }, [token])

  // Cargar datos cada vez que cambien los parámetros
  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const params = {
        busqueda: busqueda.trim() || undefined,
        estado: filtroEstado !== 'Todos' ? filtroEstado : undefined,
        tecnico: filtroTecnico !== 'Todos' ? filtroTecnico : undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        ordenCol,
        ordenDir,
        pagina: paginaActual,
        limite: ITEMS_POR_PAGINA
      }
      
      const res = await getInformeTabular(token, params)
      setServicios(res.datos)
      setTotalRegistros(res.total)
      setTotalPaginas(res.totalPaginas || 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [token, busqueda, filtroEstado, filtroTecnico, fechaDesde, fechaHasta, ordenCol, ordenDir, paginaActual])

  // Efecto de carga
  useEffect(() => {
    const timeout = setTimeout(() => {
      cargarDatos()
    }, 300) // Debounce corto para la búsqueda
    return () => clearTimeout(timeout)
  }, [cargarDatos])

  // Resetear página cuando cambian filtros
  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtroEstado, filtroTecnico, fechaDesde, fechaHasta])

  // Alternar orden
  const toggleOrden = (columna) => {
    if (ordenCol === columna) {
      setOrdenDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenCol(columna)
      setOrdenDir('asc')
    }
    setPaginaActual(1)
  }

  // Ícono de orden
  const sortIcon = (columna) => {
    if (ordenCol !== columna) return <span className="sort-indicator">{'\u2195'}</span>
    return <span className="sort-indicator active">{ordenDir === 'asc' ? '\u2191' : '\u2193'}</span>
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado('Todos')
    setFechaDesde('')
    setFechaHasta('')
    setFiltroTecnico('Todos')
  }

  // Formatear fecha
  const formatFecha = (fechaDb) => {
    if (!fechaDb) return '—'
    return new Date(fechaDb).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  // Exportar a CSV consultando todo al backend
  const exportarCSV = async () => {
    try {
      const params = {
        busqueda: busqueda.trim() || undefined,
        estado: filtroEstado !== 'Todos' ? filtroEstado : undefined,
        tecnico: filtroTecnico !== 'Todos' ? filtroTecnico : undefined,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        ordenCol,
        ordenDir,
        exportar: 'true'
      }
      const res = await getInformeTabular(token, params)
      const datosCompletos = res.datos
      
      const encabezados = ['ID', 'Fecha', 'Cliente', 'Tipo Equipo', 'Marca', 'Modelo', 'Estado', 'Problema', 'Costo Total', 'Tecnico']
      const filas = datosCompletos.map(s => [
        s.id_servicio,
        s.fecha_ingreso,
        `"${(s.nombre_cliente || '').replace(/"/g, '""')}"`,
        s.tipo_equipo || '',
        s.marca || '',
        s.modelo || '',
        s.estado || '',
        `"${(s.problema_reportado || '').replace(/"/g, '""')}"`,
        s.costo_total || 0,
        s.nombre_tecnico || ''
      ])

      const csv = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `informe_fixflow_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error al exportar CSV: ' + err.message)
    }
  }

  if (cargando) {
    return <div className="informe-page"><p>Cargando datos del informe...</p></div>
  }

  return (
    <div className="informe-page">

      {/* Encabezado */}
      <div className="informe-header">
        <div className="informe-header-left">
          <h1>Informe Tabular</h1>
          <p>Consulta, filtra y exporta todas las ordenes de servicio registradas.</p>
        </div>
        <div className="informe-count">
          <strong>{totalRegistros}</strong>
          <span>{totalRegistros === 1 ? 'resultado' : 'resultados'}</span>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

      {/* Panel de filtros */}
      <div className="filtros-panel">
        <div className="filtros-row">
          <div className="filtro-group">
            <label className="filtro-label">Buscar</label>
            <input
              type="text"
              className="filtro-input"
              placeholder="Cliente, equipo, serial, problema..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Estado</label>
            <select
              className="filtro-input"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Tecnico</label>
            <select
              className="filtro-input"
              value={filtroTecnico}
              onChange={e => setFiltroTecnico(e.target.value)}
            >
              {tecnicosDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Desde</label>
            <input
              type="date"
              className="filtro-input"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
            />
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Hasta</label>
            <input
              type="date"
              className="filtro-input"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
            />
          </div>
        </div>

        <div className="filtros-actions">
          <div className="filtros-actions-left">
            <button className="btn-ghost" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
          <button className="btn btn-outline btn-sm" onClick={exportarCSV}>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="tabla-wrapper">
        {servicios.length > 0 ? (
          <>
            <div className="tabla-scroll">
              <table className="informe-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleOrden('id_servicio')}>
                      N.{sortIcon('id_servicio')}
                    </th>
                    <th onClick={() => toggleOrden('fecha_ingreso')}>
                      Fecha{sortIcon('fecha_ingreso')}
                    </th>
                    <th onClick={() => toggleOrden('nombre_cliente')}>
                      Cliente{sortIcon('nombre_cliente')}
                    </th>
                    <th onClick={() => toggleOrden('tipo_equipo')}>
                      Equipo{sortIcon('tipo_equipo')}
                    </th>
                    <th onClick={() => toggleOrden('estado')}>
                      Estado{sortIcon('estado')}
                    </th>
                    <th>Problema</th>
                    <th onClick={() => toggleOrden('costo_total')}>
                      Costo{sortIcon('costo_total')}
                    </th>
                    <th onClick={() => toggleOrden('nombre_tecnico')}>
                      Tecnico{sortIcon('nombre_tecnico')}
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {servicios.map(s => (
                    <tr key={s.id_servicio}>
                      <td className="cell-id">#{String(s.id_servicio).padStart(4, '0')}</td>
                      <td className="cell-fecha">{formatFecha(s.fecha_ingreso)}</td>
                      <td className="cell-cliente" title={s.nombre_cliente}>{s.nombre_cliente || '—'}</td>
                      <td>{s.tipo_equipo || '—'}{s.marca ? ` ${s.marca}` : ''}</td>
                      <td>
                        <span className={`estado-tag ${estadoClase[s.estado] || ''}`}>
                          {s.estado}
                        </span>
                      </td>
                      <td className="cell-problema" title={s.problema_reportado}>
                        {s.problema_reportado || '—'}
                      </td>
                      <td className="cell-costo">
                        ${Number(s.costo_total || 0).toFixed(2)}
                      </td>
                      <td className="cell-tecnico">{s.nombre_tecnico || '—'}</td>
                      <td>
                        <button
                          className="btn-ver"
                          onClick={() => navigate(`/pedidos/${s.id_servicio}`)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="paginacion">
                <span>
                  Mostrando {((paginaActual - 1) * ITEMS_POR_PAGINA) + 1}–{Math.min(paginaActual * ITEMS_POR_PAGINA, totalRegistros)} de {totalRegistros}
                </span>
                <div className="paginacion-btns">
                  <button
                    className="paginacion-btn"
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(prev => prev - 1)}
                  >
                    {'<'}
                  </button>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p}>
                        {idx > 0 && p - arr[idx - 1] > 1 && (
                          <span className="paginacion-btn" style={{ border: 'none', cursor: 'default' }}>...</span>
                        )}
                        <button
                          className={`paginacion-btn ${p === paginaActual ? 'active' : ''}`}
                          onClick={() => setPaginaActual(p)}
                        >
                          {p}
                        </button>
                      </span>
                    ))
                  }
                  <button
                    className="paginacion-btn"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(prev => prev + 1)}
                  >
                    {'>'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="tabla-empty">
            <p>No se encontraron resultados</p>
            <p>Intenta ajustar los filtros de busqueda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
