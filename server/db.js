import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'ips_database.json');

// Crear directorio data si no existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Datos iniciales de demostración para IPS ARCAL
const INITIAL_DATA = {
  sedes: [],
  especialidades: [
    {
      id: "esp-ecografia",
      nombre: "ECOGRAFÍA E IMÁGENES DIAGNÓSTICAS",
      codigo: "ECO",
      icono: "Activity",
      descripcion: "Ecografía general, abdominal, pélvica, obstétrica, doppler vascular, musculoesquelética y tiroides con tecnología digital avanzada.",
      duracionMinutos: 30,
      activa: true,
      recomendaciones: [
        "Para ecografía abdominal superior o hepatobiliar: presentarse con ayuno de 6 a 8 horas (no grasas, lácteos ni gaseosas).",
        "Para ecografía pélvica, prostática o renal: tomar 4 vasos de agua 1 hora antes y retener la orina para vejiga llena.",
        "Para ecografía articular, muscular o tiroides: no requiere ayuno ni preparación especial.",
        "Traer orden médica autorizada, exámenes de laboratorio y ecografías o radiografías previas."
      ]
    },
    {
      id: "esp-proteccion-radiologica",
      nombre: "PROTECCIÓN RADIOLÓGICA & DOSIMETRÍA",
      codigo: "PROT-RAD",
      icono: "ShieldCheck",
      descripcion: "Servicio especializado en dosimetría personal ocupacional, control de calidad radiológico, blindajes y asesoría en licenciamiento.",
      duracionMinutos: 45,
      activa: true,
      recomendaciones: [
        "Presentar ficha técnica y datos del equipo generador de radiación ionizante (Rayos X, Fluoroscopia, Mamografía o TAC).",
        "Para asignación o recambio de dosímetros personales OSL/TLD, presentar listado del personal ocupacionalmente expuesto (POE).",
        "Para cálculo de blindajes o levantamiento radiométrico, adjuntar planos arquitectónicos de la instalación.",
        "Presentar licencia de práctica médica o industrial anterior si aplica para trámite de renovación."
      ]
    },
    {
      id: "esp-rayosx",
      nombre: "RADIOLOGÍA DIGITAL & RAYOS X",
      codigo: "RX",
      icono: "Sparkles",
      descripcion: "Radiología convencional digital de tórax, columna, articulaciones y densitometría ósea con entrega inmediata de placas y reporte digital.",
      duracionMinutos: 20,
      activa: true,
      recomendaciones: [
        "Asistir con ropa cómoda sin elementos metálicos (cremalleras, broches de metal, joyas o alambres).",
        "Pacientes mujeres en edad fértil: informar obligatoriamente al tecnólogo ante sospecha o confirmación de embarazo.",
        "Presentar orden médica indicando claramente la región anatómica y la sospecha clínica.",
        "Llegar 15 minutos antes de la hora programada para el registro en admisiones."
      ]
    },
    {
      id: "esp-medicina-laboral-poe",
      nombre: "MEDICINA LABORAL (PERSONAL EXPUESTO POE)",
      codigo: "MED-LAB",
      icono: "UserCheck",
      descripcion: "Exámenes ocupacionales de ingreso, periódicos y egreso para personal expuesto a radiaciones ionizantes según normativa MinSalud.",
      duracionMinutos: 30,
      activa: true,
      recomendaciones: [
        "Presentar documento de identidad original y orden de examen médico ocupacional emitida por la empresa.",
        "Traer reporte del historial dosimétrico acumulado de los últimos 12 meses.",
        "Si el protocolo incluye hemograma y recuento plaquetario, acudir en ayunas de 8 horas.",
        "Informar al médico evaluador sobre antecedentes de radioterapia o exposición médica previa."
      ]
    },
    {
      id: "esp-urologia",
      nombre: "UROLOGÍA",
      codigo: "URO",
      icono: "Activity",
      descripcion: "Diagnóstico y tratamiento integral de patologías del aparato urinario y sistema reproductor masculino.",
      duracionMinutos: 30,
      activa: true,
      recomendaciones: [
        "Presentar orden médica de interconsulta y autorización de la EPS (o confirmar atención particular).",
        "Si su cita incluye ecografía vesical o prostática, tome 4 vasos de agua 1 hora antes y retenga la orina para tener vejiga confortablemente llena.",
        "Traer exámenes de laboratorio recientes: Antígeno Prostático Específico (PSA), Uroanálisis, Creatinina y ecografías previas.",
        "Llegar 15 minutos antes de la hora programada para verificación de datos y signos vitales."
      ]
    },
    {
      id: "esp-otorrino",
      nombre: "OTORRINOLARINGOLOGÍA",
      codigo: "ORL",
      icono: "Ear",
      descripcion: "Atención especializada de oídos, nariz, garganta y estructuras de cabeza y cuello.",
      duracionMinutos: 30,
      activa: true,
      recomendaciones: [
        "No aplicar gotas óticas ni realizar lavados caseros en los oídos durante las 24 horas previas.",
        "Si consulta por problemas de audición o vértigo, traer audiometrías, impedanciometrías o TAC de senos paranasales previos.",
        "Traer lista de medicamentos antialérgicos, descongestionantes o anticoagulantes que esté consumiendo.",
        "Si el paciente es menor de edad, debe ingresar con un acudiente mayor de edad."
      ]
    },
    {
      id: "esp-pediatria",
      nombre: "PEDIATRÍA",
      codigo: "PED",
      icono: "Baby",
      descripcion: "Cuidado de la salud integral, crecimiento y desarrollo de recién nacidos, niños y adolescentes.",
      duracionMinutos: 30,
      activa: true,
      recomendaciones: [
        "El menor de edad DEBE ingresar acompañado de padre, madre o representante legal con identificación original.",
        "Llevar obligatoriamente el carné físico de vacunación actualizado y curva de crecimiento y desarrollo previa.",
        "Llevar ropa cómoda de dos piezas para facilitar la valoración antropométrica y examen físico.",
        "Traer notas de egreso hospitalario si estuvo hospitalizado recientemente o notas pediátricas anteriores."
      ]
    },
    {
      id: "esp-medicina-interna",
      nombre: "MEDICINA INTERNA",
      codigo: "MED-INT",
      icono: "HeartPulse",
      descripcion: "Atención médica integral del adulto para diagnóstico y manejo de enfermedades sistémicas y crónicas.",
      duracionMinutos: 30,
      activa: true,
      recomendaciones: [
        "Llevar fórmula médica actual y lista exacta de medicamentos con dosis y horarios que toma habitualmente.",
        "Traer resultados de laboratorio de los últimos 6 meses (hemograma, glicemia, perfil lipídico, función renal y tiroidea).",
        "Si padece de hipertensión arterial o diabetes, traer planilla de automonitoreo de presión arterial y glucometrías.",
        "Traer copia de electrocardiograma o ecocardiograma si le han sido practicados previamente."
      ]
    },
    {
      id: "esp-psicologia",
      nombre: "PSICOLOGÍA",
      codigo: "PSI",
      icono: "Brain",
      descripcion: "Evaluación y acompañamiento clínico para el bienestar emocional, cognitivo y de la salud mental.",
      duracionMinutos: 45,
      activa: true,
      recomendaciones: [
        "Espacio de consulta confidencial de 45 minutos. Se recomienda llegar con 10 minutos de anticipación para ambientación.",
        "Traer informes de valoraciones psicológicas, psiquiátricas o del colegio/trabajo previas si aplica.",
        "Para menores de 18 años, los primeros 15 minutos de la sesión inicial requieren la presencia del acudiente.",
        "Asistir en un estado de tranquilidad y con disposición para dialogar abiertamente con el profesional."
      ]
    },
    {
      id: "esp-cardiologia",
      nombre: "CARDIOLOGÍA",
      codigo: "CARDIO",
      icono: "HeartHandshake",
      descripcion: "Prevención, diagnóstico y tratamiento de enfermedades cardiovasculares y del ritmo cardíaco.",
      duracionMinutos: 30,
      activa: true,
      recomendaciones: [
        "No consumir bebidas con cafeína (café, té, bebidas energizantes) ni fumar durante las 6 horas previas a la cita.",
        "Vestir ropa cómoda de dos piezas para facilitar la colocación de electrodos en tórax y extremidades.",
        "Llevar resultados previos de Electrocardiograma, Ecocardiograma, Prueba de Esfuerzo o Holter.",
        "Llevar registro claro de medicamentos antihipertensivos o anticoagulantes con sus dosis exactas."
      ]
    },
    {
      id: "esp-nutricion",
      nombre: "NUTRICIÓN",
      codigo: "NUTRI",
      icono: "Salad",
      descripcion: "Asesoría nutricional clínica personalizada, plan alimentario y manejo metabólico integral.",
      duracionMinutos: 30,
      activa: true,
      recomendaciones: [
        "Ayuno de 2 a 3 horas previas si se realizará análisis de composición corporal (bioimpedancia eléctrica).",
        "Evitar ejercicio físico extenuante y consumo de alcohol durante las 24 horas previas.",
        "Llevar registro escrito de alimentos y bebidas consumidas durante los últimos 3 días (recordatorio de 24h).",
        "Traer exámenes de sangre recientes: perfil lipídico, glucosa, insulina, ácido úrico y hemoglobina glicosilada."
      ]
    },
    {
      id: "esp-dermatologia",
      nombre: "DERMATOLOGÍA",
      codigo: "DERMA",
      icono: "Sparkles",
      descripcion: "Cuidado clínico, prevención y tratamiento de afecciones de la piel, pelo, uñas y mucosas.",
      duracionMinutos: 30,
      activa: true,
      recomendaciones: [
        "Asistir con el área a evaluar completamente limpia, sin maquillaje, polvos, bases ni cremas espesas.",
        "Si la consulta es por afecciones en las uñas, asistir sin esmalte tradicional ni acrílico.",
        "Llevar los frascos o nombres exactos de los bloqueadores, cremas tópicas o tratamientos dermatológicos en uso.",
        "Identificar previamente los lunares o manchas que hayan cambiado de tamaño, color o forma para mostrarlos."
      ]
    },
    {
      id: "esp-ginecologia",
      nombre: "GINECOLOGÍA",
      codigo: "GIN",
      icono: "ShieldPlus",
      descripcion: "Salud integral de la mujer, prevención ginecológica, control prenatal y salud reproductiva.",
      duracionMinutos: 30,
      activa: true,
      recomendaciones: [
        "No acudir durante el periodo menstrual (a menos que el motivo de consulta sea una hemorragia anormal).",
        "Abstenerse de relaciones sexuales durante las 48 horas previas si se tomará citología cérvico-vaginal.",
        "No utilizar óvulos vaginales, duchas, cremas ni tampones en los 3 días anteriores a la consulta.",
        "Tener presente la fecha exacta del primer día de su última menstruación (FUM) y llevar citologías o ecografías previas."
      ]
    }
  ],
  medicos: [],
  citas: [],
  usuarios: [
    {
      id: "usr-superadmin",
      nombre: "Dirección General IPS (Super Admin)",
      username: "superadmin",
      password: "superadmin123",
      rol: "superadmin",
      email: "superadmin@ipsarcal.com",
      cargo: "Super Administrador del Sistema",
      sedesAsignadas: ["sede-1", "sede-2", "sede-3", "sede-4"],
      activo: true,
      creadoEn: new Date().toISOString()
    },
    {
      id: "usr-admin",
      nombre: "Administrador Central IPS",
      username: "admin",
      password: "admin123",
      rol: "admin",
      email: "admin@ipsarcal.com",
      cargo: "Director de Operaciones & Admisiones",
      sedesAsignadas: ["sede-1", "sede-2", "sede-3", "sede-4"],
      activo: true,
      creadoEn: new Date().toISOString()
    },
    {
      id: "usr-agente-1",
      nombre: "Laura Camila Gómez",
      username: "laura.gomez",
      password: "123",
      rol: "agente",
      email: "laura.gomez@ipsarcal.com",
      cargo: "Agente de Admisiones y Recepción",
      sedesAsignadas: ["sede-1", "sede-2"],
      activo: true,
      creadoEn: new Date().toISOString()
    },
    {
      id: "usr-agente-2",
      nombre: "Andrés Felipe Ruiz",
      username: "andres.ruiz",
      password: "123",
      rol: "agente",
      email: "andres.ruiz@ipsarcal.com",
      cargo: "Agente de Atención al Cliente",
      sedesAsignadas: ["sede-3"],
      activo: true,
      creadoEn: new Date().toISOString()
    },
    {
      id: "usr-agente-3",
      nombre: "Carolina Morales Vega",
      username: "carolina.morales",
      password: "123",
      rol: "agente",
      email: "carolina.morales@ipsarcal.com",
      cargo: "Agente de Ventanilla y Recepción",
      sedesAsignadas: ["sede-4"],
      activo: false,
      creadoEn: new Date().toISOString()
    }
  ],
  historialAuditoria: [
    {
      id: "log-1",
      fecha: new Date().toISOString(),
      accion: "INICIALIZACION",
      descripcion: "Sistema de citas IPS ARCAL configurado con 4 sedes y 9 especialidades habilitadas."
    }
  ]
};

// Cargar o inicializar base de datos
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      let needsSave = false;

      // Auto-migración si no tiene usuarios
      if (!data.usuarios || !Array.isArray(data.usuarios)) {
        data.usuarios = [...INITIAL_DATA.usuarios];
        needsSave = true;
      } else if (!data.usuarios.some(u => u.rol === 'superadmin')) {
        // Asegurar cuenta superadmin
        data.usuarios.unshift({
          id: "usr-superadmin",
          nombre: "Dirección General IPS (Super Admin)",
          username: "superadmin",
          password: "superadmin123",
          rol: "superadmin",
          email: "superadmin@ipsarcal.com",
          cargo: "Super Administrador del Sistema",
          sedesAsignadas: (data.sedes || []).map(s => s.id),
          activo: true,
          creadoEn: new Date().toISOString()
        });
        needsSave = true;
      }

      // Asegurar que cada médico tenga duracionCitaMinutos (predeterminada 30) y pausas []
      if (Array.isArray(data.medicos)) {
        data.medicos.forEach(m => {
          if (m.duracionCitaMinutos === undefined) {
            m.duracionCitaMinutos = 30; // 30 min por defecto
            needsSave = true;
          }
          if (!Array.isArray(m.pausas)) {
            m.pausas = [];
            needsSave = true;
          }
        });
      }

      // Asegurar arrays de datos para el Portal Web
      if (!Array.isArray(data.datosCuriosos)) {
        data.datosCuriosos = [];
        needsSave = true;
      }
      if (!Array.isArray(data.galeria)) {
        data.galeria = [];
        needsSave = true;
      }
      if (!Array.isArray(data.pqrs)) {
        data.pqrs = [];
        needsSave = true;
      }

      if (needsSave) {
        saveDB(data);
      }

      return data;
    }
  } catch (err) {
    console.error("Error al leer archivo DB, reinicializando:", err);
  }
  // Si no existe, guardar iniciales
  saveDB(INITIAL_DATA);
  return INITIAL_DATA;
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error al guardar archivo DB:", err);
    return false;
  }
}

// Interfaz pública DB
export const db = {
  get: () => loadDB(),
  save: (data) => saveDB(data),
  resetToInitial: () => {
    saveDB(INITIAL_DATA);
    return INITIAL_DATA;
  }
};
