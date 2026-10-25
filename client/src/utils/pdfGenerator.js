import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ARCAL_LOGO_BASE64 } from './logoBase64';

/**
 * Genera y descarga el comprobante oficial en PDF de cita médica para ARCAL Protección Radiológica IPS
 * @param {Object} cita Objeto completo enriquecido de la cita
 */
export function generarComprobantePDF(cita) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colores corporativos oficiales de ARCAL
  const primaryColor = [11, 34, 51];     // #0B2233 (Azul pizarra profundo)
  const secondaryColor = [30, 125, 140]; // #1E7D8C (Cian oscuro institucional)
  const brandCyan = [54, 176, 193];      // #36B0C1 (Cian ARCAL)
  const accentColor = [140, 198, 63];    // #8CC63F (Verde lima ARCAL)
  const lightBg = [244, 248, 250];       // Fondo suave
  const darkText = [15, 23, 42];         // Slate 900
  const mutedText = [86, 110, 127];      // Slate clínico

  // 1. Barra superior decorativa con colores ARCAL
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(...brandCyan);
  doc.rect(0, 5, pageWidth * 0.65, 2, 'F');
  doc.setFillColor(...accentColor);
  doc.rect(pageWidth * 0.65, 5, pageWidth * 0.35, 2, 'F');

  // 2. Encabezado Institucional
  let currentY = 14;

  // Logo Oficial ARCAL
  try {
    doc.addImage(ARCAL_LOGO_BASE64, 'PNG', 14, currentY, 48, 13.3);
  } catch (e) {
    // Fallback si la imagen no carga
    doc.setFillColor(...primaryColor);
    doc.roundedRect(14, currentY, 14, 14, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ARCAL', 21, currentY + 8, { align: 'center' });
  }

  // Textos Institucionales
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('ARCAL PROTECCIÓN RADIOLÓGICA S.A.S. (IPS)', 66, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...mutedText);
  doc.text('NIT: 901.365.419-8  |  Código de Habilitación MinSalud: 0500109842-01', 66, currentY + 8.5);
  doc.text('Sede Medellín: (604) 604-8956  |  Urabá & Nacional  |  WhatsApp: +57 310 854 9210', 66, currentY + 12.5);

  // Línea divisoria
  currentY += 20;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);

  // 3. Tarjeta de Resumen / Código de Cita
  currentY += 6;
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 3, 3, 'F');
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 3, 3, 'S');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('COMPROBANTE OFICIAL DE ASIGNACIÓN DE CITA MÉDICA', 20, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text(`Canal de agendamiento: ${(cita.tipoAgendamiento || 'Web').toUpperCase()}  |  Estado: ${(cita.estado || 'Confirmada').toUpperCase()}`, 20, currentY + 14);

  // Código de Cita a la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text('CÓDIGO DE CITA', pageWidth - 20, currentY + 6, { align: 'right' });
  doc.setFontSize(13);
  doc.setTextColor(...secondaryColor);
  doc.text(cita.codigoCita || 'ARC-2026-0000', pageWidth - 20, currentY + 14, { align: 'right' });

  currentY += 26;

  // 4. Bloques en 2 Columnas (Datos del Paciente & Datos de la Cita)
  const colWidth = (pageWidth - 32) / 2;

  // Columna 1: DATOS DEL PACIENTE
  const boxHeight = 48;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, colWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, colWidth, boxHeight, 2, 2, 'S');

  doc.setFillColor(...primaryColor);
  doc.rect(14, currentY, colWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DATOS DEL PACIENTE', 18, currentY + 5);

  const pacienteY = currentY + 12;
  doc.setFontSize(7.8);
  doc.setTextColor(...mutedText);
  doc.text('Nombres y Apellidos:', 18, pacienteY);
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(`${cita.pacienteNombres || ''} ${cita.pacienteApellidos || ''}`, 18, pacienteY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('Documento de Identidad:', 18, pacienteY + 10);
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(`${cita.pacienteTipoDoc || 'CC'} ${cita.pacienteNumDoc || ''}`, 18, pacienteY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('Teléfono / Móvil:', 18, pacienteY + 20);
  doc.text('Aseguradora (EPS):', 18 + colWidth / 2, pacienteY + 20);

  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(cita.pacienteTelefono || 'No registrado', 18, pacienteY + 24);
  doc.setTextColor(...secondaryColor);
  doc.text(cita.pacienteAseguradora || 'Savia Salud', 18 + colWidth / 2, pacienteY + 24);

  // Email
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('Correo Electrónico:', 18, pacienteY + 29);
  doc.setTextColor(...darkText);
  doc.text(cita.pacienteEmail || 'No registrado', 18, pacienteY + 33);

  // Columna 2: DATOS DEL SERVICIO, CUPS Y PROFESIONAL
  const col2X = 14 + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, currentY, colWidth, boxHeight, 2, 2, 'F');
  doc.roundedRect(col2X, currentY, colWidth, boxHeight, 2, 2, 'S');

  doc.setFillColor(...secondaryColor);
  doc.rect(col2X, currentY, colWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SERVICIO MÉDICO & CÓDIGO CUPS', col2X + 4, currentY + 5);

  const medY = currentY + 12;
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.setFont('helvetica', 'normal');
  doc.text('Servicio / Especialidad:', col2X + 4, medY);
  doc.setTextColor(...secondaryColor);
  doc.setFont('helvetica', 'bold');
  const nombreServicio = (cita.especialidad?.nombre || cita.servicioNombre || 'Consulta Médica').substring(0, 36);
  doc.text(nombreServicio.toUpperCase(), col2X + 4, medY + 3.8);

  // Código CUPS y Tipo de Cita
  const tipoCitaTexto = cita.tipoCita === 'primera_vez' ? 'Primera Vez' : cita.tipoCita === 'control' ? 'Control / Seguimiento' : 'Procedimiento';
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('Código CUPS Oficial:', col2X + 4, medY + 9.5);
  doc.text('Tipo de Cita:', col2X + colWidth / 2, medY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`CUPS: ${cita.codigoCups || cita.especialidad?.codigo || 'N/A'}`, col2X + 4, medY + 13.5);
  doc.setTextColor(140, 198, 63); // Color lima para el tipo de cita
  doc.text(tipoCitaTexto, col2X + colWidth / 2, medY + 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('Profesional Asignado:', col2X + 4, medY + 19);
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  const medicoNombre = (cita.medico?.nombre || 'Médico Asignado').substring(0, 38);
  doc.text(medicoNombre, col2X + 4, medY + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('Registro Médico:', col2X + 4, medY + 28.5);
  doc.text('Consultorio:', col2X + colWidth / 2, medY + 28.5);

  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.text(cita.medico?.registroMedico || 'RM-HAB-001', col2X + 4, medY + 32.5);
  doc.text(cita.medico?.consultorio || 'Cons. 01', col2X + colWidth / 2, medY + 32.5);

  currentY += boxHeight + 4;

  // 5. BANNER DE FECHA, HORA Y SEDE (MUY DESTACADO)
  doc.setFillColor(...primaryColor);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'F');

  // Lado Izquierdo: Fecha y Hora
  doc.setTextColor(...accentColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FECHA Y HORA PROGRAMADA', 22, currentY + 7);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(`${formatearFechaLarga(cita.fecha)}`, 22, currentY + 15);
  doc.setFontSize(11);
  doc.setTextColor(224, 242, 254);
  doc.text(`Hora: ${cita.hora} (Llegar 15 min antes)`, 22, currentY + 21);

  // Lado Derecho: Sede y Dirección
  const rightX = pageWidth / 2 + 10;
  doc.setTextColor(...accentColor);
  doc.setFontSize(8);
  doc.text('SEDE DE ATENCIÓN PRESENCIAL', rightX, currentY + 7);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(cita.sede?.nombre || 'Sede Principal IPS ARCAL', rightX, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(224, 242, 254);
  const direccionLines = doc.splitTextToSize(cita.sede?.direccion || 'Consulte en recepción', (pageWidth - 28) / 2 - 10);
  doc.text(direccionLines, rightX, currentY + 19);

  currentY += 32;

  // 6. CAJA DE RECOMENDACIONES CLÍNICAS PREPARATORIAS SEGÚN LA ESPECIALIDAD
  doc.setFillColor(254, 243, 199); // Amarillo / Ámbar suave de advertencia médica
  doc.setDrawColor(245, 158, 11); // Borde ámbar
  doc.setLineWidth(0.8);
  doc.roundedRect(14, currentY, pageWidth - 28, 48, 3, 3, 'FD');

  doc.setTextColor(146, 64, 14); // Ámbar oscuro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`RECOMENDACIONES CLÍNICAS OBLIGATORIAS PARA: ${(cita.especialidad?.nombre || 'ESTA ESPECIALIDAD').toUpperCase()}`, 20, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(69, 26, 3);

  const recomendaciones = cita.especialidad?.recomendaciones || [
    "Presentar documento de identidad original en físico en la recepción de la sede.",
    "Llegar con 15 minutos de anticipación para el registro de signos vitales.",
    "Llevar historias clínicas, exámenes de laboratorio y fórmulas médicas previas.",
    "En caso de no poder asistir, cancelar con al menos 4 horas de anticipación."
  ];

  let recY = currentY + 13;
  recomendaciones.forEach((rec, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}.`, 20, recY);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(rec, pageWidth - 56);
    doc.text(lines, 26, recY);
    recY += (lines.length * 4) + 2;
  });

  currentY += 54;

  // 7. INSTRUCCIONES GENERALES & NORMAS DE BIOSEGURIDAD
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 32, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, pageWidth - 28, 32, 2, 2, 'S');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CONDICIONES DE ATENCIÓN Y POLÍTICA DE CANCELACIÓN', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkText);
  const terminos = [
    "• Documentos requeridos: Cédula de ciudadanía o documento de identidad en físico original, carné de EPS o póliza de salud.",
    "• Menores de edad: Obligatorio acompañamiento de padre/madre/tutor legal con documento de parentesco y carnet de vacunas.",
    "• Tolerancia de espera: Por respeto a la agenda médica, el tiempo máximo de espera es de 10 minutos pasada la hora citada.",
    "• Cancelación o reprogramación: Comuníquese con la línea (601) 745-8900 o gestione en la web con mínimo 4 horas de anterioridad."
  ];

  let termY = currentY + 12;
  terminos.forEach(t => {
    doc.text(t, 18, termY);
    termY += 4.5;
  });

  currentY += 38;

  // 8. PIE DE PÁGINA & SELLO DE VALIDACIÓN
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text(`Documento emitido electrónicamente por IPS ARCAL Protección Radiológica SAS | Fecha de emisión: ${new Date().toLocaleString('es-CO')}`, 14, pageHeight - 11);
  doc.text(`Identificador de seguridad: ${cita.id || 'SEC-000'} | Página 1 de 1`, pageWidth - 14, pageHeight - 11, { align: 'right' });

  // Pie institucional decorativo
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

  // Descargar el archivo
  const nombreArchivo = `Cita_${cita.codigoCita || 'ARCAL'}_${(cita.pacienteNombres || 'Paciente').replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}

function formatearFechaLarga(fechaStr) {
  if (!fechaStr) return '';
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formato = fecha.toLocaleDateString('es-CO', opciones);
  return formato.charAt(0).toUpperCase() + formato.slice(1);
}
