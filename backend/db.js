// ============================================================
//  backend/db.js
//  Módulo de conexión a MySQL usando un "pool" de conexiones.
//
//  ¿Qué es un pool?
//  En lugar de abrir y cerrar una conexión nueva cada vez que
//  alguien hace una petición, el pool mantiene varias conexiones
//  abiertas y las reutiliza. Esto es mucho más rápido y eficiente.
//
//  Dependencia:  npm install mysql2
//
//  Cómo usarlo desde cualquier otro archivo del backend:
//    const db = require('./db');
//    const [filas] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
// ============================================================

const mysql = require('mysql2/promise'); // versión con soporte async/await

// Creamos el pool con la configuración de conexión.
// Las variables de entorno (process.env.*) permiten cambiar
// la configuración sin tocar el código — solo editas el archivo .env
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',      // IP o nombre del servidor MySQL
  port:               process.env.DB_PORT     || 3306,             // puerto por defecto de MySQL
  user:               process.env.DB_USER     || 'myteacher_user', // usuario creado en docker-compose
  password:           process.env.DB_PASSWORD || 'myteacher_pass_2024',
  database:           process.env.DB_NAME     || 'myteacher',      // base de datos que usaremos
  charset:            'utf8mb4',   // soporta emojis y caracteres especiales en español
  waitForConnections: true,        // si todas las conexiones están ocupadas, espera (no falla)
  connectionLimit:    10,          // máximo 10 conexiones simultáneas abiertas
  queueLimit:         0,           // 0 = cola ilimitada de peticiones esperando conexión
});

// Exportamos el pool para que otros archivos puedan importarlo con require('./db')
module.exports = pool;
