/* =============================================
   tutores_data.js — Base de datos central de
   tutores. Fuente única de verdad para:
   tutores.html, favoritos.html, mapa.html,
   perfil_tutor.html, panel_estudiante.html
   ============================================= */

var TUTORES_DB = {

  "1": {
    id: "1",
    nombre: "Ricardo Soler",
    especialidad: "Físico Teórico y Astrónomo",
    ubicacion: "Bogotá, COL",
    foto: "images/sergio.png",
    rating: "5.0",
    precio: "15k - 60k COP",
    experiencia: "5 años enseñando",
    nivel: "Secundaria / Universidad",
    modalidad: "virtual",
    email: "ricardo.soler@email.com",
    telefono: "+57 300 123 4567",
    materias: ["Física", "Electromagnetismo", "Relatividad", "Astrofísica", "Matemáticas aplicadas"],
    descripcion: "Soy físico teórico y astrónomo, apasionado por enseñar de forma clara y práctica. Me enfoco en que mis estudiantes entiendan los conceptos a profundidad y desarrollen pensamiento lógico.",
    resenas: [
      { nombre: "María González", foto: "images/maria.png", estrellas: 5, fecha: "9/04/2025", materia: "Física Cuántica", precio: "50.000 COP", texto: "El profesor explica temas complejos de una manera increíblemente clara." },
      { nombre: "Andrés Ramírez", foto: "images/esteban.png", estrellas: 5, fecha: "12/03/2025", materia: "Relatividad", precio: "45.000 COP", texto: "Excelente tutor, muy puntual y con un dominio profundo del tema." }
    ],
    totalResenas: 67, ratingPromedio: "5.0"
  },

  "2": {
    id: "2",
    nombre: "Daniela Ríos",
    especialidad: "Lingüista y Profesora de Inglés",
    ubicacion: "Medellín, COL",
    foto: "images/daniela img.png",
    rating: "4.9",
    precio: "20k - 50k COP",
    experiencia: "7 años enseñando",
    nivel: "Básico / Intermedio / Avanzado",
    modalidad: "virtual",
    email: "daniela.rios@email.com",
    telefono: "+57 315 987 6543",
    materias: ["Inglés", "Conversación", "IELTS", "TOEFL", "Gramática"],
    descripcion: "Lingüista certificada con 7 años de experiencia enseñando inglés a estudiantes de todas las edades. Mi metodología combina conversación real, gramática práctica y técnicas de memorización efectiva.",
    resenas: [
      { nombre: "Lucía Torres", foto: "images/lucia3.png", estrellas: 5, fecha: "2/05/2025", materia: "Inglés Conversacional", precio: "40.000 COP", texto: "Daniela es increíble, en solo 3 sesiones mejoré muchísimo mi pronunciación." },
      { nombre: "Maira Pérez", foto: "images/maira.png", estrellas: 5, fecha: "15/04/2025", materia: "IELTS Prep", precio: "50.000 COP", texto: "Gracias a Daniela pasé el IELTS con un 7.5. Su método es muy efectivo." }
    ],
    totalResenas: 112, ratingPromedio: "4.9"
  },

  "3": {
    id: "3",
    nombre: "Alfonso Méndez",
    especialidad: "Matemático y Estadístico",
    ubicacion: "Cali, COL",
    foto: "images/alfonso.png",
    rating: "4.8",
    precio: "10k - 45k COP",
    experiencia: "4 años enseñando",
    nivel: "Primaria / Secundaria / Universidad",
    modalidad: "presencial",
    email: "alfonso.mendez@email.com",
    telefono: "+57 321 456 7890",
    materias: ["Matemáticas", "Estadística", "Cálculo", "Álgebra Lineal", "Probabilidad"],
    descripcion: "Matemático egresado de la Universidad del Valle con maestría en estadística. Creo que las matemáticas las puede entender todo el mundo con el método correcto.",
    resenas: [
      { nombre: "Carlos Herrera", foto: "images/esteban.png", estrellas: 5, fecha: "28/04/2025", materia: "Cálculo Diferencial", precio: "35.000 COP", texto: "Alfonso tiene un don para explicar temas difíciles de forma sencilla." },
      { nombre: "Eugenia Mora", foto: "images/eugenia.png", estrellas: 4, fecha: "10/04/2025", materia: "Estadística", precio: "30.000 COP", texto: "Muy buen tutor, explica paso a paso y tiene mucha paciencia." }
    ],
    totalResenas: 89, ratingPromedio: "4.8"
  },

  "4": {
    id: "4",
    nombre: "Mariana Vega",
    especialidad: "Bióloga y Científica",
    ubicacion: "Barranquilla, COL",
    foto: "images/mariana.png",
    rating: "4.7",
    precio: "15k - 40k COP",
    experiencia: "3 años enseñando",
    nivel: "Secundaria / Universidad",
    modalidad: "hibrida",
    email: "mariana.vega@email.com",
    telefono: "+57 305 234 5678",
    materias: ["Biología", "Química", "Bioquímica", "Genética", "Anatomía"],
    descripcion: "Bióloga con especialización en genética molecular. Me apasiona hacer que las ciencias de la vida sean emocionantes y accesibles.",
    resenas: [
      { nombre: "Sofía Hernández", foto: "images/maria.png", estrellas: 5, fecha: "5/05/2025", materia: "Genética", precio: "38.000 COP", texto: "Mariana hace que la genética sea fascinante." },
      { nombre: "Juan David Ruiz", foto: "images/esteban.png", estrellas: 4, fecha: "20/04/2025", materia: "Bioquímica", precio: "35.000 COP", texto: "Excelente tutora, muy comprometida con el aprendizaje del estudiante." }
    ],
    totalResenas: 54, ratingPromedio: "4.7"
  },

  "5": {
    id: "5",
    nombre: "Esteban Cruz",
    especialidad: "Ingeniero de Software",
    ubicacion: "Bogotá, COL",
    foto: "images/esteban.png",
    rating: "5.0",
    precio: "25k - 80k COP",
    experiencia: "6 años enseñando",
    nivel: "Principiante / Intermedio / Avanzado",
    modalidad: "virtual",
    email: "esteban.cruz@email.com",
    telefono: "+57 310 876 5432",
    materias: ["Programación", "Python", "JavaScript", "React", "Algoritmos", "Bases de Datos"],
    descripcion: "Ingeniero senior con experiencia en empresas de tecnología de Colombia y el exterior. Enseño programación de manera práctica, construyendo proyectos reales desde el día uno.",
    resenas: [
      { nombre: "Lucía Torres", foto: "images/lucia3.png", estrellas: 5, fecha: "8/05/2025", materia: "Python", precio: "70.000 COP", texto: "Esteban es el mejor tutor de programación que he tenido." },
      { nombre: "Carlos Mora", foto: "images/esteban.png", estrellas: 5, fecha: "25/04/2025", materia: "React", precio: "75.000 COP", texto: "En 5 sesiones construí mi primer proyecto en React." }
    ],
    totalResenas: 143, ratingPromedio: "5.0"
  },

  "6": {
    id: "6",
    nombre: "María Inés Castro",
    especialidad: "Historiadora y Filósofa",
    ubicacion: "Cartagena, COL",
    foto: "images/maria.png",
    rating: "4.6",
    precio: "12k - 35k COP",
    experiencia: "8 años enseñando",
    nivel: "Secundaria / Universidad",
    modalidad: "presencial",
    email: "maria.castro@email.com",
    telefono: "+57 318 654 3210",
    materias: ["Historia", "Filosofía", "Ciencias Sociales", "Ética", "Literatura"],
    descripcion: "Doctora en Historia con 8 años de experiencia en docencia universitaria. Creo en el pensamiento crítico y el debate como herramientas fundamentales del aprendizaje.",
    resenas: [
      { nombre: "Andrés Mora", foto: "images/esteban.png", estrellas: 5, fecha: "1/05/2025", materia: "Filosofía", precio: "30.000 COP", texto: "María hace que la filosofía sea relevante y emocionante." },
      { nombre: "Eugenia Vidal", foto: "images/eugenia.png", estrellas: 4, fecha: "18/04/2025", materia: "Historia de Colombia", precio: "28.000 COP", texto: "Excelente docente, muy apasionada por su área." }
    ],
    totalResenas: 78, ratingPromedio: "4.6"
  },

  "7": {
    id: "7",
    nombre: "Camilo Ortega",
    especialidad: "Contador y Economista",
    ubicacion: "Bogotá, COL",
    foto: "images/sergio.png",
    rating: "4.7",
    precio: "18k - 55k COP",
    experiencia: "5 años enseñando",
    nivel: "Universidad / Profesional",
    modalidad: "virtual",
    email: "camilo.ortega@email.com",
    telefono: "+57 312 345 6789",
    materias: ["Contabilidad", "Economía", "Matemáticas Financieras", "Finanzas", "Estadística"],
    descripcion: "Contador público y economista con maestría en finanzas. Especialista en hacer que los números cobren sentido para mis estudiantes.",
    resenas: [
      { nombre: "Paula Gómez", foto: "images/maria.png", estrellas: 5, fecha: "14/04/2025", materia: "Contabilidad", precio: "45.000 COP", texto: "Camilo explica la contabilidad de forma muy práctica y fácil de entender." }
    ],
    totalResenas: 45, ratingPromedio: "4.7"
  },

  "8": {
    id: "8",
    nombre: "Valentina Rojas",
    especialidad: "Profesora de Español y Literatura",
    ubicacion: "Medellín, COL",
    foto: "images/mariana.png",
    rating: "4.8",
    precio: "15k - 45k COP",
    experiencia: "6 años enseñando",
    nivel: "Primaria / Secundaria",
    modalidad: "presencial",
    email: "valentina.rojas@email.com",
    telefono: "+57 314 567 8901",
    materias: ["Español", "Literatura", "Redacción", "Gramática", "Comprensión lectora"],
    descripcion: "Licenciada en Lengua Castellana con especialización en literatura latinoamericana. Apasionada por despertar el amor por la lectura y la escritura en mis estudiantes.",
    resenas: [
      { nombre: "Jorge Pinto", foto: "images/esteban.png", estrellas: 5, fecha: "22/04/2025", materia: "Redacción", precio: "38.000 COP", texto: "Valentina me ayudó a mejorar muchísimo mi escritura para la universidad." }
    ],
    totalResenas: 62, ratingPromedio: "4.8"
  }
  ,
  "9": {
    id: "9",
    nombre: "Maira Torres",
    especialidad: "Estadística y Probabilidad",
    ubicacion: "Bogotá, COL",
    foto: "images/maira.png",
    rating: "4.8",
    precio: "18k - 50k COP",
    modalidad: "virtual",
    materias: ["Estadística", "Probabilidad", "Análisis de Datos"],
    descripcion: "Estadística con más de 6 años de experiencia docente. Me especializo en hacer accesible el análisis de datos y la probabilidad para estudiantes de todas las carreras.",
    resenas: [
      { nombre: "Choi San", foto: "images/choi.png", estrellas: 5, fecha: "8/04/2025", materia: "Estadística", precio: "50.000 COP", texto: "Maira explica los conceptos de forma muy clara. ¡La recomiendo totalmente!" }
    ],
    totalResenas: 38, ratingPromedio: "4.8"
  }
};

/* ── FUNCIONES DE ACCESO ── */

/**
 * Obtiene un tutor por su ID.
 * @param {string} id
 * @returns {Object|null}
 */
function getTutorById(id) {
  return TUTORES_DB[String(id)] || null;
}

/**
 * Retorna todos los tutores como array.
 * @returns {Array}
 */
function getAllTutores() {
  return Object.values(TUTORES_DB);
}
