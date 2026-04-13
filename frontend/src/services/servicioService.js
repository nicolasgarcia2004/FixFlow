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

// Obtener productos disponibles
export async function getProductos(token) {
  const res = await fetch(`${API_URL}/productos`, {
    headers: authHeaders(token)
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al obtener productos')
  return data
}
