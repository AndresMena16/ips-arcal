import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Log de solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Configuración general de la IPS
const IPS_INFO = {
  nombreLegal: "ARCAL Protección Radiológica S.A.S.",
  nombreComercial: "ARCAL Protección Radiológica IPS",
  sigla: "ARCAL IPS",
  nit: "901.365.419-8",
  codigoHabilitacion: "0500109842-01",
  domicilioPrincipal: "Calle 19A # 44-25, Consultorio 2209, Edificio Salud y Servicios, Medellín, Antioquia",
  pbxMedellin: "(604) 604-8956",
  pbxBogota: "(601) 745-8900",
  whatsapp: "+57 310 854 9210",
  correo: "contacto@arcal.com.co",
  web: "https://arcal.com.co"
};

app.get('/api/config', (req, res) => {
  res.json({ success: true, data: IPS_INFO });
});

// ==========================================
// SEDES (CRUD) & ESPECIALIDADES HABILITADAS
// ==========================================
function obtenerEspecialidadesHabilitadasParaSede(sede, currentDb) {
  if (Array.isArray(sede.especialidadesHabilitadas) && sede.especialidadesHabilitadas.length > 0) {
    return sede.especialidadesHabilitadas;
  }
  // Si no está configurado explícitamente, deducir de los médicos registrados en la sede
  const medicosSede = (currentDb.medicos || []).filter(m => m.sedeId === sede.id);
  const espMedicos = [...new Set(medicosSede.map(m => m.especialidadId).filter(Boolean))];
  return espMedicos;
}

app.get('/api/sedes', (req, res) => {
  const currentDb = db.get();
  const sedesConEspecialidades = currentDb.sedes.map(sede => {
    const espIds = obtenerEspecialidadesHabilitadasParaSede(sede, currentDb);
    const espDetalles = (currentDb.especialidades || []).filter(e => espIds.includes(e.id));
    return {
      ...sede,
      especialidadesHabilitadas: espIds,
      especialidadesDetalle: espDetalles
    };
  });
  res.json({ success: true, data: sedesConEspecialidades });
});

app.post('/api/sedes', (req, res) => {
  const currentDb = db.get();
  const { codigo, nombre, ciudad, direccion, telefono, email, horarioAtencion, consultorios, especialidadesHabilitadas } = req.body;

  if (!nombre || !ciudad || !direccion) {
    return res.status(400).json({ success: false, error: "Nombre, ciudad y dirección son obligatorios" });
  }

  const nuevaSede = {
    id: `sede-${uuidv4().substring(0, 8)}`,
    codigo: (codigo || nombre.substring(0, 3)).toUpperCase(),
    nombre,
    ciudad,
    direccion,
    telefono: telefono || "",
    email: email || "",
    horarioAtencion: horarioAtencion || "Lunes a Viernes: 7:00 AM - 5:00 PM",
    consultorios: parseInt(consultorios, 10) || 4,
    activa: true,
    especialidadesHabilitadas: Array.isArray(especialidadesHabilitadas) ? especialidadesHabilitadas : []
  };

  currentDb.sedes.push(nuevaSede);
  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "CREAR_SEDE",
    descripcion: `Nueva sede creada: ${nuevaSede.nombre} en ${nuevaSede.ciudad}`
  });

  db.save(currentDb);

  const espIds = obtenerEspecialidadesHabilitadasParaSede(nuevaSede, currentDb);
  const espDetalles = (currentDb.especialidades || []).filter(e => espIds.includes(e.id));

  res.status(201).json({
    success: true,
    data: {
      ...nuevaSede,
      especialidadesHabilitadas: espIds,
      especialidadesDetalle: espDetalles
    }
  });
});

app.put('/api/sedes/:id', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const index = currentDb.sedes.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Sede no encontrada" });
  }

  currentDb.sedes[index] = {
    ...currentDb.sedes[index],
    ...req.body,
    id // id no cambia
  };

  if (Array.isArray(req.body.especialidadesHabilitadas)) {
    currentDb.sedes[index].especialidadesHabilitadas = req.body.especialidadesHabilitadas;
  }

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "MODIFICAR_SEDE",
    descripcion: `Sede actualizada: ${currentDb.sedes[index].nombre}`
  });

  db.save(currentDb);

  const espIds = obtenerEspecialidadesHabilitadasParaSede(currentDb.sedes[index], currentDb);
  const espDetalles = (currentDb.especialidades || []).filter(e => espIds.includes(e.id));

  res.json({
    success: true,
    data: {
      ...currentDb.sedes[index],
      especialidadesHabilitadas: espIds,
      especialidadesDetalle: espDetalles
    }
  });
});

app.delete('/api/sedes/:id', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const sede = currentDb.sedes.find(s => s.id === id);

  if (!sede) {
    return res.status(404).json({ success: false, error: "Sede no encontrada" });
  }

  // Desactivación lógica
  sede.activa = false;
  db.save(currentDb);
  res.json({ success: true, message: "Sede desactivada exitosamente", data: sede });
});

// ==========================================
// ESPECIALIDADES
// ==========================================
app.get('/api/especialidades', (req, res) => {
  const currentDb = db.get();
  const { sedeId } = req.query;

  if (sedeId) {
    const sede = currentDb.sedes.find(s => s.id === sedeId);
    if (sede) {
      const espIds = obtenerEspecialidadesHabilitadasParaSede(sede, currentDb);
      const filtradas = currentDb.especialidades.filter(e => espIds.includes(e.id));
      return res.json({ success: true, data: filtradas });
    }
  }

  res.json({ success: true, data: currentDb.especialidades });
});

app.post('/api/especialidades', (req, res) => {
  const currentDb = db.get();
  const {
    nombre,
    codigo,
    departamento,
    descripcion,
    duracionMinutos,
    icono,
    recomendaciones,
    esConsulta,
    activa,
    modalidades
  } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ success: false, error: "El nombre de la especialidad es obligatorio" });
  }

  const slug = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 30);
  const uniqueSuffix = uuidv4().substring(0, 6);
  const id = `esp-${slug || 'servicio'}-${uniqueSuffix}`;

  let recs = [];
  if (Array.isArray(recomendaciones)) {
    recs = recomendaciones.filter(r => r && typeof r === 'string' && r.trim());
  } else if (typeof recomendaciones === 'string') {
    recs = recomendaciones.split('\n').map(r => r.trim()).filter(Boolean);
  }

  const nuevaEspecialidad = {
    id,
    nombre: nombre.trim(),
    codigo: (codigo || slug.toUpperCase().substring(0, 8) || 'ESP').trim(),
    departamento: (departamento || 'Especialidades Médicas').trim(),
    descripcion: (descripcion || '').trim(),
    duracionMinutos: parseInt(duracionMinutos, 10) || 30,
    icono: icono || (esConsulta !== false ? 'Stethoscope' : 'Activity'),
    esConsulta: esConsulta !== false,
    activa: activa !== false,
    modalidades: Array.isArray(modalidades) ? modalidades : [],
    recomendaciones: recs
  };

  currentDb.especialidades.push(nuevaEspecialidad);

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "CREAR_ESPECIALIDAD",
    descripcion: `Nueva especialidad creada: ${nuevaEspecialidad.nombre} (${nuevaEspecialidad.codigo}) en [${nuevaEspecialidad.departamento}].`
  });

  db.save(currentDb);
  res.status(201).json({ success: true, data: nuevaEspecialidad });
});

app.put('/api/especialidades/:id', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const index = currentDb.especialidades.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Especialidad no encontrada" });
  }

  const espPrev = currentDb.especialidades[index];
  const body = req.body;

  let recs = espPrev.recomendaciones || [];
  if (body.recomendaciones !== undefined) {
    if (Array.isArray(body.recomendaciones)) {
      recs = body.recomendaciones.filter(r => r && typeof r === 'string' && r.trim());
    } else if (typeof body.recomendaciones === 'string') {
      recs = body.recomendaciones.split('\n').map(r => r.trim()).filter(Boolean);
    }
  }

  currentDb.especialidades[index] = {
    ...espPrev,
    ...body,
    id,
    duracionMinutos: body.duracionMinutos !== undefined ? (parseInt(body.duracionMinutos, 10) || 30) : espPrev.duracionMinutos,
    recomendaciones: recs
  };

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "MODIFICAR_ESPECIALIDAD",
    descripcion: `Especialidad ${currentDb.especialidades[index].nombre} actualizada.`
  });

  db.save(currentDb);
  res.json({ success: true, data: currentDb.especialidades[index] });
});

app.delete('/api/especialidades/:id', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const index = currentDb.especialidades.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Especialidad no encontrada" });
  }

  const medicosAsociados = (currentDb.medicos || []).filter(m => m.especialidadId === id);
  if (medicosAsociados.length > 0 && req.query.forzar !== 'true') {
    return res.status(400).json({
      success: false,
      error: `No se puede eliminar la especialidad porque tiene ${medicosAsociados.length} médico(s) asignado(s). Reasigne o elimine los médicos primero.`
    });
  }

  const especialidadEliminada = currentDb.especialidades.splice(index, 1)[0];

  (currentDb.sedes || []).forEach(sede => {
    if (Array.isArray(sede.especialidadesHabilitadas)) {
      sede.especialidadesHabilitadas = sede.especialidadesHabilitadas.filter(espId => espId !== id);
    }
  });

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "ELIMINAR_ESPECIALIDAD",
    descripcion: `Especialidad ${especialidadEliminada.nombre} (${especialidadEliminada.codigo}) eliminada del sistema.`
  });

  db.save(currentDb);
  res.json({ success: true, message: `Especialidad "${especialidadEliminada.nombre}" eliminada exitosamente` });
});

// ==========================================
// MÉDICOS (CRUD)
// ==========================================
app.get('/api/medicos', (req, res) => {
  const currentDb = db.get();
  const { sedeId, departamento, especialidadId } = req.query;

  let filtrados = req.query.incluirInactivos === 'true'
    ? [...currentDb.medicos]
    : currentDb.medicos.filter(m => m.activo !== false);

  if (sedeId) {
    filtrados = filtrados.filter(m => m.sedeId === sedeId);
  }
  if (departamento) {
    filtrados = filtrados.filter(m => m.departamento === departamento);
  }
  if (especialidadId) {
    const esp = currentDb.especialidades.find(e => e.id === especialidadId);
    if (esp && esp.departamento) {
      filtrados = filtrados.filter(m => m.departamento === esp.departamento || m.especialidadId === especialidadId);
    } else {
      filtrados = filtrados.filter(m => m.especialidadId === especialidadId);
    }
  }

  // Enriquecer con nombres de sede y departamento clínico
  const medicosEnriquecidos = filtrados.map(medico => {
    const sede = currentDb.sedes.find(s => s.id === medico.sedeId);
    const esp = currentDb.especialidades.find(e => e.id === medico.especialidadId);
    const depNombre = medico.departamento || (esp ? esp.departamento : 'General');
    return {
      ...medico,
      departamento: depNombre,
      sedeNombre: sede ? sede.nombre : 'No asignada',
      especialidadNombre: depNombre
    };
  });

  res.json({ success: true, data: medicosEnriquecidos });
});

app.post('/api/medicos', (req, res) => {
  const currentDb = db.get();
  const { nombre, registroMedico, departamento, especialidadId, sedeId, consultorio, diasAtencion, horaInicio, horaFin, duracionCitaMinutos, pausas } = req.body;

  const depFinal = (departamento || '').trim() || (especialidadId ? currentDb.especialidades.find(e => e.id === especialidadId)?.departamento : '');

  if (!nombre || !depFinal || !sedeId) {
    return res.status(400).json({ success: false, error: "Nombre, Departamento Clínico (REPS) y sede son obligatorios" });
  }

  const nuevoMedico = {
    id: `med-${uuidv4().substring(0, 8)}`,
    nombre: nombre.trim(),
    registroMedico: registroMedico || `RM-${Math.floor(100000 + Math.random() * 900000)}`,
    departamento: depFinal,
    especialidadId: especialidadId || null,
    sedeId,
    consultorio: consultorio || "Cons. General",
    diasAtencion: diasAtencion || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    horaInicio: horaInicio || "08:00",
    horaFin: horaFin || "17:00",
    duracionCitaMinutos: parseInt(duracionCitaMinutos, 10) || 30, // Predeterminada 30 min
    pausas: Array.isArray(pausas) ? pausas : [],
    activo: true
  };

  currentDb.medicos.push(nuevoMedico);

  // Asegurar que las especialidades del departamento queden habilitadas en la sede del médico
  const sedeAsociada = currentDb.sedes.find(s => s.id === sedeId);
  if (sedeAsociada) {
    if (!Array.isArray(sedeAsociada.especialidadesHabilitadas)) {
      sedeAsociada.especialidadesHabilitadas = [];
    }
    const espsDelDepto = currentDb.especialidades.filter(e => e.departamento === depFinal).map(e => e.id);
    espsDelDepto.forEach(espId => {
      if (!sedeAsociada.especialidadesHabilitadas.includes(espId)) {
        sedeAsociada.especialidadesHabilitadas.push(espId);
      }
    });
  }

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "CREAR_MEDICO",
    descripcion: `Nuevo médico creado: ${nuevoMedico.nombre} (${nuevoMedico.registroMedico}) asignado a departamento [${nuevoMedico.departamento}] con citas de ${nuevoMedico.duracionCitaMinutos} min.`
  });

  db.save(currentDb);
  res.status(201).json({ success: true, data: nuevoMedico });
});

app.put('/api/medicos/:id', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const index = currentDb.medicos.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Médico no encontrado" });
  }

  const medicoPrevio = currentDb.medicos[index];
  const { duracionCitaMinutos, pausas, departamento, ...restoCampos } = req.body;

  currentDb.medicos[index] = {
    ...medicoPrevio,
    ...restoCampos,
    ...(departamento ? { departamento: departamento.trim() } : {}),
    ...(duracionCitaMinutos !== undefined ? { duracionCitaMinutos: parseInt(duracionCitaMinutos, 10) || 30 } : {}),
    ...(pausas !== undefined ? { pausas: Array.isArray(pausas) ? pausas : [] } : {}),
    id
  };

  const medActualizado = currentDb.medicos[index];
  const sedeAsociada = currentDb.sedes.find(s => s.id === medActualizado.sedeId);
  if (sedeAsociada && medActualizado.departamento) {
    if (!Array.isArray(sedeAsociada.especialidadesHabilitadas)) {
      sedeAsociada.especialidadesHabilitadas = [];
    }
    const espsDelDepto = currentDb.especialidades.filter(e => e.departamento === medActualizado.departamento).map(e => e.id);
    espsDelDepto.forEach(espId => {
      if (!sedeAsociada.especialidadesHabilitadas.includes(espId)) {
        sedeAsociada.especialidadesHabilitadas.push(espId);
      }
    });
  }

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "ACTUALIZAR_MEDICO",
    descripcion: `Médico ${medActualizado.nombre} actualizado en departamento [${medActualizado.departamento || 'General'}]. Duración de cita: ${medActualizado.duracionCitaMinutos || 30} min. Pausas activas: ${(medActualizado.pausas || []).length}.`
  });

  db.save(currentDb);
  res.json({ success: true, data: currentDb.medicos[index] });
});

app.delete('/api/medicos/:id', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const { permanente } = req.query;

  const index = currentDb.medicos.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Médico no encontrado" });
  }

  const medico = currentDb.medicos[index];

  if (permanente === 'true') {
    currentDb.medicos.splice(index, 1);
    currentDb.historialAuditoria.push({
      id: `log-${Date.now()}`,
      fecha: new Date().toISOString(),
      accion: "ELIMINAR_MEDICO",
      descripcion: `Médico ${medico.nombre} (${medico.registroMedico}) eliminado permanentemente del sistema.`
    });
    db.save(currentDb);
    return res.json({ success: true, message: `Médico ${medico.nombre} eliminado permanentemente`, data: medico });
  }

  medico.activo = !medico.activo;
  db.save(currentDb);
  res.json({ success: true, message: `Médico ${medico.activo ? 'activado' : 'desactivado'} exitosamente`, data: medico });
});

// ==========================================
// AUTENTICACIÓN Y GESTIÓN DE AGENTES / USUARIOS
// ==========================================

// Iniciar sesión (admin o agente de atención al cliente)
app.post('/api/auth/login', (req, res) => {
  const currentDb = db.get();
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Usuario y contraseña requeridos" });
  }

  const user = (currentDb.usuarios || []).find(
    u => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, error: "Credenciales inválidas. Verifique usuario o contraseña." });
  }

  // Verificar si está habilitado
  if (user.activo === false) {
    return res.status(403).json({
      success: false,
      error: "Este agente ha sido deshabilitado por el administrador. Contacte a la dirección de IPS ARCAL para su habilitación."
    });
  }

  // Enriquecer sedes asignadas con sus nombres reales
  const sedesDetalle = (user.sedesAsignadas || []).map(sedeId => {
    const s = currentDb.sedes.find(item => item.id === sedeId);
    return s ? { id: s.id, nombre: s.nombre, ciudad: s.ciudad } : null;
  }).filter(Boolean);

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "LOGIN_USUARIO",
    descripcion: `Usuario ${user.username} (${user.rol.toUpperCase()}) inició sesión en el sistema.`
  });
  db.save(currentDb);

  const { password: _, ...usuarioSinPassword } = user;
  res.json({
    success: true,
    message: "Inicio de sesión exitoso",
    data: {
      ...usuarioSinPassword,
      sedesDetalle
    }
  });
});

// Listar usuarios / agentes
app.get('/api/usuarios', (req, res) => {
  const currentDb = db.get();
  const usuarios = (currentDb.usuarios || []).map(u => {
    const { password: _, ...sinPass } = u;
    const sedesDetalle = (u.sedesAsignadas || []).map(sId => {
      const s = currentDb.sedes.find(item => item.id === sId);
      return s ? { id: s.id, nombre: s.nombre, ciudad: s.ciudad } : null;
    }).filter(Boolean);

    return {
      ...sinPass,
      sedesDetalle
    };
  });

  res.json({ success: true, count: usuarios.length, data: usuarios });
});

// Crear nuevo usuario (Administrador, Super Admin o Agente de Atención)
app.post('/api/usuarios', (req, res) => {
  const currentDb = db.get();
  const { nombre, username, password, email, cargo, rol, sedesAsignadas, activo } = req.body;

  if (!nombre || !username || !password) {
    return res.status(400).json({ success: false, error: "Nombre, nombre de usuario y contraseña son requeridos" });
  }

  const existe = (currentDb.usuarios || []).find(
    u => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (existe) {
    return res.status(409).json({ success: false, error: `El nombre de usuario "${username}" ya está registrado.` });
  }

  const rolDefinido = ['superadmin', 'admin', 'agente'].includes(rol) ? rol : 'agente';

  const nuevoUsuario = {
    id: `usr-${uuidv4().substring(0, 8)}`,
    nombre: nombre.trim(),
    username: username.trim().toLowerCase(),
    password: password.trim(),
    email: email ? email.trim() : "",
    cargo: cargo || (rolDefinido === 'superadmin' ? 'Super Administrador del Sistema' : rolDefinido === 'admin' ? 'Administrador de Sede' : 'Agente de Atención al Cliente'),
    rol: rolDefinido,
    sedesAsignadas: Array.isArray(sedesAsignadas) ? sedesAsignadas : [],
    activo: activo !== false,
    creadoEn: new Date().toISOString()
  };

  currentDb.usuarios.push(nuevoUsuario);
  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "CREAR_USUARIO",
    descripcion: `Nuevo usuario creado: ${nuevoUsuario.nombre} (@${nuevoUsuario.username}) con rol [${nuevoUsuario.rol.toUpperCase()}].`
  });

  db.save(currentDb);

  const { password: _, ...sinPass } = nuevoUsuario;
  res.status(201).json({ success: true, data: sinPass });
});

// Actualizar usuario / agente / admin (datos, sedes asignadas, clave, rol)
app.put('/api/usuarios/:id', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const index = (currentDb.usuarios || []).findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  }

  const usuarioActual = currentDb.usuarios[index];
  const { password, ...otrosCampos } = req.body;

  // Protección para la cuenta superadmin principal
  if (usuarioActual.id === 'usr-superadmin' || usuarioActual.username === 'superadmin') {
    if (otrosCampos.rol && otrosCampos.rol !== 'superadmin') {
      return res.status(400).json({ success: false, error: "No es posible cambiar el rol del Super Administrador principal." });
    }
    if (otrosCampos.activo === false) {
      return res.status(400).json({ success: false, error: "No es posible deshabilitar el Super Administrador principal." });
    }
  }

  currentDb.usuarios[index] = {
    ...usuarioActual,
    ...otrosCampos,
    ...(password ? { password: password.trim() } : {}),
    id // No se cambia el id
  };

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "MODIFICAR_USUARIO",
    descripcion: `Usuario @${usuarioActual.username} actualizado (Rol: ${currentDb.usuarios[index].rol.toUpperCase()})`
  });

  db.save(currentDb);

  const { password: _, ...sinPass } = currentDb.usuarios[index];
  res.json({ success: true, data: sinPass });
});

// Habilitar / Deshabilitar usuario directamente
app.put('/api/usuarios/:id/toggle-estado', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const usuario = (currentDb.usuarios || []).find(u => u.id === id);

  if (!usuario) {
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  }

  if (usuario.id === 'usr-superadmin' || usuario.username === 'superadmin') {
    return res.status(400).json({ success: false, error: "El Super Administrador principal no puede ser deshabilitado." });
  }

  usuario.activo = !usuario.activo;

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "ESTADO_USUARIO",
    descripcion: `Usuario @${usuario.username} (${usuario.rol.toUpperCase()}) ${usuario.activo ? 'HABILITADO' : 'DESHABILITADO'}.`
  });

  db.save(currentDb);
  res.json({
    success: true,
    message: `Usuario ${usuario.nombre} ${usuario.activo ? 'habilitado' : 'deshabilitado'} exitosamente`,
    data: { id: usuario.id, activo: usuario.activo }
  });
});

// Eliminar usuario
app.delete('/api/usuarios/:id', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const index = (currentDb.usuarios || []).findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Usuario no encontrado" });
  }

  const usuario = currentDb.usuarios[index];
  if (usuario.id === 'usr-superadmin' || usuario.username === 'superadmin') {
    return res.status(400).json({ success: false, error: "El Super Administrador principal no puede ser eliminado." });
  }

  const usuarioEliminado = currentDb.usuarios.splice(index, 1)[0];

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "ELIMINAR_USUARIO",
    descripcion: `Usuario @${usuarioEliminado.username} (${usuarioEliminado.rol.toUpperCase()}) eliminado del sistema.`
  });

  db.save(currentDb);
  res.json({ success: true, message: `Usuario ${usuarioEliminado.nombre} eliminado exitosamente` });
});

// Helper para calcular slots de atención de un médico en una fecha específica
function calcularSlotsParaMedico(medico, fecha, currentDb, excluirCitaId = null) {
  const especialidad = currentDb.especialidades.find(e => e.id === medico.especialidadId);
  // Duración configurada por el Super Admin (por defecto 30 minutos, o duración de la especialidad)
  const duracion = parseInt(medico.duracionCitaMinutos, 10) || especialidad?.duracionMinutos || 30;

  const [startHour, startMin] = medico.horaInicio.split(':').map(Number);
  const [endHour, endMin] = medico.horaFin.split(':').map(Number);

  const slots = [];
  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const pausas = Array.isArray(medico.pausas) ? medico.pausas : [];

  while (currentMinutes + duracion <= endMinutes) {
    const slotHour = Math.floor(currentMinutes / 60);
    const slotMin = currentMinutes % 60;
    const slotStart = currentMinutes;
    const slotEnd = currentMinutes + duracion;

    // Verificar si el bloque se cruza con algún momento de pausa/descanso programado por el Super Admin
    const enPausa = pausas.some(p => {
      const [pH1, pM1] = p.horaInicio.split(':').map(Number);
      const [pH2, pM2] = p.horaFin.split(':').map(Number);
      const pStart = pH1 * 60 + pM1;
      const pEnd = pH2 * 60 + pM2;
      return slotStart < pEnd && slotEnd > pStart;
    });

    // Pausa de almuerzo entre 12:00 y 13:00 (a menos que se haya cubierto con pausas específicas)
    const esAlmuerzo = slotHour === 12;

    if (!enPausa && !esAlmuerzo) {
      const timeString = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;
      slots.push(timeString);
    }
    currentMinutes += duracion;
  }

  // Buscar citas ya agendadas para este médico en esta fecha que no estén canceladas ni no asistidas
  const citasTomadas = currentDb.citas.filter(c =>
    c.medicoId === medico.id &&
    c.fecha === fecha &&
    (!excluirCitaId || (c.id !== excluirCitaId && c.codigoCita !== excluirCitaId)) &&
    !['cancelada', 'no_asistio', 'llego_tarde_cancelada'].includes(c.estado)
  );

  const horasOcupadasMap = new Map();
  citasTomadas.forEach(c => {
    horasOcupadasMap.set(c.hora, {
      tipoAgendamiento: c.tipoAgendamiento,
      codigoCita: c.codigoCita
    });
  });

  // Control de fecha y hora transcurrida
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  const currentNowMinutes = now.getHours() * 60 + now.getMinutes();

  const esFechaPasada = fecha < todayStr;
  const esHoy = fecha === todayStr;

  const slotsDisponibilidad = [];

  if (!esFechaPasada) {
    slots.forEach(hora => {
      const [slotH, slotM] = hora.split(':').map(Number);
      const slotTotalMinutes = slotH * 60 + slotM;

      // Si es hoy y el horario ya transcurrió, no debe aparecer
      if (esHoy && slotTotalMinutes <= currentNowMinutes) {
        return;
      }

      const ocupada = horasOcupadasMap.has(hora);
      slotsDisponibilidad.push({
        hora,
        disponible: !ocupada,
        canalOcupado: ocupada ? horasOcupadasMap.get(hora).tipoAgendamiento : null
      });
    });
  }

  return slotsDisponibilidad;
}

// ==========================================
// DISPONIBILIDAD (MOTOR SINCRONIZADO EN TIEMPO REAL)
// ==========================================
app.get('/api/disponibilidad', (req, res) => {
  const currentDb = db.get();
  const { medicoId, sedeId, fecha, excluirCitaId } = req.query;

  if (!medicoId || !fecha) {
    return res.status(400).json({ success: false, error: "medicoId y fecha son requeridos (YYYY-MM-DD)" });
  }

  const medico = currentDb.medicos.find(m => m.id === medicoId);
  if (!medico) {
    return res.status(404).json({ success: false, error: "Médico no encontrado" });
  }

  const especialidad = currentDb.especialidades.find(e => e.id === medico.especialidadId);
  const depNombre = medico.departamento || (especialidad ? especialidad.departamento : 'General');
  const slots = calcularSlotsParaMedico(medico, fecha, currentDb, excluirCitaId);

  res.json({
    success: true,
    data: {
      fecha,
      medicoId,
      medicoNombre: medico.nombre,
      departamento: depNombre,
      especialidad: depNombre,
      duracionCitaMinutos: parseInt(medico.duracionCitaMinutos, 10) || 30,
      pausas: medico.pausas || [],
      sedeId: medico.sedeId,
      slots
    }
  });
});

// ESCANEAR DISPONIBILIDAD MÁS CERCANA EN LOS SIGUIENTES 5 DÍAS HÁBILES
app.get('/api/disponibilidad/proximos-dias', (req, res) => {
  const currentDb = db.get();
  const { especialidadId, departamento, sedeId, dias = 5 } = req.query;

  if (!especialidadId && !departamento) {
    return res.status(400).json({ success: false, error: "especialidadId o departamento es requerido" });
  }

  const targetDept = departamento || (especialidadId ? currentDb.especialidades.find(e => e.id === especialidadId)?.departamento : null);

  // Filtrar médicos activos por departamento clínico
  let medicosDisponibles = currentDb.medicos.filter(m => {
    if (m.activo === false) return false;
    if (targetDept && m.departamento === targetDept) return true;
    if (especialidadId && m.especialidadId === especialidadId) return true;
    return false;
  });
  if (sedeId) {
    medicosDisponibles = medicosDisponibles.filter(m => m.sedeId === sedeId);
  }

  const numDias = parseInt(dias, 10) || 5;
  const slotsCercanos = [];
  const now = new Date();
  let diasAgregados = 0;
  let offset = 0;

  // Escanear los siguientes N días (excluyendo domingos)
  while (diasAgregados < numDias && offset < 15) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dayOfWeek = d.getDay(); // 0 = Domingo

    if (dayOfWeek !== 0) {
      const fechaStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d);

      const nombreDia = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });

      medicosDisponibles.forEach(med => {
        const slotsDelDia = calcularSlotsParaMedico(med, fechaStr, currentDb);
        slotsDelDia.filter(s => s.disponible).forEach(s => {
          slotsCercanos.push({
            fecha: fechaStr,
            fechaTexto: nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1),
            hora: s.hora,
            medicoId: med.id,
            medicoNombre: med.nombre,
            consultorio: med.consultorio,
            sedeId: med.sedeId
          });
        });
      });

      diasAgregados++;
    }
    offset++;
  }

  // Ordenar cronológicamente
  slotsCercanos.sort((a, b) => {
    const compFecha = a.fecha.localeCompare(b.fecha);
    if (compFecha !== 0) return compFecha;
    return a.hora.localeCompare(b.hora);
  });

  const hayDisponibilidad = slotsCercanos.length > 0;
  const mensajeOficial = !hayDisponibilidad
    ? "Actualmente no hay disponibilidad en los próximos 5 días hábiles. El paciente debe estar pendiente a nuestro sitio web oficial o acercarse a la sede de la IPS en 5 días hábiles."
    : null;

  res.json({
    success: true,
    especialidadId,
    sedeId,
    diasEscaneados: diasAgregados,
    hayDisponibilidad,
    totalCupos: slotsCercanos.length,
    slotsCercanos: slotsCercanos.slice(0, 20),
    mensajeOficial
  });
});

// ==========================================
// CITAS (AGENDAMIENTO WEB Y PRESENCIAL)
// ==========================================
app.get('/api/citas', (req, res) => {
  const currentDb = db.get();
  const { fecha, fechaDesde, fechaHasta, sedeId, especialidadId, medicoId, tipoAgendamiento, pacienteNumDoc, estado, soloFuturas, codigoCita, criterio } = req.query;

  let resultado = [...currentDb.citas];

  if (fecha) {
    resultado = resultado.filter(c => c.fecha === fecha);
  }
  if (fechaDesde) {
    resultado = resultado.filter(c => c.fecha >= fechaDesde);
  }
  if (fechaHasta) {
    resultado = resultado.filter(c => c.fecha <= fechaHasta);
  }
  if (sedeId) {
    resultado = resultado.filter(c => c.sedeId === sedeId);
  }
  if (especialidadId) {
    resultado = resultado.filter(c => c.especialidadId === especialidadId);
  }
  if (medicoId) {
    resultado = resultado.filter(c => c.medicoId === medicoId);
  }
  if (tipoAgendamiento) {
    resultado = resultado.filter(c => c.tipoAgendamiento === tipoAgendamiento);
  }
  if (codigoCita) {
    resultado = resultado.filter(c => c.codigoCita && c.codigoCita.toUpperCase() === codigoCita.trim().toUpperCase());
  }
  if (pacienteNumDoc) {
    resultado = resultado.filter(c => c.pacienteNumDoc && c.pacienteNumDoc.includes(pacienteNumDoc.trim()));
  }
  if (criterio) {
    const crit = criterio.trim().toUpperCase();
    resultado = resultado.filter(c =>
      (c.pacienteNumDoc && c.pacienteNumDoc.includes(crit)) ||
      (c.codigoCita && c.codigoCita.toUpperCase().includes(crit))
    );
  }
  if (estado) {
    resultado = resultado.filter(c => c.estado === estado);
  }

  // Filtrar solo citas a futuro en la fecha actual si se solicita (para consulta de usuarios)
  if (soloFuturas === 'true' || soloFuturas === true) {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    const currentNowMinutes = now.getHours() * 60 + now.getMinutes();

    resultado = resultado.filter(c => {
      if (!c.fecha) return false;
      // Citas ya atendidas o con inasistencia registrada no son citas futuras
      if (c.estado === 'atendida' || c.estado === 'no_asistio') return false;
      // Si la fecha es posterior a hoy, es a futuro
      if (c.fecha > todayStr) return true;
      // Si es hoy, verificar que la hora sea futura o esté en ventana de atención activa (30 min)
      if (c.fecha === todayStr) {
        if (!c.hora) return true;
        const [h, m] = c.hora.split(':').map(Number);
        const citaMinutes = (h || 0) * 60 + (m || 0);
        return (citaMinutes + 30) >= currentNowMinutes;
      }
      // Fecha anterior a hoy -> ya transcurrió
      return false;
    });
  }

  // Ordenar por fecha y hora descendente o ascendente
  resultado.sort((a, b) => {
    const dateComp = a.fecha.localeCompare(b.fecha);
    if (dateComp !== 0) return dateComp;
    return a.hora.localeCompare(b.hora);
  });

  // Enriquecer con datos completos para renderizado y PDF
  const citasEnriquecidas = resultado.map(cita => enrichCita(cita, currentDb));

  res.json({ success: true, count: citasEnriquecidas.length, data: citasEnriquecidas });
});

// Obtener cita por ID o por Código
app.get('/api/citas/:identificador', (req, res) => {
  const currentDb = db.get();
  const { identificador } = req.params;
  const { soloFuturas } = req.query;

  const cita = currentDb.citas.find(c => c.id === identificador || c.codigoCita.toUpperCase() === identificador.toUpperCase());
  if (!cita) {
    return res.status(404).json({ success: false, error: "Cita no encontrada" });
  }

  if (soloFuturas === 'true' || soloFuturas === true) {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    const currentNowMinutes = now.getHours() * 60 + now.getMinutes();

    let esFutura = false;
    if (cita.fecha > todayStr) {
      esFutura = true;
    } else if (cita.fecha === todayStr) {
      if (!cita.hora) {
        esFutura = true;
      } else {
        const [h, m] = cita.hora.split(':').map(Number);
        const citaMinutes = (h || 0) * 60 + (m || 0);
        esFutura = (citaMinutes + 30) >= currentNowMinutes;
      }
    }

    if (cita.estado === 'atendida' || cita.estado === 'no_asistio') {
      esFutura = false;
    }

    if (!esFutura) {
      return res.status(404).json({
        success: false,
        error: "La cita consultada ya ha transcurrido y no se encuentra vigente.",
        esPasada: true
      });
    }
  }

  res.json({ success: true, data: enrichCita(cita, currentDb) });
});

// AGENDAR CITA (WEB O PRESENCIAL)
app.post('/api/citas', (req, res) => {
  const currentDb = db.get();
  const {
    pacienteTipoDoc,
    pacienteNumDoc,
    pacienteNombres,
    pacienteApellidos,
    pacienteTelefono,
    pacienteEmail,
    pacienteAseguradora,
    motivoConsulta,
    sedeId,
    especialidadId,
    departamento,
    tipoCita,
    codigoCups,
    nombreCups,
    medicoId,
    fecha,
    hora,
    tipoAgendamiento // 'web' o 'presencial'
  } = req.body;

  // Validaciones obligatorias
  if (!pacienteNumDoc || !pacienteNombres || !pacienteApellidos || !sedeId || !especialidadId || !medicoId || !fecha || !hora) {
    return res.status(400).json({
      success: false,
      error: "Datos incompletos: Paciente, Sede, Especialidad, Médico, Fecha y Hora son requeridos"
    });
  }

  // VALIDACIÓN DE FECHA Y HORA TRANSCURRIDA
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
  const currentNowMinutes = now.getHours() * 60 + now.getMinutes();
  const [horaH, horaM] = hora.split(':').map(Number);
  const citaTotalMinutes = horaH * 60 + horaM;

  if (fecha < todayStr || (fecha === todayStr && citaTotalMinutes <= currentNowMinutes)) {
    return res.status(400).json({
      success: false,
      error: `No es posible agendar una cita en un horario que ya pasó (${hora} del ${fecha}). Por favor seleccione un horario futuro.`
    });
  }

  // VALIDACIÓN DE MOMENTOS DE PAUSA/DESCANSO DEL MÉDICO
  const medicoObj = currentDb.medicos.find(m => m.id === medicoId);
  if (medicoObj && Array.isArray(medicoObj.pausas) && medicoObj.pausas.length > 0) {
    const duracion = parseInt(medicoObj.duracionCitaMinutos, 10) || 30;
    const slotStart = citaTotalMinutes;
    const slotEnd = citaTotalMinutes + duracion;

    const pausaConflicto = medicoObj.pausas.find(p => {
      const [pH1, pM1] = p.horaInicio.split(':').map(Number);
      const [pH2, pM2] = p.horaFin.split(':').map(Number);
      const pStart = pH1 * 60 + pM1;
      const pEnd = pH2 * 60 + pM2;
      return slotStart < pEnd && slotEnd > pStart;
    });

    if (pausaConflicto) {
      return res.status(400).json({
        success: false,
        error: `No es posible agendar: el especialista tiene programada una pausa de ${pausaConflicto.horaInicio} a ${pausaConflicto.horaFin} (${pausaConflicto.motivo || 'Descanso programado'}). Por favor elija otro horario.`
      });
    }
  }

  // CONTROL DE CONCURRENCIA / CRUCE DE HORARIOS
  // Verificar si el médico ya tiene una cita activa en esa misma fecha y hora
  const conflicto = currentDb.citas.find(c =>
    c.medicoId === medicoId &&
    c.fecha === fecha &&
    c.hora === hora &&
    c.estado !== 'cancelada'
  );

  if (conflicto) {
    return res.status(409).json({
      success: false,
      error: `El horario ${hora} del ${fecha} ya fue reservado mediante canal ${conflicto.tipoAgendamiento.toUpperCase()}. Por favor seleccione otro horario.`
    });
  }

  // Generar código único de cita para IPS ARCAL (ej: ARC-2026-4921)
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const codigoCita = `ARC-${currentYear}-${randomSuffix}`;

  const especialidadObj = currentDb.especialidades.find(e => e.id === especialidadId);

  const nuevaCita = {
    id: `cita-${uuidv4()}`,
    codigoCita,
    pacienteTipoDoc: pacienteTipoDoc || "CC",
    pacienteNumDoc: pacienteNumDoc.trim(),
    pacienteNombres: pacienteNombres.trim(),
    pacienteApellidos: pacienteApellidos.trim(),
    pacienteTelefono: pacienteTelefono || "",
    pacienteEmail: pacienteEmail || "",
    pacienteAseguradora: pacienteAseguradora || "Savia Salud",
    motivoConsulta: motivoConsulta || (nombreCups || "Consulta médica especializada"),
    sedeId,
    especialidadId,
    departamento: departamento || especialidadObj?.departamento || "",
    tipoCita: tipoCita || "primera_vez",
    codigoCups: codigoCups || especialidadObj?.modalidades?.[0]?.codigoCups || especialidadObj?.codigo || "",
    nombreCups: nombreCups || especialidadObj?.modalidades?.[0]?.descripcionCups || especialidadObj?.nombre || "",
    medicoId,
    fecha,
    hora,
    tipoAgendamiento: tipoAgendamiento === 'presencial' ? 'presencial' : 'web',
    estado: 'confirmada', // Nace confirmada para generar comprobante
    creadaEn: new Date().toISOString()
  };

  currentDb.citas.push(nuevaCita);

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "AGENDAR_CITA",
    descripcion: `Cita ${codigoCita} agendada vía ${nuevaCita.tipoAgendamiento} [CUPS: ${nuevaCita.codigoCups} - ${nuevaCita.tipoCita}] para paciente ${nuevaCita.pacienteNombres} ${nuevaCita.pacienteApellidos} en ${nuevaCita.fecha} a las ${nuevaCita.hora}`
  });

  db.save(currentDb);

  const citaEnriquecida = enrichCita(nuevaCita, currentDb);
  res.status(201).json({
    success: true,
    message: "Cita agendada exitosamente",
    data: citaEnriquecida
  });
});

// ACTUALIZAR CITA EXISTENTE (CUANDO EL USUARIO SE DEVUELVE A EDITAR DATOS)
app.put('/api/citas/:id', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const citaIndex = currentDb.citas.findIndex(c => c.id === id || c.codigoCita.toUpperCase() === id.toUpperCase());

  if (citaIndex === -1) {
    return res.status(404).json({ success: false, error: "Cita no encontrada para actualizar" });
  }

  const citaOriginal = currentDb.citas[citaIndex];
  const {
    pacienteTipoDoc,
    pacienteNumDoc,
    pacienteNombres,
    pacienteApellidos,
    pacienteTelefono,
    pacienteEmail,
    pacienteAseguradora,
    motivoConsulta,
    sedeId,
    especialidadId,
    medicoId,
    fecha,
    hora
  } = req.body;

  const targetMedicoId = medicoId || citaOriginal.medicoId;
  const targetFecha = fecha || citaOriginal.fecha;
  const targetHora = hora || citaOriginal.hora;

  // Si la fecha u hora o médico cambiaron, validar horario transcurrido y cruces con OTRAS citas
  if (targetFecha !== citaOriginal.fecha || targetHora !== citaOriginal.hora || targetMedicoId !== citaOriginal.medicoId) {
    const now = new Date();
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    const currentNowMinutes = now.getHours() * 60 + now.getMinutes();
    const [horaH, horaM] = targetHora.split(':').map(Number);
    const citaTotalMinutes = horaH * 60 + horaM;

    if (targetFecha < todayStr || (targetFecha === todayStr && citaTotalMinutes <= currentNowMinutes)) {
      return res.status(400).json({
        success: false,
        error: `No es posible agendar en un horario que ya pasó (${targetHora} del ${targetFecha}). Seleccione un horario futuro.`
      });
    }

    // VALIDACIÓN DE MOMENTOS DE PAUSA/DESCANSO DEL MÉDICO
    const targetMedicoObj = currentDb.medicos.find(m => m.id === targetMedicoId);
    if (targetMedicoObj && Array.isArray(targetMedicoObj.pausas) && targetMedicoObj.pausas.length > 0) {
      const duracion = parseInt(targetMedicoObj.duracionCitaMinutos, 10) || 30;
      const slotStart = citaTotalMinutes;
      const slotEnd = citaTotalMinutes + duracion;

      const pausaConflicto = targetMedicoObj.pausas.find(p => {
        const [pH1, pM1] = p.horaInicio.split(':').map(Number);
        const [pH2, pM2] = p.horaFin.split(':').map(Number);
        const pStart = pH1 * 60 + pM1;
        const pEnd = pH2 * 60 + pM2;
        return slotStart < pEnd && slotEnd > pStart;
      });

      if (pausaConflicto) {
        return res.status(400).json({
          success: false,
          error: `No es posible actualizar a este horario: el Dr(a). ${targetMedicoObj.nombre} tiene programada una pausa de ${pausaConflicto.horaInicio} a ${pausaConflicto.horaFin} (${pausaConflicto.motivo || 'Descanso programado'}).`
        });
      }
    }

    // Verificar conflicto EXCLUYENDO esta misma cita
    const conflicto = currentDb.citas.find(c =>
      c.id !== citaOriginal.id &&
      c.codigoCita !== citaOriginal.codigoCita &&
      c.medicoId === targetMedicoId &&
      c.fecha === targetFecha &&
      c.hora === targetHora &&
      !['cancelada', 'no_asistio', 'llego_tarde_cancelada'].includes(c.estado)
    );

    if (conflicto) {
      return res.status(409).json({
        success: false,
        error: `El horario ${targetHora} del ${targetFecha} ya se encuentra ocupado por otra cita. Por favor seleccione otro horario.`
      });
    }
  }

  // Actualizar los datos de la cita manteniendo su identificador y radicado original
  currentDb.citas[citaIndex] = {
    ...citaOriginal,
    ...(pacienteTipoDoc && { pacienteTipoDoc }),
    ...(pacienteNumDoc && { pacienteNumDoc: pacienteNumDoc.trim() }),
    ...(pacienteNombres && { pacienteNombres: pacienteNombres.trim() }),
    ...(pacienteApellidos && { pacienteApellidos: pacienteApellidos.trim() }),
    ...(pacienteTelefono !== undefined && { pacienteTelefono: pacienteTelefono.trim() }),
    ...(pacienteEmail !== undefined && { pacienteEmail: pacienteEmail.trim() }),
    ...(pacienteAseguradora && { pacienteAseguradora }),
    ...(motivoConsulta !== undefined && { motivoConsulta }),
    ...(sedeId && { sedeId }),
    ...(especialidadId && { especialidadId }),
    ...(medicoId && { medicoId: targetMedicoId }),
    ...(fecha && { fecha: targetFecha }),
    ...(hora && { hora: targetHora }),
    actualizadaEn: new Date().toISOString()
  };

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "ACTUALIZAR_CITA",
    descripcion: `Cita ${citaOriginal.codigoCita} editada/actualizada para paciente ${currentDb.citas[citaIndex].pacienteNombres} ${currentDb.citas[citaIndex].pacienteApellidos}`
  });

  db.save(currentDb);

  const citaActualizada = enrichCita(currentDb.citas[citaIndex], currentDb);
  res.json({
    success: true,
    message: "Cita actualizada correctamente",
    data: citaActualizada
  });
});

// Cambiar estado de la cita (agendada, en_sala, atendida, cancelada)
app.put('/api/citas/:id/estado', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const { estado, motivoCancelacion } = req.body;

  const cita = currentDb.citas.find(c => c.id === id || c.codigoCita === id);
  if (!cita) {
    return res.status(404).json({ success: false, error: "Cita no encontrada" });
  }

  cita.estado = estado;
  if (motivoCancelacion) {
    cita.motivoCancelacion = motivoCancelacion;
  }
  cita.actualizadaEn = new Date().toISOString();

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "CAMBIO_ESTADO_CITA",
    descripcion: `Cita ${cita.codigoCita} cambió a estado: ${estado}`
  });

  db.save(currentDb);
  res.json({ success: true, data: enrichCita(cita, currentDb) });
});

// REASIGNAR CITA (CUANDO LLEGÓ TARDE O REPROGRAMACIÓN)
app.post('/api/citas/:id/reasignar', (req, res) => {
  const currentDb = db.get();
  const { id } = req.params;
  const { nuevaFecha, nuevaHora, nuevoMedicoId, motivo } = req.body;

  const citaOriginal = currentDb.citas.find(c => c.id === id || c.codigoCita === id);
  if (!citaOriginal) {
    return res.status(404).json({ success: false, error: "Cita original no encontrada" });
  }

  if (!nuevaFecha || !nuevaHora) {
    return res.status(400).json({ success: false, error: "nuevaFecha y nuevaHora son requeridos" });
  }

  const medicoDestinoId = nuevoMedicoId || citaOriginal.medicoId;

  // Verificar que el nuevo horario no esté ocupado
  const conflicto = currentDb.citas.find(c =>
    c.id !== citaOriginal.id &&
    c.medicoId === medicoDestinoId &&
    c.fecha === nuevaFecha &&
    c.hora === nuevaHora &&
    !['cancelada', 'no_asistio', 'llego_tarde_cancelada'].includes(c.estado)
  );

  if (conflicto) {
    return res.status(409).json({
      success: false,
      error: `El horario ${nuevaHora} del ${nuevaFecha} ya fue reservado mediante canal ${conflicto.tipoAgendamiento.toUpperCase()}. Por favor seleccione otro horario.`
    });
  }

  const fechaAnterior = citaOriginal.fecha;
  const horaAnterior = citaOriginal.hora;

  citaOriginal.fecha = nuevaFecha;
  citaOriginal.hora = nuevaHora;
  if (nuevoMedicoId) {
    citaOriginal.medicoId = nuevoMedicoId;
  }
  citaOriginal.estado = 'confirmada';
  citaOriginal.tipoAgendamiento = 'presencial';
  citaOriginal.motivoReasignacion = motivo || "Reasignación por llegada tardía a la cita previa";
  citaOriginal.actualizadaEn = new Date().toISOString();

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "REASIGNAR_CITA",
    descripcion: `Cita ${citaOriginal.codigoCita} reasignada de ${fechaAnterior} ${horaAnterior} a ${nuevaFecha} ${nuevaHora}. Motivo: ${citaOriginal.motivoReasignacion}`
  });

  db.save(currentDb);
  res.json({
    success: true,
    message: "Cita reasignada exitosamente",
    data: enrichCita(citaOriginal, currentDb)
  });
});

// ==========================================
// MÉTRICAS Y DASHBOARD PARA ADMINISTRACIÓN
// ==========================================
app.get('/api/metricas', (req, res) => {
  const currentDb = db.get();
  const hoyStr = new Date().toISOString().split('T')[0];

  const totalCitas = currentDb.citas.length;
  const citasHoy = currentDb.citas.filter(c => c.fecha === hoyStr && c.estado !== 'cancelada').length;
  const citasWeb = currentDb.citas.filter(c => c.tipoAgendamiento === 'web').length;
  const citasPresenciales = currentDb.citas.filter(c => c.tipoAgendamiento === 'presencial').length;
  const citasActivas = currentDb.citas.filter(c => c.estado !== 'cancelada').length;
  const citasCanceladas = currentDb.citas.filter(c => c.estado === 'cancelada').length;

  // Distribución por Sede
  const sedesConConteo = currentDb.sedes.map(sede => {
    const conteo = currentDb.citas.filter(c => c.sedeId === sede.id && c.estado !== 'cancelada').length;
    return {
      sedeId: sede.id,
      nombre: sede.nombre,
      ciudad: sede.ciudad,
      totalCitas: conteo
    };
  });

  // Distribución por Especialidad
  const especialidadesConConteo = currentDb.especialidades.map(esp => {
    const conteo = currentDb.citas.filter(c => c.especialidadId === esp.id && c.estado !== 'cancelada').length;
    return {
      especialidadId: esp.id,
      nombre: esp.nombre,
      totalCitas: conteo
    };
  });

  res.json({
    success: true,
    data: {
      totalCitas,
      citasHoy,
      citasWeb,
      citasPresenciales,
      citasActivas,
      citasCanceladas,
      totalSedes: currentDb.sedes.filter(s => s.activa).length,
      totalMedicos: currentDb.medicos.filter(m => m.activo).length,
      sedesStats: sedesConConteo,
      especialidadesStats: especialidadesConConteo,
      ultimasCitas: currentDb.citas.slice(-6).reverse().map(c => enrichCita(c, currentDb))
    }
  });
});

// Reiniciar a datos demostrativos
app.post('/api/reset', (req, res) => {
  const data = db.resetToInitial();
  res.json({ success: true, message: "Base de datos reiniciada a valores demostrativos", data });
});

// Función de ayuda para enriquecer cita con nombres, sedes, médico y recomendaciones
function enrichCita(cita, database) {
  const sede = database.sedes.find(s => s.id === cita.sedeId);
  const especialidad = database.especialidades.find(e => e.id === cita.especialidadId);
  const medico = database.medicos.find(m => m.id === cita.medicoId);
  const duracionMinutos = parseInt(medico?.duracionCitaMinutos, 10) || especialidad?.duracionMinutos || 30;

  const codigoCupsCalculado = cita.codigoCups || especialidad?.modalidades?.[0]?.codigoCups || especialidad?.codigo || "";
  const nombreCupsCalculado = cita.nombreCups || especialidad?.modalidades?.[0]?.descripcionCups || especialidad?.nombre || "";
  const departamentoCalculado = cita.departamento || especialidad?.departamento || "";

  return {
    ...cita,
    departamento: departamentoCalculado,
    tipoCita: cita.tipoCita || "primera_vez",
    codigoCups: codigoCupsCalculado,
    nombreCups: nombreCupsCalculado,
    ipsInfo: IPS_INFO,
    duracionMinutos,
    sede: sede ? {
      id: sede.id,
      nombre: sede.nombre,
      ciudad: sede.ciudad,
      direccion: sede.direccion,
      telefono: sede.telefono,
      email: sede.email,
      horarioAtencion: sede.horarioAtencion
    } : null,
    especialidad: especialidad ? {
      id: especialidad.id,
      nombre: especialidad.nombre,
      codigo: especialidad.codigo,
      departamento: especialidad.departamento,
      esConsulta: especialidad.esConsulta,
      modalidades: especialidad.modalidades || [],
      duracionMinutos: especialidad.duracionMinutos,
      recomendaciones: especialidad.recomendaciones || []
    } : null,
    medico: medico ? {
      id: medico.id,
      nombre: medico.nombre,
      registroMedico: medico.registroMedico,
      consultorio: medico.consultorio,
      duracionCitaMinutos: parseInt(medico.duracionCitaMinutos, 10) || 30,
      pausas: medico.pausas || []
    } : null
  };
}

// ==========================================
// MÓDULO PORTAL WEB: DATOS CURIOSOS (SALUD Y BIENESTAR)
// ==========================================
app.get('/api/datos-curiosos', (req, res) => {
  const currentDb = db.get();
  const todos = req.query.admin === 'true';
  const lista = (currentDb.datosCuriosos || []).filter(item => todos || item.activo !== false);
  res.json({ success: true, data: lista });
});

app.post('/api/datos-curiosos', (req, res) => {
  const currentDb = db.get();
  const { titulo, descripcion, categoria, tipoMedia, urlMedia, fuente, destacado, activo } = req.body;

  if (!titulo || !descripcion) {
    return res.status(400).json({ success: false, error: "Título y descripción son obligatorios" });
  }

  const nuevoItem = {
    id: `curioso-${uuidv4().substring(0, 8)}`,
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    categoria: categoria || "Salud General",
    tipoMedia: tipoMedia === 'video' ? 'video' : 'imagen',
    urlMedia: urlMedia || "",
    fuente: fuente || "Comité Científico IPS ARCAL",
    destacado: Boolean(destacado),
    activo: activo !== false,
    fecha: new Date().toISOString()
  };

  if (!Array.isArray(currentDb.datosCuriosos)) {
    currentDb.datosCuriosos = [];
  }
  currentDb.datosCuriosos.unshift(nuevoItem);

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "CREAR_DATO_CURIOSO",
    descripcion: `Nuevo dato curioso publicado: ${nuevoItem.titulo}`
  });

  db.save(currentDb);
  res.status(201).json({ success: true, data: nuevoItem });
});

app.put('/api/datos-curiosos/:id', (req, res) => {
  const currentDb = db.get();
  const index = (currentDb.datosCuriosos || []).findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Dato curioso no encontrado" });
  }

  const itemPrevio = currentDb.datosCuriosos[index];
  const { titulo, descripcion, categoria, tipoMedia, urlMedia, fuente, destacado, activo } = req.body;

  currentDb.datosCuriosos[index] = {
    ...itemPrevio,
    ...(titulo !== undefined && { titulo: titulo.trim() }),
    ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
    ...(categoria !== undefined && { categoria }),
    ...(tipoMedia !== undefined && { tipoMedia }),
    ...(urlMedia !== undefined && { urlMedia }),
    ...(fuente !== undefined && { fuente }),
    ...(destacado !== undefined && { destacado: Boolean(destacado) }),
    ...(activo !== undefined && { activo: Boolean(activo) })
  };

  db.save(currentDb);
  res.json({ success: true, data: currentDb.datosCuriosos[index] });
});

app.delete('/api/datos-curiosos/:id', (req, res) => {
  const currentDb = db.get();
  const index = (currentDb.datosCuriosos || []).findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Dato curioso no encontrado" });
  }

  const eliminado = currentDb.datosCuriosos.splice(index, 1)[0];
  db.save(currentDb);
  res.json({ success: true, data: eliminado });
});

// ==========================================
// MÓDULO PORTAL WEB: GALERÍA MULTIMEDIA (FOTOS Y VIDEOS CORTOS)
// ==========================================
app.get('/api/galeria', (req, res) => {
  const currentDb = db.get();
  const todos = req.query.admin === 'true';
  const lista = (currentDb.galeria || []).filter(item => todos || item.activo !== false);
  res.json({ success: true, data: lista });
});

app.post('/api/galeria', (req, res) => {
  const currentDb = db.get();
  const { titulo, descripcion, categoria, tipoMedia, urlMedia, duracion, activo } = req.body;

  if (!titulo || !urlMedia) {
    return res.status(400).json({ success: false, error: "Título y URL de medio son obligatorios" });
  }

  const nuevoItem = {
    id: `gal-${uuidv4().substring(0, 8)}`,
    titulo: titulo.trim(),
    descripcion: (descripcion || "").trim(),
    categoria: categoria || "Instalaciones y Consultorios",
    tipoMedia: tipoMedia === 'video' ? 'video' : 'imagen',
    urlMedia: urlMedia.trim(),
    duracion: duracion || (tipoMedia === 'video' ? "0:45 min" : ""),
    activo: activo !== false,
    fecha: new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  };

  if (!Array.isArray(currentDb.galeria)) {
    currentDb.galeria = [];
  }
  currentDb.galeria.unshift(nuevoItem);

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "CREAR_ELEMENTO_GALERIA",
    descripcion: `Nuevo elemento en galería (${nuevoItem.tipoMedia}): ${nuevoItem.titulo}`
  });

  db.save(currentDb);
  res.status(201).json({ success: true, data: nuevoItem });
});

app.put('/api/galeria/:id', (req, res) => {
  const currentDb = db.get();
  const index = (currentDb.galeria || []).findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Elemento de galería no encontrado" });
  }

  const previo = currentDb.galeria[index];
  const { titulo, descripcion, categoria, tipoMedia, urlMedia, duracion, activo } = req.body;

  currentDb.galeria[index] = {
    ...previo,
    ...(titulo !== undefined && { titulo: titulo.trim() }),
    ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
    ...(categoria !== undefined && { categoria }),
    ...(tipoMedia !== undefined && { tipoMedia }),
    ...(urlMedia !== undefined && { urlMedia }),
    ...(duracion !== undefined && { duracion }),
    ...(activo !== undefined && { activo: Boolean(activo) })
  };

  db.save(currentDb);
  res.json({ success: true, data: currentDb.galeria[index] });
});

app.delete('/api/galeria/:id', (req, res) => {
  const currentDb = db.get();
  const index = (currentDb.galeria || []).findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Elemento no encontrado" });
  }

  const eliminado = currentDb.galeria.splice(index, 1)[0];
  db.save(currentDb);
  res.json({ success: true, data: eliminado });
});

// ==========================================
// MÓDULO PORTAL WEB: ATENCIÓN AL USUARIO Y PQRS
// ==========================================
app.get('/api/pqrs', (req, res) => {
  const currentDb = db.get();
  res.json({ success: true, data: currentDb.pqrs || [] });
});

app.get('/api/pqrs/consultar/:termino', (req, res) => {
  const currentDb = db.get();
  const termino = (req.params.termino || "").trim().toLowerCase();

  const resultados = (currentDb.pqrs || []).filter(item => {
    const rad = (item.radicado || "").toLowerCase();
    const doc = (item.numeroDocumento || "").toLowerCase();
    return rad === termino || doc === termino;
  });

  res.json({ success: true, data: resultados });
});

app.post('/api/pqrs', (req, res) => {
  const currentDb = db.get();
  const {
    tipo, nombreCompleto, tipoDocumento, numeroDocumento,
    email, telefono, sedeId, servicio, asunto, descripcion
  } = req.body;

  if (!nombreCompleto || !numeroDocumento || !descripcion || !asunto) {
    return res.status(400).json({
      success: false,
      error: "Nombre completo, número de documento, asunto y descripción son obligatorios"
    });
  }

  const fechaActual = new Date();
  const y = fechaActual.getFullYear();
  const m = String(fechaActual.getMonth() + 1).padStart(2, '0');
  const d = String(fechaActual.getDate()).padStart(2, '0');
  const consecutivo = String((currentDb.pqrs || []).length + 1).padStart(4, '0');
  const radicadoOficial = `PQRS-${y}${m}${d}-${consecutivo}`;

  const nuevoPqrs = {
    id: `pqrs-${uuidv4().substring(0, 8)}`,
    radicado: radicadoOficial,
    tipo: tipo || "Petición",
    nombreCompleto: nombreCompleto.trim(),
    tipoDocumento: tipoDocumento || "CC",
    numeroDocumento: numeroDocumento.trim(),
    email: (email || "").trim(),
    telefono: (telefono || "").trim(),
    sedeId: sedeId || "",
    servicio: servicio || "Atención General",
    asunto: asunto.trim(),
    descripcion: descripcion.trim(),
    estado: "Radicado",
    respuestaOficial: "",
    fechaRadicado: fechaActual.toISOString(),
    fechaRespuesta: null,
    atendidoPor: null
  };

  if (!Array.isArray(currentDb.pqrs)) {
    currentDb.pqrs = [];
  }
  currentDb.pqrs.unshift(nuevoPqrs);

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: fechaActual.toISOString(),
    accion: "RADICAR_PQRS",
    descripcion: `Nuevo PQRS radicado (${nuevoPqrs.tipo}): ${nuevoPqrs.radicado} por ${nuevoPqrs.nombreCompleto}`
  });

  db.save(currentDb);

  res.status(201).json({
    success: true,
    data: nuevoPqrs,
    mensaje: `Su solicitud ha sido radicada formalmente bajo el número ${nuevoPqrs.radicado}. Conforme a la normativa de salud, el tiempo de respuesta legal estimado es de hasta 15 días hábiles.`
  });
});

app.put('/api/pqrs/:id/responder', (req, res) => {
  const currentDb = db.get();
  const index = (currentDb.pqrs || []).findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "Solicitud PQRS no encontrada" });
  }

  const pqrsActual = currentDb.pqrs[index];
  const { estado, respuestaOficial, atendidoPor } = req.body;

  currentDb.pqrs[index] = {
    ...pqrsActual,
    estado: estado || pqrsActual.estado,
    respuestaOficial: respuestaOficial !== undefined ? respuestaOficial.trim() : pqrsActual.respuestaOficial,
    fechaRespuesta: new Date().toISOString(),
    atendidoPor: atendidoPor || "Dirección de Calidad y Atención al Usuario"
  };

  currentDb.historialAuditoria.push({
    id: `log-${Date.now()}`,
    fecha: new Date().toISOString(),
    accion: "GESTION_PQRS",
    descripcion: `PQRS ${pqrsActual.radicado} actualizado a estado ${currentDb.pqrs[index].estado}`
  });

  db.save(currentDb);
  res.json({ success: true, data: currentDb.pqrs[index] });
});

app.delete('/api/pqrs/:id', (req, res) => {
  const currentDb = db.get();
  const index = (currentDb.pqrs || []).findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: "PQRS no encontrada" });
  }

  const eliminado = currentDb.pqrs.splice(index, 1)[0];
  db.save(currentDb);
  res.json({ success: true, data: eliminado });
});

// ==========================================
// COMPATIBILIDAD CON HOSTINGER & PRODUCCIÓN (ARCHIVOS ESTÁTICOS CLIENTE)
// ==========================================
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  const currentDb = db.get();
  console.log(`====================================================`);
  console.log(` Servidor IPS ARCAL iniciado con éxito en http://localhost:${PORT}`);
  console.log(` Especialidades habilitadas: ${(currentDb.especialidades || []).length}`);
  console.log(` Sedes operativas: ${(currentDb.sedes || []).length}`);
  console.log(` Médicos activos: ${(currentDb.medicos || []).length}`);
  console.log(` Sincronización Web <-> Presencial: ACTIVA`);
  console.log(`====================================================`);
});
