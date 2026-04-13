// Configuración de la conexión a PostgreSQL (Neon)
const { Pool } = require('pg');
require('dotenv').config();

// Pool de conexiones reutilizable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Verificar conexión al iniciar
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch(err => console.error('❌ Error conectando a PostgreSQL:', err.message));

module.exports = pool;
