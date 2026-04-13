// Servicio para llamadas a la API de servicios (pedidos)
const API_URL = 'http://localhost:5000/api'

// Helper para agregar el token a las peticiones
function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

// Obtener todos los servicios
export async function getServicios(token) {
  const res = await fetch(`${API_URL}/servicios`, {
    headers: authHeaders(token)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al obtener servicios')
  return data
}

// Obtener un servicio por ID (con historial y productos)
export async function getServicioPorId(token, id) {
  const res = await fetch(`${API_URL}/servicios/${id}`, {
    headers: authHeaders(token)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al obtener el servicio')
  return data
}

// Crear un servicio nuevo
export async function crearServicio(token, servicio) {
  const res = await fetch(`${API_URL}/servicios`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(servicio)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al crear servicio')
  return data
}

// Actualizar un servicio existente
export async function actualizarServicio(token, id, datos) {
  const res = await fetch(`${API_URL}/servicios/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(datos)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al actualizar servicio')
  return data
}

// Agregar nota al historial
export async function agregarNotaServicio(token, id, nota) {
  const res = await fetch(`${API_URL}/servicios/${id}/notas`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ nota })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al agregar nota')
  return data
}

// Obtener productos disponibles
export async function getProductos(token) {
  const res = await fetch(`${API_URL}/productos`, {
    headers: authHeaders(token)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al obtener productos')
  return data
}
