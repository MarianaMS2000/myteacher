// ============================================================
//  backend/auth.js
//  Middleware de autenticación con JWT (JSON Web Token).
//
//  ¿Cómo funciona JWT?
//  Cuando el usuario hace login, el servidor le genera un "token"
//  (una cadena de texto cifrada) que incluye su id, nombre y rol.
//  El frontend guarda ese token en localStorage y lo envía en
//  cada petición dentro del header "Authorization: Bearer <token>".
//  Este middleware verifica que el token sea válido y extrae los datos.
//
//  Adicionalmente, después de verificar el JWT, comprueba en la BD
//  que el usuario sigue activo (activo = 1). Esto garantiza que una
//  cuenta eliminada (soft-delete, activo = 0) quede bloqueada de
//  inmediato, aunque el JWT todavía no haya expirado.
//
//  Uso en cualquier ruta:
//    const auth = require('./auth');
//    router.get('/ruta', auth(),             ...)  // cualquier usuario autenticado
//    router.get('/ruta', auth('estudiante'), ...)  // solo estudiantes
//    router.get('/ruta', auth('profesor'),   ...)  // solo profesores
// ============================================================

const jwt = require('jsonwebtoken');
const db  = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'myteacher_jwt_secret_2024';

function auth(rolRequerido) {
  return async function (req, res, next) {

    // 1. Leer el header "Authorization"
    const header = req.headers['authorization'] || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    let payload;
    try {
      // 2. Verificar y descifrar el token JWT
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    try {
      // 3. Verificar en la BD que el usuario sigue ACTIVO.
      //    Esto bloquea de inmediato las cuentas eliminadas (activo = 0),
      //    sin tener que esperar a que el JWT expire (hasta 7 días).
      const [rows] = await db.query(
        'SELECT id, rol FROM usuarios WHERE id = ? AND activo = 1 LIMIT 1',
        [payload.id]
      );

      if (rows.length === 0) {
        // La cuenta fue eliminada o desactivada después de emitir el token
        return res.status(401).json({ error: 'Cuenta inactiva o eliminada' });
      }

      // 4. Guardar datos en req para usarlos en la ruta
      req.usuarioId = payload.id;
      req.rol       = payload.rol;
      req.nombre    = payload.nombre;

      // 5. Verificar rol si se especificó
      if (rolRequerido && payload.rol !== rolRequerido) {
        return res.status(403).json({ error: 'Acceso no autorizado para tu rol' });
      }

      next();

    } catch (dbErr) {
      console.error('[auth] Error consultando BD:', dbErr);
      return res.status(500).json({ error: 'Error interno de autenticación' });
    }
  };
}

module.exports = auth;
