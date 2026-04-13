// Página para registrar un nuevo pedido (orden de servicio)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { crearServicio, getProductos } from '../services/servicioService'
import './RegistrarPedido.css'

function RegistrarPedido() {
  const { token } = useAuth()
  const navigate = useNavigate()

  // Datos del formulario
  const [diagnostico, setDiagnostico] = useState('')
  const [solucion, setSolucion] = useState('')

  // Productos disponibles y seleccionados
  const [productosDisponibles, setProductosDisponibles] = useState([])
  const [productosAgregados, setProductosAgregados] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState(1)

  // Estado del formulario
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [cargando, setCargando] = useState(false)

  // Cargar productos al montar el componente
  useEffect(() => {
    async function cargarProductos() {
      try {
        const data = await getProductos(token)
        setProductosDisponibles(data)
      } catch (err) {
        console.error('Error cargando productos:', err.message)
      }
    }
    cargarProductos()
  }, [token])

  // Agregar un producto a la lista
  const agregarProducto = () => {
    if (!productoSeleccionado) return

    const producto = productosDisponibles.find(
      p => p.id_producto === parseInt(productoSeleccionado)
    )

    if (!producto) return

    // Revisar si ya está en la lista
    const existente = productosAgregados.find(
      p => p.id_producto === producto.id_producto
    )

    if (existente) {
      // Sumar la cantidad
      setProductosAgregados(prev =>
        prev.map(p =>
          p.id_producto === producto.id_producto
            ? { ...p, cantidad: p.cantidad + parseInt(cantidad) }
            : p
        )
      )
    } else {
      // Agregar nuevo
      setProductosAgregados(prev => [
        ...prev,
        { ...producto, cantidad: parseInt(cantidad) }
      ])
    }

    // Limpiar selección
    setProductoSeleccionado('')
    setCantidad(1)
  }

  // Quitar un producto de la lista
  const quitarProducto = (idProducto) => {
    setProductosAgregados(prev =>
      prev.filter(p => p.id_producto !== idProducto)
    )
  }

  // Calcular el costo total
  const costoTotal = productosAgregados.reduce(
    (total, p) => total + (p.precio * p.cantidad), 0
  )

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')

    if (!diagnostico.trim()) {
      setError('El diagnóstico es obligatorio')
      return
    }

    setCargando(true)

    try {
      const datos = {
        diagnostico,
        solucion,
        productos: productosAgregados.map(p => ({
          id_producto: p.id_producto,
          cantidad: p.cantidad
        }))
      }

      await crearServicio(token, datos)
      setExito('Orden de servicio registrada correctamente')

      // Limpiar el formulario
      setDiagnostico('')
      setSolucion('')
      setProductosAgregados([])

      // Redirigir después de un momento
      setTimeout(() => navigate('/pedidos/nuevo'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="registrar-page">
      {/* Encabezado */}
      <div className="registrar-header">
        <h1>Registrar Orden de Servicio</h1>
        <p>Crea una nueva orden para el equipo recibido en el taller.</p>
      </div>

      {/* Mensajes */}
      {error && <div className="alert alert-error">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      <form onSubmit={handleSubmit}>
        {/* Sección: Diagnóstico */}
        <div className="form-section">
          <h2 className="form-section-title">Diagnóstico del equipo</h2>
          <div className="form-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="diagnostico">
                Diagnóstico *
              </label>
              <textarea
                id="diagnostico"
                className="form-textarea"
                placeholder="Describe el problema o falla que presenta el equipo..."
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="solucion">
                Solución propuesta
              </label>
              <textarea
                id="solucion"
                className="form-textarea"
                placeholder="Describe la reparación o solución a aplicar..."
                value={solucion}
                onChange={(e) => setSolucion(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Sección: Repuestos / Productos */}
        <div className="form-section">
          <h2 className="form-section-title">Repuestos utilizados</h2>

          {/* Selector de producto */}
          <div className="producto-add-row">
            <div className="form-group">
              <label className="form-label" htmlFor="producto">
                Seleccionar repuesto
              </label>
              <select
                id="producto"
                className="form-select"
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
              >
                <option value="">— Elegir repuesto —</option>
                {productosDisponibles.map(p => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre} — ${Number(p.precio).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cantidad">
                Cant.
              </label>
              <input
                id="cantidad"
                type="number"
                className="form-input"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                style={{ width: '80px' }}
              />
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={agregarProducto}
              disabled={!productoSeleccionado}
            >
              Agregar
            </button>
          </div>

          {/* Tabla de productos agregados */}
          {productosAgregados.length > 0 ? (
            <>
              <div className="productos-table-wrapper">
                <table className="productos-table">
                  <thead>
                    <tr>
                      <th>Repuesto</th>
                      <th>Precio</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                      <th className="col-acciones"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosAgregados.map(p => (
                      <tr key={p.id_producto}>
                        <td>{p.nombre}</td>
                        <td>${Number(p.precio).toFixed(2)}</td>
                        <td>{p.cantidad}</td>
                        <td>${(p.precio * p.cantidad).toFixed(2)}</td>
                        <td className="col-acciones">
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => quitarProducto(p.id_producto)}
                            title="Quitar repuesto"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="costo-resumen">
                <span className="costo-label">Costo total:</span>
                <span className="costo-valor">${costoTotal.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <p className="productos-empty">
              No se han agregado repuestos a esta orden.
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={cargando}
          >
            {cargando ? 'Guardando...' : 'Registrar Orden'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RegistrarPedido
