// Rutas de servicios (órdenes de servicio)
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth');
const { 
  obtenerServicios, 
  crearServicio,
  obtenerServicioPorId,
  actualizarServicio,
  agregarNotaHistorial
} = require('../controllers/servicioController');

// Todas las rutas de servicios requieren autenticación
router.use(verificarToken);

// GET /api/servicios — Listar servicios
router.get('/', obtenerServicios);

// GET /api/servicios/:id — Obtener un servicio (con historial)
router.get('/:id', obtenerServicioPorId);

// POST /api/servicios — Crear un servicio nuevo
router.post('/', crearServicio);

// PUT /api/servicios/:id — Actualizar servicio
router.put('/:id', actualizarServicio);

// POST /api/servicios/:id/notas — Agregar nota
router.post('/:id/notas', agregarNotaHistorial);

module.exports = router;
