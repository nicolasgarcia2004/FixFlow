// Rutas de autenticación
const express = require('express');
const router = express.Router();
const { registrar, login } = require('../controllers/authController');

// POST /api/auth/register — Crear cuenta nueva
router.post('/register', registrar);

// POST /api/auth/login — Iniciar sesión
router.post('/login', login);

module.exports = router;
