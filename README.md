# myTeacher

Plataforma web que conecta estudiantes con profesores particulares. Los estudiantes pueden buscar tutores por materia, ciudad o modalidad, ver sus perfiles y calificaciones, agendar sesiones, guardar favoritos y chatear con sus profesores. Los profesores gestionan su agenda, aceptan o rechazan solicitudes y llevan el historial de sus estudiantes.

## Tecnologías

- **Frontend:** HTML, CSS, JavaScript vanilla
- **Backend:** Node.js con Express
- **Base de datos:** MySQL 8 en Docker
- **Autenticación:** JWT (JSON Web Tokens) con bcrypt

## Estructura del proyecto

```
myteacher/
├── index.html               → Página de inicio
├── login.html               → Inicio de sesión
├── registro.html            → Registro de usuarios
├── tutores.html             → Búsqueda y listado de tutores
├── perfil_tutor.html        → Perfil individual de un tutor
├── favoritos.html           → Tutores guardados por el estudiante
├── mapa.html                → Mapa de tutores por ubicación
├── agendar_tutoria.html     → Agendar una sesión
├── mis_tutorias.html        → Historial y próximas tutorías
├── panel_estudiante.html    → Panel principal del estudiante
├── panel_profesor.html      → Panel principal del profesor
├── solicitudes_profesor.html→ Solicitudes recibidas por el profesor
├── agenda_profesor.html     → Agenda del profesor
├── configuracion.html       → Configuración del estudiante
├── configuracion_profesor.html → Configuración del profesor
├── onboarding.html          → Registro inicial del profesor
├── scripts/                 → Lógica del frontend
├── Style/                   → Estilos CSS
├── images/                  → Recursos gráficos
├── backend/                 → API del servidor
│   ├── db.js                → Conexión a MySQL
│   ├── auth.js              → Middleware de autenticación JWT
│   ├── login.js             → Ruta de inicio de sesión
│   ├── registro.js          → Ruta de registro de usuarios
│   ├── favoritos.js         → Gestión de favoritos
│   ├── tutorias.js          → Solicitudes y sesiones de tutoría
│   └── tutores.js           → Búsqueda y perfiles de profesores
├── server.js                → Servidor Express
├── init.sql                 → Esquema completo de la base de datos
└── docker-compose.yml       → Configuración de MySQL con Docker
```
