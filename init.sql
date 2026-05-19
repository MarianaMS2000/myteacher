-- ============================================================
--  myTeacher — Schema MySQL completo
--  Ejecutado automáticamente al levantar el contenedor Docker
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '-05:00'; -- UTC-5 Colombia

-- ============================================================
--  1. USUARIOS  (tabla base — estudiantes Y profesores)
-- ============================================================
CREATE TABLE usuarios (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,          -- bcrypt/argon2
  rol          ENUM('estudiante','profesor') NOT NULL,
  foto_url     VARCHAR(500) DEFAULT NULL,
  telefono     VARCHAR(20)  DEFAULT NULL,
  activo       TINYINT(1)   NOT NULL DEFAULT 1, -- soft-delete
  creado_en    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_rol   (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  2. CIUDADES / UBICACIONES
-- ============================================================
CREATE TABLE ciudades (
  id        SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(80)  NOT NULL,
  pais      CHAR(3)      NOT NULL DEFAULT 'COL',
  lat       DECIMAL(9,6) DEFAULT NULL,
  lng       DECIMAL(9,6) DEFAULT NULL
);

INSERT INTO ciudades (nombre, pais, lat, lng) VALUES
  ('Bogotá',       'COL',  4.711000, -74.072100),
  ('Medellín',     'COL',  6.244200, -75.581200),
  ('Cali',         'COL',  3.451600, -76.532000),
  ('Barranquilla', 'COL', 10.963900, -74.796400),
  ('Cartagena',    'COL', 10.391000, -75.479400);

-- ============================================================
--  3. PERFIL ESTUDIANTE
-- ============================================================
CREATE TABLE perfiles_estudiante (
  usuario_id       INT UNSIGNED PRIMARY KEY,
  nivel_estudio    ENUM('primaria','secundaria','pregrado','posgrado','otro') DEFAULT 'secundaria',
  ciudad_id        SMALLINT UNSIGNED DEFAULT NULL,
  institucion      VARCHAR(150) DEFAULT NULL,
  bio              TEXT DEFAULT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (ciudad_id)  REFERENCES ciudades(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  4. PERFIL PROFESOR  (extiende usuarios)
-- ============================================================
CREATE TABLE perfiles_profesor (
  usuario_id       INT UNSIGNED PRIMARY KEY,
  especialidad     VARCHAR(150) DEFAULT NULL,
  experiencia_años TINYINT UNSIGNED DEFAULT 0,
  nivel_educativo  ENUM('tecnico','universitario','graduado','magister','doctorado') DEFAULT 'universitario',
  modalidad        ENUM('virtual','presencial','hibrida') DEFAULT 'hibrida',
  precio_min_cop   INT UNSIGNED DEFAULT 10000,
  precio_max_cop   INT UNSIGNED DEFAULT 50000,
  ciudad_id        SMALLINT UNSIGNED DEFAULT NULL,
  descripcion      TEXT DEFAULT NULL,
  verificado       TINYINT(1) NOT NULL DEFAULT 0,
  rating_promedio  DECIMAL(3,2) DEFAULT 5.00,
  total_resenas    INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (ciudad_id)  REFERENCES ciudades(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  5. MATERIAS
-- ============================================================
CREATE TABLE materias (
  id     SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE
);

INSERT INTO materias (nombre) VALUES
  ('Física'),('Electromagnetismo'),('Astrofísica'),('Relatividad'),
  ('Matemáticas'),('Cálculo'),('Álgebra Lineal'),('Estadística'),('Probabilidad'),
  ('Inglés'),('Conversación'),('IELTS'),('TOEFL'),('Gramática'),
  ('Biología'),('Química'),('Bioquímica'),('Genética'),
  ('Programación'),('Python'),('JavaScript'),('React'),('Algoritmos'),
  ('Historia'),('Filosofía'),('Ciencias Sociales'),('Literatura');

-- ============================================================
--  6. MATERIAS QUE ENSEÑA CADA PROFESOR
-- ============================================================
CREATE TABLE profesor_materias (
  profesor_id INT UNSIGNED,
  materia_id  SMALLINT UNSIGNED,
  PRIMARY KEY (profesor_id, materia_id),
  FOREIGN KEY (profesor_id) REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (materia_id)  REFERENCES materias(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
--  7. DISPONIBILIDAD DEL PROFESOR (slots de agenda)
-- ============================================================
CREATE TABLE disponibilidad (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profesor_id  INT UNSIGNED NOT NULL,
  dia_semana   TINYINT UNSIGNED NOT NULL COMMENT '0=Dom 1=Lun ... 6=Sab',
  hora_inicio  TIME NOT NULL,
  hora_fin     TIME NOT NULL,
  activo       TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_prof_dia (profesor_id, dia_semana)
) ENGINE=InnoDB;

-- ============================================================
--  8. TUTORÍAS / SESIONES
-- ============================================================
CREATE TABLE tutorias (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudiante_id  INT UNSIGNED NOT NULL,
  profesor_id    INT UNSIGNED NOT NULL,
  materia_id     SMALLINT UNSIGNED DEFAULT NULL,
  fecha          DATE        NOT NULL,
  hora_inicio    TIME        NOT NULL,
  duracion_min   SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  modalidad      ENUM('virtual','presencial') NOT NULL DEFAULT 'virtual',
  precio_cop     INT UNSIGNED NOT NULL,
  estado         ENUM('pendiente','confirmada','en_curso','completada','cancelada') NOT NULL DEFAULT 'pendiente',
  link_virtual   VARCHAR(500) DEFAULT NULL,
  direccion      VARCHAR(300) DEFAULT NULL,
  notas          TEXT DEFAULT NULL,
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (profesor_id)   REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id)    REFERENCES materias(id) ON DELETE SET NULL,
  INDEX idx_estudiante (estudiante_id),
  INDEX idx_profesor   (profesor_id),
  INDEX idx_fecha      (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  9. SOLICITUDES DE TUTORÍA  (flujo antes de confirmar)
-- ============================================================
CREATE TABLE solicitudes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT UNSIGNED NOT NULL,
  profesor_id   INT UNSIGNED NOT NULL,
  materia_id    SMALLINT UNSIGNED DEFAULT NULL,
  fecha_prop    DATE    NOT NULL COMMENT 'Fecha propuesta por el estudiante',
  hora_prop     TIME    NOT NULL,
  duracion_min  SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  modalidad     ENUM('virtual','presencial') DEFAULT 'virtual',
  mensaje       TEXT DEFAULT NULL,
  estado        ENUM('enviada','aceptada','rechazada','expirada') NOT NULL DEFAULT 'enviada',
  tutoria_id    INT UNSIGNED DEFAULT NULL COMMENT 'Se crea cuando el prof acepta',
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (profesor_id)   REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id)    REFERENCES materias(id) ON DELETE SET NULL,
  FOREIGN KEY (tutoria_id)    REFERENCES tutorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 10. RESEÑAS / VALORACIONES
-- ============================================================
CREATE TABLE resenas (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tutoria_id    INT UNSIGNED NOT NULL UNIQUE,
  estudiante_id INT UNSIGNED NOT NULL,
  profesor_id   INT UNSIGNED NOT NULL,
  materia_id    SMALLINT UNSIGNED DEFAULT NULL,
  estrellas     TINYINT UNSIGNED NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario    TEXT DEFAULT NULL,
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tutoria_id)    REFERENCES tutorias(id) ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (profesor_id)   REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id)    REFERENCES materias(id) ON DELETE SET NULL,
  INDEX idx_profesor (profesor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trigger: actualiza rating_promedio y total_resenas en perfiles_profesor
DELIMITER //
CREATE TRIGGER trg_actualizar_rating
AFTER INSERT ON resenas
FOR EACH ROW
BEGIN
  UPDATE perfiles_profesor
  SET
    rating_promedio = (
      SELECT ROUND(AVG(estrellas), 2) FROM resenas WHERE profesor_id = NEW.profesor_id
    ),
    total_resenas = (
      SELECT COUNT(*) FROM resenas WHERE profesor_id = NEW.profesor_id
    )
  WHERE usuario_id = NEW.profesor_id;
END;
//
DELIMITER ;

-- ============================================================
-- 11. FAVORITOS (estudiante guarda profesores favoritos)
-- ============================================================
CREATE TABLE favoritos (
  estudiante_id INT UNSIGNED,
  profesor_id   INT UNSIGNED,
  guardado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (estudiante_id, profesor_id),
  FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (profesor_id)   REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 12. MENSAJES / CHAT ENTRE USUARIOS
-- ============================================================
CREATE TABLE conversaciones (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  estudiante_id  INT UNSIGNED NOT NULL,
  profesor_id    INT UNSIGNED NOT NULL,
  ultimo_mensaje DATETIME DEFAULT NULL,
  UNIQUE KEY uq_conv (estudiante_id, profesor_id),
  FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (profesor_id)   REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE mensajes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversacion_id INT UNSIGNED NOT NULL,
  remitente_id    INT UNSIGNED NOT NULL,
  contenido       TEXT NOT NULL,
  leido           TINYINT(1) NOT NULL DEFAULT 0,
  enviado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (remitente_id)    REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_conv_fecha (conversacion_id, enviado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trigger: actualiza ultimo_mensaje al insertar
DELIMITER //
CREATE TRIGGER trg_ultimo_mensaje
AFTER INSERT ON mensajes
FOR EACH ROW
BEGIN
  UPDATE conversaciones SET ultimo_mensaje = NEW.enviado_en
  WHERE id = NEW.conversacion_id;
END;
//
DELIMITER ;

-- ============================================================
-- 13. NOTIFICACIONES
-- ============================================================
CREATE TABLE notificaciones (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT UNSIGNED NOT NULL,
  tipo         VARCHAR(50) NOT NULL COMMENT 'solicitud_nueva | tutoria_confirmada | mensaje_nuevo | etc.',
  titulo       VARCHAR(150) NOT NULL,
  cuerpo       TEXT DEFAULT NULL,
  leida        TINYINT(1) NOT NULL DEFAULT 0,
  url_accion   VARCHAR(300) DEFAULT NULL,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_leida (usuario_id, leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 14. ONBOARDING DEL PROFESOR  (respuestas del flujo inicial)
-- ============================================================
CREATE TABLE onboarding_profesor (
  usuario_id         INT UNSIGNED PRIMARY KEY,
  nivel_educativo    VARCHAR(50)  DEFAULT NULL,
  años_experiencia   VARCHAR(50)  DEFAULT NULL,
  disponibilidad     VARCHAR(50)  DEFAULT NULL,
  num_estudiantes    VARCHAR(50)  DEFAULT NULL,
  completado         TINYINT(1)   NOT NULL DEFAULT 0,
  completado_en      DATETIME DEFAULT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 15. SESIONES DE AUTENTICACIÓN  (tokens de sesión seguros)
-- ============================================================
CREATE TABLE sesiones_auth (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT UNSIGNED NOT NULL,
  token_hash   CHAR(64) NOT NULL UNIQUE COMMENT 'SHA-256 del token enviado al cliente',
  user_agent   VARCHAR(300) DEFAULT NULL,
  ip           VARCHAR(45)  DEFAULT NULL,
  expira_en    DATETIME NOT NULL,
  creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash),
  INDEX idx_expira (expira_en)
) ENGINE=InnoDB;

-- ============================================================
-- 16. DATOS DEMO  (profesores de tutores_data.js)
-- ============================================================

-- Ciudades ya insertadas arriba. Insertamos los 6 profesores demo.
INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
  (1, 'Ricardo Soler',  'ricardo.soler@myteacher.co',  '$2b$12$demo_hash_1', 'profesor'),
  (2, 'Daniela Ríos',   'daniela.rios@myteacher.co',   '$2b$12$demo_hash_2', 'profesor'),
  (3, 'Alfonso Méndez', 'alfonso.mendez@myteacher.co', '$2b$12$demo_hash_3', 'profesor'),
  (4, 'Mariana Vega',   'mariana.vega@myteacher.co',   '$2b$12$demo_hash_4', 'profesor'),
  (5, 'Esteban Cruz',   'esteban.cruz@myteacher.co',   '$2b$12$demo_hash_5', 'profesor'),
  (6, 'María Inés',     'maria.ines@myteacher.co',     '$2b$12$demo_hash_6', 'profesor');

INSERT INTO perfiles_profesor (usuario_id, especialidad, experiencia_años, modalidad, precio_min_cop, precio_max_cop, ciudad_id, rating_promedio, total_resenas) VALUES
  (1, 'Físico Teórico y Astrónomo',     5, 'virtual',    15000, 60000, 1, 5.00, 67),
  (2, 'Lingüista y Profesora de Inglés',7, 'virtual',    20000, 50000, 2, 4.90, 112),
  (3, 'Matemático y Estadístico',        4, 'presencial', 10000, 45000, 3, 4.80, 89),
  (4, 'Bióloga y Científica',            6, 'hibrida',   15000, 40000, 4, 4.90, 76),
  (5, 'Desarrollador Full Stack',        8, 'virtual',   25000, 80000, 1, 5.00, 134),
  (6, 'Historiadora y Filósofa',         3, 'presencial', 12000, 35000, 5, 4.70, 45);
