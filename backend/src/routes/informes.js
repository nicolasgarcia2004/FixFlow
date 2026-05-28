const express = require('express');
const router = express.Router();
const { obtenerInformeTabular, obtenerInformeEstadistico } = require('../controllers/informeController');
const { verificarToken } = require('../middlewares/auth');

// RUTAS DE INFORMES
router.get('/tabular', verificarToken, obtenerInformeTabular);
router.get('/estadistico', verificarToken, obtenerInformeEstadistico);

module.exports = router;
