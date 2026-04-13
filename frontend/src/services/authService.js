// Servicio para llamadas a la API de autenticación
const API_URL = 'http://localhost:5000/api'

// Login: envía email y contraseña, recibe token y datos del usuario
export async function loginService(email, contrasena) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, contrasena })
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error al iniciar sesión')
  }

  return data
}

// Registro: crea un usuario nuevo y devuelve token
export async function registerService(datos) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error al registrar usuario')
  }

  return data
}
