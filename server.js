// server.js — Punto de entrada del backend myTeacher

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname)));

// Servir fotos de perfil subidas por los usuarios
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rutas del API ──
app.use('/api/auth',      require('./backend/login'));
app.use('/api/auth',      require('./backend/registro'));
app.use('/api/auth',      require('./backend/perfil'));    // /me, /perfil, /foto
app.use('/api/favoritos', require('./backend/favoritos'));
app.use('/api/tutores',   require('./backend/tutores'));
app.use('/api',           require('./backend/tutorias'));

// Fallback: cualquier ruta no-API sirve el index
app.get('*', function (req, res) {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log('');
  console.log('✅  myTeacher corriendo en  → http://localhost:' + PORT);
  console.log('📊  Adminer (gestor BD)     → http://localhost:8080');
  console.log('');
});
