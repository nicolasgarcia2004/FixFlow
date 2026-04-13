// Punto de entrada del servidor FixFlow
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares globales ---
app.use(cors());                // Permitir peticiones del frontend
app.use(express.json());        // Parsear body como JSON

// --- Rutas ---
app.use('/api/auth', authRoutes);

// Ruta de prueba para verificar que el servidor funciona
app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok', mensaje: 'Servidor FixFlow funcionando' });
});

// --- Manejo global de errores ---
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// --- Iniciar servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor FixFlow corriendo en http://localhost:${PORT}`);
});
