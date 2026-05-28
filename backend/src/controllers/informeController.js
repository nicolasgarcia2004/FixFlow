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

// GET /api/informes/estadistico — Informe estadístico para dashboard
const obtenerInformeEstadistico = async (req, res) => {
  try {
    const { filtroFecha } = req.query;
    
    let dateCondition = '';
    
    if (filtroFecha === 'hoy') {
      dateCondition = 'WHERE fecha_ingreso = CURRENT_DATE';
    } else if (filtroFecha === '7dias') {
      dateCondition = 'WHERE fecha_ingreso >= CURRENT_DATE - INTERVAL \'7 days\'';
    } else if (filtroFecha === '30dias') {
      dateCondition = 'WHERE fecha_ingreso >= CURRENT_DATE - INTERVAL \'30 days\'';
    } else if (filtroFecha === 'esteAño') {
      dateCondition = 'WHERE EXTRACT(YEAR FROM fecha_ingreso) = EXTRACT(YEAR FROM CURRENT_DATE)';
    }

    const whereClause = dateCondition ? dateCondition : '';
    const whereClauseAnd = dateCondition ? dateCondition + ' AND' : 'WHERE';

    // 1. Resumen general
    const queryResumen = `
      SELECT 
        CAST(COUNT(id_servicio) AS INTEGER) AS total_servicios,
        CAST(COALESCE(SUM(costo_total), 0) AS NUMERIC) AS ingresos_totales,
        CAST(COUNT(CASE WHEN estado = 'Listo' THEN 1 END) AS INTEGER) AS servicios_completados
      FROM servicios
      ${whereClause}
    `;
    const resResumen = await pool.query(queryResumen);

    // 2. Servicios por estado
    const queryEstado = `
      SELECT estado, CAST(COUNT(id_servicio) AS INTEGER) AS cantidad
      FROM servicios
      ${whereClause}
      GROUP BY estado
    `;
    const resEstado = await pool.query(queryEstado);

    // 3. Servicios por tipo de equipo
    const queryEquipo = `
      SELECT tipo_equipo, CAST(COUNT(id_servicio) AS INTEGER) AS cantidad
      FROM servicios
      ${whereClauseAnd} tipo_equipo IS NOT NULL AND tipo_equipo != ''
      GROUP BY tipo_equipo
      ORDER BY cantidad DESC
      LIMIT 5
    `;
    const resEquipo = await pool.query(queryEquipo);

    // 4. Ingresos por mes (últimos 6 meses)
    const queryMeses = `
      SELECT TO_CHAR(fecha_ingreso, 'YYYY-MM') AS mes, CAST(COALESCE(SUM(costo_total), 0) AS NUMERIC) AS total
      FROM servicios
      ${whereClause}
      GROUP BY TO_CHAR(fecha_ingreso, 'YYYY-MM')
      ORDER BY mes DESC
      LIMIT 6
    `;
    const resMeses = await pool.query(queryMeses);

    res.json({
      resumen: resResumen.rows[0],
      serviciosPorEstado: resEstado.rows,
      serviciosPorTipoEquipo: resEquipo.rows,
      ingresosPorMes: resMeses.rows.reverse()
    });
  } catch (err) {
    console.error('Error al obtener informe estadístico:', err.message);
    res.status(500).json({ error: 'Error al generar el informe estadístico' });
  }
};

module.exports = { obtenerInformeTabular, obtenerInformeEstadistico };
