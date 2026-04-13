// Rutas de productos (repuestos)
const express = require('express');
const router = express.Router();
const { verificarToken, esAdmin } = require('../middlewares/auth');
const { obtenerProductos, crearProducto } = require('../controllers/productoController');

// Todas las rutas de productos requieren autenticación
router.use(verificarToken);

// GET /api/productos — Listar productos
router.get('/', obtenerProductos);

// POST /api/productos — Crear producto (solo admin)
router.post('/', esAdmin, crearProducto);

module.exports = router;
