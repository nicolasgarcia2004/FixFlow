// Rutas de servicios (órdenes de servicio)
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth');
const { obtenerServicios, crearServicio } = require('../controllers/servicioController');

// Todas las rutas de servicios requieren autenticación
router.use(verificarToken);

// GET /api/servicios — Listar servicios
router.get('/', obtenerServicios);

// POST /api/servicios — Crear un servicio nuevo
router.post('/', crearServicio);

module.exports = router;
