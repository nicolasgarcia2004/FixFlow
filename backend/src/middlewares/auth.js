// Middleware de autenticación JWT
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifica que el request tenga un token JWT válido
const verificarToken = (req, res, next) => {
  const header = req.headers['authorization'];

  if (!header) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // El header viene como "Bearer <token>"
  const token = header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    // Decodificar y verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // Guardar datos del usuario en el request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Verifica que el usuario sea administrador
const esAdmin = (req, res, next) => {
  if (req.usuario.tipo_usuario !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol ADMIN' });
  }
  next();
};

module.exports = { verificarToken, esAdmin };
