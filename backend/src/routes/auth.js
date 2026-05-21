// Rutas de autenticación
const express = require('express');
const router = express.Router();
const { registrar, login, obtenerUsuarioActual, obtenerTecnicos } = require('../controllers/authController');

// POST /api/auth/register — Crear cuenta nueva
router.post('/register', registrar);

// POST /api/auth/login — Iniciar sesión
router.post('/login', login);

// GET /api/auth/tecnicos — Listar todos los técnicos
router.get('/tecnicos', obtenerTecnicos);

module.exports = router;
