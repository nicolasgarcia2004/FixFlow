import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getServicioPorId, actualizarServicio, getProductos, agregarNotaServicio } from '../services/servicioService'
import './DetallePedido.css'

const ESTADOS = ['Recibido', 'Diagnóstico', 'Reparando', 'Listo']

export default function DetallePedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

  const [servicio, setServicio] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Campos de edición
  const [editando, setEditando] = useState(false)
  const [diagnosticoTxt, setDiagnosticoTxt] = useState('')
  const [solucionTxt, setSolucionTxt] = useState('')
  
  // Productos en memoria local
  const [productosDisponibles, setProductosDisponibles] = useState([])
  const [productos, setProductos] = useState([])
  const [prodSelect, setProdSelect] = useState('')
  const [prodCant, setProdCant] = useState(1)

  // Notas
  const [nuevaNota, setNuevaNota] = useState('')

  const cargarDatos = async () => {
    try {
      const data = await getServicioPorId(token, id)
      setServicio(data)
      setDiagnosticoTxt(data.diagnostico || '')
      setSolucionTxt(data.solucion || '')
      setProductos(data.productos || [])
      
      const prodsDisponibles = await getProductos(token)
      setProductosDisponibles(prodsDisponibles)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [id, token])

  const cambiarEstado = async (nuevoEstado) => {
    if (servicio.estado === nuevoEstado) return;
    try {
      await actualizarServicio(token, id, { estado: nuevoEstado, productos })
      cargarDatos()
      setExito(`Estado actualizado a ${nuevoEstado}`)
    } catch (err) {
      setError(err.message)
    }
  }

  const guardarCambios = async () => {
    try {
      await actualizarServicio(token, id, {
        diagnostico: diagnosticoTxt,
        solucion: solucionTxt,
        productos: productos
      })
      setEditando(false)
      cargarDatos()
      setExito('Cambios guardados correctamente')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAgregarProducto = () => {
    if (!prodSelect) return
    const prod = productosDisponibles.find(p => p.id_producto === parseInt(prodSelect))
    if (!prod) return
    const existe = productos.find(p => p.id_producto === prod.id_producto)
    if (existe) {
      setProductos(productos.map(p => p.id_producto === prod.id_producto ? { ...p, cantidad: p.cantidad + parseInt(prodCant) } : p))
    } else {
      setProductos([...productos, { ...prod, cantidad: parseInt(prodCant) }])
    }
    setProdSelect('')
    setProdCant(1)
  }

  const quitarProducto = (idProd) => {
    setProductos(productos.filter(p => p.id_producto !== idProd))
  }

  const enviarNota = async (e) => {
    e.preventDefault()
    if (!nuevaNota.trim()) return
    try {
      await agregarNotaServicio(token, id, nuevaNota)
      setNuevaNota('')
      cargarDatos()
    } catch (err) {
      setError(err.message)
    }
  }

  const formatearFecha = (fechaDb) => {
    if (!fechaDb) return ''
    const d = new Date(fechaDb)
    return d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
  }

  if (cargando) return <div className="detalle-page"><p>Cargando información del pedido...</p></div>

  if (!servicio && !cargando) return <div className="detalle-page alert alert-error">No se encontró el pedido</div>

  const idxEstadoActual = ESTADOS.indexOf(servicio.estado || 'Recibido')
  
  // Costo total mostrado en UI
  const calcCostoTotal = productos.reduce((tot, p) => tot + (parseFloat(p.precio) * p.cantidad), 0)

  return (
    <div className="detalle-page">
      {/* Header */}
      <div className="detalle-header">
        <div className="detalle-title">
          <h1>Editar Pedido #{servicio.id_servicio.toString().padStart(4, '0')}</h1>
          <p>
            Registrado por {servicio.nombre_tecnico} el {formatearFecha(servicio.fecha_ingreso)}
          </p>
        </div>
        <div>
          {editando ? (
            <div style={{display: 'flex', gap: '8px'}}>
              <button className="btn btn-outline" onClick={() => { setEditando(false); cargarDatos(); }}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarCambios}>Guardar Cambios</button>
            </div>
          ) : (
            <button className="btn btn-outline" onClick={() => setEditando(true)}>Editar Detalles</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom: '1rem'}}>{error}</div>}
      {exito && <div className="alert alert-success" style={{marginBottom: '1rem'}}>{exito}</div>}

      {/* Stepper Estado */}
      <div className="status-stepper">
        {ESTADOS.map((est, idx) => {
          let classes = 'stepper-step'
          if (idx <= idxEstadoActual) classes += ' completed'
          if (idx === idxEstadoActual) classes += ' active'
          // Mostrar clickeables todos, para poder avanzar o retroceder
          return (
            <div key={est} className={classes} onClick={() => cambiarEstado(est)}>
              {est}
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="detalle-grid">
        
        {/* Columna Izquierda (Hardware, Textos, Repuestos) */}
        <div className="detalles-main">
          <div className="card">
            <div className="hw-header">
              <div>
                <h2 className="hw-equipo">{servicio.marca} {servicio.modelo}</h2>
                <div className="hw-meta">
                  {servicio.tipo_equipo} | S/N: {servicio.numero_serie || 'N/A'}
                </div>
              </div>
              <span className="badge">{servicio.estado}</span>
            </div>

            <div className="form-group" style={{marginBottom: '1.5rem'}}>
              <label className="form-label">PROBLEMA REPORTADO</label>
              <div style={{fontStyle: 'italic', color: 'var(--color-text-secondary)', padding: '0.5rem', backgroundColor: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)'}}>
                "{servicio.problema_reportado}"
              </div>
            </div>

            <div className="form-row" style={{marginBottom: '1.5rem'}}>
              <div className="form-group">
                <label className="form-label">DIAGNÓSTICO TÉCNICO</label>
                {editando ? (
                  <textarea className="form-textarea" value={diagnosticoTxt} onChange={e => setDiagnosticoTxt(e.target.value)} rows="4" placeholder="Escriba el diagnóstico..."/>
                ) : (
                  <div className="timeline-desc bg-white" style={{margin: 0, minHeight: '80px', border: '1px solid var(--color-border)'}}>{diagnosticoTxt || 'Sin diagnóstico registrado.'}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">SOLUCIÓN / NOTAS FINALES</label>
                {editando ? (
                  <textarea className="form-textarea" value={solucionTxt} onChange={e => setSolucionTxt(e.target.value)} rows="4" placeholder="Trabajo realizado..."/>
                ) : (
                  <div className="timeline-desc bg-white" style={{margin: 0, minHeight: '80px', border: '1px solid var(--color-border)'}}>{solucionTxt || 'Sin notas de solución.'}</div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Componentes y Servicios</h2>
            
            {editando && (
              <div className="producto-add-row" style={{marginBottom: '1rem'}}>
                <select className="form-select" value={prodSelect} onChange={e => setProdSelect(e.target.value)}>
                  <option value="">Buscar repuesto...</option>
                  {productosDisponibles.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre} - ${p.precio}</option>)}
                </select>
                <input type="number" className="form-input" min="1" value={prodCant} onChange={e => setProdCant(e.target.value)} />
                <button type="button" className="btn btn-outline" onClick={handleAgregarProducto} disabled={!prodSelect}>+ Agregar</button>
              </div>
            )}

            {productos.length > 0 ? (
              <div className="productos-table-wrapper">
                <table className="productos-table">
                  <thead>
                    <tr>
                      <th>Ítem</th>
                      <th>Precio Unit.</th>
                      <th>Cant.</th>
                      <th>Total</th>
                      {editando && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map(p => (
                      <tr key={p.id_producto}>
                        <td>{p.nombre}</td>
                        <td>${parseFloat(p.precio).toFixed(2)}</td>
                        <td>{p.cantidad}</td>
                        <td>${(parseFloat(p.precio) * p.cantidad).toFixed(2)}</td>
                        {editando && (
                          <td style={{textAlign:'center'}}>
                            <button className="btn-remove" onClick={() => quitarProducto(p.id_producto)}>✕</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="productos-empty">No hay repuestos registrados.</p>
            )}

            <div className="resumen-costo">
              <span>Total Estimado</span>
              <strong>${calcCostoTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Columna Derecha (Cliente y Timeline) */}
        <div className="detalles-sidebar">
          <div className="card cliente-info">
            <div className="cliente-nombre">{servicio.nombre_cliente}</div>
            {servicio.email_cliente && (
              <div className="cliente-item">
                <span className="cliente-item-label">Email</span>
                <span className="cliente-item-value">{servicio.email_cliente}</span>
              </div>
            )}
            {servicio.telefono_cliente && (
              <div className="cliente-item">
                <span className="cliente-item-label">Teléfono</span>
                <span className="cliente-item-value">{servicio.telefono_cliente}</span>
              </div>
            )}
            {servicio.direccion_cliente && (
              <div className="cliente-item">
                <span className="cliente-item-label">Dirección</span>
                <span className="cliente-item-value">{servicio.direccion_cliente}</span>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-title">Línea de Tiempo</h2>
            
            <div className="timeline">
              {servicio.historial && servicio.historial.map((hx) => {
                const isEstado = hx.accion === 'Cambio de Estado';
                const isNueva = hx.accion === 'Orden Creada';
                return (
                  <div key={hx.id_historial} className={`timeline-item ${isEstado ? 'accion-estado' : ''} ${isNueva ? 'accion-nueva' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-header">
                      <span className="timeline-action">{hx.accion}</span>
                      <span className="timeline-date">{formatearFecha(hx.fecha_registro)}</span>
                    </div>
                    {hx.descripcion && <div className="timeline-desc">{hx.descripcion}</div>}
                    <div className="timeline-user">Por: {hx.tecnico_nombre || 'Sistema'}</div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={enviarNota} className="add-note-box">
              <div className="form-group">
                <textarea 
                  className="form-textarea" 
                  rows="2" 
                  placeholder="Agregar nota interna para esta orden..."
                  value={nuevaNota}
                  onChange={e => setNuevaNota(e.target.value)}
                />
              </div>
              <div style={{textAlign: 'right', marginTop: 'var(--space-2)'}}>
                <button type="submit" className="btn btn-outline" style={{padding: 'var(--space-2) var(--space-4)', fontSize: '11px'}} disabled={!nuevaNota.trim()}>Guardar Nota</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
