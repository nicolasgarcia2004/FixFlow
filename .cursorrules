# Reglas de Agente y Contexto del Proyecto (FixFlow)

Este archivo contiene el contexto, las reglas de arquitectura, diseño y convenciones de código para el proyecto **FixFlow**. Cualquier agente de IA (Antigravity, Cursor, GitHub Copilot, Claude, etc.) debe leer y apegarse **estrictamente** a estas reglas antes de escribir o modificar código para mantener la coherencia del proyecto.

## 1. Stack Tecnológico
*   **Backend:** Node.js, Express.js.
*   **Base de Datos:** PostgreSQL (alojado en Neon Tech), usando el paquete `pg` (PostgreSQL client para Node).
*   **Autenticación:** JWT (`jsonwebtoken`) y encriptación de contraseñas con `bcryptjs`.
*   **Frontend:** React (Vite), React Router DOM.
*   **Estilos:** **Vanilla CSS puro**. ¡ESTÁ ESTRICTAMENTE PROHIBIDO USAR TAILWIND CSS O LIBRERÍAS DE COMPONENTES! Todo el diseño se rige por un sistema de variables CSS personalizado (`index.css`).

## 2. Estructura de Carpetas Obligatoria
El proyecto es un monorepo con dos subcarpetas principales: `backend/` y `frontend/`. No mezcles dependencias.

### Backend (`/backend`)
*   `src/config/db.js`: Archivo de conexión al pool de PostgreSQL.
*   `src/controllers/`: Controladores con la lógica de negocio (ej. `authController.js`, `informeController.js`).
*   `src/middlewares/`: Middlewares de Express (ej. `auth.js` con `verificarToken` y `esAdmin`).
*   `src/routes/`: Definición de rutas Express que mapean endpoints a controladores.

### Frontend (`/frontend`)
*   `src/pages/`: Vistas completas de la aplicación (ej. `Login.jsx`, `InformeTabular.jsx`). Cada página tiene su propio archivo CSS asociado (ej. `Login.css`).
*   `src/components/`: Componentes UI reutilizables (botones, modales, etc.).
*   `src/services/`: Capa de peticiones a la API. Todo fetch debe encapsularse aquí (ej. `servicioService.js`).
*   `src/context/`: Contextos de React (ej. `AuthContext.jsx` para el manejo de sesión global).
*   `src/index.css`: **Sistema de diseño global**. Contiene las variables de color, tipografía y espaciado.

## 3. Guía de Estilos y UI (Frontend)
*   **Diseño Premium y Moderno:** La aplicación tiene una estética sobria, profesional y moderna. Utiliza bordes redondeados (`border-radius`), sombras suaves (`box-shadow`), efectos "Glassmorphism" sutiles y transiciones de hover fluidas.
*   **Cero Emojis:** No uses emojis en la interfaz gráfica a menos que se solicite explícitamente. Usa íconos de la librería `react-icons` si es necesario.
*   **Colores Guía (Variables en `index.css`):**
    *   Primario: `#b84246` (Rojizo oscuro)
    *   Secundario: `#1f2e1f` (Verde/Gris muy oscuro)
    *   Acento (Accent): `#4f6963` (Verde azulado desaturado)
*   Usa siempre las variables CSS definidas como `var(--space-4)`, `var(--color-primary)`, `var(--radius-lg)` en los archivos CSS en lugar de valores estáticos.

## 4. Convenciones de Backend y Base de Datos
*   **Seguridad SQL:** Nunca concatene strings para hacer consultas SQL. Utiliza SIEMPRE consultas parametrizadas con `$1, $2, $3` y `pool.query(query, [params])` para evitar inyecciones SQL.
*   **Respuestas API:** Los controladores siempre deben envolver el código en bloques `try...catch`. En caso de error, siempre retornar un JSON con la estructura `{ "error": "Mensaje de error" }` y estado 400, 401 o 500 según aplique.
*   **Protección de Rutas:** Toda ruta privada debe inyectar el middleware `verificarToken` de `../middlewares/auth.js`.
*   **Paginación y Filtros:** Si se hacen informes o consultas grandes (como InformeTabular), los filtros (ILIKE, fechas, estado) y la paginación (LIMIT, OFFSET) se deben aplicar del lado del backend (PostgreSQL), nunca descargar toda la tabla en el frontend.

## 5. Reglas de Negocio Centrales
1.  **Tipos de Usuario:** `ADMIN` (Administradores/Técnicos) y `CLIENTE` (solo pueden ver sus propios pedidos).
2.  **Estados de un Servicio:** Los servicios técnico pasan por un flujo estricto: `Recibido` -> `Diagnóstico` -> `Reparando` -> `Listo`.
3.  **Auditoría (Historial):** Cualquier cambio de estado o diagnóstico en la tabla `servicios` debe registrar automáticamente una nota en la tabla `historial_servicios`.
4.  **Hardware de Clientes:** En el registro de servicios técnico se deben capturar los datos minuciosos: `tipo_equipo` (Celular, Computadora, Consola, etc.), `marca`, `modelo`, `numero_serie` y detallar los `accesorios` y la `condicion_fisica` al ser recibido.

## Instrucciones para Agentes de IA
Al recibir un requerimiento del desarrollador:
1. Analiza el código existente (`index.css` para estilos, el formato de `services/` y `controllers/`).
2. Implementa cualquier archivo nuevo siguiendo la estructura obligatoria descrita en el paso 2.
3. No modifiques ni reescribas la arquitectura de autenticación (JWT actual), cíñete a los tokens y el AuthContext.
4. Redacta el código limpio, comentado y listo para integración directa.
