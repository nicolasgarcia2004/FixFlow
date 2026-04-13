# FixFlow 🔧

Sistema de gestión para el control del ciclo de vida de reparaciones de computadores.

## Tecnologías

- **Frontend:** React + Vite
- **Backend:** Express.js + Node.js
- **Base de datos:** PostgreSQL (Neon)
- **Autenticación:** JWT (JSON Web Tokens)

## Estructura del Proyecto

```
fixflow/
├── backend/         # API REST con Express.js
├── frontend/        # Aplicación React con Vite
├── database/        # Scripts SQL
└── docs/            # Diagramas y documentación
```

## Instalación

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Variables de Entorno

Crear archivo `.env` en la carpeta `backend/`:

```
DATABASE_URL=tu_cadena_de_conexion_postgresql
JWT_SECRET=tu_secreto_jwt
PORT=5000
```

## Autores

- Proyecto académico — Ingeniería de Software 2
