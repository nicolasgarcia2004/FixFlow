const API_URL = 'http://localhost:5000/api'

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

// Obtener datos tabulares filtrados desde el backend
export async function getInformeTabular(token, params = {}) {
  // Convertir params a query string
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      query.append(key, value)
    }
  }

  const res = await fetch(`${API_URL}/informes/tabular?${query.toString()}`, {
    headers: authHeaders(token)
  })
  
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al obtener el informe')
  return data
}

// Obtener lista única de técnicos para el filtro (esto podría venir de la BD también, pero para facilitar usamos usuarios del tipo ADMIN o CLIENTE, o un endpoint rápido si se requiriera, pero lo dejamos que el componente actual resuelva)
export async function getTecnicosLista(token) {
  const res = await fetch(`${API_URL}/auth/tecnicos`, {
    headers: authHeaders(token)
  })
  // We'll create this endpoint briefly or just fetch the users in backend
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al obtener técnicos')
  return data
}
