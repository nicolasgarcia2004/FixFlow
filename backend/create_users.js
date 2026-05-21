const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function createUsers() {
  try {
    const users = [
      { nombre: 'Nicolas', email: 'nicolas@fixflow.com', contrasena: 'nicolas123' },
      { nombre: 'Johan', email: 'johan@fixflow.com', contrasena: 'johan123' },
      { nombre: 'Alejandro', email: 'alejandro@fixflow.com', contrasena: 'alejandro123' }
    ];

    for (const u of users) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(u.contrasena, salt);
      
      // Check if exists
      const check = await pool.query('SELECT id_usuario FROM usuarios WHERE email = $1', [u.email]);
      if (check.rows.length === 0) {
        await pool.query(
          `INSERT INTO usuarios (nombre, email, contrasena, tipo_usuario) VALUES ($1, $2, $3, 'CLIENTE')`,
          [u.nombre, u.email, hash]
        );
        console.log(`Usuario creado: ${u.nombre}`);
      } else {
        console.log(`Usuario ya existe: ${u.nombre}`);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

createUsers();
