// Controlador de informes tabulares y estadísticos
const pool = require('../config/db');

// GET /api/informes/tabular — Informe tabular con filtros y paginación desde DB
const obtenerInformeTabular = async (req, res) => {
  try {
    const { 
      busqueda, 
      estado, 
      tecnico, 
      fechaDesde, 
      fechaHasta, 
      ordenCol = 'id_servicio', 
      ordenDir = 'desc',
      pagina = 1,
      limite = 10,
      exportar = 'false'
    } = req.query;

    let query = `
      SELECT s.id_servicio, s.fecha_ingreso, s.nombre_cliente, s.tipo_equipo, 
             s.marca, s.modelo, s.estado, s.problema_reportado, s.costo_total, 
             s.numero_serie, u.nombre AS nombre_tecnico
      FROM servicios s
      JOIN usuarios u ON s.id_usuario = u.id_usuario
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filtro de búsqueda general
    if (busqueda) {
      query += ` AND (
        s.nombre_cliente ILIKE $${paramCount} OR 
        s.tipo_equipo ILIKE $${paramCount} OR 
        s.marca ILIKE $${paramCount} OR 
        s.modelo ILIKE $${paramCount} OR 
        s.problema_reportado ILIKE $${paramCount} OR 
        s.numero_serie ILIKE $${paramCount} OR 
        u.nombre ILIKE $${paramCount} OR 
        CAST(s.id_servicio AS TEXT) ILIKE $${paramCount}
      )`;
      params.push(`%${busqueda}%`);
      paramCount++;
    }

    // Filtro por estado
    if (estado && estado !== 'Todos') {
      query += ` AND s.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    // Filtro por técnico
    if (tecnico && tecnico !== 'Todos') {
      query += ` AND u.nombre = $${paramCount}`;
      params.push(tecnico);
      paramCount++;
    }

    // Filtro por fechas
    if (fechaDesde) {
      query += ` AND s.fecha_ingreso >= $${paramCount}`;
      params.push(fechaDesde);
      paramCount++;
    }

    if (fechaHasta) {
      query += ` AND s.fecha_ingreso <= $${paramCount}`;
      params.push(fechaHasta + ' 23:59:59');
      paramCount++;
    }

    // Columnas seguras para ordenar para evitar inyección SQL
    const columnasPermitidas = ['id_servicio', 'fecha_ingreso', 'nombre_cliente', 'tipo_equipo', 'estado', 'costo_total', 'nombre_tecnico'];
    const colOrden = columnasPermitidas.includes(ordenCol) ? (ordenCol === 'nombre_tecnico' ? 'u.nombre' : `s.${ordenCol}`) : 's.id_servicio';
    const dirOrden = ordenDir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${colOrden} ${dirOrden}`;

    // Si es exportación CSV, retornamos todo sin paginación
    if (exportar === 'true') {
      const resultado = await pool.query(query, params);
      return res.json({ datos: resultado.rows, total: resultado.rows.length });
    }

    // Contar total de registros para paginación
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS total_query`;
    const totalResult = await pool.query(countQuery, params);
    const total = parseInt(totalResult.rows[0].count, 10);

    // Aplicar paginación
    const offset = (pagina - 1) * limite;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);

    const resultado = await pool.query(query, params);

    res.json({
      datos: resultado.rows,
      total,
      pagina: parseInt(pagina, 10),
      totalPaginas: Math.ceil(total / limite)
    });

  } catch (err) {
    console.error('Error al obtener informe tabular:', err.message);
    res.status(500).json({ error: 'Error al generar el informe tabular' });
  }
};

module.exports = { obtenerInformeTabular };
