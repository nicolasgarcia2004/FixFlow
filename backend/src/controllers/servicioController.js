// Controlador de servicios (órdenes de servicio)
const pool = require('../config/db');

// GET /api/servicios — Listar todos los servicios
const obtenerServicios = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT s.*, u.nombre AS nombre_tecnico
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
    const {
      // Datos del cliente
      nombre_cliente, telefono_cliente, email_cliente, direccion_cliente,
      // Detalles del hardware
      tipo_equipo, marca, modelo, numero_serie, accesorios, condicion_fisica,
      // Diagnóstico
      problema_reportado, diagnostico, solucion,
      // Productos/repuestos
      productos
    } = req.body;

    const id_usuario = req.usuario.id_usuario;

    // Validaciones básicas
    if (!nombre_cliente || !nombre_cliente.trim()) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
    }
    if (!tipo_equipo) {
      return res.status(400).json({ error: 'El tipo de equipo es obligatorio' });
    }
    if (!problema_reportado || !problema_reportado.trim()) {
      return res.status(400).json({ error: 'El problema reportado es obligatorio' });
    }

    // Calcular costo total con los productos
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

    // Insertar el servicio con todos los campos
    const resultado = await pool.query(
      `INSERT INTO servicios (
        id_usuario, nombre_cliente, telefono_cliente, email_cliente, direccion_cliente,
        tipo_equipo, marca, modelo, numero_serie, accesorios, condicion_fisica,
        problema_reportado, diagnostico, solucion, costo_total
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        id_usuario, nombre_cliente, telefono_cliente || null, email_cliente || null,
        direccion_cliente || null, tipo_equipo, marca || null, modelo || null,
        numero_serie || null, accesorios || null, condicion_fisica || null,
        problema_reportado, diagnostico || null, solucion || null, costoTotal
      ]
    );

    const servicio = resultado.rows[0];

    // Insertar los productos asociados
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
