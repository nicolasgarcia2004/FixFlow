// Controlador de autenticación: login y registro
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Genera un token JWT con los datos del usuario
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// POST /api/auth/register — Registrar un usuario nuevo
const registrar = async (req, res) => {
  try {
    const { nombre, email, contrasena, tipo_usuario, telefono } = req.body;

    // Validar campos obligatorios
    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }

    // Verificar si el email ya existe
    const existe = await pool.query('SELECT id_usuario FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hashear la contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(contrasena, salt);

    // Insertar el nuevo usuario
    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, email, contrasena, tipo_usuario, telefono)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_usuario, nombre, email, tipo_usuario, telefono`,
      [nombre, email, contrasenaHash, tipo_usuario || 'CLIENTE', telefono || null]
    );

    const usuario = resultado.rows[0];
    const token = generarToken(usuario);

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario
    });

  } catch (err) {
    console.error('Error al registrar:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/auth/login — Iniciar sesión
const login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    // Validar que vengan los campos
    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // Buscar el usuario por email
    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = resultado.rows[0];

    // Comparar la contraseña con el hash guardado
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = generarToken(usuario);

    // No enviar la contraseña en la respuesta
    delete usuario.contrasena;

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario
    });

  } catch (err) {
    console.error('Error al iniciar sesión:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { registrar, login };
