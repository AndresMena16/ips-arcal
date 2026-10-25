import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Stethoscope, User, Calendar, Clock, CheckCircle2,
  AlertTriangle, FileDown, ArrowRight, ArrowLeft, Shield, MapPin,
  Phone, HeartPulse, Brain, Baby, Activity, Ear, Salad, Sparkles, ShieldPlus, Check,
  Scissors, Bone, Droplets, Wind, Layers, Info, Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { generarComprobantePDF } from '../utils/pdfGenerator';
import InstitutionalSection from './InstitutionalSection';

// Mapeo exhaustivo de iconos para todas las especialidades y procedimientos de ARCAL
const ESPECIALIDAD_ICONS = {
  // Consulta Médica Especializada
  'esp-cardiologia': HeartPulse,
  'esp-medicina-interna': Stethoscope,
  'esp-pediatria': Baby,
  'esp-dermatologia': Sparkles,
  'esp-cirugia-general': Scissors,
  'esp-ortopedia': Bone,
  'esp-otorrino': Ear,
  'esp-ginecologia': ShieldPlus,
  'esp-obstetricia': Baby,
  'esp-urologia': Activity,
  'esp-hematologia': Droplets,
  'esp-reumatologia': HeartPulse,

  // Consulta Medicina General
  'esp-medicina-general': Stethoscope,
  'esp-nutricion': Salad,
  'esp-psicologia': Brain,
  'esp-terapia-respiratoria': Wind,

  // Diagnóstico Vascular
  'esp-electrocardiograma': Activity,
  'esp-ecocardiograma': HeartPulse,
  'esp-holter': Activity,
  'esp-mapa': Activity,

  // Procedimientos Menores
  'esp-proc-otorrino': Ear,
  'esp-proc-dermatologia': Sparkles,
  'esp-proc-urologia': Activity,
  'esp-proc-ortopedia': Bone,

  // Imágenes Diagnósticas & Ecografía
  'esp-ecografia': Activity,
  'esp-rayosx': Sparkles,

  // Protección Radiológica & Dosimetría
  'esp-proteccion-radiologica': Shield,
  'esp-medicina-laboral-poe': User
};

export default function WebBookingWizard({ onVerInstitucional }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrarInfoInstitucional, setMostrarInfoInstitucional] = useState(false);

  // Catálogos
  const [sedes, setSedes] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [medicosDisponibles, setMedicosDisponibles] = useState([]);
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Selección del Wizard
  const [selectedSedeId, setSelectedSedeId] = useState('');
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [selectedEspecialidadId, setSelectedEspecialidadId] = useState('');
  const [selectedMedicoId, setSelectedMedicoId] = useState('');
  const [selectedFecha, setSelectedFecha] = useState(() => {
    // Por defecto mañana
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedHora, setSelectedHora] = useState('');
  const [selectedCupsCodigo, setSelectedCupsCodigo] = useState('');

  // Formulario del Paciente
  const [formData, setFormData] = useState({
    pacienteTipoDoc: 'CC',
    pacienteNumDoc: '',
    pacienteNombres: '',
    pacienteApellidos: '',
    pacienteTelefono: '',
    pacienteEmail: '',
    pacienteAseguradora: 'Savia Salud',
    motivoConsulta: ''
  });

  // Cita creada
  const [citaConfirmada, setCitaConfirmada] = useState(null);

  // Cargar sedes y especialidades iniciales
  useEffect(() => {
    cargarCatalogos();
  }, []);

  async function cargarCatalogos() {
    try {
      setLoading(true);
      const [sedesRes, espRes] = await Promise.all([
        api.getSedes(),
        api.getEspecialidades()
      ]);
      const sedesActivas = (sedesRes.data || []).filter(s => s.activa);
      setSedes(sedesActivas);
      if (sedesActivas.length > 0) {
        setSelectedSedeId(sedesActivas[0].id);
      }
      setEspecialidades(espRes.data || []);
      if (espRes.data && espRes.data.length > 0) {
        setSelectedEspecialidadId(espRes.data[0].id);
      }
    } catch (err) {
      setError('No fue posible cargar las sedes y especialidades. Verifique el servidor.');
    } finally {
      setLoading(false);
    }
  }

  // Especialidades habilitadas específicamente para la sede seleccionada
  const especialidadesDeLaSede = useMemo(() => {
    if (!selectedSedeId) return [];
    const sede = sedes.find(s => s.id === selectedSedeId);
    if (!sede) return [];
    if (Array.isArray(sede.especialidadesHabilitadas) && sede.especialidadesHabilitadas.length > 0) {
      return especialidades.filter(esp => sede.especialidadesHabilitadas.includes(esp.id));
    }
    return especialidades;
  }, [selectedSedeId, sedes, especialidades]);

  // Departamentos únicos disponibles en la sede seleccionada
  const departamentosDisponibles = useMemo(() => {
    if (!especialidadesDeLaSede || especialidadesDeLaSede.length === 0) return [];
    const deps = [];
    especialidadesDeLaSede.forEach(esp => {
      const dep = esp.departamento || 'Medicina general';
      if (!deps.includes(dep)) {
        deps.push(dep);
      }
    });
    return deps;
  }, [especialidadesDeLaSede]);

  // Sincronizar departamento seleccionado
  useEffect(() => {
    if (departamentosDisponibles.length > 0) {
      if (!selectedDepartamento || !departamentosDisponibles.includes(selectedDepartamento)) {
        const espActual = especialidadesDeLaSede.find(e => e.id === selectedEspecialidadId);
        if (espActual && departamentosDisponibles.includes(espActual.departamento)) {
          setSelectedDepartamento(espActual.departamento);
        } else {
          setSelectedDepartamento(departamentosDisponibles[0]);
        }
      }
    } else {
      setSelectedDepartamento('');
    }
  }, [departamentosDisponibles, selectedEspecialidadId]);

  // Especialidades filtradas por el departamento seleccionado
  const especialidadesFiltradasPorDepartamento = useMemo(() => {
    if (!selectedDepartamento) return especialidadesDeLaSede;
    return especialidadesDeLaSede.filter(esp => (esp.departamento || 'Medicina general') === selectedDepartamento);
  }, [especialidadesDeLaSede, selectedDepartamento]);

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

  // Manejar cambio de departamento (Nivel 1 del select anidado)
  function handleDepartamentoChange(nuevoDep) {
    setSelectedDepartamento(nuevoDep);
    const esps = especialidadesDeLaSede.filter(e => (e.departamento || 'Medicina general') === nuevoDep);
    if (esps.length > 0) {
      const sigueValida = esps.some(e => e.id === selectedEspecialidadId);
      if (!sigueValida) {
        setSelectedEspecialidadId(esps[0].id);
      }
    } else {
      setSelectedEspecialidadId('');
    }
  }

  // Manejar cambio de especialidad (Nivel 2 del select anidado)
  function handleEspecialidadChange(espId) {
    setSelectedEspecialidadId(espId);
    const esp = especialidadesDeLaSede.find(e => e.id === espId);
    if (esp && esp.departamento && esp.departamento !== selectedDepartamento) {
      setSelectedDepartamento(esp.departamento);
    }
  }

  // Filtrar médicos según Sede y Especialidad seleccionadas
  useEffect(() => {
    if (selectedSedeId && selectedEspecialidadId) {
      cargarMedicos();
    }
  }, [selectedSedeId, selectedEspecialidadId]);

  async function cargarMedicos() {
    try {
      const res = await api.getMedicos({
        sedeId: selectedSedeId,
        especialidadId: selectedEspecialidadId
      });
      const medicos = res.data || [];
      setMedicosDisponibles(medicos);
      if (medicos.length > 0) {
        setSelectedMedicoId(medicos[0].id);
      } else {
        setSelectedMedicoId('');
        setSlotsDisponibles([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Cargar disponibilidad de slots en tiempo real
  useEffect(() => {
    if (selectedMedicoId && selectedFecha) {
      cargarDisponibilidad();
    }
  }, [selectedMedicoId, selectedFecha, citaConfirmada?.id]);

  async function cargarDisponibilidad() {
    try {
      setLoadingSlots(true);
      setError('');
      // Si ya hay una cita confirmada que se está editando, excluimos su ID para que su horario aparezca disponible para ella misma
      const res = await api.getDisponibilidad(
        selectedMedicoId,
        selectedFecha,
        selectedSedeId,
        citaConfirmada ? citaConfirmada.id : ''
      );
      if (res.data && res.data.slots) {
        setSlotsDisponibles(res.data.slots);
        // Si el horario seleccionado antes no está disponible (y no es el que ya teníamos reservado), deseleccionarlo
        const slotAunLibre = res.data.slots.find(s => s.hora === selectedHora && s.disponible);
        if (!slotAunLibre && (!citaConfirmada || selectedHora !== citaConfirmada.hora)) {
          setSelectedHora('');
        }
      }
    } catch (err) {
      console.error(err);
      setError('No fue posible consultar la disponibilidad en tiempo real.');
    } finally {
      setLoadingSlots(false);
    }
  }

  // Manejar cambio en formulario paciente
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // Confirmar y agendar o actualizar la cita médica
  async function handleAgendarCita(e) {
    e.preventDefault();
    if (!formData.pacienteNumDoc || !formData.pacienteNombres || !formData.pacienteApellidos) {
      setError('Por favor complete los nombres, apellidos y número de documento del paciente.');
      return;
    }
    if (!selectedHora) {
      setError('Por favor seleccione una hora válida.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        ...formData,
        sedeId: selectedSedeId,
        especialidadId: selectedEspecialidadId,
        departamento: selectedDepartamento || especialidadSeleccionada?.departamento || '',
        tipoCita: modalidadActual?.tipo || (especialidadSeleccionada?.esConsulta ? 'primera_vez' : 'procedimiento'),
        codigoCups: modalidadActual?.codigoCups || especialidadSeleccionada?.codigo || '',
        nombreCups: modalidadActual?.descripcionCups || especialidadSeleccionada?.nombre || '',
        medicoId: selectedMedicoId,
        fecha: selectedFecha,
        hora: selectedHora,
        tipoAgendamiento: 'web'
      };

      let res;
      // Si ya generamos la cita previamente y nos devolvimos a editar datos, ACTUALIZAR la cita existente
      if (citaConfirmada && (citaConfirmada.id || citaConfirmada.codigoCita)) {
        res = await api.updateCita(citaConfirmada.id || citaConfirmada.codigoCita, payload);
      } else {
        // Primera confirmación: crear la cita
        res = await api.createCita(payload);
      }

      if (res.success && res.data) {
        setCitaConfirmada(res.data);
        setStep(4);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setError(err.message || 'Error al procesar la cita. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  // Objetos seleccionados para resúmenes
  const sedeActual = sedes.find(s => s.id === selectedSedeId);
  const espActual = especialidades.find(e => e.id === selectedEspecialidadId);
  const medicoActual = medicosDisponibles.find(m => m.id === selectedMedicoId);

  return (
    <div>
      {/* Hero Header */}
      <div className="hero-card">
        <div className="hero-content">
          <div className="hero-badge">
            <Shield size={14} color="var(--brand-green)" />
            ARCAL PROTECCIÓN RADIOLÓGICA IPS
          </div>
          <h2>Portal de Citas & Servicios de Apoyo Diagnóstico</h2>
          <p>
            Reserve su cita de forma ágil y segura en nuestras sedes de Medellín, Urabá y cobertura nacional.
            Especialistas en <b>Ecografía de alta resolución</b>, <b>Protección Radiológica</b>, <b>Dosimetría Ocupacional</b> y <b>Consultas Médicas Especializadas</b>.
            Al completar su reserva, obtendrá inmediatamente su comprobante digital oficial en PDF con recomendaciones médicas.
          </p>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* <button
              type="button"
              onClick={() => setMostrarInfoInstitucional(!mostrarInfoInstitucional)}
              className="btn btn-secondary"
              style={{
                background: 'rgba(255,255,255,0.18)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                padding: '0.45rem 0.95rem',
                backdropFilter: 'blur(4px)'
              }}
            >
              <Info size={15} color="var(--brand-green)" />
              {mostrarInfoInstitucional ? 'Ocultar Identidad Institucional' : 'Conocer Misión, Visión & Portafolio Oficial'}
            </button>*/}
            {departamentosDisponibles.map(dep => (
              <span key={dep} className="specialty-pill" style={{ fontSize: '0.74rem' }}>
                {dep}
              </span>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', zIndex: 2, background: 'rgba(255,255,255,0.08)', padding: '1.4rem 1.6rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', minWidth: '240px' }}>
          <div style={{ background: '#FFFFFF', padding: '6px 14px', borderRadius: '10px', display: 'inline-block', marginBottom: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <img src="/arcal-logo.png" alt="ARCAL IPS" style={{ height: '36px', width: 'auto', display: 'block' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Central de Atención</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-green)', margin: '0.2rem 0' }}>(604) 604-8956</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--brand-cyan)' }}>WhatsApp: +57 310 854 9210</div>
          <div style={{ marginTop: '0.7rem', fontSize: '0.72rem', color: '#A3E635', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <span className="live-dot" style={{ width: '6px', height: '6px' }}></span> Agendamiento Habilitado
          </div>
        </div>
      </div>

      {/* Despliegue de Misión, Visión y Política Institucional */}
      {mostrarInfoInstitucional && (
        <div style={{ marginBottom: '2rem' }}>
          <InstitutionalSection onAgendarClick={() => {
            setMostrarInfoInstitucional(false);
            setStep(1);
          }} />
        </div>
      )}

      {/* Stepper de Progreso */}
      <div className="stepper-container">
        <div className="stepper-progress-bg">
          <div
            className="stepper-progress-fill"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
        </div>

        <div
          className={`step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
          onClick={() => step > 1 && setStep(1)}
        >
          <div className="step-circle">{step > 1 ? <Check size={14} /> : '1'}</div>
          <div className="step-label">Sede & Especialidad</div>
        </div>

        <div
          className={`step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}
          onClick={() => step > 2 && setStep(2)}
        >
          <div className="step-circle">{step > 2 ? <Check size={14} /> : '2'}</div>
          <div className="step-label">Fecha, Hora & Médico</div>
        </div>

        <div
          className={`step-item ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}
          onClick={() => step > 3 && setStep(3)}
        >
          <div className="step-circle">{step > 3 ? <Check size={14} /> : '3'}</div>
          <div className="step-label">Datos del Paciente</div>
        </div>

        <div
          className={`step-item ${step === 4 ? 'active' : ''} ${citaConfirmada ? 'completed' : ''}`}
          onClick={() => citaConfirmada && setStep(4)}
          style={{ cursor: citaConfirmada ? 'pointer' : 'default' }}
        >
          <div className="step-circle">4</div>
          <div className="step-label">Confirmación & PDF</div>
        </div>
      </div>

      {/* Mensajes de Error */}
      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <AlertTriangle size={20} color="#DC2626" />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 1: SELECCIÓN DE SEDE Y ESPECIALIDAD */}
      {/* ======================================================== */}
      {step === 1 && (
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Building2 size={22} color="#028090" />
                Paso 1: Seleccione la Sede y Especialidad Médica
              </h3>
              <p className="panel-subtitle">Elija el centro de atención presencial y el servicio que requiere.</p>
            </div>
          </div>

          {/* Selector de Sedes */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#1E293B', marginBottom: '0.8rem', fontWeight: 700 }}>
              1. Seleccione la Sede Presencial de IPS ARCAL:
            </h4>
            <div className="selection-grid">
              {sedes.map(sede => (
                <div
                  key={sede.id}
                  className={`select-card ${selectedSedeId === sede.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSedeId(sede.id)}
                >
                  <div>
                    <div className="card-icon-title">
                      <div className="card-icon-badge">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4>{sede.nombre}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#028090', fontWeight: 700 }}>{sede.ciudad}</span>
                      </div>
                    </div>
                    <p style={{ margin: '0.5rem 0' }}>{sede.direccion}</p>
                  </div>

                  <div className="card-meta-list">
                    <div className="card-meta-item">
                      <Phone size={12} />
                      <span>{sede.telefono}</span>
                    </div>
                    <div className="card-meta-item">
                      <Clock size={12} />
                      <span>{sede.horarioAtencion}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ======================================================== */}
          {/* SELECT ANIDADO: DEPARTAMENTO -> ESPECIALIDAD */}
          {/* ======================================================== */}
          <div style={{
            background: '#F8FAFC',
            border: '1.5px solid var(--border-light)',
            borderRadius: '16px',
            padding: '1.4rem',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--brand-cyan-light)',
                  color: 'var(--brand-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: '#1E293B', fontWeight: 800, margin: 0 }}>
                    Selección por Departamento de Salud
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    Filtre por departamento para desplegar las especialidades y procedimientos específicos
                  </span>
                </div>
              </div>

              <span className="badge badge-web" style={{ fontSize: '0.78rem' }}>
                {especialidadesDeLaSede.length} especialidades en esta sede
              </span>
            </div>

            {/* Fila de los TRES selects anidados encadenados */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
              {/* SELECT 1: DEPARTAMENTO */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                  Departamento Clínico / Área
                </label>
                <select
                  className="form-select"
                  value={selectedDepartamento}
                  onChange={e => handleDepartamentoChange(e.target.value)}
                  disabled={departamentosDisponibles.length === 0}
                  style={{ fontWeight: 700, borderColor: 'var(--brand-cyan)', padding: '0.65rem 0.8rem', background: '#FFFFFF' }}
                >
                  {departamentosDisponibles.length === 0 ? (
                    <option value="">Sin departamentos disponibles</option>
                  ) : (
                    departamentosDisponibles.map(dep => {
                      const count = especialidadesDeLaSede.filter(e => (e.departamento || 'Medicina general') === dep).length;
                      return (
                        <option key={dep} value={dep}>
                          {dep} ({count} {count === 1 ? 'servicio' : 'servicios'})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              {/* SELECT 2: ESPECIALIDAD ANIDADA */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                  Especialidad o Procedimiento
                </label>
                <select
                  className="form-select"
                  value={selectedEspecialidadId}
                  onChange={e => handleEspecialidadChange(e.target.value)}
                  disabled={!selectedDepartamento || especialidadesFiltradasPorDepartamento.length === 0}
                  style={{ fontWeight: 700, borderColor: 'var(--brand-green)', padding: '0.65rem 0.8rem', background: '#FFFFFF' }}
                >
                  {especialidadesFiltradasPorDepartamento.length === 0 ? (
                    <option value="">No hay especialidades en este departamento</option>
                  ) : (
                    especialidadesFiltradasPorDepartamento.map(esp => (
                      <option key={esp.id} value={esp.id}>
                        {esp.nombre} — {esp.duracionMinutos} min ({esp.codigo})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* SELECT 3: TIPO DE CITA (PRIMERA VEZ VS CONTROL) Y CÓDIGO CUPS ANIDADO */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.80rem', fontWeight: 500, color: 'var(--primary-900)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tipo de Cita & Código CUPS</span>
                  {modalidadActual && (
                    <span style={{ color: 'var(--brand-green-dark)', fontWeight: 500 }}>
                      CUPS:{modalidadActual.codigoCups}
                    </span>
                  )}
                </label>
                {modalidadesDisponibles.length > 1 ? (
                  <select
                    className="form-select"
                    value={selectedCupsCodigo}
                    onChange={e => setSelectedCupsCodigo(e.target.value)}
                    style={{ fontWeight: 700, borderColor: '#8CC63F', padding: '0.65rem 0.8rem', background: '#FFFFFF', color: '#0F172A' }}
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minHeight: '42px'
                  }}>
                    <span style={{ background: '#16A34A', color: '#FFF', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 800 }}>
                      CUPS {modalidadActual?.codigoCups || 'Oficial'}
                    </span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {modalidadActual?.etiqueta || 'Procedimiento / Examen Único'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Selector interactivo directo para Primera Vez vs Control en consultas médicas */}
            {modalidadesDisponibles.length > 1 && (
              <div style={{ marginTop: '1.1rem', paddingTop: '0.9rem', borderTop: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  <Filter size={15} color="var(--brand-cyan)" />
                  <span>Seleccione Modalidad de Consulta:</span>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {modalidadesDisponibles.map(mod => {
                    const isActiva = selectedCupsCodigo === mod.codigoCups;
                    const esPrimera = mod.tipo === 'primera_vez';
                    return (
                      <button
                        key={mod.codigoCups}
                        type="button"
                        onClick={() => setSelectedCupsCodigo(mod.codigoCups)}
                        style={{
                          padding: '0.45rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          border: isActiva ? '2px solid var(--brand-green)' : '1px solid #CBD5E1',
                          background: isActiva ? (esPrimera ? '#F0FDF4' : '#F0F9FF') : '#FFFFFF',
                          color: isActiva ? (esPrimera ? '#166534' : '#0369A1') : '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.15s ease',
                          boxShadow: isActiva ? '0 3px 8px rgba(140, 198, 63, 0.25)' : 'none'
                        }}
                      >
                        <Check size={15} color={isActiva ? (esPrimera ? '#16A34A' : '#0284C7') : 'transparent'} />
                        <span>{mod.etiqueta}</span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: isActiva ? (esPrimera ? '#8CC63F' : '#36B0C1') : '#E2E8F0',
                          color: isActiva ? (esPrimera ? '#0B2233' : '#FFFFFF') : '#64748B',
                          padding: '2px 7px',
                          borderRadius: '4px'
                        }}>
                          CUPS: {mod.codigoCups}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chips de departamentos para cambio visual con un solo clic */}
            <div style={{ marginTop: '1.1rem', paddingTop: '0.9rem', borderTop: '1px dashed #CBD5E1' }}>
              {/* <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>
                Departamentos de salud habilitados en {sedeActual?.nombre || 'la sede'}:
              </div>
               <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                {departamentosDisponibles.map(dep => {
                  const isSelected = selectedDepartamento === dep;
                  const count = especialidadesDeLaSede.filter(e => (e.departamento || 'Departamento 1. Medicina general') === dep).length;
                  return (
                    <button
                      key={dep}
                      type="button"
                      onClick={() => handleDepartamentoChange(dep)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.76rem',
                        border: isSelected ? '2px solid var(--brand-cyan)' : '1px solid #CBD5E1',
                        background: isSelected ? 'var(--brand-cyan-light)' : '#FFFFFF',
                        color: isSelected ? 'var(--brand-cyan-dark)' : '#334155',
                        fontWeight: isSelected ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(54, 176, 193, 0.2)' : 'none'
                      }}
                    >
                      {dep} ({count})
                    </button>
                  );
                })}
              </div> */}
            </div>
          </div>

          {/* Cuadrícula de Tarjetas del Departamento Seleccionado */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#1E293B', fontWeight: 700, margin: 0 }}>
                Especialidades en: <span style={{ color: 'var(--brand-cyan-dark)' }}>{selectedDepartamento || 'Departamento'}</span>
              </h4>
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                Haga clic en la tarjeta o elija del menú desplegable superior
              </span>
            </div>

            {especialidadesFiltradasPorDepartamento.length === 0 ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '1.2rem', borderRadius: '12px', color: '#991B1B', textAlign: 'center', marginTop: '0.5rem' }}>
                <p style={{ margin: 0, fontWeight: 700 }}>
                  No hay especialidades habilitadas en este departamento para la sede seleccionada.
                </p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: '#B91C1C' }}>
                  Por favor seleccione otro departamento o cambie de sede.
                </p>
              </div>
            ) : (
              <div className="selection-grid">
                {especialidadesFiltradasPorDepartamento.map(esp => {
                  const IconComponent = ESPECIALIDAD_ICONS[esp.id] || Stethoscope;
                  const isSelected = selectedEspecialidadId === esp.id;

                  return (
                    <div
                      key={esp.id}
                      className={`select-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleEspecialidadChange(esp.id)}
                    >
                      <div>
                        <div className="card-icon-title">
                          <div className="card-icon-badge">
                            <IconComponent size={22} />
                          </div>
                          <div>
                            <h4>{esp.nombre}</h4>
                            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                              Código: {esp.codigo} • {esp.duracionMinutos} min
                            </span>
                          </div>
                        </div>
                        <p>{esp.descripcion}</p>
                      </div>

                      <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: isSelected ? 'var(--brand-green-dark)' : '#0369A1', background: isSelected ? 'var(--brand-green-light)' : '#F0F9FF', padding: '0.5rem 0.7rem', borderRadius: '8px', fontWeight: isSelected ? 700 : 500 }}>
                        {isSelected ? '✓ Seleccionada para agendamiento' : 'Incluye recomendaciones previas para la consulta'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vista previa de recomendaciones de la especialidad seleccionada */}
          {espActual && espActual.recomendaciones && especialidadesFiltradasPorDepartamento.length > 0 && (
            <div className="clinical-rec-box">
              <div className="clinical-rec-header">
                <AlertTriangle size={20} />
                <span>Recomendaciones previas para {espActual.nombre}:</span>
              </div>
              <ul className="clinical-rec-list">
                {espActual.recomendaciones.map((rec, idx) => (
                  <li key={idx} className="clinical-rec-item">
                    <span className="rec-bullet">{idx + 1}</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Botón Siguiente */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => setStep(2)}
              disabled={!selectedSedeId || !selectedEspecialidadId || especialidadesDeLaSede.length === 0}
            >
              <span>Continuar a Selección de Fecha y Médico</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 2: PROFESIONAL, FECHA Y SLOTS DISPONIBLES */}
      {/* ======================================================== */}
      {step === 2 && (
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Calendar size={22} color="#028090" />
                Paso 2: Especialista, Fecha y Horario Disponible
              </h3>
              <p className="panel-subtitle">
                Sede: <b>{sedeActual?.nombre}</b> | Especialidad: <b>{espActual?.nombre}</b>
              </p>
            </div>
            <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ padding: '0.5rem 1rem' }}>
              <ArrowLeft size={16} /> Cambiar Sede/Especialidad
            </button>
          </div>

          {/* Selección de Médico */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#1E293B', marginBottom: '0.8rem', fontWeight: 700 }}>
              1. Seleccione el Profesional de la Salud:
            </h4>

            {medicosDisponibles.length === 0 ? (
              <div style={{ background: '#FEF3C7', padding: '1.2rem', borderRadius: '12px', color: '#92400E', fontSize: '0.9rem' }}>
                No hay médicos habilitados para {espActual?.nombre} en {sedeActual?.nombre} en este momento. Por favor seleccione otra sede o consulte en recepción.
              </div>
            ) : (
              <div className="selection-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {medicosDisponibles.map(med => (
                  <div
                    key={med.id}
                    className={`select-card ${selectedMedicoId === med.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMedicoId(med.id)}
                  >
                    <div className="card-icon-title">
                      <div className="card-icon-badge">
                        <User size={22} />
                      </div>
                      <div>
                        <h4>{med.nombre}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#028090', fontWeight: 700 }}>
                          {med.registroMedico}
                        </span>
                      </div>
                    </div>
                    <div className="card-meta-list">
                      <div className="card-meta-item">
                        <span>Consultorio: <b>{med.consultorio}</b></span>
                      </div>
                      <div className="card-meta-item">
                        <span>Jornada: {med.horaInicio} a {med.horaFin}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selección de Fecha */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#1E293B', marginBottom: '0.8rem', fontWeight: 700 }}>
              2. Seleccione la Fecha de Consulta:
            </h4>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="date"
                className="form-input"
                style={{ maxWidth: '280px', fontWeight: 600, fontSize: '1rem' }}
                value={selectedFecha}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setSelectedFecha(e.target.value)}
              />
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Atención de Lunes a Sábado en jornadas matutina y vespertina.
              </span>
            </div>
          </div>

          {/* Cuadrícula de Slots en Tiempo Real */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#1E293B', fontWeight: 700 }}>
                3. Horarios Disponibles en Tiempo Real para el {selectedFecha}:
              </h4>
              <span style={{ fontSize: '0.8rem', color: '#028090', fontWeight: 600 }}>
                {loadingSlots ? 'Consultando agenda en vivo...' : '● Sincronizado con recepción presencial'}
              </span>
            </div>

            {loadingSlots ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                Cargando franjas horarias libres...
              </div>
            ) : slotsDisponibles.length === 0 ? (
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1.2rem', borderRadius: '12px', color: '#92400E', textAlign: 'center' }}>
                No hay horarios disponibles para el {selectedFecha}. Los turnos de hoy ya transcurrieron o ya están ocupados. Por favor seleccione una fecha posterior.
              </div>
            ) : (
              <div className="slots-grid">
                {slotsDisponibles.map(slot => (
                  <button
                    key={slot.hora}
                    type="button"
                    className={`slot-btn ${selectedHora === slot.hora ? 'selected' : ''}`}
                    disabled={!slot.disponible}
                    onClick={() => setSelectedHora(slot.hora)}
                    title={slot.disponible ? 'Horario libre para agendar' : `Ocupado vía canal ${slot.canalOcupado}`}
                  >
                    <span>{slot.hora}</span>
                    <span className="slot-status-text" style={{ color: slot.disponible ? '#059669' : '#DC2626' }}>
                      {slot.disponible ? 'Libre' : 'Ocupado'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedHora && (
              <div style={{ marginTop: '1rem', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.8rem 1.2rem', borderRadius: '10px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={18} color="#059669" />
                <span>Horario seleccionado: <b>{selectedHora}</b> del día <b>{selectedFecha}</b></span>
              </div>
            )}
          </div>

          {/* Botones de Navegación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={18} /> Atrás
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setStep(3)}
              disabled={!selectedMedicoId || !selectedFecha || !selectedHora}
            >
              <span>Continuar a Datos del Paciente</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 3: FORMULARIO DE DATOS DEL PACIENTE */}
      {/* ======================================================== */}
      {step === 3 && (
        <div className="card-panel">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <User size={22} color="#028090" />
                Paso 3: Información Personal del Paciente
              </h3>
              <p className="panel-subtitle">Ingrese sus datos exactos para el registro clínico oficial y el comprobante PDF.</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ padding: '0.5rem 1rem' }}>
              <ArrowLeft size={16} /> Cambiar Horario
            </button>
          </div>

          {/* Notificación si se está editando una cita ya generada */}
          {citaConfirmada && (
            <div style={{
              background: '#EFF6FF',
              border: '1.5px solid #93C5FD',
              borderRadius: '10px',
              padding: '0.85rem 1.2rem',
              marginBottom: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase' }}>
                  Modificando Cita Reservada
                </span>
                <div style={{ fontSize: '0.88rem', color: '#1E40AF', fontWeight: 600 }}>
                  Radicado: <b>{citaConfirmada.codigoCita}</b> — Los cambios se actualizarán sobre su misma reserva sin generar duplicados ni perder su horario.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                onClick={() => setStep(4)}
              >
                Volver al Comprobante
              </button>
            </div>
          )}

          {/* Resumen de la Cita */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.8rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Sede</div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{sedeActual?.nombre}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Servicio & CUPS</div>
              <div style={{ fontWeight: 700, color: '#028090' }}>{espActual?.nombre}</div>
              <div style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 700 }}>
                {modalidadActual ? `${modalidadActual.etiqueta} • CUPS: ${modalidadActual.codigoCups}` : ''}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Departamento</div>
              <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.82rem' }}>
                {selectedDepartamento || espActual?.departamento}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Fecha y Hora</div>
              <div style={{ fontWeight: 800, color: '#059669' }}>{selectedFecha} a las {selectedHora}</div>
            </div>
          </div>

          <form onSubmit={handleAgendarCita}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Tipo de Documento *</label>
                <select
                  className="form-select"
                  name="pacienteTipoDoc"
                  value={formData.pacienteTipoDoc}
                  onChange={handleInputChange}
                  required
                >
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="TI">Tarjeta de Identidad (TI)</option>
                  <option value="CE">Cédula de Extranjería (CE)</option>
                  <option value="PA">Pasaporte (PA)</option>
                  <option value="RC">Registro Civil (RC)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Número de Identificación *</label>
                <input
                  type="text"
                  className="form-input"
                  name="pacienteNumDoc"
                  placeholder="Ej: 1018459203"
                  value={formData.pacienteNumDoc}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombres Completos *</label>
                <input
                  type="text"
                  className="form-input"
                  name="pacienteNombres"
                  placeholder="Ej: Juan Camilo"
                  value={formData.pacienteNombres}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Apellidos Completos *</label>
                <input
                  type="text"
                  className="form-input"
                  name="pacienteApellidos"
                  placeholder="Ej: Rodríguez Gómez"
                  value={formData.pacienteApellidos}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número Celular / Teléfono *</label>
                <input
                  type="tel"
                  className="form-input"
                  name="pacienteTelefono"
                  placeholder="Ej: 310 854 9210"
                  value={formData.pacienteTelefono}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico *</label>
                <input
                  type="email"
                  className="form-input"
                  name="pacienteEmail"
                  placeholder="ejemplo@correo.com"
                  value={formData.pacienteEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Entidad / EPS / Aseguradora</label>
                <select
                  className="form-select"
                  name="pacienteAseguradora"
                  value={formData.pacienteAseguradora}
                  onChange={handleInputChange}
                >
                  <option value="Particular">Particular (Pago directo)</option>
                  <option value="Savia Salud">Savia Salud</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo de Consulta o Síntomas</label>
                <input
                  type="text"
                  className="form-input"
                  name="motivoConsulta"
                  placeholder="Ej: Valoración inicial, control, dolor localizado..."
                  value={formData.motivoConsulta}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Aviso de Tratamiento de Datos */}
            <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748B', background: '#F1F5F9', padding: '0.8rem 1rem', borderRadius: '8px' }}>
              De acuerdo con la Ley Estatutaria 1581 de 2012 y normatividad de salud en Colombia, sus datos personales y clínicos son tratados con estricta confidencialidad médica por <b>IPS ARCAL Protección Radiológica S.A.S.</b>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={18} /> Atrás
              </button>
              <button
                type="submit"
                className="btn btn-accent"
                disabled={loading}
                style={{ padding: '0.9rem 2.2rem', fontSize: '1.05rem' }}
              >
                {loading
                  ? 'Procesando Cita...'
                  : (citaConfirmada ? 'Guardar Cambios & Actualizar Comprobante' : 'Confirmar Cita & Generar PDF')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASO 4: CONFIRMACIÓN EXITOSA & DESCARGA DEL PDF */}
      {/* ======================================================== */}
      {step === 4 && citaConfirmada && (
        <div className="card-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: '70px', height: '70px', background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={44} color="#15803D" />
          </div>

          <h2 style={{ fontSize: '2rem', color: '#0F172A', marginBottom: '0.5rem' }}>
            ¡Su Cita Médica ha Sido Agendada con Éxito!
          </h2>
          <p style={{ color: '#64748B', maxWidth: '600px', margin: '0 auto 2rem', fontSize: '0.95rem' }}>
            La cita ha sido registrada en el sistema central de <b>ARCAL Protección Radiológica S.A.S. (IPS)</b> y el horario seleccionado ha quedado reservado tanto para canal web como para taquilla presencial.
          </p>

          {/* Tarjeta Destacada con Radicado */}
          <div style={{ background: '#FFFFFF', border: '2px solid var(--brand-cyan)', borderRadius: '16px', maxWidth: '650px', margin: '0 auto 2rem', padding: '2rem', textAlign: 'left', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src="/arcal-logo.png" alt="ARCAL" style={{ height: '36px', width: 'auto' }} />
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Código de Cita / Radicado</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-cyan-dark)' }}>
                    {citaConfirmada.codigoCita}
                  </div>
                </div>
              </div>
              <span className="badge badge-confirmada">Confirmada</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.2rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Paciente & Aseguradora:</span>
                <div style={{ fontWeight: 700, color: '#0F172A' }}>
                  {citaConfirmada.pacienteNombres} {citaConfirmada.pacienteApellidos}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  {citaConfirmada.pacienteTipoDoc} {citaConfirmada.pacienteNumDoc} • <b style={{ color: 'var(--brand-cyan-dark)' }}>{citaConfirmada.pacienteAseguradora || 'Savia Salud'}</b>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Servicio & Código CUPS:</span>
                <div style={{ fontWeight: 700, color: '#028090' }}>
                  {citaConfirmada.especialidad?.nombre}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 800 }}>
                  CUPS: {citaConfirmada.codigoCups} ({citaConfirmada.tipoCita === 'primera_vez' ? 'Primera Vez' : citaConfirmada.tipoCita === 'control' ? 'Control o Seguimiento' : 'Procedimiento'})
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Fecha y Hora Programada:</span>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>
                  {citaConfirmada.fecha} a las {citaConfirmada.hora}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
                  Llegar 15 minutos antes
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Departamento & Sede:</span>
                <div style={{ fontWeight: 700, color: '#0F172A' }}>
                  {citaConfirmada.sede?.nombre}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  {citaConfirmada.departamento}
                </div>
              </div>
            </div>

            {/* Caja de Recomendaciones Específicas */}
            <div className="clinical-rec-box" style={{ margin: '1.5rem 0 0' }}>
              <div className="clinical-rec-header" style={{ fontSize: '0.9rem' }}>
                <AlertTriangle size={18} />
                <span>Recomendaciones obligatorias según su especialidad ({citaConfirmada.especialidad?.nombre}):</span>
              </div>
              <ul className="clinical-rec-list">
                {citaConfirmada.especialidad?.recomendaciones?.map((rec, idx) => (
                  <li key={idx} className="clinical-rec-item" style={{ fontSize: '0.8rem' }}>
                    <span className="rec-bullet">{idx + 1}</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Botones de Descarga y Navegación */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-accent"
              onClick={() => generarComprobantePDF(citaConfirmada)}
              style={{ padding: '1rem 2.2rem', fontSize: '1.05rem', boxShadow: 'var(--shadow-glow)' }}
            >
              <FileDown size={22} />
              <span>Descargar Comprobante Oficial en PDF</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => setStep(3)}
              style={{ padding: '1rem 1.6rem', fontSize: '1rem' }}
              title="Corregir datos del paciente o verificar información"
            >
              <span>Editar Datos de la Cita</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setStep(1);
                setCitaConfirmada(null);
                setFormData({
                  pacienteTipoDoc: 'CC',
                  pacienteNumDoc: '',
                  pacienteNombres: '',
                  pacienteApellidos: '',
                  pacienteTelefono: '',
                  pacienteEmail: '',
                  pacienteAseguradora: 'Particular',
                  motivoConsulta: ''
                });
              }}
              style={{ padding: '1rem 1.6rem', fontSize: '1rem' }}
            >
              <span>Agendar Otra Cita</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
