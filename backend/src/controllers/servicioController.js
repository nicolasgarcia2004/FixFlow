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

    // Registrar en el historial la creación
    await pool.query(
      `INSERT INTO historial_servicios (id_servicio, id_usuario, accion, descripcion)
       VALUES ($1, $2, $3, $4)`,
      [servicio.id_servicio, id_usuario, 'Orden Creada', 'El equipo fue recibido e ingresado al sistema.']
    );

    res.status(201).json({
      mensaje: 'Orden de servicio creada',
      servicio
    });

  } catch (err) {
    console.error('Error al crear servicio:', err.message);
    res.status(500).json({ error: 'Error al crear el servicio' });
  }
};

// GET /api/servicios/:id — Obtener un servicio detallado (con historial y productos)
const obtenerServicioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener servicio base
    const servicioRes = await pool.query(`
      SELECT s.*, u.nombre AS nombre_tecnico
      FROM servicios s
      JOIN usuarios u ON s.id_usuario = u.id_usuario
      WHERE s.id_servicio = $1
    `, [id]);
    
    if (servicioRes.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de servicio no encontrada' });
    }
    
    const servicio = servicioRes.rows[0];
    
    // Obtener historial
    const historialRes = await pool.query(`
      SELECT h.*, u.nombre AS tecnico_nombre 
      FROM historial_servicios h
      LEFT JOIN usuarios u ON h.id_usuario = u.id_usuario 
      WHERE h.id_servicio = $1 
      ORDER BY h.fecha_registro DESC
    `, [id]);
    
    // Obtener productos
    const productosRes = await pool.query(`
      SELECT p.*, ps.cantidad 
      FROM productos_servicios ps
      JOIN productos p ON ps.id_producto = p.id_producto
      WHERE ps.id_servicio = $1
    `, [id]);
    
    servicio.historial = historialRes.rows;
    servicio.productos = productosRes.rows;
    
    res.json(servicio);
  } catch (err) {
    console.error('Error al obtener servicio:', err.message);
    res.status(500).json({ error: 'Error al obtener el servicio' });
  }
};

// PUT /api/servicios/:id — Actualizar servicio (estado, datos o repuestos)
const actualizarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estado, diagnostico, solucion, problema_reportado, productos
    } = req.body;
    const id_usuario = req.usuario.id_usuario;

    // Obtener servicio actual para verificar si hubo cambio de estado
    const actualRes = await pool.query('SELECT estado FROM servicios WHERE id_servicio = $1', [id]);
    if (actualRes.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    const estadoAnterior = actualRes.rows[0].estado;

    // Calcular nuevo costo total
    let costoTotal = 0;
    if (productos && productos.length > 0) {
      for (const p of productos) {
        const prod = await pool.query('SELECT precio FROM productos WHERE id_producto = $1', [p.id_producto]);
        if (prod.rows.length > 0) {
          costoTotal += prod.rows[0].precio * (p.cantidad || 1);
        }
      }
    }

    // Actualizar servicio
    await pool.query(`
      UPDATE servicios 
      SET estado = COALESCE($1::VARCHAR, estado), 
          diagnostico = COALESCE($2::TEXT, diagnostico), 
          solucion = COALESCE($3::TEXT, solucion),
          problema_reportado = COALESCE($4::TEXT, problema_reportado),
          costo_total = COALESCE($5::NUMERIC, costo_total),
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_servicio = $6
    `, [
      estado === undefined ? null : estado, 
      diagnostico === undefined ? null : diagnostico, 
      solucion === undefined ? null : solucion, 
      problema_reportado === undefined ? null : problema_reportado, 
      costoTotal, 
      id
    ]);

    // Reemplazar productos (borrar anteriores e insertar nuevos)
    if (productos !== undefined) {
      await pool.query('DELETE FROM productos_servicios WHERE id_servicio = $1', [id]);
      for (const p of productos) {
        await pool.query(
          'INSERT INTO productos_servicios (id_producto, id_servicio, cantidad) VALUES ($1, $2, $3)',
          [p.id_producto, id, p.cantidad || 1]
        );
      }
    }

    // Registrar cambio de estado si corresponde
    if (estado && estado !== estadoAnterior) {
      await pool.query(
        'INSERT INTO historial_servicios (id_servicio, id_usuario, accion, descripcion) VALUES ($1, $2, $3, $4)',
        [id, id_usuario, 'Cambio de Estado', `El estado de la orden cambió de ${estadoAnterior} a ${estado}`]
      );
    }

    res.json({ mensaje: 'Orden actualizada exitosamente' });
  } catch (err) {
    console.error('Error al actualizar servicio:', err.message);
    res.status(500).json({ error: 'Error al actualizar el servicio' });
  }
};

// POST /api/servicios/:id/notas — Agregar una nota custom al historial
const agregarNotaHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const { nota } = req.body;
    const id_usuario = req.usuario.id_usuario;

    if (!nota || !nota.trim()) {
      return res.status(400).json({ error: 'La nota no puede estar vacía' });
    }

    await pool.query(
      'INSERT INTO historial_servicios (id_servicio, id_usuario, accion, descripcion) VALUES ($1, $2, $3, $4)',
      [id, id_usuario, 'Nota Interna Agregada', nota]
    );

    res.status(201).json({ mensaje: 'Nota agregada al historial' });
  } catch (err) {
    console.error('Error al agregar nota:', err.message);
    res.status(500).json({ error: 'Error al agregar nota' });
  }
};

module.exports = { obtenerServicios, crearServicio, obtenerServicioPorId, actualizarServicio, agregarNotaHistorial };
