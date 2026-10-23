import * as XLSX from 'xlsx';

/**
 * Calcula la hora final sumando la duración en minutos
 */
export function calcularHoraFin(horaInicio, duracionMinutos = 30) {
  if (!horaInicio || !horaInicio.includes(':')) return '';
  const [h, m] = horaInicio.split(':').map(Number);
  const total = h * 60 + m + (parseInt(duracionMinutos, 10) || 30);
  const finH = Math.floor(total / 60) % 24;
  const finM = total % 60;
  return `${String(finH).padStart(2, '0')}:${String(finM).padStart(2, '0')}`;
}

/**
 * Exporta citas médicas a archivo de Excel (.xlsx) formateado para el programa Info Salud y gestión interna
 */
export function exportarCitasAExcel(citas, opciones = {}) {
  const {
    nombreEspecialista = 'Todos',
    fechaFiltro = 'Todas',
    sedeFiltro = 'Todas',
    nombreArchivoPersonalizado = null
  } = opciones;

  const filas = citas.map((c, index) => {
    const duracion = c.duracionMinutos || c.medico?.duracionCitaMinutos || c.especialidad?.duracionMinutos || 30;
    const horaFin = calcularHoraFin(c.hora, duracion);

    return {
      'TURNO': index + 1,
      'RADICADO': c.codigoCita || c.id,
      'FECHA_CITA': c.fecha || '',
      'HORA_INICIO': c.hora || '',
      'HORA_FIN': horaFin,
      'DURACION_MIN': duracion,
      'TIPO_DOC': c.pacienteTipoDoc || 'CC',
      'NUMERO_DOCUMENTO': c.pacienteNumDoc || '',
      'NOMBRES_PACIENTE': c.pacienteNombres || '',
      'APELLIDOS_PACIENTE': c.pacienteApellidos || '',
      'NOMBRE_COMPLETO': `${c.pacienteNombres || ''} ${c.pacienteApellidos || ''}`.trim(),
      'TELEFONO': c.pacienteTelefono || 'No registrado',
      'EMAIL': c.pacienteEmail || 'No registrado',
      'ASEGURADORA_EPS': c.pacienteAseguradora || 'Particular',
      'ESPECIALIDAD': c.especialidad?.nombre || 'General',
      'MEDICO_ESPECIALISTA': c.medico?.nombre || 'Por asignar',
      'REGISTRO_MEDICO': c.medico?.registroMedico || '',
      'CONSULTORIO': c.medico?.consultorio || 'General',
      'SEDE': c.sede?.nombre || 'Sede Principal',
      'CIUDAD': c.sede?.ciudad || 'Bogotá D.C.',
      'CANAL': (c.tipoAgendamiento || 'web').toUpperCase(),
      'ESTADO_CITA': (c.estado || 'agendada').toUpperCase(),
      'MOTIVO_CONSULTA': c.motivoConsulta || 'Consulta médica especializada'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(filas);

  // Ajustar anchos automáticos de columnas
  const colWidths = [
    { wch: 8 },  // Turno
    { wch: 16 }, // Radicado
    { wch: 13 }, // Fecha
    { wch: 12 }, // Hora Inicio
    { wch: 12 }, // Hora Fin
    { wch: 14 }, // Duración min
    { wch: 10 }, // Tipo Doc
    { wch: 18 }, // Número Documento
    { wch: 22 }, // Nombres
    { wch: 22 }, // Apellidos
    { wch: 30 }, // Nombre Completo
    { wch: 16 }, // Teléfono
    { wch: 26 }, // Email
    { wch: 22 }, // Aseguradora EPS
    { wch: 24 }, // Especialidad
    { wch: 30 }, // Médico
    { wch: 18 }, // Registro Médico
    { wch: 16 }, // Consultorio
    { wch: 28 }, // Sede
    { wch: 16 }, // Ciudad
    { wch: 14 }, // Canal
    { wch: 16 }, // Estado
    { wch: 40 }  // Motivo
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Agenda Info Salud');

  // Construir nombre de archivo amigable
  const sanitize = (str) => String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fechaStr = fechaFiltro !== 'Todas' ? sanitize(fechaFiltro) : new Date().toISOString().split('T')[0];
  const espStr = nombreEspecialista !== 'Todos' ? sanitize(nombreEspecialista) : 'General';
  const nombreFinal = nombreArchivoPersonalizado || `Agenda_InfoSalud_${espStr}_${fechaStr}.xlsx`;

  XLSX.writeFile(workbook, nombreFinal);
  return nombreFinal;
}

/**
 * Genera y exporta la agenda completa de un especialista (incluyendo citas y pausas médicas)
 */
export function exportarAgendaEspecialistaCompleta(medico, fecha, citasDelDia, slotsDelDia = []) {
  const duracion = parseInt(medico.duracionCitaMinutos, 10) || 30;
  const pausas = medico.pausas || [];

  const citasMap = new Map();
  citasDelDia.forEach(c => {
    citasMap.set(c.hora, c);
  });

  const pausasMap = new Map();
  pausas.forEach(p => {
    pausasMap.set(p.horaInicio, p);
  });

  const filas = slotsDelDia.map((slot, index) => {
    const hora = slot.hora;
    const horaFin = calcularHoraFin(hora, duracion);
    const cita = citasMap.get(hora);
    const pausa = pausas.find(p => p.horaInicio <= hora && p.horaFin > hora);

    let tipoEstado = 'DISPONIBLE';
    let paciente = '';
    let doc = '';
    let tel = '';
    let eps = '';
    let radicado = '';
    let motivo = '';
    let canal = '';

    if (cita) {
      tipoEstado = cita.estado.toUpperCase();
      paciente = `${cita.pacienteNombres} ${cita.pacienteApellidos}`;
      doc = `${cita.pacienteTipoDoc} ${cita.pacienteNumDoc}`;
      tel = cita.pacienteTelefono;
      eps = cita.pacienteAseguradora;
      radicado = cita.codigoCita;
      motivo = cita.motivoConsulta;
      canal = cita.tipoAgendamiento.toUpperCase();
    } else if (pausa) {
      tipoEstado = 'PAUSA_MEDICA';
      motivo = `Momento de pausa: ${pausa.motivo || 'Descanso programado'}`;
    }

    return {
      'TURNO': index + 1,
      'FECHA': fecha,
      'HORA_INICIO': hora,
      'HORA_FIN': horaFin,
      'DURACION_MIN': duracion,
      'ESTADO_HORARIO': tipoEstado,
      'RADICADO': radicado,
      'PACIENTE': paciente,
      'DOCUMENTO': doc,
      'TELEFONO': tel,
      'EPS_ASEGURADORA': eps,
      'ESPECIALISTA': medico.nombre,
      'CONSULTORIO': medico.consultorio,
      'CANAL': canal,
      'MOTIVO_O_DESCANSO': motivo
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(filas);
  worksheet['!cols'] = [
    { wch: 8 },  // Turno
    { wch: 13 }, // Fecha
    { wch: 12 }, // Hora Inicio
    { wch: 12 }, // Hora Fin
    { wch: 14 }, // Duración
    { wch: 18 }, // Estado
    { wch: 16 }, // Radicado
    { wch: 30 }, // Paciente
    { wch: 20 }, // Documento
    { wch: 16 }, // Teléfono
    { wch: 22 }, // EPS
    { wch: 30 }, // Especialista
    { wch: 16 }, // Consultorio
    { wch: 14 }, // Canal
    { wch: 38 }  // Motivo o Descanso
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Agenda Detallada Info Salud');

  const sanitize = (str) => String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Agenda_Detallada_${sanitize(medico.nombre)}_${fecha}.xlsx`;
  XLSX.writeFile(workbook, filename);
  return filename;
}
