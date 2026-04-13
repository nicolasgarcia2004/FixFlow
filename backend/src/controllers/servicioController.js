// Controlador de servicios (órdenes de servicio)
const pool = require('../config/db');

// GET /api/servicios — Listar todos los servicios
const obtenerServicios = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT s.*, u.nombre AS nombre_usuario, u.email AS email_usuario
      FROM servicios s
      JOIN usuarios u ON s.id_usuario = u.id_usuario
      ORDER BY s.fecha_ingreso DESC
    `);

    res.json(resultado.rows);
  } catch (err) {
    console.error('Error al obtener servicios:', err.message);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
};

// POST /api/servicios — Crear una nueva orden de servicio
const crearServicio = async (req, res) => {
  try {
    const { diagnostico, solucion, productos } = req.body;
    const id_usuario = req.usuario.id_usuario;

    if (!diagnostico || !diagnostico.trim()) {
      return res.status(400).json({ error: 'El diagnóstico es obligatorio' });
    }

    // Calcular el costo total sumando los productos
    let costoTotal = 0;
    if (productos && productos.length > 0) {
      for (const p of productos) {
        const prod = await pool.query(
          'SELECT precio FROM productos WHERE id_producto = $1', [p.id_producto]
        );
        if (prod.rows.length > 0) {
          costoTotal += prod.rows[0].precio * (p.cantidad || 1);
        }
      }
    }

    // Insertar el servicio
    const resultado = await pool.query(
      `INSERT INTO servicios (id_usuario, diagnostico, solucion, costo_total)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id_usuario, diagnostico, solucion || '', costoTotal]
    );

    const servicio = resultado.rows[0];

    // Insertar los productos asociados al servicio
    if (productos && productos.length > 0) {
      for (const p of productos) {
        await pool.query(
          `INSERT INTO productos_servicios (id_producto, id_servicio, cantidad)
           VALUES ($1, $2, $3)`,
          [p.id_producto, servicio.id_servicio, p.cantidad || 1]
        );
      }
    }

    res.status(201).json({
      mensaje: 'Orden de servicio creada',
      servicio
    });

  } catch (err) {
    console.error('Error al crear servicio:', err.message);
    res.status(500).json({ error: 'Error al crear el servicio' });
  }
};

module.exports = { obtenerServicios, crearServicio };
