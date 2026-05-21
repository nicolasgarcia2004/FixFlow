// Vista Informe Tabular — Tabla de datos con filtros y exportación
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getServicios } from '../services/servicioService'
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
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroTecnico, setFiltroTecnico] = useState('Todos')

  // Ordenamiento
  const [ordenCol, setOrdenCol] = useState('id_servicio')
  const [ordenDir, setOrdenDir] = useState('desc')

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)

  // Cargar datos
  useEffect(() => {
    async function cargar() {
      try {
        const data = await getServicios(token)
        setServicios(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [token])

  // Obtener lista de técnicos únicos para el filtro
  const tecnicos = useMemo(() => {
    const nombres = [...new Set(servicios.map(s => s.nombre_tecnico).filter(Boolean))]
    return ['Todos', ...nombres.sort()]
  }, [servicios])

  // Aplicar filtros
  const datosFiltrados = useMemo(() => {
    let resultado = [...servicios]

    // Filtro por palabra
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      resultado = resultado.filter(s =>
        (s.nombre_cliente || '').toLowerCase().includes(termino) ||
        (s.tipo_equipo || '').toLowerCase().includes(termino) ||
        (s.marca || '').toLowerCase().includes(termino) ||
        (s.modelo || '').toLowerCase().includes(termino) ||
        (s.problema_reportado || '').toLowerCase().includes(termino) ||
        (s.numero_serie || '').toLowerCase().includes(termino) ||
        String(s.id_servicio).includes(termino)
      )
    }

    // Filtro por estado
    if (filtroEstado !== 'Todos') {
      resultado = resultado.filter(s => s.estado === filtroEstado)
    }

    // Filtro por técnico
    if (filtroTecnico !== 'Todos') {
      resultado = resultado.filter(s => s.nombre_tecnico === filtroTecnico)
    }

    // Filtro por fecha desde
    if (fechaDesde) {
      resultado = resultado.filter(s => {
        const fecha = new Date(s.fecha_ingreso)
        return fecha >= new Date(fechaDesde)
      })
    }

    // Filtro por fecha hasta
    if (fechaHasta) {
      resultado = resultado.filter(s => {
        const fecha = new Date(s.fecha_ingreso)
        return fecha <= new Date(fechaHasta + 'T23:59:59')
      })
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      let valA = a[ordenCol]
      let valB = b[ordenCol]

      // Manejar tipos
      if (ordenCol === 'id_servicio' || ordenCol === 'costo_total') {
        valA = Number(valA) || 0
        valB = Number(valB) || 0
      } else if (ordenCol === 'fecha_ingreso') {
        valA = new Date(valA || 0)
        valB = new Date(valB || 0)
      } else {
        valA = (valA || '').toString().toLowerCase()
        valB = (valB || '').toString().toLowerCase()
      }

      if (valA < valB) return ordenDir === 'asc' ? -1 : 1
      if (valA > valB) return ordenDir === 'asc' ? 1 : -1
      return 0
    })

    return resultado
  }, [servicios, busqueda, filtroEstado, filtroTecnico, fechaDesde, fechaHasta, ordenCol, ordenDir])

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(datosFiltrados.length / ITEMS_POR_PAGINA))
  const datosVisibles = datosFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  )

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

  // Exportar a CSV
  const exportarCSV = () => {
    const encabezados = ['ID', 'Fecha', 'Cliente', 'Tipo Equipo', 'Marca', 'Modelo', 'Estado', 'Problema', 'Costo Total', 'Tecnico']
    const filas = datosFiltrados.map(s => [
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
          <strong>{datosFiltrados.length}</strong>
          <span>{datosFiltrados.length === 1 ? 'resultado' : 'resultados'}</span>
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
              {tecnicos.map(t => <option key={t} value={t}>{t}</option>)}
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
        {datosVisibles.length > 0 ? (
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
                  {datosVisibles.map(s => (
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
                  Mostrando {((paginaActual - 1) * ITEMS_POR_PAGINA) + 1}–{Math.min(paginaActual * ITEMS_POR_PAGINA, datosFiltrados.length)} de {datosFiltrados.length}
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
