/* =============================================
   tutores_data.js — Base de datos de tutores
   Cada tutor tiene sus datos únicos.
   Se usa en perfil_tutor.html y comunidad.html
   ============================================= */

var TUTORES_DB = {

  /* ── Tutor 1: Ricardo Soler ── */
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
    email: "ricardo.soler@email.com",
    telefono: "+57 300 123 4567",
    materias: ["Física", "Electromagnetismo", "Relatividad", "Astrofísica", "Matemáticas aplicadas"],
    descripcion: "Soy físico teórico y astrónomo, apasionado por enseñar de forma clara y práctica. Me enfoco en que mis estudiantes entiendan los conceptos a profundidad y desarrollen pensamiento lógico, adaptando cada clase a su nivel y necesidades.",
    resenas: [
      { nombre: "María González", foto: "images/maria.png", estrellas: 4, fecha: "9/04/2025", materia: "Física Cuántica", precio: "50.000 COP", texto: "El profesor explica temas complejos de una manera increíblemente clara. Nunca había entendido bien la física cuántica hasta esta tutoría." },
      { nombre: "Andrés Ramírez", foto: "images/esteban.png", estrellas: 5, fecha: "12/03/2025", materia: "Relatividad", precio: "45.000 COP", texto: "Excelente tutor, muy puntual y con un dominio profundo del tema. Lo recomiendo ampliamente." }
    ],
    totalResenas: 67,
    ratingPromedio: "5.0"
  },

  /* ── Tutor 2: Daniela Ríos ── */
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
    email: "daniela.rios@email.com",
    telefono: "+57 315 987 6543",
    materias: ["Inglés", "Conversación", "IELTS", "TOEFL", "Gramática"],
    descripcion: "Lingüista certificada con 7 años de experiencia enseñando inglés a estudiantes de todas las edades. Mi metodología combina conversación real, gramática práctica y técnicas de memorización efectiva. ¡Habla inglés con confianza desde la primera clase!",
    resenas: [
      { nombre: "Lucía Torres", foto: "images/lucia3.png", estrellas: 5, fecha: "2/05/2025", materia: "Inglés Conversacional", precio: "40.000 COP", texto: "Daniela es increíble, en solo 3 sesiones mejoré muchísimo mi pronunciación y fluidez. Super recomendada." },
      { nombre: "Maira Pérez", foto: "images/maira.png", estrellas: 5, fecha: "15/04/2025", materia: "IELTS Prep", precio: "50.000 COP", texto: "Gracias a Daniela pasé el IELTS con un 7.5. Su método de preparación es muy efectivo y motivador." }
    ],
    totalResenas: 112,
    ratingPromedio: "4.9"
  },

  /* ── Tutor 3: Alfonso Méndez ── */
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
    email: "alfonso.mendez@email.com",
    telefono: "+57 321 456 7890",
    materias: ["Matemáticas", "Estadística", "Cálculo", "Álgebra Lineal", "Probabilidad"],
    descripcion: "Matemático egresado de la Universidad del Valle con maestría en estadística. Creo firmemente que las matemáticas las puede entender todo el mundo con el método correcto. Mis clases son dinámicas, con ejemplos reales y mucha práctica.",
    resenas: [
      { nombre: "Carlos Herrera", foto: "images/esteban.png", estrellas: 5, fecha: "28/04/2025", materia: "Cálculo Diferencial", precio: "35.000 COP", texto: "Alfonso tiene un don para explicar temas difíciles de forma sencilla. Pasé mi parcial de cálculo gracias a él." },
      { nombre: "Eugenia Mora", foto: "images/eugenia.png", estrellas: 4, fecha: "10/04/2025", materia: "Estadística", precio: "30.000 COP", texto: "Muy buen tutor, explica paso a paso y tiene mucha paciencia. Lo recomiendo para estadística." }
    ],
    totalResenas: 89,
    ratingPromedio: "4.8"
  },

  /* ── Tutor 4: Mariana Vega ── */
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
    email: "mariana.vega@email.com",
    telefono: "+57 305 234 5678",
    materias: ["Biología", "Química", "Bioquímica", "Genética", "Anatomía"],
    descripcion: "Bióloga con especialización en genética molecular. Me apasiona hacer que las ciencias de la vida sean emocionantes y accesibles. Utilizo recursos visuales, analogías creativas y ejemplos cotidianos para explicar conceptos complejos.",
    resenas: [
      { nombre: "Sofía Hernández", foto: "images/maria.png", estrellas: 5, fecha: "5/05/2025", materia: "Genética", precio: "38.000 COP", texto: "Mariana hace que la genética sea fascinante. Explica con tanta claridad que es imposible no entender." },
      { nombre: "Juan David Ruiz", foto: "images/esteban.png", estrellas: 4, fecha: "20/04/2025", materia: "Bioquímica", precio: "35.000 COP", texto: "Excelente tutora, muy comprometida con el aprendizaje del estudiante. Totalmente recomendada." }
    ],
    totalResenas: 54,
    ratingPromedio: "4.7"
  },

  /* ── Tutor 5: Esteban Cruz ── */
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
    email: "esteban.cruz@email.com",
    telefono: "+57 310 876 5432",
    materias: ["Programación", "Python", "JavaScript", "React", "Algoritmos", "Bases de Datos"],
    descripcion: "Ingeniero senior con experiencia en empresas de tecnología de Colombia y el exterior. Enseño programación de manera práctica, construyendo proyectos reales desde el día uno. Especialista en Python, JavaScript y desarrollo web moderno.",
    resenas: [
      { nombre: "Lucía Torres", foto: "images/lucia3.png", estrellas: 5, fecha: "8/05/2025", materia: "Python", precio: "70.000 COP", texto: "Esteban es el mejor tutor de programación que he tenido. Aprende de manera práctica y divertida." },
      { nombre: "Carlos Mora", foto: "images/esteban.png", estrellas: 5, fecha: "25/04/2025", materia: "React", precio: "75.000 COP", texto: "En 5 sesiones construí mi primer proyecto en React. Increíble metodología." }
    ],
    totalResenas: 143,
    ratingPromedio: "5.0"
  },

  /* ── Tutor 6: María Inés Castro ── */
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
    email: "maria.castro@email.com",
    telefono: "+57 318 654 3210",
    materias: ["Historia", "Filosofía", "Ciencias Sociales", "Ética", "Literatura"],
    descripcion: "Doctora en Historia con 8 años de experiencia en docencia universitaria. Creo en el pensamiento crítico y el debate como herramientas fundamentales del aprendizaje. Mis clases conectan el pasado con el presente de manera relevante y apasionante.",
    resenas: [
      { nombre: "Andrés Mora", foto: "images/esteban.png", estrellas: 5, fecha: "1/05/2025", materia: "Filosofía", precio: "30.000 COP", texto: "María hace que la filosofía sea relevante y emocionante. Sus clases cambian la forma de pensar." },
      { nombre: "Eugenia Vidal", foto: "images/eugenia.png", estrellas: 4, fecha: "18/04/2025", materia: "Historia de Colombia", precio: "28.000 COP", texto: "Excelente docente, muy apasionada por su área. Recomendada para humanidades." }
    ],
    totalResenas: 78,
    ratingPromedio: "4.6"
  }
};

/* Función auxiliar para obtener tutor por ID */
function getTutorById(id) {
  return TUTORES_DB[String(id)] || null;
}

/* Función auxiliar para obtener todos los tutores como array */
function getAllTutores() {
  return Object.values(TUTORES_DB);
}
