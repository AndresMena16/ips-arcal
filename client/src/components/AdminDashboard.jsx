import React, { useState, useEffect } from 'react';
import {
  Building2, Stethoscope, Users, Calendar, Settings, Plus,
  Edit2, Trash2, Check, X, FileDown, Activity, RefreshCw, AlertCircle,
  UserCheck, ShieldAlert, Lock, KeyRound, CheckCircle2,
  FileSpreadsheet, Download, Copy, Crown, Clock, Coffee, Sliders, Filter
} from 'lucide-react';
import { api } from '../services/api';
import { generarComprobantePDF } from '../utils/pdfGenerator';
import { exportarCitasAExcel, calcularHoraFin } from '../utils/excelExporter';

export default function AdminDashboard({ usuarioActual, onOpenLogin }) {
  const isSuperAdmin = usuarioActual?.rol === 'superadmin';
  const [subTab, setSubTab] = useState('citas'); // 'sedes' | 'especialidades' | 'medicos' | 'agentes' | 'citas' | 'metricas'
  const [loading, setLoading] = useState(false);
  const [metricas, setMetricas] = useState(null);

  // Datos
  const [sedes, setSedes] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Modales y Edición
  const [modalSedeAbierto, setModalSedeAbierto] = useState(false);
  const [sedeEnEdicion, setSedeEnEdicion] = useState(null);
  const [formSede, setFormSede] = useState({
    nombre: '',
    codigo: '',
    ciudad: 'Bogotá D.C.',
    direccion: '',
    telefono: '',
    email: '',
    horarioAtencion: 'Lunes a Viernes: 7:00 AM - 5:00 PM',
    consultorios: 4
  });

  // Modales y Edición de Médicos
  const [modalMedicoAbierto, setModalMedicoAbierto] = useState(false);
  const [medicoEnEdicion, setMedicoEnEdicion] = useState(null);
  const [formMedico, setFormMedico] = useState({
    nombre: '',
    registroMedico: '',
    especialidadId: '',
    sedeId: '',
    consultorio: 'Consultorio 101',
    diasAtencion: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    horaInicio: '08:00',
    horaFin: '17:00',
    duracionCitaMinutos: 30, // 30 min por defecto
    pausas: []
  });

  // Modal dedicado para configuración de tiempos y pausas médicas (Super Admin)
  const [modalPausasAbierto, setModalPausasAbierto] = useState(false);
  const [medicoParaPausas, setMedicoParaPausas] = useState(null);
  const [formPausas, setFormPausas] = useState({
    duracionCitaMinutos: 30,
    pausas: []
  });
  const [nuevaPausa, setNuevaPausa] = useState({
    horaInicio: '09:00',
    horaFin: '09:30',
    motivo: 'Descanso y pausa activa'
  });

  // Modales y Edición de Usuarios (Administradores y Agentes)
  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState(null);
  const [filtroRolUsuario, setFiltroRolUsuario] = useState('todos'); // 'todos' | 'admin' | 'agente' | 'superadmin'
  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    username: '',
    email: '',
    password: '',
    cargo: 'Agente de Admisiones y Recepción',
    rol: 'agente',
    sedesAsignadas: [],
    activo: true
  });

  // Edición de Recomendaciones en Especialidad
  const [especialidadEnEdicion, setEspecialidadEnEdicion] = useState(null);
  const [recomendacionesTexto, setRecomendacionesTexto] = useState('');

  // Filtros Avanzados de Citas & Agenda Especialista (Info Salud)
  const [filtroFechaTipo, setFiltroFechaTipo] = useState('todas'); // 'todas' | 'hoy' | 'manana' | 'semana' | 'especifica'
  const [fechaFiltro, setFechaFiltro] = useState(() => new Date().toISOString().split('T')[0]);
  const [filtroMedico, setFiltroMedico] = useState('');
  const [filtroSede, setFiltroSede] = useState('');
  const [filtroCanal, setFiltroCanal] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busquedaDoc, setBusquedaDoc] = useState('');
  const [vistaModoCitas, setVistaModoCitas] = useState('agenda'); // 'agenda' | 'tabla'
  const [copiadoExitoso, setCopiadoExitoso] = useState(false);

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    try {
      setLoading(true);
      const [sedesRes, espRes, medRes, metricasRes, citasRes, usuariosRes] = await Promise.all([
        api.getSedes(),
        api.getEspecialidades(),
        api.getMedicos(),
        api.getMetricas(),
        api.getCitas(),
        api.getUsuarios()
      ]);
      setSedes(sedesRes.data || []);
      setEspecialidades(espRes.data || []);
      setMedicos(medRes.data || []);
      setMetricas(metricasRes.data || null);
      setCitas(citasRes.data || []);
      setUsuarios(usuariosRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // GESTIÓN DE SEDES
  // ==========================================
  function abrirModalNuevaSede() {
    setSedeEnEdicion(null);
    setFormSede({
      nombre: '',
      codigo: '',
      ciudad: 'Bogotá D.C.',
      direccion: '',
      telefono: '',
      email: '',
      horarioAtencion: 'Lunes a Viernes: 7:00 AM - 5:00 PM | Sábados: 8:00 AM - 1:00 PM',
      consultorios: 6,
      especialidadesHabilitadas: []
    });
    setModalSedeAbierto(true);
  }

  function abrirModalEditarSede(sede) {
    setSedeEnEdicion(sede);
    setFormSede({
      nombre: sede.nombre,
      codigo: sede.codigo,
      ciudad: sede.ciudad,
      direccion: sede.direccion,
      telefono: sede.telefono,
      email: sede.email,
      horarioAtencion: sede.horarioAtencion,
      consultorios: sede.consultorios,
      especialidadesHabilitadas: sede.especialidadesHabilitadas || []
    });
    setModalSedeAbierto(true);
  }

  async function guardarSede(e) {
    e.preventDefault();
    try {
      if (sedeEnEdicion) {
        await api.updateSede(sedeEnEdicion.id, formSede);
      } else {
        await api.createSede(formSede);
      }
      setModalSedeAbierto(false);
      cargarTodo();
    } catch (err) {
      alert('Error al guardar la sede: ' + err.message);
    }
  }

  async function toggleEstadoSede(sede) {
    try {
      await api.updateSede(sede.id, { activa: !sede.activa });
      cargarTodo();
    } catch (err) {
      alert('Error al cambiar estado de la sede: ' + err.message);
    }
  }

  // ==========================================
  // GESTIÓN DE MÉDICOS Y HORARIOS / PAUSAS
  // ==========================================
  function abrirModalNuevoMedico() {
    setMedicoEnEdicion(null);
    setFormMedico({
      nombre: '',
      registroMedico: '',
      especialidadId: especialidades.length > 0 ? especialidades[0].id : '',
      sedeId: sedes.length > 0 ? sedes[0].id : '',
      consultorio: 'Cons. 101',
      diasAtencion: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
      horaInicio: '08:00',
      horaFin: '17:00',
      duracionCitaMinutos: 30, // 30 min por defecto
      pausas: []
    });
    setModalMedicoAbierto(true);
  }

  function abrirModalEditarMedico(medico) {
    setMedicoEnEdicion(medico);
    setFormMedico({
      nombre: medico.nombre,
      registroMedico: medico.registroMedico,
      especialidadId: medico.especialidadId,
      sedeId: medico.sedeId,
      consultorio: medico.consultorio,
      diasAtencion: medico.diasAtencion || ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
      horaInicio: medico.horaInicio || '08:00',
      horaFin: medico.horaFin || '17:00',
      duracionCitaMinutos: medico.duracionCitaMinutos || 30,
      pausas: Array.isArray(medico.pausas) ? [...medico.pausas] : []
    });
    setModalMedicoAbierto(true);
  }

  // Modal dedicado de tiempos de cita y pausas (Exclusivo Super Admin)
  function abrirModalConfigurarPausas(medico) {
    setMedicoParaPausas(medico);
    setFormPausas({
      duracionCitaMinutos: parseInt(medico.duracionCitaMinutos, 10) || 30,
      pausas: Array.isArray(medico.pausas) ? [...medico.pausas] : []
    });
    setNuevaPausa({
      horaInicio: '09:00',
      horaFin: '09:30',
      motivo: 'Descanso y pausa activa'
    });
    setModalPausasAbierto(true);
  }

  function agregarPausaAlMedico() {
    if (!nuevaPausa.horaInicio || !nuevaPausa.horaFin) {
      alert('Por favor elija la hora de inicio y hora de fin de la pausa.');
      return;
    }
    if (nuevaPausa.horaInicio >= nuevaPausa.horaFin) {
      alert('La hora de inicio de la pausa debe ser anterior a la hora de fin.');
      return;
    }

    const pausaItem = {
      id: `pause-${Date.now()}`,
      horaInicio: nuevaPausa.horaInicio,
      horaFin: nuevaPausa.horaFin,
      motivo: nuevaPausa.motivo.trim() || 'Descanso programado'
    };

    setFormPausas(prev => ({
      ...prev,
      pausas: [...prev.pausas, pausaItem]
    }));
  }

  function eliminarPausaDelMedico(pausaId) {
    setFormPausas(prev => ({
      ...prev,
      pausas: prev.pausas.filter(p => p.id !== pausaId)
    }));
  }

  async function guardarConfiguracionPausas(e) {
    e.preventDefault();
    if (!medicoParaPausas) return;
    try {
      await api.updateMedico(medicoParaPausas.id, {
        duracionCitaMinutos: parseInt(formPausas.duracionCitaMinutos, 10) || 30,
        pausas: formPausas.pausas
      });
      setModalPausasAbierto(false);
      await cargarTodo();
      alert(`Configuración guardada para Dr(a). ${medicoParaPausas.nombre}:\n• Duración de cita: ${formPausas.duracionCitaMinutos} min\n• Pausas programadas: ${formPausas.pausas.length}`);
    } catch (err) {
      alert('Error al guardar configuración: ' + err.message);
    }
  }

  async function guardarMedico(e) {
    e.preventDefault();
    if (!formMedico.nombre || !formMedico.especialidadId || !formMedico.sedeId) {
      alert('Por favor complete el nombre, especialidad y sede del profesional.');
      return;
    }
    try {
      if (medicoEnEdicion) {
        await api.updateMedico(medicoEnEdicion.id, formMedico);
      } else {
        await api.createMedico(formMedico);
      }
      setModalMedicoAbierto(false);
      cargarTodo();
    } catch (err) {
      alert('Error al guardar médico: ' + err.message);
    }
  }

  async function toggleEstadoMedico(medico) {
    try {
      await api.deleteMedico(medico.id);
      cargarTodo();
    } catch (err) {
      alert('Error al cambiar estado del médico: ' + err.message);
    }
  }

  // ==========================================
  // GESTIÓN DE RECOMENDACIONES DE ESPECIALIDADES
  // ==========================================
  function abrirEdicionEspecialidad(esp) {
    setEspecialidadEnEdicion(esp);
    setRecomendacionesTexto((esp.recomendaciones || []).join('\n'));
  }

  async function guardarRecomendacionesEspecialidad() {
    if (!especialidadEnEdicion) return;
    try {
      const arrayRecs = recomendacionesTexto
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      await api.updateEspecialidad(especialidadEnEdicion.id, {
        recomendaciones: arrayRecs
      });
      setEspecialidadEnEdicion(null);
      cargarTodo();
    } catch (err) {
      alert('Error al actualizar recomendaciones: ' + err.message);
    }
  }

  // ==========================================
  // GESTIÓN DE USUARIOS (ADMINISTRADORES Y AGENTES)
  // ==========================================
  function abrirModalNuevoAgente(rolInicial = 'agente') {
    setUsuarioEnEdicion(null);
    setFormUsuario({
      nombre: '',
      username: '',
      email: '',
      password: '',
      cargo: rolInicial === 'admin' ? 'Administrador de Sede' : 'Agente de Admisiones y Recepción',
      rol: rolInicial,
      sedesAsignadas: sedes.length > 0 ? [sedes[0].id] : [],
      activo: true
    });
    setModalUsuarioAbierto(true);
  }

  function abrirModalEditarAgente(agente) {
    setUsuarioEnEdicion(agente);
    setFormUsuario({
      nombre: agente.nombre,
      username: agente.username,
      email: agente.email || '',
      password: '', // si se deja vacío, no se modifica la clave
      cargo: agente.cargo || '',
      rol: agente.rol || 'agente',
      sedesAsignadas: agente.sedesAsignadas || [],
      activo: agente.activo !== false
    });
    setModalUsuarioAbierto(true);
  }

  async function guardarAgente(e) {
    e.preventDefault();
    try {
      if (usuarioEnEdicion) {
        await api.updateUsuario(usuarioEnEdicion.id, formUsuario);
      } else {
        await api.createUsuario(formUsuario);
      }
      setModalUsuarioAbierto(false);
      cargarTodo();
    } catch (err) {
      alert('Error al guardar usuario: ' + err.message);
    }
  }

  async function toggleEstadoAgente(agente) {
    try {
      await api.toggleEstadoUsuario(agente.id);
      cargarTodo();
    } catch (err) {
      alert('Error al cambiar estado: ' + err.message);
    }
  }

  async function eliminarAgente(agente) {
    if (!window.confirm(`¿Está seguro de eliminar al usuario ${agente.nombre} (@${agente.username}) [${agente.rol.toUpperCase()}]?`)) {
      return;
    }
    try {
      await api.deleteUsuario(agente.id);
      cargarTodo();
    } catch (err) {
      alert('Error al eliminar usuario: ' + err.message);
    }
  }

  // ==========================================
  // FILTRADO AVANZADO DE CITAS (POR DÍAS Y ESPECIALISTA)
  // ==========================================
  const hoyStr = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  const citasFiltradas = citas.filter(c => {
    if (filtroSede && c.sedeId !== filtroSede) return false;
    if (filtroCanal && c.tipoAgendamiento !== filtroCanal) return false;
    if (filtroEstado && c.estado !== filtroEstado) return false;
    if (filtroMedico && c.medicoId !== filtroMedico) return false;

    // Filtro por Días
    if (filtroFechaTipo === 'hoy') {
      if (c.fecha !== hoyStr) return false;
    } else if (filtroFechaTipo === 'manana') {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      const mananaStr = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(manana);
      if (c.fecha !== mananaStr) return false;
    } else if (filtroFechaTipo === 'semana') {
      const limite = new Date();
      limite.setDate(limite.getDate() + 7);
      const limiteStr = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(limite);
      if (c.fecha < hoyStr || c.fecha > limiteStr) return false;
    } else if (filtroFechaTipo === 'especifica') {
      if (fechaFiltro && c.fecha !== fechaFiltro) return false;
    }

    if (busquedaDoc) {
      const term = busquedaDoc.toLowerCase().trim();
      const numDoc = (c.pacienteNumDoc || '').toLowerCase();
      const nom = (c.pacienteNombres || '').toLowerCase();
      const ape = (c.pacienteApellidos || '').toLowerCase();
      const rad = (c.codigoCita || '').toLowerCase();
      if (!numDoc.includes(term) && !nom.includes(term) && !ape.includes(term) && !rad.includes(term)) {
        return false;
      }
    }

    return true;
  });

  // Funciones de Exportación a Excel y Copiado a Info Salud
  function handleExportarExcel() {
    if (citasFiltradas.length === 0) {
      alert('No hay citas con los filtros seleccionados para exportar a Excel.');
      return;
    }
    const med = medicos.find(m => m.id === filtroMedico);
    const sedeObj = sedes.find(s => s.id === filtroSede);
    const fechaDesc = filtroFechaTipo === 'especifica' ? fechaFiltro : filtroFechaTipo;

    exportarCitasAExcel(citasFiltradas, {
      nombreEspecialista: med ? med.nombre : 'Todos',
      fechaFiltro: fechaDesc,
      sedeFiltro: sedeObj ? sedeObj.nombre : 'Todas'
    });
  }

  function handleCopiarInfoSalud() {
    if (citasFiltradas.length === 0) {
      alert('No hay citas filtradas para copiar.');
      return;
    }

    const headers = [
      'TURNO', 'RADICADO', 'FECHA', 'HORA_INICIO', 'HORA_FIN', 'DURACION',
      'TIPO_DOC', 'DOCUMENTO', 'PACIENTE', 'TELEFONO', 'EPS', 'ESPECIALIDAD',
      'ESPECIALISTA', 'CONSULTORIO', 'SEDE', 'CANAL', 'ESTADO', 'MOTIVO'
    ].join('\t');

    const filas = citasFiltradas.map((c, i) => {
      const dur = c.duracionMinutos || c.medico?.duracionCitaMinutos || 30;
      const fin = calcularHoraFin(c.hora, dur);
      return [
        i + 1,
        c.codigoCita,
        c.fecha,
        c.hora,
        fin,
        `${dur} min`,
        c.pacienteTipoDoc,
        c.pacienteNumDoc,
        `${c.pacienteNombres} ${c.pacienteApellidos}`,
        c.pacienteTelefono,
        c.pacienteAseguradora,
        c.especialidad?.nombre,
        c.medico?.nombre,
        c.medico?.consultorio,
        c.sede?.nombre,
        c.tipoAgendamiento.toUpperCase(),
        c.estado.toUpperCase(),
        c.motivoConsulta
      ].join('\t');
    }).join('\n');

    const tsv = `${headers}\n${filas}`;
    navigator.clipboard.writeText(tsv).then(() => {
      setCopiadoExitoso(true);
      setTimeout(() => setCopiadoExitoso(false), 3500);
    }).catch(err => {
      console.error(err);
      alert('No se pudo copiar automáticamente al portapapeles.');
    });
  }

  // Control de Seguridad: rol admin o superadmin pueden acceder
  if (!usuarioActual || (usuarioActual.rol !== 'admin' && usuarioActual.rol !== 'superadmin')) {
    return (
      <div className="card-panel" style={{ maxWidth: '600px', margin: '3rem auto', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: '#FEF3C7',
          color: '#D97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ fontSize: '1.4rem', color: '#0F172A', marginBottom: '0.8rem' }}>
          Acceso Restringido — Panel Administrativo
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Este módulo de configuración y control maestro es exclusivo para personal autorizado de <b>ARCAL Protección Radiológica IPS</b>.
        </p>
        <button
          className="btn btn-primary"
          style={{ padding: '0.9rem 2rem', fontWeight: 800 }}
          onClick={onOpenLogin}
        >
          Iniciar Sesión como Administrador
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Encabezado del Administrador / Super Administrador */}
      <div className="card-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: isSuperAdmin ? '5px solid #E34A83' : '5px solid var(--brand-cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              className="card-icon-badge"
              style={{
                width: '52px',
                height: '52px',
                background: isSuperAdmin ? 'linear-gradient(135deg, var(--brand-green) 0%, var(--brand-green-hover) 100%)' : 'var(--primary-900)',
                color: isSuperAdmin ? '#E34A83' : 'white',
                border: isSuperAdmin ? '2px solid var(--brand-green-hover)' : 'none'
              }}
            >
              {isSuperAdmin ? <Crown size={26} /> : <Settings size={24} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    background: isSuperAdmin ? '#f8dce6ff' : '#E0F2FE',
                    color: isSuperAdmin ? '#E34A83' : '#0369A1'
                  }}
                >
                  {isSuperAdmin ? 'Super Administrador Maestro' : 'Administrador de Sede'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Sesión activa: <b>@{usuarioActual.username}</b>
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', color: '#0F172A', margin: 0 }}>
                {isSuperAdmin
                  ? 'Panel de Super Admin — Gestión de Admins, Tiempos Clínicos & Info Salud'
                  : 'Administración General — IPS ARCAL'}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={cargarTodo} title="Actualizar datos">
              <RefreshCw size={16} /> Actualizar
            </button>
            {subTab === 'sedes' && (
              <button className="btn btn-accent" onClick={abrirModalNuevaSede}>
                <Plus size={18} /> Nueva Sede
              </button>
            )}
            {subTab === 'medicos' && (
              <button className="btn btn-accent" onClick={abrirModalNuevoMedico}>
                <Plus size={18} /> Agregar Médico
              </button>
            )}
            {subTab === 'agentes' && (
              <button className="btn btn-accent" onClick={() => abrirModalNuevoAgente(isSuperAdmin ? 'admin' : 'agente')}>
                <Plus size={18} /> {isSuperAdmin ? 'Crear Administrador / Agente' : 'Registrar Nuevo Agente'}
              </button>
            )}
            {subTab === 'citas' && (
              <button
                className="btn btn-accent"
                onClick={handleExportarExcel}
                style={{ background: 'var(--brand-green-dark)', borderColor: 'var(--brand-green)', color: 'white' }}
                title="Descargar agenda en formato compatible con Info Salud"
              >
                <FileSpreadsheet size={16} /> Exportar Excel
              </button>
            )}
          </div>
        </div>

        {/* Subpestañas del Administrador */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${subTab === 'citas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTab('citas')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', fontWeight: 700 }}
          >
            <Calendar size={16} /> Agenda & Citas ({citas.length})
          </button>
          <button
            className={`btn ${subTab === 'medicos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTab('medicos')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Users size={16} /> Especialistas & Tiempos ({medicos.length})
          </button>
          <button
            className={`btn ${subTab === 'agentes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTab('agentes')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            {isSuperAdmin ? <Crown size={16} color="#D97706" /> : <UserCheck size={16} />}
            {isSuperAdmin ? `Gestión de Admins & Agentes (${usuarios.length})` : `Agentes de Atención (${usuarios.filter(u => u.rol === 'agente').length})`}
          </button>
          <button
            className={`btn ${subTab === 'sedes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTab('sedes')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Building2 size={16} /> Sedes ({sedes.length})
          </button>
          <button
            className={`btn ${subTab === 'especialidades' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTab('especialidades')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Stethoscope size={16} /> Especialidades & Recomendaciones ({especialidades.length})
          </button>
          <button
            className={`btn ${subTab === 'metricas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSubTab('metricas')}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Activity size={16} /> Métricas & KPIs
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUBPESTAÑA: MÉTRICAS & KPIs */}
      {/* ======================================================== */}
      {subTab === 'metricas' && metricas && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                <Calendar size={28} />
              </div>
              <div className="kpi-data">
                <h3>{metricas.totalCitas}</h3>
                <p>Total Citas Registradas</p>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
                <Activity size={28} />
              </div>
              <div className="kpi-data">
                <h3>{metricas.citasHoy}</h3>
                <p>Citas Programadas Hoy</p>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#F0FDFA', color: '#0D9488' }}>
                <Users size={28} />
              </div>
              <div className="kpi-data">
                <h3>{metricas.citasWeb}</h3>
                <p>Citas Vía Canal Web</p>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
                <Building2 size={28} />
              </div>
              <div className="kpi-data">
                <h3>{metricas.citasPresenciales}</h3>
                <p>Citas en Taquilla Presencial</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card-panel">
              <h3 className="panel-title" style={{ marginBottom: '1rem' }}>Citas por Sede</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {metricas.sedesStats.map(s => (
                  <div key={s.sedeId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.ciudad}</div>
                    </div>
                    <span className="badge badge-confirmada" style={{ fontSize: '0.85rem' }}>
                      {s.totalCitas} citas
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-panel">
              <h3 className="panel-title" style={{ marginBottom: '1rem' }}>Citas por Especialidad</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '350px', overflowY: 'auto' }}>
                {metricas.especialidadesStats.map(e => (
                  <div key={e.especialidadId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#F8FAFC', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{e.nombre}</div>
                    <span className="badge badge-web" style={{ fontSize: '0.8rem' }}>
                      {e.totalCitas} citas
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPESTAÑA: GESTIÓN DE SEDES */}
      {/* ======================================================== */}
      {subTab === 'sedes' && (
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Building2 size={20} color="#028090" />
                Sedes Habilitadas de IPS ARCAL
              </h3>
              <p className="panel-subtitle">Administre la información física, contactos, consultorios y estado de cada sede.</p>
            </div>
            <button className="btn btn-accent" onClick={abrirModalNuevaSede}>
              <Plus size={18} /> Agregar Sede
            </button>
          </div>

          <div className="selection-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {sedes.map(sede => (
              <div key={sede.id} className="select-card" style={{ cursor: 'default' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="brand-tag">{sede.codigo}</span>
                    <span className={`badge ${sede.activa ? 'badge-confirmada' : 'badge-cancelada'}`}>
                      {sede.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.15rem', margin: '0.6rem 0 0.3rem' }}>{sede.nombre}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#028090', fontWeight: 700, marginBottom: '0.6rem' }}>
                    {sede.ciudad}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>{sede.direccion}</p>

                  <div className="card-meta-list" style={{ marginTop: '0.8rem' }}>
                    <div className="card-meta-item"><b>Teléfono:</b> {sede.telefono}</div>
                    <div className="card-meta-item"><b>Horario:</b> {sede.horarioAtencion}</div>
                    <div className="card-meta-item"><b>Consultorios:</b> {sede.consultorios} habilitados</div>
                  </div>

                  <div style={{ marginTop: '0.8rem', borderTop: '1px dashed #E2E8F0', paddingTop: '0.6rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                      Especialidades habilitadas ({sede.especialidadesHabilitadas?.length || 0}):
                    </div>
                    {(!sede.especialidadesHabilitadas || sede.especialidadesHabilitadas.length === 0) ? (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                        Sin especialidades habilitadas
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {(sede.especialidadesDetalle && sede.especialidadesDetalle.length > 0
                          ? sede.especialidadesDetalle
                          : especialidades.filter(e => sede.especialidadesHabilitadas?.includes(e.id))
                        ).map(esp => (
                          <span
                            key={esp.id}
                            style={{
                              fontSize: '0.7rem',
                              background: '#F0FDF4',
                              color: '#166534',
                              border: '1px solid #BBF7D0',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              fontWeight: 600
                            }}
                          >
                            {esp.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.8rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                    onClick={() => abrirModalEditarSede(sede)}
                  >
                    <Edit2 size={14} /> Editar Sede
                  </button>
                  <button
                    className={`btn ${sede.activa ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => toggleEstadoSede(sede)}
                  >
                    {sede.activa ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPESTAÑA: GESTIÓN DE ESPECIALIDADES & RECOMENDACIONES */}
      {/* ======================================================== */}
      {subTab === 'especialidades' && (
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Stethoscope size={20} color="#028090" />
                9 Especialidades Médicas Habilitadas
              </h3>
              <p className="panel-subtitle">
                Configure las recomendaciones clínicas preparatorias que se imprimen en el comprobante PDF para cada especialidad.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {especialidades.map(esp => (
              <div
                key={esp.id}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="badge badge-web">{esp.codigo}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{esp.duracionMinutos} minutos</span>
                  </div>

                  <h4 style={{ fontSize: '1.2rem', color: '#0F172A', marginBottom: '0.4rem' }}>{esp.nombre}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>{esp.descripcion}</p>

                  <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.8rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400E', marginBottom: '0.4rem' }}>
                      Recomendaciones para el PDF:
                    </div>
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.76rem', color: '#78350F', lineHeight: '1.4' }}>
                      {esp.recomendaciones?.map((r, i) => (
                        <li key={i} style={{ marginBottom: '0.3rem' }}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.8rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                    onClick={() => abrirEdicionEspecialidad(esp)}
                  >
                    <Edit2 size={14} /> Editar Recomendaciones del PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPESTAÑA: GESTIÓN DE MÉDICOS */}
      {/* ======================================================== */}
      {subTab === 'medicos' && (
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Users size={20} color="#028090" />
                Cuerpo Médico Especialista
              </h3>
              <p className="panel-subtitle">Profesionales adscritos a las sedes de IPS ARCAL.</p>
            </div>
            <button className="btn btn-accent" onClick={abrirModalNuevoMedico}>
              <Plus size={18} /> Registrar Especialista
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre del Profesional</th>
                  <th>Registro Médico</th>
                  <th>Especialidad</th>
                  <th>Sede & Consultorio</th>
                  <th>Horario Jornada</th>
                  <th>Duración Cita</th>
                  <th>Pausas Programadas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {medicos.map(med => {
                  const duracion = med.duracionCitaMinutos || 30;
                  const pausas = Array.isArray(med.pausas) ? med.pausas : [];
                  return (
                    <tr key={med.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{med.nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Días: {(med.diasAtencion || []).join(', ') || 'Lun - Vie'}</div>
                      </td>
                      <td><span className="badge badge-web">{med.registroMedico}</span></td>
                      <td><b>{med.especialidadNombre}</b></td>
                      <td>
                        <div>{med.sedeNombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{med.consultorio}</div>
                      </td>
                      <td>{med.horaInicio} - {med.horaFin}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span
                            className="badge"
                            style={{
                              background: duracion === 30 ? '#F1F5F9' : '#FEF3C7',
                              color: duracion === 30 ? '#475569' : '#B45309',
                              border: duracion === 30 ? '1px solid #CBD5E1' : '1px solid #FDE68A',
                              fontWeight: 700
                            }}
                          >
                            <Clock size={12} style={{ marginRight: '0.2rem' }} />
                            {duracion} min {duracion === 30 ? '(Predet.)' : 'Personalizado'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {pausas.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>
                            Sin pausas
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {pausas.map(p => (
                              <span
                                key={p.id}
                                style={{
                                  fontSize: '0.72rem',
                                  background: '#FFFBEB',
                                  color: '#92400E',
                                  border: '1px solid #FCD34D',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                                title={p.motivo}
                              >
                                <Coffee size={11} /> {p.horaInicio} - {p.horaFin}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${med.activo !== false ? 'badge-confirmada' : 'badge-cancelada'}`}>
                          {med.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {isSuperAdmin && (
                            <button
                              className="btn btn-secondary"
                              style={{
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                color: '#B45309',
                                borderColor: '#FDE68A',
                                background: '#FFFBEB',
                                fontWeight: 700
                              }}
                              onClick={() => abrirModalConfigurarPausas(med)}
                              title="Gestionar duración de consulta y franjas de descanso (Exclusivo Super Admin)"
                            >
                              <Sliders size={13} /> Tiempos & Pausas
                            </button>
                          )}
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => abrirModalEditarMedico(med)}
                            title="Editar profesional"
                          >
                            <Edit2 size={13} /> Editar
                          </button>
                          <button
                            className={`btn ${med.activo !== false ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => toggleEstadoMedico(med)}
                            title={med.activo !== false ? 'Desactivar médico' : 'Activar médico'}
                          >
                            {med.activo !== false ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPESTAÑA: GESTIÓN DE USUARIOS / ADMINISTRADORES / AGENTES */}
      {/* ======================================================== */}
      {subTab === 'agentes' && (
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                {isSuperAdmin && (
                  <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    CONTROL DE ACCESOS SUPER ADMIN
                  </span>
                )}
              </div>
              <h3 className="panel-title">
                {isSuperAdmin ? <Crown size={20} color="#D97706" /> : <Users size={20} color="#028090" />}
                {isSuperAdmin ? 'Gestión de Administradores y Agentes de Atención' : 'Agentes de Atención al Cliente & Recepción'}
              </h3>
              <p className="panel-subtitle">
                {isSuperAdmin
                  ? 'Como Super Administrador puede crear, habilitar, editar y dar de baja cuentas de Administrador y Agentes de Atención de IPS ARCAL.'
                  : 'Administre el personal de ventanilla, asigne las sedes permitidas a cada agente y controle su estado de acceso.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isSuperAdmin && (
                <button
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', border: '1px solid #F59E0B' }}
                  onClick={() => abrirModalNuevoAgente('admin')}
                >
                  <Plus size={18} color="#FBBF24" /> Crear Administrador
                </button>
              )}
              <button className="btn btn-accent" onClick={() => abrirModalNuevoAgente('agente')}>
                <Plus size={18} /> Registrar Agente
              </button>
            </div>
          </div>

          {/* Filtro por Rol (Exclusivo Super Admin) */}
          {isSuperAdmin && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              {[
                { id: 'todos', label: `Todos los Usuarios (${usuarios.length})` },
                { id: 'admin', label: `Administradores (${usuarios.filter(u => u.rol === 'admin').length})` },
                { id: 'agente', label: `Agentes de Atención (${usuarios.filter(u => u.rol === 'agente').length})` },
                { id: 'superadmin', label: `Super Admin (${usuarios.filter(u => u.rol === 'superadmin').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  className={`btn ${filtroRolUsuario === f.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setFiltroRolUsuario(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Usuario / Nombre</th>
                  <th>Rol en el Sistema</th>
                  <th>Login (Usuario)</th>
                  <th>Cargo</th>
                  <th>Sedes Autorizadas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const listaUsuarios = usuarios.filter(u => {
                    if (!isSuperAdmin) return u.rol === 'agente';
                    if (filtroRolUsuario === 'todos') return true;
                    return u.rol === filtroRolUsuario;
                  });

                  if (listaUsuarios.length === 0) {
                    return (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
                          No hay usuarios que coincidan con el filtro seleccionado.
                        </td>
                      </tr>
                    );
                  }

                  return listaUsuarios.map(usr => {
                    const esSuper = usr.rol === 'superadmin';
                    const esAdmin = usr.rol === 'admin';
                    const esActual = usr.id === usuarioActual.id;

                    return (
                      <tr key={usr.id} style={esSuper ? { background: '#FFFDF5' } : {}}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontWeight: 800, color: '#0F172A' }}>{usr.nombre}</div>
                            {esActual && (
                              <span style={{ fontSize: '0.65rem', background: '#DCFCE7', color: '#15803D', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                                TU CUENTA
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{usr.email || 'Sin correo registrado'}</div>
                        </td>
                        <td>
                          {esSuper ? (
                            <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', fontWeight: 800 }}>
                              SUPER ADMIN
                            </span>
                          ) : esAdmin ? (
                            <span className="badge" style={{ background: '#EDE9FE', color: '#5B21B6', border: '1px solid #DDD6FE', fontWeight: 800 }}>
                              ADMINISTRADOR
                            </span>
                          ) : (
                            <span className="badge badge-web" style={{ fontWeight: 700 }}>
                              AGENTE
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-web" style={{ textTransform: 'none', fontWeight: 700 }}>
                            @{usr.username}
                          </span>
                        </td>
                        <td>{usr.cargo || (esSuper ? 'Super Administrador' : esAdmin ? 'Administrador' : 'Agente')}</td>
                        <td>
                          {esSuper || esAdmin ? (
                            <span style={{ fontSize: '0.75rem', color: '#0369A1', fontWeight: 700, background: '#E0F2FE', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              Todas las Sedes (Maestro)
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', maxWidth: '280px' }}>
                              {usr.sedesDetalle && usr.sedesDetalle.length > 0 ? (
                                usr.sedesDetalle.map(s => (
                                  <span key={s.id} className="badge badge-presencial" style={{ fontSize: '0.68rem' }}>
                                    {s.nombre}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>
                                  Sin sedes asignadas
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${usr.activo !== false ? 'badge-confirmada' : 'badge-cancelada'}`}>
                            {usr.activo !== false ? 'Habilitado' : 'Deshabilitado'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {esSuper ? (
                              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic', padding: '0.3rem 0.5rem' }}>
                                Protegido
                              </span>
                            ) : (
                              <>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                                  onClick={() => abrirModalEditarAgente(usr)}
                                  title="Editar datos, rol o sedes"
                                >
                                  <Edit2 size={13} /> Editar
                                </button>
                                <button
                                  className={`btn ${usr.activo !== false ? 'btn-danger' : 'btn-secondary'}`}
                                  style={{
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.75rem',
                                    ...(usr.activo === false ? { color: '#15803D', borderColor: '#BBF7D0', background: '#DCFCE7' } : {})
                                  }}
                                  onClick={() => toggleEstadoAgente(usr)}
                                  title={usr.activo !== false ? 'Deshabilitar acceso' : 'Habilitar acceso'}
                                  disabled={esActual}
                                >
                                  {usr.activo !== false ? 'Deshabilitar' : 'Habilitar'}
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#991B1B' }}
                                  onClick={() => eliminarAgente(usr)}
                                  title="Eliminar usuario del sistema"
                                  disabled={esActual}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPESTAÑA: CONTROL DE CITAS & AGENDA ESPECIALISTA (INFO SALUD) */}
      {/* ======================================================== */}
      {subTab === 'citas' && (
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#15803D', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  SISTEMA DE GESTIÓN & ANEXO A INFO SALUD
                </span>
                {filtroFechaTipo !== 'todas' && (
                  <span style={{ fontSize: '0.72rem', background: '#E0F2FE', color: '#0369A1', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    Filtro Activo: {filtroFechaTipo.toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="panel-title">
                <Calendar size={20} color="#028090" />
                Control de Citas & Agenda Especialista
              </h3>
              <p className="panel-subtitle">
                Gestione la programación interna de citas por especialista, filtre por días, visualice pausas médicas y exporte en Excel para anexar al sistema <b>Info Salud</b>.
              </p>
            </div>

            {/* Acciones de Exportación e Intercambio de Vistas */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.25rem', borderRadius: '8px' }}>
                <button
                  className={`btn ${vistaModoCitas === 'agenda' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', border: 'none' }}
                  onClick={() => setVistaModoCitas('agenda')}
                >
                  <Calendar size={14} /> Agenda Info Salud
                </button>
                <button
                  className={`btn ${vistaModoCitas === 'tabla' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', border: 'none' }}
                  onClick={() => setVistaModoCitas('tabla')}
                >
                  Tabla General
                </button>
              </div>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                onClick={handleCopiarInfoSalud}
                title="Copiar datos tabulados para pegar directamente en hojas de cálculo o Info Salud"
              >
                {copiadoExitoso ? <CheckCircle2 size={15} color="#15803D" /> : <Copy size={15} />}
                {copiadoExitoso ? '¡Copiado!' : 'Copiar TSV'}
              </button>

              <button
                className="btn btn-accent"
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem', background: '#059669', borderColor: '#059669', color: 'white', fontWeight: 700 }}
                onClick={handleExportarExcel}
                title="Generar archivo .xlsx estructurado con duración exacta y horarios para Info Salud"
              >
                <FileSpreadsheet size={16} /> Exportar Excel Info Salud
              </button>
            </div>
          </div>

          {/* BARRA DE FILTRO POR DÍAS (Requerimiento Clave) */}
          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                <Filter size={16} color="#028090" /> Filtro por Días:
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className={`btn ${filtroFechaTipo === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                  onClick={() => setFiltroFechaTipo('todas')}
                >
                  Todas las Fechas
                </button>
                <button
                  className={`btn ${filtroFechaTipo === 'hoy' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                  onClick={() => setFiltroFechaTipo('hoy')}
                >
                  Hoy
                </button>
                <button
                  className={`btn ${filtroFechaTipo === 'manana' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                  onClick={() => setFiltroFechaTipo('manana')}
                >
                  Mañana
                </button>
                <button
                  className={`btn ${filtroFechaTipo === 'semana' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                  onClick={() => setFiltroFechaTipo('semana')}
                >
                  Próximos 7 Días
                </button>
                <button
                  className={`btn ${filtroFechaTipo === 'especifica' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                  onClick={() => setFiltroFechaTipo('especifica')}
                >
                  Fecha Específica
                </button>

                {filtroFechaTipo === 'especifica' && (
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem', maxWidth: '160px', marginLeft: '0.4rem' }}
                    value={fechaFiltro}
                    onChange={e => setFechaFiltro(e.target.value)}
                  />
                )}
              </div>
            </div>

            {/* Filtros Secundarios: Especialista, Sede, Canal, Estado y Documento */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                  Especialista Médico:
                </label>
                <select
                  className="form-select"
                  style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem' }}
                  value={filtroMedico}
                  onChange={e => setFiltroMedico(e.target.value)}
                >
                  <option value="">Todos los Especialistas</option>
                  {medicos.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} — {m.especialidadNombre} ({m.duracionCitaMinutos || 30} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                  Sede IPS:
                </label>
                <select
                  className="form-select"
                  style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem' }}
                  value={filtroSede}
                  onChange={e => setFiltroSede(e.target.value)}
                >
                  <option value="">Todas las Sedes</option>
                  {sedes.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                  Canal de Reserva:
                </label>
                <select
                  className="form-select"
                  style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem' }}
                  value={filtroCanal}
                  onChange={e => setFiltroCanal(e.target.value)}
                >
                  <option value="">Todos los Canales</option>
                  <option value="web">Canal Web</option>
                  <option value="presencial">Presencial (Sede)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                  Estado de la Cita:
                </label>
                <select
                  className="form-select"
                  style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem' }}
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value)}
                >
                  <option value="">Todos los Estados</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="en_sala">En Sala</option>
                  <option value="atendida">Atendida</option>
                  <option value="no_asistio">No Asistió</option>
                  <option value="llego_tarde">Llegó Tarde</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                  Búsqueda Paciente / Radicado:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Doc, nombre o radicado..."
                  style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem' }}
                  value={busquedaDoc}
                  onChange={e => setBusquedaDoc(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* FICHA TÉCNICA DEL ESPECIALISTA (Si hay especialista filtrado) */}
          {(() => {
            const medSel = medicos.find(m => m.id === filtroMedico);
            if (!medSel) return null;
            const dur = medSel.duracionCitaMinutos || 30;
            const pausas = Array.isArray(medSel.pausas) ? medSel.pausas : [];

            return (
              <div
                style={{
                  background: 'linear-gradient(135deg, #F0FDFA 0%, #E6FFFA 100%)',
                  border: '1.5px solid #99F6E4',
                  borderRadius: '12px',
                  padding: '1rem 1.2rem',
                  marginBottom: '1.2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#0F766E', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      AGENDA INTERNA DEL ESPECIALISTA
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#0F766E', fontWeight: 700 }}>
                      {medSel.sedeNombre} — {medSel.consultorio}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.15rem', color: '#134E4A', margin: '0.2rem 0' }}>
                    {medSel.nombre} <span style={{ fontSize: '0.9rem', color: '#047857', fontWeight: 600 }}>({medSel.especialidadNombre})</span>
                  </h4>
                  <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#115E59', marginTop: '0.4rem' }}>
                    <span><b>Jornada:</b> {medSel.horaInicio} - {medSel.horaFin}</span>
                    <span>
                      <b>Duración de Consulta:</b>{' '}
                      <span className="badge" style={{ background: dur === 30 ? '#E0F2FE' : '#FEF3C7', color: dur === 30 ? '#0369A1' : '#B45309', fontWeight: 800 }}>
                        <Clock size={11} style={{ marginRight: '0.2rem' }} />
                        {dur} min {dur === 30 ? '(Predeterminado)' : '(Configurado por Super Admin)'}
                      </span>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {pausas.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: '#0F766E', fontStyle: 'italic', background: 'white', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                        Sin pausas de descanso programadas
                      </span>
                    ) : (
                      pausas.map(p => (
                        <span
                          key={p.id}
                          style={{
                            fontSize: '0.75rem',
                            background: '#FFFBEB',
                            color: '#92400E',
                            border: '1px solid #FCD34D',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Coffee size={13} /> Pausa: {p.horaInicio} - {p.horaFin} ({p.motivo})
                        </span>
                      ))
                    )}
                  </div>

                  {isSuperAdmin && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem', color: '#B45309', borderColor: '#FDE68A', background: '#FFFBEB', fontWeight: 800 }}
                      onClick={() => abrirModalConfigurarPausas(medSel)}
                    >
                      <Sliders size={13} /> Ajustar Tiempos & Pausas del Especialista
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* VISTA 1: AGENDA ESPECIALISTA FORMATO INFO SALUD */}
          {vistaModoCitas === 'agenda' ? (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Horario (Inicio - Fin)</th>
                    <th>Radicado</th>
                    <th>Paciente (Info Salud)</th>
                    <th>Documento</th>
                    <th>Teléfono & EPS</th>
                    <th>Especialista & Consultorio</th>
                    <th>Sede</th>
                    <th>Canal</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (citasFiltradas.length === 0) {
                      return (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                            <Calendar size={36} color="#CBD5E1" style={{ margin: '0 auto 0.8rem auto', display: 'block' }} />
                            <b>No hay citas programadas con los filtros seleccionados.</b>
                            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.3rem' }}>
                              Pruebe cambiando el filtro por días (Hoy, Mañana, Esta Semana) o seleccionando otro especialista.
                            </p>
                          </td>
                        </tr>
                      );
                    }

                    // Renderizar las filas de citas calculando Hora Fin exacta basada en duracionCitaMinutos
                    return citasFiltradas.map(cita => {
                      const duracion = cita.duracionMinutos || cita.medico?.duracionCitaMinutos || 30;
                      const horaFinCalculada = calcularHoraFin(cita.hora, duracion);

                      return (
                        <tr key={cita.id}>
                          <td>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={14} color="#028090" />
                              {cita.hora} — {horaFinCalculada}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              Fecha: <b>{cita.fecha}</b> ({duracion} min)
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#028090', fontSize: '0.85rem' }}>
                              {cita.codigoCita}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>
                              {cita.pacienteNombres} {cita.pacienteApellidos}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              {cita.motivoConsulta || 'Consulta médica especializada'}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-web" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              {cita.pacienteTipoDoc} {cita.pacienteNumDoc}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem', color: '#0F172A' }}>{cita.pacienteTelefono || 'Sin teléfono'}</div>
                            <div style={{ fontSize: '0.72rem', color: '#0369A1', fontWeight: 600 }}>{cita.pacienteEps || 'Particular'}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{cita.medico?.nombre || 'Especialista'}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              {cita.especialidad?.nombre} • {cita.medico?.consultorio}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>{cita.sede?.nombre}</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{cita.sede?.ciudad}</div>
                          </td>
                          <td>
                            <span className={`badge ${cita.tipoAgendamiento === 'web' ? 'badge-web' : 'badge-presencial'}`}>
                              {cita.tipoAgendamiento}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${cita.estado}`}>
                              {cita.estado === 'no_asistio' ? 'No Asistió' :
                                cita.estado === 'llego_tarde' ? 'Llegó Tarde' :
                                  cita.estado === 'en_sala' ? 'En Sala' :
                                    cita.estado}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => generarComprobantePDF(cita)}
                              title="Descargar comprobante PDF de la cita"
                            >
                              <FileDown size={14} /> PDF
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            /* VISTA 2: TABLA GENERAL COMPACTA */
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Radicado</th>
                    <th>Paciente</th>
                    <th>Especialidad</th>
                    <th>Profesional</th>
                    <th>Sede</th>
                    <th>Fecha & Hora</th>
                    <th>Duración</th>
                    <th>Canal</th>
                    <th>Estado</th>
                    <th>Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {citasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                        No se encontraron citas con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    citasFiltradas.map(cita => {
                      const duracion = cita.duracionMinutos || cita.medico?.duracionCitaMinutos || 30;
                      return (
                        <tr key={cita.id}>
                          <td><b>{cita.codigoCita}</b></td>
                          <td>
                            <div>{cita.pacienteNombres} {cita.pacienteApellidos}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{cita.pacienteTipoDoc} {cita.pacienteNumDoc}</div>
                          </td>
                          <td>{cita.especialidad?.nombre}</td>
                          <td>{cita.medico?.nombre}</td>
                          <td>{cita.sede?.ciudad} - {cita.sede?.nombre}</td>
                          <td>
                            <b>{cita.fecha}</b> a las {cita.hora}
                          </td>
                          <td>
                            <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontSize: '0.72rem' }}>
                              {duracion} min
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${cita.tipoAgendamiento === 'web' ? 'badge-web' : 'badge-presencial'}`}>
                              {cita.tipoAgendamiento}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${cita.estado}`}>
                              {cita.estado === 'no_asistio' ? 'No Asistió' :
                                cita.estado === 'llego_tarde' ? 'Llegó Tarde' :
                                  cita.estado === 'en_sala' ? 'En Sala' :
                                    cita.estado}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => generarComprobantePDF(cita)}
                              title="Descargar PDF oficial"
                            >
                              <FileDown size={14} /> PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREAR / EDITAR SEDE */}
      {/* ======================================================== */}
      {modalSedeAbierto && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#0F172A' }}>
                {sedeEnEdicion ? 'Editar Información de Sede' : 'Registrar Nueva Sede IPS ARCAL'}
              </h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                onClick={() => setModalSedeAbierto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarSede}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Nombre Oficial de la Sede *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formSede.nombre}
                    onChange={e => setFormSede({ ...formSede, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Código Único (Ej: BOG-NORTE) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formSede.codigo}
                    onChange={e => setFormSede({ ...formSede, codigo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ciudad *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formSede.ciudad}
                    onChange={e => setFormSede({ ...formSede, ciudad: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Dirección Completa *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formSede.direccion}
                    onChange={e => setFormSede({ ...formSede, direccion: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfonos de Contacto</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formSede.telefono}
                    onChange={e => setFormSede({ ...formSede, telefono: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Número de Consultorios</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formSede.consultorios}
                    onChange={e => setFormSede({ ...formSede, consultorios: e.target.value })}
                    min="1"
                    max="50"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Horario de Atención</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formSede.horarioAtencion}
                    onChange={e => setFormSede({ ...formSede, horarioAtencion: e.target.value })}
                  />
                </div>

                <div className="form-group full-width" style={{ marginTop: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
                      Especialidades Médicas Habilitadas para esta Sede:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        style={{ fontSize: '0.72rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', color: '#0F172A' }}
                        onClick={() => setFormSede(prev => ({ ...prev, especialidadesHabilitadas: especialidades.map(e => e.id) }))}
                      >
                        Habilitar todas
                      </button>
                      <button
                        type="button"
                        style={{ fontSize: '0.72rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', color: '#0F172A' }}
                        onClick={() => setFormSede(prev => ({ ...prev, especialidadesHabilitadas: [] }))}
                      >
                        Desmarcar todas
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 0, marginBottom: '0.8rem' }}>
                    Active únicamente las especialidades que funcionarán en esta sede física. Las especialidades no marcadas se ocultarán automáticamente tanto en el portal web de pacientes como en la taquilla presencial.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', padding: '0.8rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    {especialidades.map(esp => {
                      const isChecked = formSede.especialidadesHabilitadas?.includes(esp.id);
                      return (
                        <label
                          key={esp.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            padding: '0.45rem 0.6rem',
                            borderRadius: '6px',
                            background: isChecked ? '#EFF6FF' : '#FFFFFF',
                            border: isChecked ? '1px solid #93C5FD' : '1px solid #E2E8F0',
                            fontWeight: isChecked ? 600 : 400,
                            color: isChecked ? '#1E40AF' : '#334155'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormSede(prev => {
                                const current = prev.especialidadesHabilitadas || [];
                                const updated = checked
                                  ? [...current, esp.id]
                                  : current.filter(id => id !== esp.id);
                                return { ...prev, especialidadesHabilitadas: updated };
                              });
                            }}
                          />
                          <span>{esp.nombre}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.8rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalSedeAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-accent">
                  Guardar Sede
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDITAR RECOMENDACIONES DE ESPECIALIDAD */}
      {/* ======================================================== */}
      {especialidadEnEdicion && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#0F172A' }}>
                Recomendaciones para: {especialidadEnEdicion.nombre}
              </h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                onClick={() => setEspecialidadEnEdicion(null)}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem' }}>
              Escriba una recomendación por línea. Estas instrucciones aparecerán impresas en el comprobante oficial en PDF que recibe el paciente al agendar su cita.
            </p>

            <div className="form-group">
              <label className="form-label">Instrucciones Preparatorias (Una por línea):</label>
              <textarea
                className="form-textarea"
                rows="7"
                value={recomendacionesTexto}
                onChange={e => setRecomendacionesTexto(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEspecialidadEnEdicion(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-accent" onClick={guardarRecomendacionesEspecialidad}>
                Actualizar Recomendaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTRAR / EDITAR MÉDICO */}
      {/* ======================================================== */}
      {modalMedicoAbierto && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#0F172A' }}>
                {medicoEnEdicion ? 'Editar Profesional Especialista' : 'Registrar Nuevo Profesional Médico'}
              </h3>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                onClick={() => setModalMedicoAbierto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.2rem' }}>
              Asigne la sede física de atención, especialidad médica y franja horaria. El sistema generará automáticamente los bloques de citas para los pacientes.
            </p>

            <form onSubmit={guardarMedico}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Nombre Completo del Especialista *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Dr. Santiago Barrientos Morales"
                    value={formMedico.nombre}
                    onChange={e => setFormMedico({ ...formMedico, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Registro Médico / Tarjeta Profesional</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: RM-819203-BOG"
                    value={formMedico.registroMedico}
                    onChange={e => setFormMedico({ ...formMedico, registroMedico: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Consultorio Asignado</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Cons. 402-A"
                    value={formMedico.consultorio}
                    onChange={e => setFormMedico({ ...formMedico, consultorio: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Especialidad Habilitada *</label>
                  <select
                    className="form-select"
                    value={formMedico.especialidadId}
                    onChange={e => setFormMedico({ ...formMedico, especialidadId: e.target.value })}
                    required
                  >
                    <option value="">Seleccione Especialidad...</option>
                    {especialidades.map(esp => (
                      <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sede Presencial Asignada *</label>
                  <select
                    className="form-select"
                    value={formMedico.sedeId}
                    onChange={e => setFormMedico({ ...formMedico, sedeId: e.target.value })}
                    required
                  >
                    <option value="">Seleccione Sede...</option>
                    {sedes.filter(s => s.activa).map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} ({s.ciudad})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hora Inicio de Jornada</label>
                  <select
                    className="form-select"
                    value={formMedico.horaInicio}
                    onChange={e => setFormMedico({ ...formMedico, horaInicio: e.target.value })}
                  >
                    <option value="07:00">07:00 AM</option>
                    <option value="07:30">07:30 AM</option>
                    <option value="08:00">08:00 AM</option>
                    <option value="08:30">08:30 AM</option>
                    <option value="09:00">09:00 AM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hora Fin de Jornada</label>
                  <select
                    className="form-select"
                    value={formMedico.horaFin}
                    onChange={e => setFormMedico({ ...formMedico, horaFin: e.target.value })}
                  >
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.8rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalMedicoAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-accent">
                  {medicoEnEdicion ? 'Actualizar Médico' : 'Guardar Médico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREAR / EDITAR USUARIO (ADMINISTRADOR O AGENTE) */}
      {/* ======================================================== */}
      {modalUsuarioAbierto && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: formUsuario.rol === 'admin' ? '#EDE9FE' : '#E0F2FE', color: formUsuario.rol === 'admin' ? '#6D28D9' : '#028090', padding: '0.5rem', borderRadius: '10px' }}>
                  {formUsuario.rol === 'admin' ? <ShieldAlert size={22} /> : <UserCheck size={22} />}
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0 }}>
                  {usuarioEnEdicion
                    ? `Configurar ${formUsuario.rol === 'admin' ? 'Administrador' : 'Agente'}: ${usuarioEnEdicion.nombre}`
                    : `Registrar Nuevo ${formUsuario.rol === 'admin' ? 'Administrador' : 'Agente'}`}
                </h3>
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                onClick={() => setModalUsuarioAbierto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarAgente}>
              <div className="form-grid">
                {/* Selección de Rol (Exclusivo Super Admin) */}
                {isSuperAdmin && (
                  <div className="form-group full-width" style={{ background: '#F8FAFC', padding: '0.8rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <label className="form-label" style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Crown size={15} color="#D97706" /> Rol del Usuario en IPS ARCAL *
                    </label>
                    <select
                      className="form-select"
                      value={formUsuario.rol}
                      onChange={e => {
                        const nuevoRol = e.target.value;
                        setFormUsuario(prev => ({
                          ...prev,
                          rol: nuevoRol,
                          cargo: nuevoRol === 'admin' ? 'Administrador de Sede / General' : 'Agente de Admisiones y Recepción'
                        }));
                      }}
                      required
                    >
                      <option value="admin">Administrador (Gestión de Sedes, Médicos y Agenda Info Salud)</option>
                      <option value="agente">Agente de Atención (Atención en Taquilla Presencial y Recepción)</option>
                    </select>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.3rem' }}>
                      {formUsuario.rol === 'admin'
                        ? 'Los administradores pueden gestionar sedes, médicos, especialidades y exportar la agenda de citas a Excel para Info Salud.'
                        : 'Los agentes operan en la ventanilla presencial de las sedes asignadas.'}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Lic. Carlos Andrés Restrepo"
                    value={formUsuario.nombre}
                    onChange={e => setFormUsuario({ ...formUsuario, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Usuario de Ingreso (Login) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: carlos.restrepo"
                    value={formUsuario.username}
                    onChange={e => setFormUsuario({ ...formUsuario, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico Corporativo</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="carlos.restrepo@ipsarcal.com"
                    value={formUsuario.email}
                    onChange={e => setFormUsuario({ ...formUsuario, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Contraseña {usuarioEnEdicion ? '(Opcional / Dejar vacía para conservar)' : '*'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={formUsuario.password}
                    onChange={e => setFormUsuario({ ...formUsuario, password: e.target.value })}
                    placeholder={usuarioEnEdicion ? '••••••••' : 'Contraseña de acceso'}
                    required={!usuarioEnEdicion}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Cargo Oficial</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Administrador Operativo de Sedes"
                    value={formUsuario.cargo}
                    onChange={e => setFormUsuario({ ...formUsuario, cargo: e.target.value })}
                  />
                </div>
              </div>

              {/* ASIGNACIÓN DE SEDES OPERATIVAS (Para Agentes o Administradores) */}
              <div style={{ marginTop: '1.2rem', background: '#F8FAFC', padding: '1.2rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Building2 size={16} color="#028090" />
                  Sedes Asignadas:
                </label>
                <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.8rem' }}>
                  {formUsuario.rol === 'admin'
                    ? 'Seleccione las sedes que coordinará este administrador (o marque todas para acceso maestro):'
                    : 'Seleccione las sedes en las que este agente tendrá autorización para gestionar la agenda presencial:'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
                  {sedes.map(sede => (
                    <label
                      key={sede.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        background: '#FFFFFF',
                        border: `1.5px solid ${formUsuario.sedesAsignadas.includes(sede.id) ? '#028090' : '#CBD5E1'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formUsuario.sedesAsignadas.includes(sede.id)}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormUsuario(prev => ({
                            ...prev,
                            sedesAsignadas: checked
                              ? [...prev.sedesAsignadas, sede.id]
                              : prev.sedesAsignadas.filter(id => id !== sede.id)
                          }));
                        }}
                      />
                      <div style={{ fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{sede.nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{sede.ciudad}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* ESTADO HABILITADO / DESHABILITADO */}
              <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#F1F5F9', padding: '0.8rem 1rem', borderRadius: '10px' }}>
                <input
                  type="checkbox"
                  id="chk-agente-activo"
                  checked={formUsuario.activo}
                  onChange={e => setFormUsuario({ ...formUsuario, activo: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="chk-agente-activo" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}>
                  Usuario Habilitado (Permitir acceso e inicio de sesión en el sistema)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.8rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalUsuarioAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-accent">
                  {usuarioEnEdicion ? 'Actualizar Usuario' : 'Guardar Nuevo Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIGURAR TIEMPOS DE CITA Y PAUSAS DEL MÉDICO (SUPER ADMIN) */}
      {/* ======================================================== */}
      {modalPausasAbierto && medicoParaPausas && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#FEF3C7', color: '#B45309', padding: '0.5rem', borderRadius: '10px' }}>
                  <Crown size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 800, textTransform: 'uppercase' }}>
                    Gestión Exclusiva de Super Administrador
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0 }}>
                    Tiempos de Cita & Pausas: {medicoParaPausas.nombre}
                  </h3>
                </div>
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                onClick={() => setModalPausasAbierto(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Banner Informativo del Especialista */}
            <div style={{ background: '#F8FAFC', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                  {medicoParaPausas.especialidadNombre} • {medicoParaPausas.consultorio}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Sede: {medicoParaPausas.sedeNombre} | Jornada: {medicoParaPausas.horaInicio} - {medicoParaPausas.horaFin}
                </div>
              </div>
              <span className="badge badge-web" style={{ fontWeight: 700 }}>
                {medicoParaPausas.registroMedico}
              </span>
            </div>

            <form onSubmit={guardarConfiguracionPausas}>
              {/* SECCIÓN 1: DURACIÓN DE CITA (NO PREDETERMINADA) */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Clock size={18} color="#028090" />
                  <h4 style={{ fontSize: '1rem', color: '#0F172A', margin: 0 }}>
                    1. Duración de Cita del Especialista
                  </h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.5 }}>
                  El sistema asigna por defecto <b>30 minutos</b> por cita médica. Como Super Administrador, puede cambiar este tiempo para este profesional (ej: 15, 20, 30, 45 o 60 min). Los intervalos y la exportación de agenda a <b>Info Salud</b> se recalcularán automáticamente.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '0.8rem' }}>
                  {[15, 20, 30, 40, 45, 60].map(mins => (
                    <label
                      key={mins}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        background: formPausas.duracionCitaMinutos === mins ? '#E0F2FE' : '#F8FAFC',
                        border: `1.5px solid ${formPausas.duracionCitaMinutos === mins ? '#028090' : '#E2E8F0'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="duracionCitaRadio"
                        value={mins}
                        checked={formPausas.duracionCitaMinutos === mins}
                        onChange={() => setFormPausas({ ...formPausas, duracionCitaMinutos: mins })}
                      />
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: formPausas.duracionCitaMinutos === mins ? '#0369A1' : '#334155' }}>
                        {mins} min {mins === 30 ? '(Predeterminado)' : ''}
                      </div>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#475569' }}>O definir duración personalizada:</span>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    step="5"
                    className="form-input"
                    style={{ width: '90px', padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
                    value={formPausas.duracionCitaMinutos}
                    onChange={e => setFormPausas({ ...formPausas, duracionCitaMinutos: parseInt(e.target.value, 10) || 30 })}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#475569' }}>minutos por cita</span>
                </div>
              </div>

              {/* SECCIÓN 2: MOMENTOS DE PAUSA Y DESCANSO MÉDICO */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Coffee size={18} color="#D97706" />
                  <h4 style={{ fontSize: '1rem', color: '#0F172A', margin: 0 }}>
                    2. Momentos de Pausa / Descanso del Médico
                  </h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Configure franjas horarias de receso para este especialista (ejemplo: <b>descanso de 9:00 AM a 9:30 AM</b> o receso de almuerzo). Los espacios dentro de esta franja <b>quedarán completamente bloqueados</b> tanto en la web como en ventanilla presencial, y se reflejarán en la agenda interna para Info Salud.
                </p>

                {/* Formulario para agregar pausa */}
                <div style={{ background: '#FFFBEB', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #FDE68A', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400E', marginBottom: '0.5rem' }}>
                    + Programar Nuevo Momento de Descanso / Pausa:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 120px 1fr auto', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#78350F', display: 'block', marginBottom: '0.2rem' }}>
                        Hora Inicio:
                      </label>
                      <input
                        type="time"
                        className="form-input"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                        value={nuevaPausa.horaInicio}
                        onChange={e => setNuevaPausa({ ...nuevaPausa, horaInicio: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#78350F', display: 'block', marginBottom: '0.2rem' }}>
                        Hora Fin:
                      </label>
                      <input
                        type="time"
                        className="form-input"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                        value={nuevaPausa.horaFin}
                        onChange={e => setNuevaPausa({ ...nuevaPausa, horaFin: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#78350F', display: 'block', marginBottom: '0.2rem' }}>
                        Motivo / Descripción:
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: Descanso de 9am a 9:30am / Pausa activa"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem' }}
                        value={nuevaPausa.motivo}
                        onChange={e => setNuevaPausa({ ...nuevaPausa, motivo: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.8rem', fontSize: '0.78rem', background: '#D97706', borderColor: '#D97706' }}
                      onClick={agregarPausaAlMedico}
                    >
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                </div>

                {/* Listado de pausas configuradas */}
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                  Pausas activas asignadas a este especialista ({formPausas.pausas.length}):
                </div>

                {formPausas.pausas.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#94A3B8', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    Este profesional atiende de forma continua sin momentos de pausa programados.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {formPausas.pausas.map(p => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0.8rem',
                          background: '#FFFDF5',
                          border: '1px solid #FCD34D',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, color: '#92400E', fontSize: '0.85rem' }}>
                            {p.horaInicio} - {p.horaFin}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                            — {p.motivo}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#DC2626', borderColor: '#FECACA' }}
                          onClick={() => eliminarPausaDelMedico(p.id)}
                          title="Eliminar este descanso"
                        >
                          <Trash2 size={12} /> Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalPausasAbierto(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  style={{ background: '#028090', fontWeight: 800, padding: '0.6rem 1.4rem' }}
                >
                  <Check size={16} /> Guardar Configuración de Tiempos & Pausas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
