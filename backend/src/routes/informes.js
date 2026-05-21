const express = require('express');
const router = express.Router();
const { obtenerInformeTabular } = require('../controllers/informeController');
const { verificarToken } = require('../middlewares/auth');

// RUTAS DE INFORMES
router.get('/tabular', verificarToken, obtenerInformeTabular);

module.exports = router;
