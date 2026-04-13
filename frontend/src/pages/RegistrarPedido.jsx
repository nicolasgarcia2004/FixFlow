// Página para registrar una nueva orden de servicio
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { crearServicio, getProductos } from '../services/servicioService'
import './RegistrarPedido.css'

// Tipos de equipo disponibles
const TIPOS_EQUIPO = [
  'Computadora de escritorio',
  'Laptop',
  'Celular',
  'Tablet',
  'Monitor',
  'Televisor',
  'Impresora',
  'Electrodoméstico',
  'Otro'
]

// Accesorios comunes para checkboxes
const ACCESORIOS_COMUNES = [
  'Cargador',
  'Funda/Estuche',
  'Mouse',
  'Teclado',
  'Cable de poder',
  'Audífonos'
]

function RegistrarPedido() {
  const { token } = useAuth()
  const navigate = useNavigate()

  // Datos del cliente
  const [nombreCliente, setNombreCliente] = useState('')
  const [telefonoCliente, setTelefonoCliente] = useState('')
  const [emailCliente, setEmailCliente] = useState('')
  const [direccionCliente, setDireccionCliente] = useState('')

  // Detalles del hardware
  const [tipoEquipo, setTipoEquipo] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [numeroSerie, setNumeroSerie] = useState('')
  const [accesoriosCheck, setAccesoriosCheck] = useState({})
  const [otrosAccesorios, setOtrosAccesorios] = useState('')
  const [condicionFisica, setCondicionFisica] = useState('')

  // Diagnóstico
  const [problemaReportado, setProblemaReportado] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [solucion, setSolucion] = useState('')

  // Productos/repuestos
  const [productosDisponibles, setProductosDisponibles] = useState([])
  const [productosAgregados, setProductosAgregados] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState(1)

  // Estado del formulario
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [cargando, setCargando] = useState(false)

  // Cargar productos al montar
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

  // Toggle de checkbox de accesorio
  const toggleAccesorio = (accesorio) => {
    setAccesoriosCheck(prev => ({
      ...prev,
      [accesorio]: !prev[accesorio]
    }))
  }

  // Agregar producto a la lista
  const agregarProducto = () => {
    if (!productoSeleccionado) return

    const producto = productosDisponibles.find(
      p => p.id_producto === parseInt(productoSeleccionado)
    )
    if (!producto) return

    const existente = productosAgregados.find(
      p => p.id_producto === producto.id_producto
    )

    if (existente) {
      setProductosAgregados(prev =>
        prev.map(p =>
          p.id_producto === producto.id_producto
            ? { ...p, cantidad: p.cantidad + parseInt(cantidad) }
            : p
        )
      )
    } else {
      setProductosAgregados(prev => [
        ...prev,
        { ...producto, cantidad: parseInt(cantidad) }
      ])
    }

    setProductoSeleccionado('')
    setCantidad(1)
  }

  // Quitar producto
  const quitarProducto = (idProducto) => {
    setProductosAgregados(prev =>
      prev.filter(p => p.id_producto !== idProducto)
    )
  }

  // Calcular costo total
  const costoTotal = productosAgregados.reduce(
    (total, p) => total + (p.precio * p.cantidad), 0
  )

  // Armar texto de accesorios
  const getAccesoriosTexto = () => {
    const seleccionados = Object.entries(accesoriosCheck)
      .filter(([, v]) => v)
      .map(([k]) => k)
    if (otrosAccesorios.trim()) {
      seleccionados.push(otrosAccesorios.trim())
    }
    return seleccionados.join(', ')
  }

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')

    // Validaciones
    if (!nombreCliente.trim()) {
      setError('El nombre del cliente es obligatorio')
      return
    }
    if (!tipoEquipo) {
      setError('Selecciona el tipo de equipo')
      return
    }
    if (!problemaReportado.trim()) {
      setError('Describe el problema reportado por el cliente')
      return
    }

    setCargando(true)

    try {
      const datos = {
        nombre_cliente: nombreCliente,
        telefono_cliente: telefonoCliente,
        email_cliente: emailCliente,
        direccion_cliente: direccionCliente,
        tipo_equipo: tipoEquipo,
        marca,
        modelo,
        numero_serie: numeroSerie,
        accesorios: getAccesoriosTexto(),
        condicion_fisica: condicionFisica,
        problema_reportado: problemaReportado,
        diagnostico,
        solucion,
        productos: productosAgregados.map(p => ({
          id_producto: p.id_producto,
          cantidad: p.cantidad
        }))
      }

      await crearServicio(token, datos)
      setExito('Orden de servicio registrada correctamente')

      // Limpiar todo
      setNombreCliente(''); setTelefonoCliente(''); setEmailCliente('')
      setDireccionCliente(''); setTipoEquipo(''); setMarca(''); setModelo('')
      setNumeroSerie(''); setAccesoriosCheck({}); setOtrosAccesorios('')
      setCondicionFisica(''); setProblemaReportado(''); setDiagnostico('')
      setSolucion(''); setProductosAgregados([])

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
        <div>
          <h1>Registrar Orden de Servicio</h1>
          <p>Completa la información del equipo recibido en el taller.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
          <div className="order-status-badge">
            <span className="order-status-dot"></span>
            Nuevo
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Técnico Registrando: <strong>{useAuth().usuario?.nombre}</strong>
          </span>
        </div>
      </div>

      {/* Mensajes */}
      {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-5)'}}>{error}</div>}
      {exito && <div className="alert alert-success" style={{marginBottom: 'var(--space-5)'}}>{exito}</div>}

      <form onSubmit={handleSubmit}>

        {/* === SECCIÓN 1: Información del cliente === */}
        <div className="form-section">
          <h2 className="form-section-title">
            Información del Cliente
          </h2>

          <div className="form-fields">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="nombreCliente">
                  Nombre completo *
                </label>
                <input
                  id="nombreCliente"
                  type="text"
                  className="form-input"
                  placeholder="Nombre del cliente"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="telefonoCliente">
                  Teléfono *
                </label>
                <input
                  id="telefonoCliente"
                  type="tel"
                  className="form-input"
                  placeholder="300 123 4567"
                  value={telefonoCliente}
                  onChange={(e) => setTelefonoCliente(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="emailCliente">
                  Correo electrónico
                </label>
                <input
                  id="emailCliente"
                  type="email"
                  className="form-input"
                  placeholder="correo@ejemplo.com"
                  value={emailCliente}
                  onChange={(e) => setEmailCliente(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="direccionCliente">
                  Dirección (opcional)
                </label>
                <input
                  id="direccionCliente"
                  type="text"
                  className="form-input"
                  placeholder="Dirección del cliente"
                  value={direccionCliente}
                  onChange={(e) => setDireccionCliente(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* === SECCIÓN 2: Detalles del hardware === */}
        <div className="form-section">
          <h2 className="form-section-title">
            Detalles del Hardware
          </h2>

          <div className="form-fields">
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label" htmlFor="tipoEquipo">
                  Tipo de equipo *
                </label>
                <select
                  id="tipoEquipo"
                  className="form-select"
                  value={tipoEquipo}
                  onChange={(e) => setTipoEquipo(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {TIPOS_EQUIPO.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="marca">
                  Marca
                </label>
                <input
                  id="marca"
                  type="text"
                  className="form-input"
                  placeholder="Ej: Dell, Apple, Samsung"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="modelo">
                  Modelo
                </label>
                <input
                  id="modelo"
                  type="text"
                  className="form-input"
                  placeholder="Ej: XPS 13, iPhone 15"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="numeroSerie">
                  Número de Serie / IMEI
                </label>
                <input
                  id="numeroSerie"
                  type="text"
                  className="form-input"
                  placeholder="Serial o IMEI del equipo"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                />
              </div>
            </div>

            {/* Accesorios recibidos */}
            <div className="form-group">
              <label className="form-label">Accesorios recibidos</label>
              <div className="checkbox-group">
                {ACCESORIOS_COMUNES.map(acc => (
                  <div className="checkbox-item" key={acc}>
                    <input
                      type="checkbox"
                      id={`acc-${acc}`}
                      checked={!!accesoriosCheck[acc]}
                      onChange={() => toggleAccesorio(acc)}
                    />
                    <label htmlFor={`acc-${acc}`}>{acc}</label>
                  </div>
                ))}
              </div>
              <input
                type="text"
                className="form-input otros-accesorios"
                placeholder="Otros accesorios..."
                value={otrosAccesorios}
                onChange={(e) => setOtrosAccesorios(e.target.value)}
              />
            </div>

            {/* Condición física */}
            <div className="form-group">
              <label className="form-label" htmlFor="condicionFisica">
                Condición física del equipo
              </label>
              <input
                id="condicionFisica"
                type="text"
                className="form-input"
                placeholder="Ej: Rayones en la tapa, tecla faltante, pantalla rota..."
                value={condicionFisica}
                onChange={(e) => setCondicionFisica(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* === SECCIÓN 3: Diagnóstico y problema === */}
        <div className="form-section">
          <h2 className="form-section-title">
            Diagnóstico y Problema
          </h2>

          <div className="form-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="problemaReportado">
                Problema reportado por el cliente *
              </label>
              <textarea
                id="problemaReportado"
                className="form-textarea"
                placeholder="Describe el problema que el cliente reporta..."
                value={problemaReportado}
                onChange={(e) => setProblemaReportado(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="diagnostico">
                Diagnóstico técnico
              </label>
              <textarea
                id="diagnostico"
                className="form-textarea"
                placeholder="Diagnóstico del técnico después de revisar el equipo..."
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
                placeholder="Reparación o solución a aplicar..."
                value={solucion}
                onChange={(e) => setSolucion(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* === SECCIÓN 4: Repuestos === */}
        <div className="form-section">
          <h2 className="form-section-title">
            Repuestos Utilizados
          </h2>

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

          {/* Tabla de productos */}
          {productosAgregados.length > 0 ? (
            <>
              <div className="productos-table-wrapper">
                <table className="productos-table">
                  <thead>
                    <tr>
                      <th>Repuesto</th>
                      <th>Precio</th>
                      <th>Cant.</th>
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
                            title="Quitar"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="costo-resumen">
                <span className="costo-label">Costo total estimado:</span>
                <span className="costo-valor">${costoTotal.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <p className="productos-empty">
              No se han agregado repuestos a esta orden.
            </p>
          )}
        </div>

        {/* Acciones del formulario */}
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
