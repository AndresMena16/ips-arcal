import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, UserCheck, Calendar, Clock, FileDown, Search,
  CheckCircle2, AlertCircle, Printer, PlusCircle, RefreshCw, Users,
  ShieldAlert, X, AlertTriangle, UserX, CalendarClock, Check, ArrowRight,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { generarComprobantePDF } from '../utils/pdfGenerator';

export default function PresencialBooking({ usuarioActual, onOpenLogin }) {
  const [sedes, setSedes] = useState([]);
  const [sedeSeleccionadaId, setSedeSeleccionadaId] = useState('');
  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [citasDelDia, setCitasDelDia] = useState([]);

  // Filtros dedicados para la Agenda en Sede
  const [fechaFiltroAgenda, setFechaFiltroAgenda] = useState(() => new Date().toISOString().split('T')[0]);
  const [filtroTextoAgenda, setFiltroTextoAgenda] = useState('');
  const [filtroEstadoAgenda, setFiltroEstadoAgenda] = useState('todos');

  // Formulario rápido de taquilla (agendamiento presencial)
  const [fechaConsulta, setFechaConsulta] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] = useState('');
  const [selectedCupsCodigo, setSelectedCupsCodigo] = useState('');
  const [selectedMedicoId, setSelectedMedicoId] = useState('');
  const [selectedHora, setSelectedHora] = useState('');
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);

  // Datos paciente
  const [pacienteTipoDoc, setPacienteTipoDoc] = useState('CC');
  const [pacienteNumDoc, setPacienteNumDoc] = useState('');
  const [pacienteNombres, setPacienteNombres] = useState('');
  const [pacienteApellidos, setPacienteApellidos] = useState('');
  const [pacienteTelefono, setPacienteTelefono] = useState('');
  const [pacienteEmail, setPacienteEmail] = useState('');
  const [pacienteAseguradora, setPacienteAseguradora] = useState('Savia Salud');
  const [motivoConsulta, setMotivoConsulta] = useState('Consulta presencial en ventanilla');

  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [error, setError] = useState('');

  // Modales de Gestión de Citas (Cancelación / Inasistencia & Llegó Tarde / Reasignar)
  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const [citaParaCancelar, setCitaParaCancelar] = useState(null);
  const [tipoCancelacion, setTipoCancelacion] = useState('no_asistio'); // 'no_asistio' | 'cancelada'
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [guardandoCancelacion, setGuardandoCancelacion] = useState(false);

  const [modalReasignarAbierto, setModalReasignarAbierto] = useState(false);
  const [citaParaReasignar, setCitaParaReasignar] = useState(null);
  const [cargandoProximos, setCargandoProximos] = useState(false);
  const [resultadoProximos, setResultadoProximos] = useState(null);
  const [errorProximos, setErrorProximos] = useState('');
  const [reasignandoSlot, setReasignandoSlot] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    inicializar();
  }, [usuarioActual]);

  async function inicializar() {
    try {
      setLoading(true);
      const [sedesRes, espRes] = await Promise.all([
        api.getSedes(),
        api.getEspecialidades()
      ]);
      const allSedes = (sedesRes.data || []).filter(s => s.activa);

      // Si es agente, filtrar estrictamente a sus sedes asignadas
      let sedesPermitidas = allSedes;
      if (usuarioActual && usuarioActual.rol === 'agente') {
        const idsAsignados = usuarioActual.sedesAsignadas || [];
        sedesPermitidas = allSedes.filter(s => idsAsignados.includes(s.id));
      }

      setSedes(sedesPermitidas);
      if (sedesPermitidas.length > 0) {
        setSedeSeleccionadaId(sedesPermitidas[0].id);
      } else {
        setSedeSeleccionadaId('');
      }

      setEspecialidades(espRes.data || []);
      if (espRes.data && espRes.data.length > 0) {
        setSelectedEspecialidadId(espRes.data[0].id);
      }
    } catch (err) {
      setError('Error al conectar con el servidor central');
    } finally {
      setLoading(false);
    }
  }

  // Especialidades habilitadas específicamente para la sede seleccionada en taquilla
  const especialidadesSedeActual = useMemo(() => {
    if (!sedeSeleccionadaId) return [];
    const sede = sedes.find(s => s.id === sedeSeleccionadaId);
    if (!sede) return [];
    if (Array.isArray(sede.especialidadesHabilitadas) && sede.especialidadesHabilitadas.length > 0) {
      return especialidades.filter(esp => sede.especialidadesHabilitadas.includes(esp.id));
    }
    return especialidades;
  }, [sedeSeleccionadaId, sedes, especialidades]);

  // Departamentos únicos disponibles en la sede seleccionada
  const departamentosSedeActual = useMemo(() => {
    if (!especialidadesSedeActual || especialidadesSedeActual.length === 0) return [];
    const deps = [];
    especialidadesSedeActual.forEach(esp => {
      const dep = esp.departamento || 'Medicina general';
      if (!deps.includes(dep)) {
        deps.push(dep);
      }
    });
    return deps;
  }, [especialidadesSedeActual]);

  // Sincronizar departamento seleccionado
  useEffect(() => {
    if (departamentosSedeActual.length > 0) {
      if (!selectedDepartamento || !departamentosSedeActual.includes(selectedDepartamento)) {
        const espActual = especialidadesSedeActual.find(e => e.id === selectedEspecialidadId);
        if (espActual && departamentosSedeActual.includes(espActual.departamento)) {
          setSelectedDepartamento(espActual.departamento);
        } else {
          setSelectedDepartamento(departamentosSedeActual[0]);
        }
      }
    } else {
      setSelectedDepartamento('');
    }
  }, [departamentosSedeActual, selectedEspecialidadId]);

  // Especialidades del departamento seleccionado
  const especialidadesFiltradasPorDep = useMemo(() => {
    if (!selectedDepartamento) return especialidadesSedeActual;
    return especialidadesSedeActual.filter(esp => (esp.departamento || 'Medicina general') === selectedDepartamento);
  }, [especialidadesSedeActual, selectedDepartamento]);

  function handleDepartamentoChange(nuevoDep) {
    setSelectedDepartamento(nuevoDep);
    const esps = especialidadesSedeActual.filter(e => (e.departamento || 'Medicina general') === nuevoDep);
    if (esps.length > 0) {
      const valida = esps.some(e => e.id === selectedEspecialidadId);
      if (!valida) {
        setSelectedEspecialidadId(esps[0].id);
      }
    } else {
      setSelectedEspecialidadId('');
    }
  }

  // Especialidad seleccionada actualmente
  const especialidadSeleccionada = useMemo(() => {
    return especialidades.find(e => e.id === selectedEspecialidadId);
  }, [especialidades, selectedEspecialidadId]);

  // Modalidades CUPS disponibles para la especialidad actual (Primera vez, Control, o Procedimiento)
  const modalidadesDisponibles = useMemo(() => {
    if (!especialidadSeleccionada || !Array.isArray(especialidadSeleccionada.modalidades)) {
      return [];
    }
    return especialidadSeleccionada.modalidades;
  }, [especialidadSeleccionada]);

  // Sincronizar modalidad / código CUPS seleccionado
  useEffect(() => {
    if (modalidadesDisponibles.length > 0) {
      const existe = modalidadesDisponibles.some(m => m.codigoCups === selectedCupsCodigo);
      if (!selectedCupsCodigo || !existe) {
        setSelectedCupsCodigo(modalidadesDisponibles[0].codigoCups);
      }
    } else {
      setSelectedCupsCodigo('');
    }
  }, [modalidadesDisponibles, selectedCupsCodigo]);

  // Modalidad actual activa
  const modalidadActual = useMemo(() => {
    if (modalidadesDisponibles.length === 0) return null;
    return modalidadesDisponibles.find(m => m.codigoCups === selectedCupsCodigo) || modalidadesDisponibles[0];
  }, [modalidadesDisponibles, selectedCupsCodigo]);

  // Al cambiar de sede o lista de especialidades de la sede, auto-seleccionar la primera disponible
  useEffect(() => {
    if (especialidadesFiltradasPorDep.length > 0) {
      const existe = especialidadesFiltradasPorDep.some(esp => esp.id === selectedEspecialidadId);
      if (!existe) {
        setSelectedEspecialidadId(especialidadesFiltradasPorDep[0].id);
      }
    } else if (especialidadesSedeActual.length > 0) {
      setSelectedEspecialidadId(especialidadesSedeActual[0].id);
    } else {
      setSelectedEspecialidadId('');
    }
  }, [sedeSeleccionadaId, selectedDepartamento, especialidadesFiltradasPorDep]);

  // Actualizar agenda al cambiar de sede o de fecha en el filtro
  useEffect(() => {
    if (sedeSeleccionadaId) {
      cargarCitasSede();
    }
  }, [sedeSeleccionadaId, fechaFiltroAgenda]);

  // Actualizar médicos al cambiar de sede
  useEffect(() => {
    if (sedeSeleccionadaId) {
      cargarMedicosSede();
    }
  }, [sedeSeleccionadaId]);

  async function cargarCitasSede() {
    try {
      const params = { sedeId: sedeSeleccionadaId };
      if (fechaFiltroAgenda) {
        params.fecha = fechaFiltroAgenda;
      }
      const res = await api.getCitas(params);
      setCitasDelDia(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  // Helpers para navegación de fecha en la agenda
  function getFechaHoy() {
    return new Date().toISOString().split('T')[0];
  }

  function getFechaManana() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  function cambiarDiaAnterior() {
    if (!fechaFiltroAgenda) return;
    const [y, m, d] = fechaFiltroAgenda.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    setFechaFiltroAgenda(`${yStr}-${mStr}-${dStr}`);
  }

  function cambiarDiaSiguiente() {
    if (!fechaFiltroAgenda) return;
    const [y, m, d] = fechaFiltroAgenda.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    setFechaFiltroAgenda(`${yStr}-${mStr}-${dStr}`);
  }

  async function cargarMedicosSede() {
    try {
      const res = await api.getMedicos({
        sedeId: sedeSeleccionadaId,
        ...(selectedEspecialidadId ? { especialidadId: selectedEspecialidadId } : {})
      });
      setMedicos(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedMedicoId(res.data[0].id);
      } else {
        setSelectedMedicoId('');
        setSlotsDisponibles([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Actualizar médicos cuando cambia especialidad
  useEffect(() => {
    if (sedeSeleccionadaId && selectedEspecialidadId) {
      cargarMedicosSede();
    }
  }, [selectedEspecialidadId]);

  // Consultar disponibilidad al cambiar médico o fecha
  useEffect(() => {
    if (selectedMedicoId && fechaConsulta) {
      cargarSlots();
    }
  }, [selectedMedicoId, fechaConsulta]);

  async function cargarSlots() {
    try {
      const res = await api.getDisponibilidad(selectedMedicoId, fechaConsulta, sedeSeleccionadaId);
      if (res.data && res.data.slots) {
        setSlotsDisponibles(res.data.slots);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Búsqueda rápida de paciente por cédula en el historial de la IPS
  async function buscarPacienteExistente() {
    if (!pacienteNumDoc) return;
    try {
      const res = await api.getCitas({ pacienteNumDoc });
      if (res.data && res.data.length > 0) {
        const ultimaCita = res.data[0];
        setPacienteNombres(ultimaCita.pacienteNombres);
        setPacienteApellidos(ultimaCita.pacienteApellidos);
        setPacienteTelefono(ultimaCita.pacienteTelefono);
        setPacienteEmail(ultimaCita.pacienteEmail);
        setPacienteAseguradora(ultimaCita.pacienteAseguradora || 'Particular');
        setPacienteTipoDoc(ultimaCita.pacienteTipoDoc || 'CC');
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Agendar en ventanilla presencial
  async function handleAgendarPresencial(e) {
    e.preventDefault();
    if (!pacienteNumDoc || !pacienteNombres || !pacienteApellidos || !selectedHora) {
      setError('Complete todos los campos requeridos y seleccione un horario disponible.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        pacienteTipoDoc,
        pacienteNumDoc,
        pacienteNombres,
        pacienteApellidos,
        pacienteTelefono,
        pacienteEmail,
        pacienteAseguradora,
        motivoConsulta: motivoConsulta || modalidadActual?.descripcionCups || especialidadSeleccionada?.nombre || '',
        sedeId: sedeSeleccionadaId,
        especialidadId: selectedEspecialidadId,
        departamento: selectedDepartamento || especialidadSeleccionada?.departamento || '',
        tipoCita: modalidadActual?.tipo || (especialidadSeleccionada?.esConsulta ? 'primera_vez' : 'procedimiento'),
        codigoCups: modalidadActual?.codigoCups || especialidadSeleccionada?.codigo || '',
        nombreCups: modalidadActual?.descripcionCups || especialidadSeleccionada?.nombre || '',
        medicoId: selectedMedicoId,
        fecha: fechaConsulta,
        hora: selectedHora,
        tipoAgendamiento: 'presencial'
      };

      const res = await api.createCita(payload);
      if (res.success && res.data) {
        setMensajeExito(res.data);
        cargarCitasSede();
        cargarSlots();
        // Reset campos
        setPacienteNumDoc('');
        setPacienteNombres('');
        setPacienteApellidos('');
        setPacienteTelefono('');
        setPacienteEmail('');
        setSelectedHora('');
      }
    } catch (err) {
      setError(err.message || 'Error al registrar la cita presencial.');
    } finally {
      setLoading(false);
    }
  }

  // Cambiar estado directo de cita en sala
  async function cambiarEstadoCita(citaId, nuevoEstado) {
    try {
      await api.updateEstadoCita(citaId, nuevoEstado);
      cargarCitasSede();
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  }

  // --- GESTIÓN: CANCELACIÓN O INASISTENCIA ---
  function abrirModalCancelar(cita, tipoPorDefecto = 'no_asistio') {
    setCitaParaCancelar(cita);
    setTipoCancelacion(tipoPorDefecto);
    setMotivoCancelacion('');
    setModalCancelarAbierto(true);
  }

  async function confirmarCancelacion() {
    if (!citaParaCancelar) return;
    try {
      setGuardandoCancelacion(true);
      const motivoFinal = motivoCancelacion.trim() ||
        (tipoCancelacion === 'no_asistio'
          ? 'El paciente no asistió a su cita médica programada en sede.'
          : 'Cita cancelada a solicitud del usuario o por contingencia.');

      await api.updateEstadoCita(citaParaCancelar.id, tipoCancelacion, motivoFinal);
      setModalCancelarAbierto(false);
      setCitaParaCancelar(null);
      cargarCitasSede();
      cargarSlots();
    } catch (err) {
      alert('Error al registrar estado: ' + (err.message || err));
    } finally {
      setGuardandoCancelacion(false);
    }
  }

  // --- GESTIÓN: LLEGÓ TARDE Y REASIGNACIÓN EN 5 DÍAS ---
  function abrirModalReasignar(cita) {
    setCitaParaReasignar(cita);
    setModalReasignarAbierto(true);
    setResultadoProximos(null);
    setErrorProximos('');
    consultarDisponibilidad5Dias(cita);
  }

  async function consultarDisponibilidad5Dias(cita) {
    try {
      setCargandoProximos(true);
      setErrorProximos('');
      const res = await api.getDisponibilidadProximosDias({
        especialidadId: cita.especialidadId,
        sedeId: cita.sedeId,
        dias: 5
      });
      setResultadoProximos(res);
    } catch (err) {
      console.error(err);
      setErrorProximos('Error al escanear la agenda en los próximos 5 días: ' + (err.message || ''));
    } finally {
      setCargandoProximos(false);
    }
  }

  async function handleReasignarSlot(slot) {
    if (!citaParaReasignar) return;
    try {
      setReasignandoSlot(true);
      const res = await api.reasignarCita(citaParaReasignar.id, {
        nuevaFecha: slot.fecha,
        nuevaHora: slot.hora,
        nuevoMedicoId: slot.medicoId,
        motivo: `Reasignación por llegada tardía a la cita original (${citaParaReasignar.fecha} a las ${citaParaReasignar.hora})`
      });

      if (res.success && res.data) {
        setModalReasignarAbierto(false);
        setMensajeExito(res.data);
        cargarCitasSede();
        cargarSlots();
      }
    } catch (err) {
      alert('Error al reasignar cita: ' + (err.message || err));
    } finally {
      setReasignandoSlot(false);
    }
  }

  async function handleRegistrarLlegoTardeSinCupo() {
    if (!citaParaReasignar) return;
    try {
      setReasignandoSlot(true);
      await api.updateEstadoCita(
        citaParaReasignar.id,
        'llego_tarde',
        'Paciente llegó tarde. No hubo disponibilidad en los siguientes 5 días hábiles. Se indicó estar pendiente al sitio web oficial o acudir presencialmente a la IPS en 5 días hábiles.'
      );
      setModalReasignarAbierto(false);
      cargarCitasSede();
    } catch (err) {
      alert('Error al registrar estado: ' + (err.message || err));
    } finally {
      setReasignandoSlot(false);
    }
  }

  const sedeActual = sedes.find(s => s.id === sedeSeleccionadaId);

  // 1. Si no hay sesión iniciada, mostrar bloqueo de seguridad
  if (!usuarioActual) {
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
          Módulo de Recepción Presencial Protegido
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Este módulo está reservado para <b>Agentes de Atención al Cliente</b> y personal administrativo de <b>ARCAL Protección Radiológica IPS</b> asignados a las sedes de atención física.
        </p>
        <button
          className="btn btn-primary"
          style={{ padding: '0.9rem 2rem', fontWeight: 800 }}
          onClick={onOpenLogin}
        >
          Iniciar Sesión como Agente de Atención
        </button>
      </div>
    );
  }

  // 2. Si es agente y no tiene sedes asignadas por el admin
  if (usuarioActual.rol === 'agente' && !loading && sedes.length === 0) {
    return (
      <div className="card-panel" style={{ maxWidth: '650px', margin: '3rem auto', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#FEE2E2',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.2rem auto'
        }}>
          <AlertCircle size={32} />
        </div>
        <h3 style={{ fontSize: '1.3rem', color: '#991B1B', marginBottom: '0.8rem' }}>
          Sin Sedes Asignadas para Operar
        </h3>
        <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Hola <b>{usuarioActual.nombre}</b>. Actualmente su usuario no tiene sedes asignadas en el sistema. El Administrador de IPS ARCAL debe ingresar al panel y asignarle las sedes en las que atenderá presencialmente.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Barra de Control de Taquilla */}
      <div className="card-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="card-icon-badge" style={{ width: '48px', height: '48px' }}>
              <Building2 size={24} color="#0B192C" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Módulo de Admisiones y Recepción Física
              </div>
              <h2 style={{ fontSize: '1.35rem', color: '#0F172A', margin: 0 }}>
                Atención Presencial en Sede
              </h2>
              {/* Información del Agente Conectado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#028090', fontWeight: 700 }}>
                  Atendiendo: {usuarioActual.nombre} ({usuarioActual.cargo || 'Agente'})
                </span>
                {usuarioActual.rol === 'admin' ? (
                  <span style={{ background: '#DCFCE7', color: '#15803D', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.68rem' }}>
                    Supervisor (Todas las Sedes)
                  </span>
                ) : (
                  <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.68rem' }}>
                    {sedes.length} {sedes.length === 1 ? 'Sede Habilitada' : 'Sedes Habilitadas'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.2rem' }}>
                Sede Activa en Taquilla:
              </label>
              <select
                className="form-select"
                value={sedeSeleccionadaId}
                onChange={e => setSedeSeleccionadaId(e.target.value)}
                style={{ fontWeight: 700, minWidth: '260px' }}
              >
                {sedes.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} ({s.ciudad})</option>
                ))}
              </select>
            </div>

            <button className="btn btn-secondary" onClick={() => { cargarCitasSede(); cargarSlots(); }} title="Actualizar datos">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {sedeActual && (
          <div style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: '#64748B', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', borderTop: '1px solid #E2E8F0', paddingTop: '0.8rem' }}>
            <span><b>Dirección:</b> {sedeActual.direccion}</span>
            <span><b>Teléfono:</b> {sedeActual.telefono}</span>
            <span><b>Horario:</b> {sedeActual.horarioAtencion}</span>
          </div>
        )}
      </div>

      {/* Alerta de Éxito / Comprobante Inmediato */}
      {mensajeExito && (
        <div style={{ background: '#ECFDF5', border: '2px solid #10B981', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#065F46', fontWeight: 800, fontSize: '1.1rem' }}>
              <CheckCircle2 size={24} color="#059669" />
              <span>¡Cita Presencial Asignada / Reasignada Exitosamente!</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#047857', marginTop: '0.3rem' }}>
              Código Radicado: <b>{mensajeExito.codigoCita}</b> | Paciente: <b>{mensajeExito.pacienteNombres} {mensajeExito.pacienteApellidos}</b> | Fecha: <b>{mensajeExito.fecha}</b> a las <b>{mensajeExito.hora}</b>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#065F46', marginTop: '0.2rem' }}>
              El cupo ha quedado confirmado y sincronizado en tiempo real.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button
              className="btn btn-accent"
              onClick={() => generarComprobantePDF(mensajeExito)}
            >
              <FileDown size={18} />
              <span>Imprimir / Descargar Comprobante PDF</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setMensajeExito(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem' }}>
        {/* COLUMNA 1: FORMULARIO DE AGENDAMIENTO EN TAQUILLA */}
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <PlusCircle size={20} color="#028090" />
                Asignar Cita Inmediata (Paciente en Sede)
              </h3>
              <p className="panel-subtitle">El cupo seleccionado se sincroniza y descuenta al instante de la plataforma web.</p>
            </div>
          </div>

          <form onSubmit={handleAgendarPresencial}>
            {/* Búsqueda rápida de paciente */}
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1.2rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                <Search size={14} /> Buscar Historial del Paciente por Documento:
              </label>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <select
                  className="form-select"
                  style={{ maxWidth: '110px' }}
                  value={pacienteTipoDoc}
                  onChange={e => setPacienteTipoDoc(e.target.value)}
                >
                  <option value="CC">CC</option>
                  <option value="TI">TI</option>
                  <option value="CE">CE</option>
                  <option value="PA">PA</option>
                </select>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Número de cédula o documento..."
                  value={pacienteNumDoc}
                  onChange={e => setPacienteNumDoc(e.target.value)}
                  onBlur={buscarPacienteExistente}
                />
                <button type="button" className="btn btn-secondary" onClick={buscarPacienteExistente}>
                  Buscar
                </button>
              </div>
            </div>

            <div className="form-grid" style={{ marginBottom: '1.2rem' }}>
              <div className="form-group">
                <label className="form-label">Nombres *</label>
                <input
                  type="text"
                  className="form-input"
                  value={pacienteNombres}
                  onChange={e => setPacienteNombres(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Apellidos *</label>
                <input
                  type="text"
                  className="form-input"
                  value={pacienteApellidos}
                  onChange={e => setPacienteApellidos(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono Móvil *</label>
                <input
                  type="text"
                  className="form-input"
                  value={pacienteTelefono}
                  onChange={e => setPacienteTelefono(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-input"
                  value={pacienteEmail}
                  onChange={e => setPacienteEmail(e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Aseguradora / Régimen *</label>
                <select
                  className="form-select"
                  value={pacienteAseguradora}
                  onChange={e => setPacienteAseguradora(e.target.value)}
                >
                  <option value="Savia Salud">Savia Salud (Convenio Oficial IPS ARCAL)</option>
                  <option value="Particular">Particular (Pago en caja)</option>
                </select>
              </div>
            </div>

            {/* Servicio Médico con Select Anidado de 3 Niveles */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.2rem', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-900)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="badge badge-web" style={{ fontSize: '0.75rem' }}>Selección Anidada de 3 Niveles (Savia Salud / ARCAL):</span>
              </div>
              <div className="form-grid">
                {/* SELECT 1: DEPARTAMENTO */}
                <div className="form-group">
                  <label className="form-label">Departamento / Área</label>
                  <select
                    className="form-select"
                    value={selectedDepartamento}
                    onChange={e => handleDepartamentoChange(e.target.value)}
                    disabled={departamentosSedeActual.length === 0}
                    style={{ fontWeight: 600, borderColor: 'var(--brand-cyan)' }}
                  >
                    {departamentosSedeActual.length === 0 ? (
                      <option value="">Sin departamentos en esta sede</option>
                    ) : (
                      departamentosSedeActual.map(dep => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))
                    )}
                  </select>
                </div>

                {/* SELECT 2: ESPECIALIDAD ANIDADA */}
                <div className="form-group">
                  <label className="form-label">Servicio o Especialidad</label>
                  <select
                    className="form-select"
                    value={selectedEspecialidadId}
                    onChange={e => handleEspecialidadChange(e.target.value)}
                    disabled={!selectedDepartamento || especialidadesFiltradasPorDep.length === 0}
                    style={{ fontWeight: 700, borderColor: 'var(--brand-green)' }}
                  >
                    {especialidadesFiltradasPorDep.length === 0 ? (
                      <option value="">No hay especialidades en este departamento</option>
                    ) : (
                      especialidadesFiltradasPorDep.map(esp => (
                        <option key={esp.id} value={esp.id}>
                          {esp.nombre} ({esp.codigo} - {esp.duracionMinutos} min)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* SELECT 3: TIPO DE CITA (PRIMERA VEZ VS CONTROL) Y CÓDIGO CUPS */}
                <div className="form-group">
                  <label className="form-label">Tipo de Cita & Código CUPS</label>
                  {modalidadesDisponibles.length > 1 ? (
                    <select
                      className="form-select"
                      value={selectedCupsCodigo}
                      onChange={e => setSelectedCupsCodigo(e.target.value)}
                      style={{ fontWeight: 700, borderColor: '#8CC63F' }}
                    >
                      {modalidadesDisponibles.map(mod => (
                        <option key={mod.codigoCups} value={mod.codigoCups}>
                          {mod.etiqueta} — CUPS: {mod.codigoCups}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{
                      padding: '0.62rem 0.8rem',
                      borderRadius: '8px',
                      background: '#F0FDF4',
                      border: '1.5px solid #86EFAC',
                      color: '#166534',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      minHeight: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <span style={{ background: '#16A34A', color: '#FFF', fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px' }}>
                        CUPS {modalidadActual?.codigoCups || 'Oficial'}
                      </span>
                      <span>{modalidadActual?.etiqueta || 'Procedimiento Único'}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Médico Asignado *</label>
                  <select
                    className="form-select"
                    value={selectedMedicoId}
                    onChange={e => setSelectedMedicoId(e.target.value)}
                  >
                    {medicos.map(med => (
                      <option key={med.id} value={med.id}>{med.nombre} ({med.consultorio})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Fecha de Consulta *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={fechaConsulta}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setFechaConsulta(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Franjas Horarias */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Horario Disponible para hoy/fecha elegida:</label>
              {slotsDisponibles.length === 0 ? (
                <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.9rem', borderRadius: '8px', color: '#92400E', fontSize: '0.82rem', textAlign: 'center' }}>
                  No hay turnos disponibles para esta fecha (los horarios de hoy ya transcurrieron o están ocupados). Seleccione otra fecha u otro profesional.
                </div>
              ) : (
                <div className="slots-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))' }}>
                  {slotsDisponibles.map(slot => (
                    <button
                      key={slot.hora}
                      type="button"
                      className={`slot-btn ${selectedHora === slot.hora ? 'selected' : ''}`}
                      disabled={!slot.disponible}
                      onClick={() => setSelectedHora(slot.hora)}
                      style={{ padding: '0.5rem 0.3rem' }}
                    >
                      <span>{slot.hora}</span>
                      <span className="slot-status-text" style={{ fontSize: '0.6rem', color: slot.disponible ? '#059669' : '#DC2626' }}>
                        {slot.disponible ? 'Libre' : 'Ocupado'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem' }}
              disabled={loading || !selectedHora}
            >
              {loading ? 'Guardando...' : 'Asignar Cita Presencial & Generar Comprobante'}
            </button>
          </form>
        </div>

        {/* COLUMNA 2: AGENDA Y PACIENTES EN LA SEDE CON FILTRO POR FECHA */}
        <div className="card-panel">
          <div className="panel-header" style={{ marginBottom: '0.8rem' }}>
            <div>
              <h3 className="panel-title">
                <Users size={20} color="#028090" />
                Agenda de Citas en Sede
              </h3>
              <p className="panel-subtitle">Pacientes programados en {sedeActual?.nombre || 'la sede'}.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-confirmada">
                {citasDelDia.filter(cita => {
                  if (filtroEstadoAgenda !== 'todos' && cita.estado !== filtroEstadoAgenda) return false;
                  if (filtroTextoAgenda.trim()) {
                    const q = filtroTextoAgenda.toLowerCase();
                    const matchDoc = cita.pacienteNumDoc?.toLowerCase().includes(q);
                    const matchNombre = `${cita.pacienteNombres} ${cita.pacienteApellidos}`.toLowerCase().includes(q);
                    const matchCodigo = cita.codigoCita?.toLowerCase().includes(q);
                    const matchMedico = cita.medico?.nombre?.toLowerCase().includes(q);
                    if (!matchDoc && !matchNombre && !matchCodigo && !matchMedico) return false;
                  }
                  return true;
                }).length} Citas
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.6rem' }}
                onClick={cargarCitasSede}
                title="Actualizar agenda de la sede"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* BARRA DE FILTROS POR FECHA, BÚSQUEDA Y ESTADO */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginBottom: '1.2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            {/* Fila 1: Control de Fecha */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                  Fecha:
                </span>
                <button
                  type="button"
                  className={`btn ${fechaFiltroAgenda === getFechaHoy() ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
                  onClick={() => setFechaFiltroAgenda(getFechaHoy())}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  className={`btn ${fechaFiltroAgenda === getFechaManana() ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
                  onClick={() => setFechaFiltroAgenda(getFechaManana())}
                >
                  Mañana
                </button>
                <button
                  type="button"
                  className={`btn ${!fechaFiltroAgenda ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
                  onClick={() => setFechaFiltroAgenda('')}
                >
                  Todas las Fechas
                </button>
              </div>

              {/* Selector de fecha con navegación día a día */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.5rem' }}
                  onClick={cambiarDiaAnterior}
                  title="Día anterior"
                  disabled={!fechaFiltroAgenda}
                >
                  <ChevronLeft size={15} />
                </button>
                <input
                  type="date"
                  className="form-input"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '145px', fontWeight: 600 }}
                  value={fechaFiltroAgenda}
                  onChange={e => setFechaFiltroAgenda(e.target.value)}
                  title="Seleccionar fecha específica"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.5rem' }}
                  onClick={cambiarDiaSiguiente}
                  title="Día siguiente"
                  disabled={!fechaFiltroAgenda}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Fila 2: Búsqueda rápida por paciente/cédula y filtro de estado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '0.35rem 0.65rem 0.35rem 2rem', fontSize: '0.78rem' }}
                  placeholder="Buscar paciente, cédula, radicado o médico..."
                  value={filtroTextoAgenda}
                  onChange={e => setFiltroTextoAgenda(e.target.value)}
                />
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                {filtroTextoAgenda && (
                  <button
                    type="button"
                    style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                    onClick={() => setFiltroTextoAgenda('')}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <select
                className="form-select"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', minWidth: '135px' }}
                value={filtroEstadoAgenda}
                onChange={e => setFiltroEstadoAgenda(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="confirmada">Confirmadas</option>
                <option value="en_sala">En Sala</option>
                <option value="atendida">Atendidas</option>
                <option value="llego_tarde">Llegó Tarde</option>
                <option value="no_asistio">No Asistió</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>
          </div>

          {(() => {
            const citasFiltradas = citasDelDia.filter(cita => {
              if (filtroEstadoAgenda !== 'todos' && cita.estado !== filtroEstadoAgenda) return false;
              if (filtroTextoAgenda.trim()) {
                const q = filtroTextoAgenda.toLowerCase();
                const matchDoc = cita.pacienteNumDoc?.toLowerCase().includes(q);
                const matchNombre = `${cita.pacienteNombres} ${cita.pacienteApellidos}`.toLowerCase().includes(q);
                const matchCodigo = cita.codigoCita?.toLowerCase().includes(q);
                const matchMedico = cita.medico?.nombre?.toLowerCase().includes(q);
                if (!matchDoc && !matchNombre && !matchCodigo && !matchMedico) return false;
              }
              return true;
            });

            if (citasFiltradas.length === 0) {
              return (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
                  No hay citas programadas {fechaFiltroAgenda ? `para la fecha ${fechaFiltroAgenda}` : ''} con los filtros seleccionados en {sedeActual?.nombre}.
                </div>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '640px', overflowY: 'auto' }}>
                {citasFiltradas.map(cita => (
                  <div
                    key={cita.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A' }}>{cita.hora}</span>
                        {!fechaFiltroAgenda && (
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                            ({cita.fecha})
                          </span>
                        )}
                        <span className={`badge ${cita.tipoAgendamiento === 'web' ? 'badge-web' : 'badge-presencial'}`}>
                          {cita.tipoAgendamiento}
                        </span>
                      </div>
                      <span className={`badge badge-${cita.estado}`}>
                        {cita.estado === 'no_asistio' ? 'No Asistió' :
                         cita.estado === 'llego_tarde' ? 'Llegó Tarde' :
                         cita.estado === 'en_sala' ? 'En Sala' :
                         cita.estado}
                      </span>
                    </div>

                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                    {cita.pacienteNombres} {cita.pacienteApellidos}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    {cita.pacienteTipoDoc} {cita.pacienteNumDoc} • Cel: {cita.pacienteTelefono}
                  </div>

                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#028090', fontWeight: 600 }}>
                    {cita.especialidad?.nombre} • {cita.medico?.nombre}
                  </div>

                  {cita.motivoCancelacion && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#991B1B', background: '#FEF2F2', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                      <b>Nota:</b> {cita.motivoCancelacion}
                    </div>
                  )}

                  {cita.motivoReasignacion && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#0369A1', background: '#F0F9FF', padding: '0.35rem 0.6rem', borderRadius: '6px' }}>
                      <b>Reasignada:</b> {cita.motivoReasignacion}
                    </div>
                  )}

                  {/* Acciones de taquilla */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.8rem', borderTop: '1px dashed #E2E8F0', paddingTop: '0.6rem', flexWrap: 'wrap' }}>
                    {/* Si está confirmada o en sala */}
                    {cita.estado !== 'atendida' && cita.estado !== 'cancelada' && cita.estado !== 'no_asistio' && (
                      <>
                        {cita.estado !== 'en_sala' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem' }}
                            onClick={() => cambiarEstadoCita(cita.id, 'en_sala')}
                            title="Registrar que el paciente llegó a sala de espera"
                          >
                            En Sala
                          </button>
                        )}

                        {cita.estado === 'en_sala' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', color: '#15803D', fontWeight: 700 }}
                            onClick={() => cambiarEstadoCita(cita.id, 'atendida')}
                            title="Marcar cita médica completada"
                          >
                            Atendido
                          </button>
                        )}

                        {/* Botón de Llegó Tarde / Reasignar (5 días) */}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', color: '#B45309', background: '#FEF3C7', borderColor: '#FDE68A', fontWeight: 600 }}
                          onClick={() => abrirModalReasignar(cita)}
                          title="Paciente llegó tarde: Reasignar al turno más cercano en los próximos 5 días"
                        >
                          Llegó Tarde
                        </button>

                        {/* Botón de Cancelar o No Asistió */}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', color: '#B91C1C', background: '#FEE2E2', borderColor: '#FECACA', fontWeight: 600 }}
                          onClick={() => abrirModalCancelar(cita, 'no_asistio')}
                          title="Marcar como No Asistió o Cita Cancelada"
                        >
                          Cancelar / Inasistencia
                        </button>
                      </>
                    )}

                    {/* Si ya estaba como No Asistió o Llegó Tarde pero el paciente acude a ventanilla */}
                    {(cita.estado === 'no_asistio' || cita.estado === 'llego_tarde') && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', color: '#028090', background: '#E0F2FE', borderColor: '#BAE6FD', fontWeight: 700 }}
                        onClick={() => abrirModalReasignar(cita)}
                        title="Reasignar cita en los siguientes 5 días"
                      >
                        Reasignar (5 Días)
                      </button>
                    )}

                    {/* Botón Imprimir PDF */}
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.72rem', marginLeft: 'auto' }}
                      onClick={() => generarComprobantePDF(cita)}
                      title="Descargar comprobante oficial en PDF"
                    >
                      <Printer size={13} /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>

      {/* ======================================================== */}
      {/* MODAL 1: REGISTRAR CITA CANCELADA O NO ASISTIÓ */}
      {/* ======================================================== */}
      {modalCancelarAbierto && citaParaCancelar && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.5rem', borderRadius: '10px' }}>
                  <UserX size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#0F172A', margin: 0 }}>
                    Gestión de Cita en Recepción
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Registro de inasistencia o cancelación de cita
                  </div>
                </div>
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                onClick={() => setModalCancelarAbierto(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Ficha Resumen Paciente */}
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1.2rem', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                {citaParaCancelar.pacienteNombres} {citaParaCancelar.pacienteApellidos}
              </div>
              <div style={{ color: '#64748B', marginTop: '0.2rem' }}>
                {citaParaCancelar.pacienteTipoDoc} {citaParaCancelar.pacienteNumDoc} • Cel: {citaParaCancelar.pacienteTelefono}
              </div>
              <div style={{ marginTop: '0.4rem', color: '#028090', fontWeight: 600 }}>
                {citaParaCancelar.especialidad?.nombre} • {citaParaCancelar.medico?.nombre}
              </div>
              <div style={{ marginTop: '0.2rem', color: '#334155' }}>
                <b>Programada:</b> {citaParaCancelar.fecha} a las {citaParaCancelar.hora}
              </div>
            </div>

            {/* Selección de Tipo de Novedad */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.6rem' }}>
                Seleccione el estado a registrar:
              </label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '0.8rem 1rem',
                  borderRadius: '10px',
                  border: `2px solid ${tipoCancelacion === 'no_asistio' ? '#DC2626' : '#E2E8F0'}`,
                  background: tipoCancelacion === 'no_asistio' ? '#FEF2F2' : '#FFFFFF',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="tipoNovedad"
                    value="no_asistio"
                    checked={tipoCancelacion === 'no_asistio'}
                    onChange={() => setTipoCancelacion('no_asistio')}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.9rem' }}>
                      Inasistencia (No Asistió a la Cita)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      El paciente no se presentó en la sede ni respondió al llamado de consulta.
                    </div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '0.8rem 1rem',
                  borderRadius: '10px',
                  border: `2px solid ${tipoCancelacion === 'cancelada' ? '#DC2626' : '#E2E8F0'}`,
                  background: tipoCancelacion === 'cancelada' ? '#FEF2F2' : '#FFFFFF',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="tipoNovedad"
                    value="cancelada"
                    checked={tipoCancelacion === 'cancelada'}
                    onChange={() => setTipoCancelacion('cancelada')}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.9rem' }}>
                      Cita Cancelada
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                      El usuario notificó la cancelación o se cancela formalmente por recepción.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Motivo opcional */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Motivo u Observación (Opcional):</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Ej: Paciente notificó imprevisto de transporte / No se presentó tras 3 llamados en sala..."
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalCancelarAbierto(false)}
                disabled={guardandoCancelacion}
              >
                Volver
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '0.7rem 1.2rem', fontWeight: 700 }}
                onClick={confirmarCancelacion}
                disabled={guardandoCancelacion}
              >
                {guardandoCancelacion ? 'Registrando...' : 'Confirmar Novedad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: LLEGÓ TARDE & REASIGNACIÓN EN LOS PRÓXIMOS 5 DÍAS */}
      {/* ======================================================== */}
      {modalReasignarAbierto && citaParaReasignar && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ background: '#FEF3C7', color: '#D97706', padding: '0.5rem', borderRadius: '10px' }}>
                  <CalendarClock size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#0F172A', margin: 0 }}>
                    Reasignación por Llegada Tardía
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Búsqueda automática de turnos más cercanos en los siguientes 5 días hábiles
                  </div>
                </div>
              </div>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                onClick={() => setModalReasignarAbierto(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Ficha Resumen de la Cita Afectada */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '10px', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#92400E', fontSize: '0.95rem' }}>
                    {citaParaReasignar.pacienteNombres} {citaParaReasignar.pacienteApellidos} ({citaParaReasignar.pacienteTipoDoc} {citaParaReasignar.pacienteNumDoc})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#78350F', marginTop: '0.2rem' }}>
                    Especialidad: <b>{citaParaReasignar.especialidad?.nombre}</b> | Médico original: <b>{citaParaReasignar.medico?.nombre}</b>
                  </div>
                </div>
                <div style={{ background: '#F59E0B', color: '#FFFFFF', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  Hora citada: {citaParaReasignar.hora} ({citaParaReasignar.fecha})
                </div>
              </div>
            </div>

            {/* Estado de Carga */}
            {cargandoProximos && (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748B' }}>
                <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.8rem auto', display: 'block', color: '#028090' }} />
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                  Escaneando agendas disponibles en los próximos 5 días hábiles...
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Buscando médicos de {citaParaReasignar.especialidad?.nombre} en esta sede.
                </div>
              </div>
            )}

            {/* Error en escaneo */}
            {errorProximos && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
                {errorProximos}
              </div>
            )}

            {/* CASO A: HAY DISPONIBILIDAD EN LOS PRÓXIMOS 5 DÍAS */}
            {!cargandoProximos && resultadoProximos && resultadoProximos.hayDisponibilidad && (
              <div>
                <div style={{
                  background: '#ECFDF5',
                  border: '1.5px solid #10B981',
                  borderRadius: '10px',
                  padding: '0.9rem 1.2rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  color: '#065F46'
                }}>
                  <CheckCircle2 size={20} color="#059669" />
                  <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                    Se encontraron {resultadoProximos.totalCupos} horarios disponibles en los próximos 5 días hábiles. Seleccione el más conveniente para reasignar:
                  </div>
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '0.3rem', marginBottom: '1.2rem' }}>
                  {resultadoProximos.slotsCercanos.map((slot, index) => (
                    <div
                      key={`${slot.fecha}-${slot.hora}-${slot.medicoId}`}
                      style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.8rem',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                            {slot.fechaTexto} ({slot.fecha})
                          </span>
                          <span style={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 800, fontSize: '0.85rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            {slot.hora}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                          <b>{slot.medicoNombre}</b> • {slot.consultorio}
                        </div>
                      </div>

                      <button
                        className="btn btn-accent"
                        style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                        disabled={reasignandoSlot}
                        onClick={() => handleReasignarSlot(slot)}
                      >
                        {reasignandoSlot ? 'Reasignando...' : 'Reasignar Aquí'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CASO B: NO HAY DISPONIBILIDAD EN LOS PRÓXIMOS 5 DÍAS HÁBILES */}
            {!cargandoProximos && resultadoProximos && !resultadoProximos.hayDisponibilidad && (
              <div style={{
                background: '#FFFBEB',
                border: '2px solid #F59E0B',
                borderRadius: '14px',
                padding: '1.6rem',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  color: '#D97706',
                  marginBottom: '1rem'
                }}>
                  <AlertTriangle size={32} />
                </div>

                <h4 style={{ color: '#92400E', fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                  Sin Disponibilidad en los Próximos 5 Días Hábiles
                </h4>

                <p style={{ color: '#78350F', fontSize: '0.88rem', marginBottom: '1.2rem', lineHeight: 1.5 }}>
                  No se encontraron turnos de consulta libres para la especialidad de <b>{citaParaReasignar.especialidad?.nombre}</b> en los siguientes 5 días hábiles en esta sede.
                </p>

                {/* MENSAJE OFICIAL OBLIGATORIO SEGÚN REQUERIMIENTO */}
                <div style={{
                  background: '#FFFFFF',
                  border: '2px dashed #F59E0B',
                  borderRadius: '12px',
                  padding: '1.2rem',
                  color: '#B45309',
                  marginBottom: '1.2rem',
                  textAlign: 'left'
                }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', color: '#D97706', marginBottom: '0.3rem' }}>
                    Indicación y Política Oficial para el Paciente:
                  </div>
                  <div style={{ color: '#78350F', fontSize: '0.98rem', fontWeight: 800, lineHeight: 1.5 }}>
                    "La persona debe estar pendiente al sitio web oficial o debe ir a la IPS en 5 días hábiles para nueva asignación de cita."
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-warning"
                    style={{ padding: '0.65rem 1.2rem', fontWeight: 800, fontSize: '0.85rem' }}
                    disabled={reasignandoSlot}
                    onClick={handleRegistrarLlegoTardeSinCupo}
                  >
                    {reasignandoSlot ? 'Guardando...' : 'Registrar como "Llegó Tarde" (Sin Cupo Inmediato)'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalReasignarAbierto(false)}
                disabled={reasignandoSlot}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

