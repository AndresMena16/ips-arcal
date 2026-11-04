import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/ips_database.json');

const raw = fs.readFileSync(dbPath, 'utf8');
const data = JSON.parse(raw);

if (!data.datosCuriosos || data.datosCuriosos.length === 0) {
  data.datosCuriosos = [
    {
      id: "curioso-1",
      titulo: "¿Por qué la dosimetría personal es fundamental en la seguridad radiológica?",
      descripcion: "Los dosímetros personales cuantifican los niveles de radiación ionizante absorbida por el personal de salud y garantizan que los procedimientos diagnósticos cumplan con el principio ALARA (tan bajo como sea razonablemente posible), protegiendo la integridad del paciente y del operador.",
      categoria: "Protección Radiológica",
      tipoMedia: "video",
      urlMedia: "https://www.youtube.com/embed/g3_8q_037X0",
      fuente: "Comité de Protección Radiológica IPS ARCAL",
      destacado: true,
      activo: true,
      fecha: "2026-10-15T08:00:00.000Z"
    },
    {
      id: "curioso-2",
      titulo: "Monitoreo MAPA de 24 Horas: Detección precisa de la hipertensión oculta",
      descripcion: "El Monitoreo Ambulatorio de Presión Arterial (MAPA) registra lecturas continuas durante el ciclo diurno y nocturno, permitiendo identificar variaciones fisiológicas que una toma aislada en consultorio no puede evidenciar.",
      categoria: "Diagnóstico Vascular",
      tipoMedia: "imagen",
      urlMedia: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
      fuente: "Departamento de Cardiología IPS ARCAL",
      destacado: true,
      activo: true,
      fecha: "2026-10-18T10:30:00.000Z"
    },
    {
      id: "curioso-3",
      titulo: "Ecografía Doppler Vascular: Visualización hemodinámica sin radiación",
      descripcion: "Mediante ultrasonido de alta frecuencia, el ecógrafo doppler calcula la velocidad y dirección del flujo sanguíneo en vasos arteriales y venosos, siendo el estándar de oro no invasivo para detectar insuficiencias y trombos.",
      categoria: "Imágenes Diagnósticas",
      tipoMedia: "video",
      urlMedia: "https://www.youtube.com/embed/Z1BCUJX3pw8",
      fuente: "Servicio de Apoyo Diagnóstico",
      destacado: true,
      activo: true,
      fecha: "2026-10-22T14:15:00.000Z"
    },
    {
      id: "curioso-4",
      titulo: "Preparación adecuada para ecografías: La clave para un estudio concluyente",
      descripcion: "El ayuno de 6 a 8 horas previene la presencia de gas intestinal que obstaculiza la visualización de órganos abdominales, mientras que la ingesta de agua para vejiga llena es indispensable en estudios pélvicos y renales.",
      categoria: "Medicina Preventiva",
      tipoMedia: "imagen",
      urlMedia: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
      fuente: "Guías Clínicas Institucionales",
      destacado: false,
      activo: true,
      fecha: "2026-10-26T09:00:00.000Z"
    },
    {
      id: "curioso-5",
      titulo: "Rayos X de Baja Dosis: Diagnóstico de alta precisión con mínima radiación",
      descripcion: "Los detectores digitales modernos reducen hasta en un 60% la dosis de radiación recibida por toma en comparación con placas radiográficas analógicas antiguas, manteniendo una nitidez anatómica superior.",
      categoria: "Protección Radiológica",
      tipoMedia: "imagen",
      urlMedia: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80",
      fuente: "Área de Física Médica IPS ARCAL",
      destacado: false,
      activo: true,
      fecha: "2026-10-29T11:45:00.000Z"
    },
    {
      id: "curioso-6",
      titulo: "Monitoreo Holter 24h: Registro electrocardiográfico en su entorno habitual",
      descripcion: "Permite correlacionar síntomas como palpitaciones, mareos o sensación de fatiga con arritmias cardíacas transitorias mientras el paciente continúa con sus actividades cotidianas de trabajo y descanso.",
      categoria: "Cardiología",
      tipoMedia: "video",
      urlMedia: "https://www.youtube.com/embed/1O7q653B3V0",
      fuente: "Sociedad Colombiana de Cardiología",
      destacado: true,
      activo: true,
      fecha: "2026-11-01T16:20:00.000Z"
    }
  ];
}

if (!data.galeria || data.galeria.length === 0) {
  data.galeria = [
    {
      id: "gal-1",
      titulo: "Unidad Digital de Rayos X de Baja Dosis",
      descripcion: "Equipo de radiología digital de última generación con detectores planos para estudios esqueléticos y torácicos.",
      categoria: "Equipos de Alta Tecnología",
      tipoMedia: "imagen",
      urlMedia: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
      duracion: "",
      activo: true,
      fecha: "2026-10-10"
    },
    {
      id: "gal-2",
      titulo: "Ecógrafo Doppler Color Multidisciplinario",
      descripcion: "Transductores lineales y convexos de alta resolución para ecografía general, pélvica, vascular y de partes blandas.",
      categoria: "Equipos de Alta Tecnología",
      tipoMedia: "imagen",
      urlMedia: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
      duracion: "",
      activo: true,
      fecha: "2026-10-12"
    },
    {
      id: "gal-3",
      titulo: "Protocolos de Calibración y Seguridad Radiológica",
      descripcion: "Cápsula explicativa sobre el levantamiento radiométrico y verificación de blindajes en salas de procedimientos.",
      categoria: "Videos Cortos",
      tipoMedia: "video",
      urlMedia: "https://www.youtube.com/embed/g3_8q_037X0",
      duracion: "0:45 min",
      activo: true,
      fecha: "2026-10-15"
    },
    {
      id: "gal-4",
      titulo: "Consultorio de Cardiología y Pruebas Vasculares",
      descripcion: "Instalaciones climatizadas y dotadas para la instalación de grabadoras Holter y equipos de monitoreo MAPA.",
      categoria: "Instalaciones y Consultorios",
      tipoMedia: "imagen",
      urlMedia: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
      duracion: "",
      activo: true,
      fecha: "2026-10-18"
    },
    {
      id: "gal-5",
      titulo: "Procedimiento de Ecocardiograma Transtorácico",
      descripcion: "Resumen técnico de la adquisición de imágenes ecocardiográficas en ejes paraesternales y apicales.",
      categoria: "Videos Cortos",
      tipoMedia: "video",
      urlMedia: "https://www.youtube.com/embed/Z1BCUJX3pw8",
      duracion: "0:50 min",
      activo: true,
      fecha: "2026-10-22"
    },
    {
      id: "gal-6",
      titulo: "Sala de Procedimientos Menores Especializados",
      descripcion: "Espacio esterilizado y dotado para procedimientos ambulatorios de urología, otorrinolaringología y dermatología.",
      categoria: "Instalaciones y Consultorios",
      tipoMedia: "imagen",
      urlMedia: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
      duracion: "",
      activo: true,
      fecha: "2026-10-25"
    }
  ];
}

if (!data.pqrs || data.pqrs.length === 0) {
  data.pqrs = [
    {
      id: "pqrs-1",
      radicado: "PQRS-2026-0012",
      tipo: "Felicitación",
      nombreCompleto: "Gloria Elena Restrepo",
      tipoDocumento: "CC",
      numeroDocumento: "43512890",
      email: "gloria.restrepo@gmail.com",
      telefono: "3124567890",
      sedeId: "sede-3",
      servicio: "Consulta Médica Especializada - Cardiología",
      asunto: "Agradecimiento por excelente atención del especialista",
      descripcion: "Deseo manifestar mi felicitación al equipo asistencial de la sede Medellín El Poblado por la puntualidad, calidez humana y claridad durante la consulta y entrega de resultados.",
      estado: "Respondido",
      respuestaOficial: "Apreciada usuaria: Reciba un cordial saludo de la Dirección Médica de IPS ARCAL. Agradecemos su reconocimiento, el cual ha sido transmitido al equipo asistencial. Continuamos comprometidos con su bienestar y trato humanizado.",
      fechaRadicado: "2026-10-25T10:15:00.000Z",
      fechaRespuesta: "2026-10-26T14:30:00.000Z",
      atendidoPor: "Auditoría Médica y Calidad"
    },
    {
      id: "pqrs-2",
      radicado: "PQRS-2026-0018",
      tipo: "Petición",
      nombreCompleto: "Carlos Alberto Morales",
      tipoDocumento: "CC",
      numeroDocumento: "71298450",
      email: "carlos.morales@hotmail.com",
      telefono: "3008912345",
      sedeId: "sede-3",
      servicio: "Imágenes Diagnósticas & Radiología",
      asunto: "Solicitud de copia de informe radiológico con firma digital",
      descripcion: "Requiero que me sea remitida una copia del reporte oficial firmado digitalmente del estudio radiológico de columna lumbar realizado el pasado viernes.",
      estado: "En trámite",
      respuestaOficial: "",
      fechaRadicado: "2026-11-01T09:00:00.000Z",
      fechaRespuesta: null,
      atendidoPor: null
    }
  ];
}

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Datos iniciales de Datos Curiosos, Galería y PQRS sembrados exitosamente.');

