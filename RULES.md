# FixFlow — Reglas del Proyecto para Agentes de IA

> Este archivo define **todas** las convenciones, restricciones, patrones de código y estructura de carpetas del proyecto FixFlow.  
> Cualquier agente de IA (Antigravity, Cursor, Copilot, etc.) que trabaje en este repositorio **DEBE** leer y seguir este documento antes de crear o modificar cualquier archivo.

---

## 1. Descripción del Proyecto

**FixFlow** es un sistema web de gestión de órdenes de servicio para talleres de reparación de equipos electrónicos (celulares, laptops, computadoras, televisores, tablets, electrodomésticos, monitores, etc.).

**Funcionalidades principales:**
- Login/autenticación con JWT
- Registro de órdenes de servicio con datos del cliente y hardware
- Edición de órdenes: cambio de estado, diagnóstico, repuestos, notas
- Informe tabular con filtros, paginación server-side y exportación CSV
- Informe estadístico con gráficas consolidadas (pendiente)
- Historial de cambios por orden (auditoría)

---

## 2. Stack Tecnológico (NO cambiar)

| Capa | Tecnología | Versión |
|---|---|---|
| **Frontend** | React (Vite) | React 19, Vite 8 |
| **Routing Frontend** | react-router-dom | v7 |
| **Backend** | Express.js | v5 |
| **Base de Datos** | PostgreSQL (Neon Cloud) | v17 |
| **Autenticación** | JWT (jsonwebtoken) + bcryptjs | — |
| **CSS** | Vanilla CSS con variables (Design Tokens) | — |
| **Fuente** | Google Fonts — Raleway | 300–700 |

**NO usar:** TailwindCSS, Material UI, Bootstrap, Chakra, Styled Components, TypeScript, ORMs (Sequelize, Prisma), ni ninguna otra librería de UI o CSS framework.

---

## 3. Paleta de Colores (OBLIGATORIA)

```
Primario:           #b84246  (rojo oscuro)
Primario oscuro:    #963539
Primario claro:     #d4686b
Secundario:         #1f2e1f  (verde muy oscuro / casi negro)
Secundario claro:   #2d422d
Accent:             #4f6963  (verde azulado / teal oscuro)
Accent claro:       #6b847e
Fondo:              #fafaf9
Superficie:         #ffffff
Superficie alt:     #f5f3f0
Borde:              #e2ddd8
Texto:              #1a1a1a
Texto secundario:   #5c5650
Texto muted:        #8a8279
Texto inverso:      #ffffff
Error:              #c0392b
Éxito:              #27ae60
Warning:            #e67e22
```

> Todos estos colores ya están definidos como CSS Custom Properties en `frontend/src/index.css`. **SIEMPRE** usar las variables CSS (`var(--color-primary)`, `var(--color-accent)`, etc.) en lugar de valores hexadecimales directos.

---

## 4. Estructura de Carpetas

```
fixflow/
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js              ← Punto de entrada Express
│   │   ├── config/
│   │   │   └── db.js             ← Pool de conexión PostgreSQL (Neon)
│   │   ├── middlewares/
│   │   │   └── auth.js           ← verificarToken, esAdmin (JWT)
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── servicioController.js
│   │   │   ├── productoController.js
│   │   │   └── informeController.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── servicios.js
│   │       ├── productos.js
│   │       └── informes.js
│   └── .env                      ← NO commitear (está en .gitignore)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx              ← Punto de entrada React
│   │   ├── App.jsx               ← Router y layout principal
│   │   ├── index.css             ← Design system (tokens globales)
│   │   ├── context/
│   │   │   └── AuthContext.jsx   ← Contexto global de autenticación
│   │   ├── components/
│   │   │   ├── Navbar.jsx + Navbar.css
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx + Login.css
│   │   │   ├── RegistrarPedido.jsx + RegistrarPedido.css
│   │   │   ├── DetallePedido.jsx + DetallePedido.css
│   │   │   └── InformeTabular.jsx + InformeTabular.css
│   │   └── services/
│   │       ├── authService.js
│   │       ├── servicioService.js
│   │       └── informeService.js
│
├── database/
│   └── init.sql                  ← DDL de todas las tablas
│
├── docs/
│   └── diagramas/                ← Diagramas PlantUML
│       ├── arquitectura.puml
│       ├── modelo_er.puml
│       ├── api_rest.puml
│       └── rutas_frontend.puml
│
├── .gitignore
├── RULES.md                      ← Este archivo
└── README.md
```

---

## 5. Convenciones de Código

### 5.1 Backend (Node.js / Express)

#### Archivos de Rutas (`backend/src/routes/`)
- **Un archivo por recurso:** `auth.js`, `servicios.js`, `productos.js`, `informes.js`
- Usar `express.Router()` siempre
- Importar el middleware de autenticación así:
  ```js
  const { verificarToken } = require('../middlewares/auth');
  ```
  > **IMPORTANTE:** El archivo del middleware se llama `auth.js`, **NO** `authMiddleware.js`. Nunca importar desde `../middlewares/authMiddleware`.
- Todas las rutas protegidas deben usar `verificarToken` como middleware
- Comentar cada ruta con el verbo HTTP y el path completo:
  ```js
  // GET /api/servicios — Listar servicios
  router.get('/', obtenerServicios);
  ```

#### Archivos de Controladores (`backend/src/controllers/`)
- **Un archivo por recurso:** `authController.js`, `servicioController.js`, `productoController.js`, `informeController.js`
- Cada función es `async (req, res) => { ... }`
- Siempre envolver en `try/catch`
- En el `catch`, loguear con `console.error` y devolver `res.status(500).json({ error: '...' })`
- Exportar con `module.exports = { funcion1, funcion2 }`
- **Acceso al usuario autenticado:** `req.usuario` contiene `{ id_usuario, email, tipo_usuario }` (lo inyecta el middleware JWT)
- **Queries SQL:** Usar `pool.query(sql, params)` con placeholders `$1, $2, ...` (nunca concatenar strings)
- **Pool de BD:** Importar así:
  ```js
  const pool = require('../config/db');
  ```

#### Registro de nuevas rutas en `index.js`
Al crear un nuevo módulo de rutas, registrar en `backend/src/index.js`:
```js
const nuevasRoutes = require('./routes/nuevas');
app.use('/api/nuevas', nuevasRoutes);
```

#### Convenciones de nombres (Backend)
- Archivos: `camelCase.js` para controladores, `camelCase.js` para rutas
- Funciones: `camelCase` (e.g., `obtenerServicios`, `crearServicio`, `actualizarServicio`)
- Tablas SQL: `snake_case` (e.g., `id_servicio`, `fecha_ingreso`, `nombre_cliente`)
- Variables JS: `camelCase`

### 5.2 Frontend (React / Vite)

#### Estructura de cada vista nueva
Cuando se necesite una nueva vista, crear **dos archivos** en `frontend/src/pages/`:
1. `NombreVista.jsx` — Componente React
2. `NombreVista.css` — Estilos específicos de esa vista

#### Archivos de Servicio (`frontend/src/services/`)
- **Un archivo por dominio:** `authService.js`, `servicioService.js`, `informeService.js`
- Cada service define la constante `API_URL`:
  ```js
  const API_URL = 'http://localhost:5000/api'
  ```
- Helper de headers con token:
  ```js
  function authHeaders(token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }
  ```
- Cada función exporta con `export async function nombre(token, ...params)`
- Siempre verificar `res.ok` y lanzar `throw new Error(data.error || 'mensaje')` si falla
- **Patrón completo de una función:**
  ```js
  export async function getRecurso(token) {
    const res = await fetch(`${API_URL}/recurso`, {
      headers: authHeaders(token)
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al obtener recurso')
    return data
  }
  ```

#### Componentes reutilizables (`frontend/src/components/`)
- Archivos `PascalCase.jsx` + `PascalCase.css`
- `Navbar.jsx` — Barra de navegación global (ya existe, añadir enlaces a nuevas vistas aquí)
- `ProtectedRoute.jsx` — HOC que redirige a `/login` si no hay sesión

#### Registro de nuevas rutas en `App.jsx`
Al crear una nueva vista:
1. Importar el componente en `App.jsx`
2. Añadir la ruta dentro de `<Routes>` envuelta en `<ProtectedRoute>`:
   ```jsx
   <Route path="/nueva-ruta" element={
     <ProtectedRoute>
       <NuevaVista />
     </ProtectedRoute>
   } />
   ```
3. Añadir el enlace correspondiente en `Navbar.jsx` (tanto en desktop como en el panel móvil)

#### Contexto de autenticación
- Se usa `AuthContext.jsx` con el provider en `main.jsx`
- En cualquier componente, acceder con:
  ```jsx
  const { usuario, token, isAuthenticated, login, logout } = useAuth()
  ```
- `usuario` contiene: `{ id_usuario, nombre, email, tipo_usuario }`
- `token` es el JWT string para pasarlo a los services

#### Convenciones de nombres (Frontend)
- Componentes y páginas: `PascalCase.jsx` (e.g., `RegistrarPedido.jsx`, `DetallePedido.jsx`)
- Archivos CSS por vista: `PascalCase.css` con el mismo nombre que el `.jsx`
- Services: `camelCase.js` (e.g., `servicioService.js`)
- Context: `PascalCase.jsx` (e.g., `AuthContext.jsx`)
- Variables de estado: `camelCase` en español (e.g., `cargando`, `error`, `busqueda`, `filtroEstado`)
- Funciones handler: `camelCase` (e.g., `handleSubmit`, `cargarDatos`, `limpiarFiltros`)

### 5.3 Estilo CSS

- **NO usar frameworks CSS.** Solo Vanilla CSS.
- **SIEMPRE** usar las variables CSS definidas en `index.css` (sección `:root`)
- Cada vista tiene su propio archivo `.css` importado al inicio del `.jsx`
- Los estilos globales y tokens están en `frontend/src/index.css`
- Clases de formulario reutilizables ya definidas: `.form-group`, `.form-label`, `.form-input`, `.form-select`, `.form-textarea`, `.form-error-text`
- Clases de botón ya definidas: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-block`, `.btn-sm`
- Clases de alerta ya definidas: `.alert`, `.alert-error`, `.alert-success`
- **Espaciado:** usar `var(--space-1)` a `var(--space-16)` (escala de 4px)
- **Bordes:** `var(--radius-sm)`, `var(--radius-md)`, `var(--radius-lg)`
- **Sombras:** `var(--shadow-sm)`, `var(--shadow-md)`, `var(--shadow-lg)`
- **Transiciones:** `var(--transition-fast)` (150ms), `var(--transition-base)` (250ms)
- **Tipografía:** `var(--font-size-xs)` a `var(--font-size-2xl)`, `var(--font-weight-light)` a `var(--font-weight-bold)`
- **NO usar emojis** en la interfaz de usuario. Solo texto plano.
- La estética debe ser moderna, profesional y premium (glassmorphism sutil, transiciones suaves, hover effects)

---

## 6. Base de Datos

### Tablas actuales (PostgreSQL en Neon)

| Tabla | Descripción |
|---|---|
| `usuarios` | Usuarios del sistema (técnicos, admin) |
| `servicios` | Órdenes de servicio con datos de cliente y hardware |
| `productos` | Repuestos disponibles |
| `productos_servicios` | Relación N:M — repuestos usados en cada servicio |
| `historial_servicios` | Registro de cambios de estado y notas internas |

### Columnas clave de `servicios` (tabla principal)
La tabla fue expandida con columnas de cliente y hardware. Las columnas principales son:
- `id_servicio`, `id_usuario` (FK a usuarios), `fecha_ingreso`, `estado`
- **Cliente:** `nombre_cliente`, `telefono_cliente`, `email_cliente`, `direccion_cliente`
- **Hardware:** `tipo_equipo`, `marca`, `modelo`, `numero_serie`, `accesorios`, `condicion_fisica`, `problema_reportado`
- **Servicio:** `diagnostico`, `solucion`, `costo_total`, `fecha_actualizacion`

### Estados válidos de un servicio
Solo hay **4 estados** (en este orden de flujo):
1. `Recibido`
2. `Diagnóstico`
3. `Reparando`
4. `Listo`

> **NO agregar** estados adicionales como "Entregado", "Cancelado", etc., a menos que el equipo lo apruebe explícitamente.

### Conexión a la BD
- Se usa `pg.Pool` con `DATABASE_URL` desde `.env`
- Archivo: `backend/src/config/db.js`
- Siempre importar como: `const pool = require('../config/db');`
- Todas las queries usan `pool.query(sql, [params])`

---

## 7. Autenticación y Seguridad

- **JWT** con expiración de 24 horas
- El token se envía en el header `Authorization: Bearer <token>`
- En el frontend, el token se guarda en `localStorage` y se gestiona con `AuthContext`
- El middleware `verificarToken` en `backend/src/middlewares/auth.js` decodifica el token e inyecta `req.usuario = { id_usuario, email, tipo_usuario }`
- Existe un middleware `esAdmin` para rutas que requieran rol ADMIN
- Las contraseñas se hashean con `bcryptjs` (salt rounds: 10)
- **NUNCA** commitear archivos `.env`, claves secretas, connection strings o tokens

---

## 8. API REST — Endpoints existentes

### Auth (`/api/auth`)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |
| GET | `/api/auth/tecnicos` | Lista de nombres de técnicos |

### Servicios (`/api/servicios`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/servicios` | Listar todos los servicios |
| GET | `/api/servicios/:id` | Obtener servicio con historial y productos |
| POST | `/api/servicios` | Crear orden de servicio |
| PUT | `/api/servicios/:id` | Actualizar servicio (estado, diagnóstico, costo, etc.) |
| POST | `/api/servicios/:id/notas` | Agregar nota al historial |

### Productos (`/api/productos`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/productos` | Listar productos |
| POST | `/api/productos` | Crear producto |

### Informes (`/api/informes`)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/informes/tabular` | Informe tabular con filtros, paginación y export |

> Al crear nuevos endpoints, seguir esta convención exacta de prefijos `/api/recurso`.

---

## 9. Cronograma de Actividades

El proyecto sigue un cronograma de 30 fases. El estado actual es:

### Fases completadas (1–21 + 22.1 + 23)
- Fases 1–13: Análisis, diseño, diagramas, prototipos
- Fase 14: Configuración del entorno (repo Git, Vite, Express, Neon)
- Fase 15: Creación de tablas en PostgreSQL
- Fase 16: Backend de autenticación (JWT, bcrypt)
- Fase 17: Frontend de Login
- Fase 18: Backend CRUD de servicios
- Fase 19: Frontend Registrar Pedido
- Fase 20: Backend de actualización de servicios, estados, repuestos
- Fase 21: Frontend Editar/Ver Pedido (DetallePedido)
- Fase 22.1: Backend endpoints para informe tabular (filtrado, paginación en BD)
- Fase 23: Frontend vista Informe Tabular

### Fases pendientes (seguir este orden)
| Fase | Descripción |
|---|---|
| **22.2** | Desarrollo Backend: endpoints de consulta y datos agregados para informe estadístico consolidado en Express.js |
| **24** | Desarrollo Frontend: vista Informe Estadístico Consolidado con gráficas y resúmenes visuales en React (pueden usar Chart.js u otra librería de gráficas ligera) |
| **25** | Pruebas de integración entre Frontend y Backend: validación de todos los flujos funcionales del sistema |
| **26** | Configurar contenedores Docker para el Frontend React, Backend Express.js y PostgreSQL con Docker Compose |
| **27** | Desplegar la aplicación web en el servidor de producción y configurar dominio, SSL y pruebas de humo |
| **28** | Elaborar el manual técnico: arquitectura, API REST, modelo de datos y guía de despliegue |
| **29** | Elaborar el manual de usuario final: guía paso a paso de cada vista del sistema FixFlow |
| **30** | Documentar las pruebas realizadas y entregar el Informe Final del proyecto |

> **IMPORTANTE:** Siempre desarrollar en el orden del cronograma. Si se solicita algo fuera de orden, indicar en qué fase estamos y qué fases faltan antes.

---

## 10. Reglas de Git

- **Branch principal:** `main`
- **Commits:** mensajes cortos y descriptivos en español (máximo 72 caracteres)
  - Ejemplos: `feat: Vista Informe Estadístico con gráficas`, `fix: Corregir filtro de técnico en informe tabular`
- **NUNCA commitear:** `.env`, `node_modules/`, archivos temporales, contraseñas, claves de API
- Hacer `git add -A && git commit -m "mensaje" && git push` después de cada feature o fix completado
- El `.gitignore` ya está configurado correctamente — no modificarlo innecesariamente

---

## 11. Variables de Entorno

El backend requiere un archivo `.env` en `backend/` con:
```
DATABASE_URL=postgresql://usuario:password@host/dbname?sslmode=require
JWT_SECRET=clave_secreta_jwt
PORT=5000
```

> **NUNCA** hardcodear estos valores en el código. Siempre leerlos con `process.env.VARIABLE`.

---

## 12. Cómo levantar el proyecto

### Backend
```bash
cd fixflow/backend
npm install
# Crear .env con DATABASE_URL y JWT_SECRET
npm run dev
# Servidor en http://localhost:5000
```

### Frontend
```bash
cd fixflow/frontend
npm install
npm run dev
# App en http://localhost:5173 o :5174
```

---

## 13. Usuarios de prueba (ya en la BD)

| Nombre | Email | Contraseña | Rol |
|---|---|---|---|
| Administrador | admin@fixflow.com | admin123 | ADMIN |
| Nicolas Garcia | nicolas@fixflow.com | nicolas123 | ADMIN |
| Johan Martinez | johan@fixflow.com | johan123 | CLIENTE |
| Alejandro Lopez | alejandro@fixflow.com | alejandro123 | CLIENTE |

---

## 14. Checklist para crear una nueva funcionalidad

Al implementar una nueva vista o endpoint, seguir esta lista:

### Backend
- [ ] Crear controlador en `backend/src/controllers/nombreController.js`
- [ ] Crear archivo de rutas en `backend/src/routes/nombre.js`
- [ ] Importar `{ verificarToken }` desde `../middlewares/auth` (no `authMiddleware`)
- [ ] Registrar las rutas en `backend/src/index.js` con `app.use('/api/nombre', nombreRoutes)`
- [ ] Usar `pool.query()` con parámetros `$1, $2` (nunca concatenar SQL)
- [ ] Envolver todo en `try/catch` con `console.error` y respuesta 500

### Frontend
- [ ] Crear `NombreVista.jsx` + `NombreVista.css` en `frontend/src/pages/`
- [ ] Crear funciones de fetch en `frontend/src/services/nombreService.js`
- [ ] Importar y registrar la ruta en `App.jsx` con `<ProtectedRoute>`
- [ ] Añadir enlace de navegación en `Navbar.jsx` (desktop + panel móvil)
- [ ] Usar `useAuth()` para obtener el token y datos del usuario
- [ ] Usar las clases CSS globales de `index.css` y las variables de diseño
- [ ] **NO usar emojis** en el texto visible de la interfaz

### Verificación
- [ ] Probar que el backend responde correctamente (Postman o curl)
- [ ] Probar que el frontend renderiza sin errores en consola
- [ ] Verificar que los nombres de import coinciden exactamente con los archivos existentes
- [ ] Hacer commit y push al repositorio

---

## 15. Errores conocidos y soluciones aplicadas

| Error | Causa | Solución |
|---|---|---|
| `MODULE_NOT_FOUND: authMiddleware` | Import incorrecto del middleware | El archivo se llama `auth.js`, no `authMiddleware.js`. Importar desde `../middlewares/auth` |
| Pantalla en blanco en vista | Variable JS indefinida en el render | Verificar que todas las variables usadas en JSX estén declaradas con `useState` |
| `Failed to fetch` en login | Backend crasheado por error de import | Revisar logs del backend antes de diagnosticar el frontend |
| Error al actualizar estado del servicio | La query SQL no incluía todos los campos | Asegurarse de que el UPDATE incluya todos los campos que puede enviar el frontend |
| Búsqueda no encuentra por técnico | La query ILIKE no incluía `u.nombre` | Añadir `u.nombre ILIKE $param` en la cláusula WHERE del buscador |

---

## 16. Notas adicionales

- El proyecto es académico (asignatura Ingeniería de Software II)
- La interfaz debe verse profesional y moderna — NO debe parecer hecha por IA (nada de emojis decorativos)
- Cada vista tiene un layout `max-width` centrado con padding coherente
- Las tablas usan encabezados oscuros (`var(--color-secondary)`) con texto blanco
- Los tags de estado usan colores diferenciados con pill/badge styling
- La Navbar usa un estilo tipo "pill container" centrado con efecto glassmorphism
- Todo el texto de la interfaz está en **español**
