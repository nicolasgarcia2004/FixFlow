// Controlador de productos (repuestos)
const pool = require('../config/db');

// GET /api/productos — Listar todos los productos
const obtenerProductos = async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM productos ORDER BY nombre ASC'
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error('Error al obtener productos:', err.message);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// POST /api/productos — Crear un producto nuevo (solo admin)
const crearProducto = async (req, res) => {
  try {
    const { nombre, precio } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    if (!precio || precio <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }

    const resultado = await pool.query(
      'INSERT INTO productos (nombre, precio) VALUES ($1, $2) RETURNING *',
      [nombre.trim(), precio]
    );

    res.status(201).json({
      mensaje: 'Producto creado',
      producto: resultado.rows[0]
    });
  } catch (err) {
    console.error('Error al crear producto:', err.message);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

module.exports = { obtenerProductos, crearProducto };
