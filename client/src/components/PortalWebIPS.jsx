import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, ShieldCheck, Shield, Phone, Mail, MapPin, Search,
  ArrowRight, ExternalLink, CheckCircle2, AlertCircle, FileText, Video,
  Image as ImageIcon, Play, Eye, Filter, RefreshCw, Send, Check, X,
  Building2, Stethoscope, HeartPulse, Scissors, Activity, User,
  HelpCircle, MessageSquare, ChevronRight, Layers, Award, Sparkles, BookOpen
} from 'lucide-react';
import { api } from '../services/api';

// Helper para convertir URLs de video (YouTube, Shorts, Vimeo) a formato de inserción responsivo
function formatVideoEmbed(url) {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;

  const ytWatchMatch = url.match(/[?&]v=([^&]+)/);
  if (ytWatchMatch) return `https://www.youtube.com/embed/${ytWatchMatch[1]}`;

  const ytuMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (ytuMatch) return `https://www.youtube.com/embed/${ytuMatch[1]}`;

  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([^?&]+)/);
  if (ytShortsMatch) return `https://www.youtube.com/embed/${ytShortsMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return url;
}

function isDirectVideo(url) {
  if (!url) return false;
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
}

export default function PortalWebIPS({ onIrControlCitas, onIrConsulta, initialSection }) {
  // Estados de datos dinámicos
  const [datosCuriosos, setDatosCuriosos] = useState([]);
  const [galeriaItems, setGaleriaItems] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subnavActivo, setSubnavActivo] = useState('servicios');

  // Filtros de navegación
  const [categoriaCuriosa, setCategoriaCuriosa] = useState('todos');
  const [categoriaGaleria, setCategoriaGaleria] = useState('todos');

  // Modal de Detalle (Dato Curioso o Galería)
  const [modalElemento, setModalElemento] = useState(null);

  // Estado del Módulo PQRS
  const [tabPqrs, setTabPqrs] = useState('radicar'); // 'radicar' | 'consultar'
  const [formPqrs, setFormPqrs] = useState({
    tipo: 'Petición',
    nombreCompleto: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    email: '',
    telefono: '',
    sedeId: '',
    servicio: 'Consulta Médica Especializada',
    asunto: '',
    descripcion: ''
  });
  const [enviandoPqrs, setEnviandoPqrs] = useState(false);
  const [resultadoRadicacion, setResultadoRadicacion] = useState(null);

  // Consulta de PQRS
  const [busquedaPqrs, setBusquedaPqrs] = useState('');
  const [resultadosConsulta, setResultadosConsulta] = useState(null);
  const [consultandoPqrs, setConsultandoPqrs] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState('');

  // Portafolio de Departamentos Médicos
  const [deptoSeleccionado, setDeptoSeleccionado] = useState('especializada');

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (initialSection) {
      const el = document.getElementById(initialSection);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [initialSection]);

  // ScrollSpy para subbarra de navegación rápida
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const threshold = 180;
          const sedesEl = document.getElementById('seccion-sedes');
          const pqrsEl = document.getElementById('seccion-pqrs');
          const galeriaEl = document.getElementById('seccion-galeria');
          const curiososEl = document.getElementById('seccion-datos-curiosos');

          if (sedesEl && sedesEl.getBoundingClientRect().top <= threshold) {
            setSubnavActivo('sedes');
          } else if (pqrsEl && pqrsEl.getBoundingClientRect().top <= threshold) {
            setSubnavActivo('pqrs');
          } else if (galeriaEl && galeriaEl.getBoundingClientRect().top <= threshold) {
            setSubnavActivo('galeria');
          } else if (curiososEl && curiososEl.getBoundingClientRect().top <= threshold) {
            setSubnavActivo('curiosos');
          } else {
            setSubnavActivo('servicios');
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function cargarDatos() {
    setLoading(true);
    try {
      const [curiososRes, galeriaRes, sedesRes] = await Promise.all([
        api.getDatosCuriosos().catch(() => ({ data: [] })),
        api.getGaleria().catch(() => ({ data: [] })),
        api.getSedes().catch(() => ({ data: [] }))
      ]);
      setDatosCuriosos(curiososRes.data || []);
      setGaleriaItems(galeriaRes.data || []);
      setSedes(sedesRes.data || []);
    } catch (err) {
      console.error('Error al cargar datos del portal:', err);
    } finally {
      setLoading(false);
    }
  }

  // Manejo de Formulario PQRS
  async function handleSubmitPqrs(e) {
    e.preventDefault();
    setEnviandoPqrs(true);
    try {
      const res = await api.radicarPqrs(formPqrs);
      setResultadoRadicacion(res.data);
      setFormPqrs({
        tipo: 'Petición',
        nombreCompleto: '',
        tipoDocumento: 'CC',
        numeroDocumento: '',
        email: '',
        telefono: '',
        sedeId: '',
        servicio: 'Consulta Médica Especializada',
        asunto: '',
        descripcion: ''
      });
    } catch (err) {
      alert('Error al radicar PQRS: ' + err.message);
    } finally {
      setEnviandoPqrs(false);
    }
  }

  async function handleConsultarPqrs(e) {
    e.preventDefault();
    if (!busquedaPqrs.trim()) return;
    setConsultandoPqrs(true);
    setErrorConsulta('');
    setResultadosConsulta(null);
    try {
      const res = await api.consultarPqrs(busquedaPqrs.trim());
      if (res.data && res.data.length > 0) {
        setResultadosConsulta(res.data);
      } else {
        setErrorConsulta('No se encontraron registros de PQRS con el radicado o número de documento ingresado.');
      }
    } catch (err) {
      setErrorConsulta('Error al consultar: ' + err.message);
    } finally {
      setConsultandoPqrs(false);
    }
  }

  // Filtrado de Datos Curiosos
  const categoriasCuriosasDisponibles = useMemo(() => {
    const cats = new Set(datosCuriosos.map(d => d.categoria).filter(Boolean));
    return ['todos', ...Array.from(cats)];
  }, [datosCuriosos]);

  const datosCuriososFiltrados = useMemo(() => {
    if (categoriaCuriosa === 'todos') return datosCuriosos;
    return datosCuriosos.filter(d => d.categoria === categoriaCuriosa);
  }, [datosCuriosos, categoriaCuriosa]);

  // Filtrado de Galería
  const categoriasGaleriaDisponibles = useMemo(() => {
    const cats = new Set(galeriaItems.map(g => g.categoria).filter(Boolean));
    return ['todos', ...Array.from(cats)];
  }, [galeriaItems]);

  const galeriaFiltrada = useMemo(() => {
    if (categoriaGaleria === 'todos') return galeriaItems;
    return galeriaItems.filter(g => g.categoria === categoriaGaleria);
  }, [galeriaItems, categoriaGaleria]);

  const departamentosPortafolio = [
    {
      id: 'especializada',
      nombre: 'Consulta Médica Especializada',
      icono: Stethoscope,
      descripcion: 'Atención clínica y diagnóstica orientada a la resolución de patologías complejas.',
      color: 'var(--brand-cyan)',
      items: [
        'Cardiología de Alta Complejidad',
        'Medicina Interna & Manejo de Enfermedad Crónica',
        'Pediatría & Cuidado Integral Infantil',
        'Ortopedia y Traumatología',
        'Otorrinolaringología Especializada',
        'Urología & Diagnóstico de Vía Urinaria',
        'Dermatología Clínica'
      ]
    },
    {
      id: 'general',
      nombre: 'Medicina General & Bienestar',
      icono: HeartPulse,
      descripcion: 'Prevención primaria, diagnóstico oportuno y acompañamiento multidisciplinario humanizado.',
      color: 'var(--brand-green)',
      items: [
        'Consulta de Medicina General Integral',
        'Nutrición y Dietética Clínica',
        'Psicología Clínica y Acompañamiento Emocional',
        'Terapia Respiratoria Ambulatoria'
      ]
    },
    {
      id: 'vascular',
      nombre: 'Diagnóstico Vascular & Cardíaco',
      icono: Activity,
      descripcion: 'Monitoreo dinámico con equipamiento no invasivo de alta fidelidad diagnóstica.',
      color: '#EF5E95',
      items: [
        'Electrocardiograma de Superficie (12 Derivaciones)',
        'Monitoreo Ambulatorio de Presión Arterial (MAPA 24 Horas)',
        'Electrocardiografía Dinámica (Holter 24 Horas)',
        'Ecocardiograma Transtorácico de Alta Resolución'
      ]
    },
    {
      id: 'radiologia',
      nombre: 'Imágenes Diagnósticas & Ecografía',
      icono: Layers,
      descripcion: 'Evaluación anatómica precisa con tecnología digital y ecografía doppler color.',
      color: 'var(--brand-cyan-dark)',
      items: [
        'Radiología Digital Convencional de Baja Dosis',
        'Ecografía General, Abdominal, Pélvica y Renal',
        'Ecografía Doppler Vascular Arterial y Venoso',
        'Ecografía de Partes Blandas y Tiroides'
      ]
    },
    {
      id: 'procedimientos',
      nombre: 'Procedimientos Menores Dotados',
      icono: Scissors,
      descripcion: 'Intervenciones ambulatorias seguras bajo estrictas normas de bioseguridad.',
      color: '#D97706',
      items: [
        'Nasolaringoscopia y Lavados Especializados de Oído',
        'Biopsias Cutáneas, Resección de Lesiones y Crioterapia',
        'Infiltraciones Articulares y Manejo de Material Ortopédico',
        'Cistoscopia y Curaciones Especializadas'
      ]
    },
    {
      id: 'proteccion',
      nombre: 'Protección Radiológica & Dosimetría',
      icono: ShieldCheck,
      descripcion: 'Liderazgo nacional en licenciamiento, física médica y vigilancia ocupacional de radiaciones.',
      color: 'var(--brand-green-dark)',
      items: [
        'Dosimetría Personal Ocupacional (Lecturas OSL / TLD)',
        'Control de Calidad y Verificación de Equipos de Rayos X',
        'Levantamiento Radiométrico y Cálculo Estructural de Blindajes',
        'Medicina Laboral para Personal Ocupacionalmente Expuesto (POE)'
      ]
    }
  ];

  const deptoActual = departamentosPortafolio.find(d => d.id === deptoSeleccionado) || departamentosPortafolio[0];
  const IconoDepto = deptoActual.icono;

  return (
    <div className="portal-ips-container" style={{ color: '#0F172A', background: '#F8FAFC' }}>
      {/* ======================================================== */}
      {/* 1. HERO INSTITUCIONAL SECTOR SALUD */}
      {/* ======================================================== */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #0B3B4B 100%)',
          color: '#FFFFFF',
          padding: '2.4rem 1.25rem 2rem 1.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decoraciones de fondo sutiles */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(54, 176, 193, 0.15) 0%, rgba(153, 200, 93, 0.05) 60%, transparent 80%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ maxWidth: '1160px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Badge Oficial MinSalud */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(153, 200, 93, 0.4)',
              color: '#99c85d',
              fontSize: '0.73rem',
              fontWeight: 700,
              letterSpacing: '0.03em',
              marginBottom: '1rem'
            }}
          >
            <ShieldCheck size={14} color="#99c85d" />
            <span>IPS HABILITADA POR EL MINISTERIO DE SALUD Y PROTECCIÓN SOCIAL • CÓDIGO 0500109842-01</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            <div>
              <h1
                style={{
                  fontSize: 'clamp(1.5rem, 2.4vw, 2.05rem)',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  marginBottom: '0.8rem',
                  letterSpacing: '-0.02em'
                }}
              >
                Atención Médica Integral & Apoyo Diagnóstico con Capacidad Científica
              </h1>

              <p
                style={{
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: '#CBD5E1',
                  maxWidth: '560px',
                  marginBottom: '1.4rem'
                }}
              >
                <b>ARCAL Protección Radiológica S.A.S. (IPS)</b> pone a su disposición consulta médica especializada, estudios cardiovasculares dinámicos, diagnóstico por imágenes y seguridad radiológica con el más alto rigor clínico y trato humanizado.
              </p>

              {/* Botones de Acción Primarios */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className="btn"
                  onClick={onIrControlCitas}
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-green) 0%, var(--brand-green-hover) 100%)',
                    color: '#0B2233',
                    padding: '0.65rem 1.35rem',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    boxShadow: '0 8px 18px -3px rgba(153, 200, 93, 0.45)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  id="btn-hero-ir-control-citas"
                >
                  <Calendar size={17} />
                  <span>Ir al Control de Citas</span>
                </button>

                <button
                  className="btn"
                  onClick={onIrConsulta}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    padding: '0.65rem 1.2rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '1.5px solid rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer'
                  }}
                >
                  <Search size={15} />
                  <span>Consultar Cita por Cédula</span>
                </button>

                <a
                  href="#seccion-pqrs"
                  style={{
                    color: 'var(--brand-cyan)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    textDecoration: 'none',
                    padding: '0.4rem 0.6rem'
                  }}
                >
                  <FileText size={15} />
                  <span>Radicar PQRS</span>
                </a>
              </div>
            </div>

            {/* Tarjeta Resumen Institucional */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '1.4rem',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 16px 32px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.8rem' }}>
                <img
                  src="/arcal-logo.png"
                  alt="IPS ARCAL"
                  style={{ height: '34px', width: 'auto', background: '#FFFFFF', padding: '3px 8px', borderRadius: '7px' }}
                />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Identidad Institucional
                  </div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF' }}>
                    NIT: 901.365.419-8
                  </div>
                </div>
              </div>

              {/* Grid de Métricas Clave */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-cyan)' }}>
                    +10 Años
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
                    Vigilancia y Protección Radiológica
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#99c85d' }}>
                    4 Sedes
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
                    Medellín, Bogotá, Urabá y Ciudad Bolívar
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#EF5E95' }}>
                    6 Áreas
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
                    Especialidades y Apoyo Diagnóstico
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F8FAFC' }}>
                    100% Digital
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
                    Agendamiento y PQRS en Tiempo Real
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.73rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={13} color="#99c85d" />
                <span>Horarios: Lun a Vie 7:00 AM - 5:00 PM | Sáb 8:00 AM - 1:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Barra de Navegación Rápida del Portal */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: '48px',
          zIndex: 40,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div
          style={{
            maxWidth: '1160px',
            margin: '0 auto',
            padding: '0.4rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.8rem',
            overflowX: 'auto'
          }}
        >
          <div style={{ display: 'flex', gap: '0.4rem', whiteSpace: 'nowrap' }}>
            <a
              href="#seccion-servicios"
              className="btn btn-secondary"
              style={{
                fontSize: '0.74rem',
                padding: '0.35rem 0.75rem',
                textDecoration: 'none',
                background: subnavActivo === 'servicios' ? 'var(--brand-cyan-light)' : '#F1F5F9',
                borderColor: subnavActivo === 'servicios' ? 'var(--brand-cyan)' : '#E2E8F0',
                color: subnavActivo === 'servicios' ? 'var(--brand-cyan-dark)' : '#334155',
                fontWeight: subnavActivo === 'servicios' ? 800 : 600
              }}
            >
              <Stethoscope size={14} color="var(--brand-cyan)" />
              <span>Servicios & Especialidades</span>
            </a>
            <a
              href="#seccion-datos-curiosos"
              className="btn btn-secondary"
              style={{
                fontSize: '0.74rem',
                padding: '0.35rem 0.75rem',
                textDecoration: 'none',
                background: subnavActivo === 'curiosos' ? 'var(--brand-green-light)' : '#F1F5F9',
                borderColor: subnavActivo === 'curiosos' ? 'var(--brand-green)' : '#E2E8F0',
                color: subnavActivo === 'curiosos' ? 'var(--brand-green-dark)' : '#334155',
                fontWeight: subnavActivo === 'curiosos' ? 800 : 600
              }}
            >
              <BookOpen size={14} color="var(--brand-green)" />
              <span>Datos Curiosos ({datosCuriosos.length})</span>
            </a>
            <a
              href="#seccion-galeria"
              className="btn btn-secondary"
              style={{
                fontSize: '0.74rem',
                padding: '0.35rem 0.75rem',
                textDecoration: 'none',
                background: subnavActivo === 'galeria' ? '#FDF2F7' : '#F1F5F9',
                borderColor: subnavActivo === 'galeria' ? '#EF5E95' : '#E2E8F0',
                color: subnavActivo === 'galeria' ? '#EF5E95' : '#334155',
                fontWeight: subnavActivo === 'galeria' ? 800 : 600
              }}
            >
              <ImageIcon size={14} color="#EF5E95" />
              <span>Galería Multimedia ({galeriaItems.length})</span>
            </a>
            <a
              href="#seccion-pqrs"
              className="btn btn-secondary"
              style={{
                fontSize: '0.74rem',
                padding: '0.35rem 0.75rem',
                textDecoration: 'none',
                background: subnavActivo === 'pqrs' ? '#FEF3C7' : '#F1F5F9',
                borderColor: subnavActivo === 'pqrs' ? '#D97706' : '#E2E8F0',
                color: subnavActivo === 'pqrs' ? '#D97706' : '#334155',
                fontWeight: subnavActivo === 'pqrs' ? 800 : 600
              }}
            >
              <FileText size={14} color="#D97706" />
              <span>Atención PQRS</span>
            </a>
            <a
              href="#seccion-sedes"
              className="btn btn-secondary"
              style={{
                fontSize: '0.74rem',
                padding: '0.35rem 0.75rem',
                textDecoration: 'none',
                background: subnavActivo === 'sedes' ? 'var(--brand-cyan-light)' : '#F1F5F9',
                borderColor: subnavActivo === 'sedes' ? 'var(--brand-cyan)' : '#E2E8F0',
                color: subnavActivo === 'sedes' ? 'var(--brand-cyan-dark)' : '#334155',
                fontWeight: subnavActivo === 'sedes' ? 800 : 600
              }}
            >
              <Building2 size={14} color="var(--brand-cyan-dark)" />
              <span>Sedes & Contacto</span>
            </a>
          </div>

          <button
            onClick={onIrControlCitas}
            className="btn btn-primary"
            style={{
              padding: '0.38rem 0.95rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, var(--brand-green) 0%, var(--brand-green-hover) 100%)',
              color: '#0B2233',
              border: 'none',
              boxShadow: '0 4px 10px rgba(153, 200, 93, 0.3)'
            }}
          >
            <Calendar size={14} />
            <span>Ir al Control de Citas</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '1.8rem 1.25rem' }}>
        {/* ======================================================== */}
        {/* 2. PORTAFOLIO DE DEPARTAMENTOS Y ESPECIALIDADES MÉDICAS */}
        {/* ======================================================== */}
        <section id="seccion-servicios" style={{ marginBottom: '2.8rem', scrollMarginTop: '110px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--brand-cyan)',
                background: 'var(--brand-cyan-light)',
                padding: '0.28rem 0.75rem',
                borderRadius: '9999px',
                marginBottom: '0.45rem'
              }}
            >
              <Stethoscope size={13} />
              <span>PORTAFOLIO CLÍNICO Y RADIOLÓGICO</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', color: '#0F172A', marginBottom: '0.35rem', fontWeight: 800 }}>
              Departamentos Médicos Habilitados
            </h2>
            <p style={{ color: '#64748B', maxWidth: '650px', margin: '0 auto', fontSize: '0.84rem', lineHeight: 1.55 }}>
              Seleccione un departamento para conocer los procedimientos clínicos, modalidades diagnósticas y agendar su consulta sin desplazamientos innecesarios.
            </p>
          </div>

          {/* Botones de Departamentos */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.5rem',
              marginBottom: '1.2rem'
            }}
          >
            {departamentosPortafolio.map(dep => {
              const Icon = dep.icono;
              const activo = dep.id === deptoSeleccionado;
              return (
                <button
                  key={dep.id}
                  onClick={() => setDeptoSeleccionado(dep.id)}
                  style={{
                    background: activo ? '#FFFFFF' : '#F1F5F9',
                    border: activo ? `2px solid ${dep.color}` : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.65rem 0.65rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: activo ? '0 6px 14px -3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '7px',
                        background: activo ? dep.color : '#CBD5E1',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon size={15} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: activo ? '#0F172A' : '#475569' }}>
                    {dep.nombre}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tarjeta Detalle de Departamento */}
          <div
            className="card-panel"
            style={{
              padding: '1.35rem',
              borderTop: `3.5px solid ${deptoActual.color}`,
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.06)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.9rem', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '11px',
                    background: `${deptoActual.color}15`,
                    color: deptoActual.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconoDepto size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>
                    {deptoActual.nombre}
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '0.15rem 0 0 0' }}>
                    {deptoActual.descripcion}
                  </p>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={onIrControlCitas}
                style={{
                  background: deptoActual.color,
                  borderColor: deptoActual.color,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '0.55rem 1.15rem'
                }}
              >
                <Calendar size={14} /> Agendar Cita en este Departamento
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.6rem' }}>
              {deptoActual.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.55rem 0.8rem',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.8rem',
                    color: '#1E293B'
                  }}
                >
                  <CheckCircle2 size={14} color={deptoActual.color} style={{ flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. DATOS CURIOSOS DE SALUD & BIENESTAR (VIDEOS E IMÁGENES) */}
        {/* ======================================================== */}
        <section id="seccion-datos-curiosos" style={{ marginBottom: '2.8rem', scrollMarginTop: '110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--brand-green-dark)',
                  background: 'var(--brand-green-light)',
                  padding: '0.28rem 0.75rem',
                  borderRadius: '9999px',
                  marginBottom: '0.45rem'
                }}
              >
                <BookOpen size={13} />
                <span>EDUCACIÓN Y CULTURA MÉDICA</span>
              </div>
              <h2 style={{ fontSize: '1.45rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>
                Datos Curiosos de Salud & Bienestar
              </h2>
              <p style={{ color: '#64748B', fontSize: '0.84rem', margin: '0.2rem 0 0 0' }}>
                Cápsulas en video e infografías elaboradas por nuestro comité científico para su cuidado diario.
              </p>
            </div>

            {/* Selector de Categorías de Datos Curiosos */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {categoriasCuriosasDisponibles.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoriaCuriosa(cat)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.74rem',
                    borderRadius: '9999px',
                    border: categoriaCuriosa === cat ? '1px solid var(--brand-green-dark)' : '1px solid #CBD5E1',
                    background: categoriaCuriosa === cat ? 'var(--brand-green)' : '#FFFFFF',
                    color: categoriaCuriosa === cat ? '#0B2233' : '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {cat === 'todos' ? 'Ver Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {datosCuriososFiltrados.length === 0 ? (
            <div className="card-panel" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
              <AlertCircle size={30} color="var(--brand-cyan)" style={{ margin: '0 auto 0.8rem auto' }} />
              <p style={{ fontSize: '0.85rem' }}>No hay datos curiosos publicados en esta categoría actualmente.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.1rem' }}>
              {datosCuriososFiltrados.map(item => {
                const esVideo = item.tipoMedia === 'video';
                return (
                  <div
                    key={item.id}
                    className="card-panel"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '14px',
                      boxShadow: '0 4px 14px -2px rgba(15, 23, 42, 0.07)',
                      transition: 'transform 0.2s ease',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    {/* Contenedor Multimedia (Video o Imagen) */}
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#0F172A', overflow: 'hidden' }}>
                      {esVideo ? (
                        isDirectVideo(item.urlMedia) ? (
                          <video
                            src={item.urlMedia}
                            controls
                            preload="metadata"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <iframe
                            src={formatVideoEmbed(item.urlMedia)}
                            title={item.titulo}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          />
                        )
                      ) : (
                        <img
                          src={item.urlMedia || '/arcal-icon.png'}
                          alt={item.titulo}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}

                      {/* Badge de Categoría y Tipo de Medio */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          display: 'flex',
                          gap: '0.35rem',
                          pointerEvents: 'none'
                        }}
                      >
                        <span
                          style={{
                            background: 'rgba(15, 23, 42, 0.85)',
                            backdropFilter: 'blur(6px)',
                            color: '#FFFFFF',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          {esVideo ? <Video size={12} color="var(--brand-green)" /> : <ImageIcon size={12} color="var(--brand-cyan)" />}
                          <span>{esVideo ? 'Video' : 'Infografía'}</span>
                        </span>

                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.95)',
                            color: '#0F172A',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '5px'
                          }}
                        >
                          {item.categoria}
                        </span>
                      </div>
                    </div>

                    {/* Contenido Textual */}
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <h4
                          style={{
                            fontSize: '0.94rem',
                            color: '#0F172A',
                            fontWeight: 800,
                            lineHeight: 1.35,
                            marginBottom: '0.45rem'
                          }}
                        >
                          {item.titulo}
                        </h4>

                        <p
                          style={{
                            fontSize: '0.81rem',
                            color: '#475569',
                            lineHeight: 1.55,
                            marginBottom: '0.8rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {item.descripcion}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
                          Fuente: {item.fuente || 'IPS ARCAL'}
                        </span>

                        <button
                          onClick={() => setModalElemento({ ...item, tipoSeccion: 'curioso' })}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
                        >
                          <Eye size={13} /> Ver Completo
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* 4. GALERÍA MULTIMEDIA (FOTOS Y VIDEOS CORTOS) */}
        {/* ======================================================== */}
        <section id="seccion-galeria" style={{ marginBottom: '2.8rem', scrollMarginTop: '110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#EF5E95',
                  background: '#FDF2F7',
                  padding: '0.28rem 0.75rem',
                  borderRadius: '9999px',
                  marginBottom: '0.45rem'
                }}
              >
                <ImageIcon size={13} />
                <span>TECNOLOGÍA E INSTALACIONES</span>
              </div>
              <h2 style={{ fontSize: '1.45rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>
                Galería Multimedia
              </h2>
              <p style={{ color: '#64748B', fontSize: '0.84rem', margin: '0.2rem 0 0 0' }}>
                Conozca nuestros equipos de última tecnología, consultorios climatizados y cápsulas audiovisuales breves.
              </p>
            </div>

            {/* Selector de Categorías de Galería */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {categoriasGaleriaDisponibles.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoriaGaleria(cat)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.74rem',
                    borderRadius: '9999px',
                    border: categoriaGaleria === cat ? '1px solid #EF5E95' : '1px solid #CBD5E1',
                    background: categoriaGaleria === cat ? '#EF5E95' : '#FFFFFF',
                    color: categoriaGaleria === cat ? '#FFFFFF' : '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {cat === 'todos' ? 'Ver Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem' }}>
            {galeriaFiltrada.map(g => {
              const esVideo = g.tipoMedia === 'video';
              return (
                <div
                  key={g.id}
                  onClick={() => setModalElemento({ ...g, tipoSeccion: 'galeria' })}
                  style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#0F172A',
                    boxShadow: '0 3px 12px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    aspectRatio: '4/3',
                    border: '1px solid #E2E8F0',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  {esVideo ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'rgba(239, 94, 149, 0.9)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2,
                          boxShadow: '0 0 16px rgba(239, 94, 149, 0.6)'
                        }}
                      >
                        <Play size={18} fill="#FFFFFF" />
                      </div>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.95), rgba(15,23,42,0.4))' }} />
                    </div>
                  ) : (
                    <img
                      src={g.urlMedia}
                      alt={g.titulo}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    />
                  )}

                  {/* Overlay con Información */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '0.85rem',
                      background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.6) 70%, transparent 100%)',
                      color: '#FFFFFF'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          background: esVideo ? '#EF5E95' : 'var(--brand-cyan)'
                        }}
                      >
                        {esVideo ? `Video Corto ${g.duracion ? `• ${g.duracion}` : ''}` : 'Fotografía'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.84rem', fontWeight: 700, margin: 0, color: '#FFFFFF', lineHeight: 1.3 }}>
                      {g.titulo}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. ATENCIÓN AL USUARIO & PQRS OFICIAL (SECTOR SALUD) */}
        {/* ======================================================== */}
        <section id="seccion-pqrs" style={{ marginBottom: '2.8rem', scrollMarginTop: '110px' }}>
          <div className="card-panel" style={{ padding: '1.4rem', borderLeft: '4.5px solid #D97706', boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.3rem' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#D97706',
                    background: '#FEF3C7',
                    padding: '0.28rem 0.75rem',
                    borderRadius: '9999px',
                    marginBottom: '0.45rem'
                  }}
                >
                  <ShieldCheck size={13} />
                  <span>SISTEMA OFICIAL DE ATENCIÓN AL CIUDADANO (SUPERSALUD)</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>
                  Peticiones, Quejas, Reclamos & Sugerencias (PQRS)
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.84rem', margin: '0.2rem 0 0 0' }}>
                  Canal formal para radicar y consultar sus solicitudes conforme a la circular única de la Superintendencia Nacional de Salud.
                </p>
              </div>

              {/* Pestañas de Radicación vs Consulta */}
              <div style={{ display: 'flex', gap: '0.35rem', background: '#F1F5F9', padding: '0.3rem', borderRadius: '8px' }}>
                <button
                  onClick={() => setTabPqrs('radicar')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: tabPqrs === 'radicar' ? '#FFFFFF' : 'transparent',
                    color: tabPqrs === 'radicar' ? '#0F172A' : '#64748B',
                    boxShadow: tabPqrs === 'radicar' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <FileText size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  Radicar Nueva Solicitud
                </button>

                <button
                  onClick={() => setTabPqrs('consultar')}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: tabPqrs === 'consultar' ? '#FFFFFF' : 'transparent',
                    color: tabPqrs === 'consultar' ? '#0F172A' : '#64748B',
                    boxShadow: tabPqrs === 'consultar' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <Search size={13} style={{ display: 'inline', marginRight: '5px' }} />
                  Consultar Radicado
                </button>
              </div>
            </div>

            {/* TAB 1: FORMULARIO DE RADICACIÓN */}
            {tabPqrs === 'radicar' && (
              <div>
                {resultadoRadicacion ? (
                  <div
                    style={{
                      background: 'var(--brand-green-light)',
                      border: '1.5px solid var(--brand-green)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'var(--brand-green)',
                        color: '#0B2233',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.8rem auto'
                      }}
                    >
                      <CheckCircle2 size={26} />
                    </div>

                    <h3 style={{ fontSize: '1.2rem', color: '#0F172A', marginBottom: '0.4rem', fontWeight: 800 }}>
                      Solicitud Radicada Formalmente
                    </h3>

                    <div
                      style={{
                        display: 'inline-block',
                        background: '#FFFFFF',
                        border: '1.5px solid #CBD5E1',
                        borderRadius: '6px',
                        padding: '0.45rem 1.1rem',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: 'var(--brand-cyan-dark)',
                        letterSpacing: '0.04em',
                        marginBottom: '0.8rem'
                      }}
                    >
                      Radicado No: {resultadoRadicacion.radicado}
                    </div>

                    <p style={{ color: '#334155', fontSize: '0.85rem', maxWidth: '600px', margin: '0 auto 1.2rem auto', lineHeight: 1.55 }}>
                      Apreciado(a) <b>{resultadoRadicacion.nombreCompleto}</b>: Su {resultadoRadicacion.tipo.toLowerCase()} ha sido remitida al área de Calidad y Auditoría Médica de IPS ARCAL. El plazo legal reglamentario para su atención es de hasta 15 días hábiles.
                    </p>

                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setResultadoRadicacion(null);
                          setTabPqrs('consultar');
                          setBusquedaPqrs(resultadoRadicacion.radicado);
                        }}
                        style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                      >
                        Ver Estado en Línea
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setResultadoRadicacion(null)}
                        style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                      >
                        Radicar Otra Solicitud
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitPqrs} style={{ width: '100%' }}>
                    {/* Fila 1: Tipo de Solicitud y Nombre Completo */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                          Tipo de Solicitud *
                        </label>
                        <select
                          className="form-input"
                          value={formPqrs.tipo}
                          onChange={e => setFormPqrs({ ...formPqrs, tipo: e.target.value })}
                          required
                          style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem 0.75rem', boxSizing: 'border-box' }}
                        >
                          <option value="Petición">Petición (Solicitud de información o documentos)</option>
                          <option value="Queja">Queja (Inconformidad con la atención recibida)</option>
                          <option value="Reclamo">Reclamo (Insatisfacción por servicio o cobro)</option>
                          <option value="Sugerencia">Sugerencia (Propuesta de mejora en el servicio)</option>
                          <option value="Felicitación">Felicitación (Reconocimiento a personal o sede)</option>
                        </select>
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                          Nombre Completo del Solicitante / Paciente *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Nombres y apellidos completos"
                          value={formPqrs.nombreCompleto}
                          onChange={e => setFormPqrs({ ...formPqrs, nombreCompleto: e.target.value })}
                          required
                          style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem 0.75rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Fila 2: Documento de Identidad y Sede Relacionada */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                          Documento de Identidad *
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '0.5rem' }}>
                          <select
                            className="form-input"
                            value={formPqrs.tipoDocumento}
                            onChange={e => setFormPqrs({ ...formPqrs, tipoDocumento: e.target.value })}
                            style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem 0.5rem', boxSizing: 'border-box' }}
                          >
                            <option value="CC">CC</option>
                            <option value="TI">TI</option>
                            <option value="CE">CE</option>
                            <option value="Pasaporte">Pasaporte</option>
                          </select>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Número de cédula o ID"
                            value={formPqrs.numeroDocumento}
                            onChange={e => setFormPqrs({ ...formPqrs, numeroDocumento: e.target.value })}
                            required
                            style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem 0.75rem', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                          Sede Relacionada (Opcional)
                        </label>
                        <select
                          className="form-input"
                          value={formPqrs.sedeId}
                          onChange={e => setFormPqrs({ ...formPqrs, sedeId: e.target.value })}
                          style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem 0.75rem', boxSizing: 'border-box' }}
                        >
                          <option value="">Seleccione sede...</option>
                          {sedes.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre} ({s.ciudad})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fila 3: Correo Electrónico y Teléfono */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                          Correo Electrónico para Notificación *
                        </label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="ejemplo@correo.com"
                          value={formPqrs.email}
                          onChange={e => setFormPqrs({ ...formPqrs, email: e.target.value })}
                          required
                          style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem 0.75rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                          Teléfono o Celular de Contacto *
                        </label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Número celular de contacto"
                          value={formPqrs.telefono}
                          onChange={e => setFormPqrs({ ...formPqrs, telefono: e.target.value })}
                          required
                          style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem 0.75rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Fila 4: Asunto (100% ancho) */}
                    <div style={{ width: '100%', marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Asunto Concreto de la Solicitud *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: Solicitud de copia de historia clínica / Reconocimiento a especialista"
                        value={formPqrs.asunto}
                        onChange={e => setFormPqrs({ ...formPqrs, asunto: e.target.value })}
                        required
                        style={{ width: '100%', fontSize: '0.82rem', padding: '0.55rem 0.8rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Fila 5: Descripción Detallada (100% ancho del contenedor y espaciosa) */}
                    <div style={{ width: '100%', marginBottom: '1.4rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Descripción Detallada de los Hechos *
                      </label>
                      <textarea
                        className="form-input"
                        rows={6}
                        placeholder="Describa con claridad fechas, lugares, personal involucrado y motivos de su solicitud o sugerencia..."
                        value={formPqrs.descripcion}
                        onChange={e => setFormPqrs({ ...formPqrs, descripcion: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          minWidth: '100%',
                          maxWidth: '100%',
                          minHeight: '140px',
                          fontSize: '0.84rem',
                          padding: '0.75rem 0.85rem',
                          boxSizing: 'border-box',
                          lineHeight: 1.55,
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
                      <div style={{ fontSize: '0.74rem', color: '#64748B', maxWidth: '520px', lineHeight: 1.5 }}>
                        Sus datos están protegidos bajo la Ley de Habeas Data en Salud (Ley 1581 de 2012). Solo serán empleados para la resolución y trazabilidad de su solicitud.
                      </div>

                      <button
                        type="submit"
                        disabled={enviandoPqrs}
                        className="btn btn-primary"
                        style={{
                          background: '#D97706',
                          borderColor: '#D97706',
                          color: '#FFFFFF',
                          padding: '0.65rem 1.6rem',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                        }}
                      >
                        <Send size={15} />
                        <span>{enviandoPqrs ? 'Radicando...' : 'Radicar Solicitud Oficial'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: CONSULTA DE RADICADO */}
            {tabPqrs === 'consultar' && (
              <div>
                <form onSubmit={handleConsultarPqrs} style={{ maxWidth: '520px', margin: '0 auto 1.4rem auto' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem', textAlign: 'center' }}>
                    Ingrese su Número de Radicado (ej: PQRS-2026-0012) o su Cédula
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="PQRS-2026-XXXX o Documento de Identidad"
                      value={busquedaPqrs}
                      onChange={e => setBusquedaPqrs(e.target.value)}
                      required
                      style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                    />
                    <button
                      type="submit"
                      disabled={consultandoPqrs}
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                      <Search size={14} />
                      <span>{consultandoPqrs ? 'Buscando...' : 'Consultar'}</span>
                    </button>
                  </div>
                </form>

                {errorConsulta && (
                  <div className="card-panel" style={{ padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', textAlign: 'center' }}>
                    <AlertCircle size={20} style={{ margin: '0 auto 0.4rem auto' }} />
                    <p style={{ margin: 0, fontSize: '0.82rem' }}>{errorConsulta}</p>
                  </div>
                )}

                {resultadosConsulta && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    {resultadosConsulta.map(pqrs => {
                      const colorEstado =
                        pqrs.estado === 'Respondido' ? '#10B981' :
                        pqrs.estado === 'En trámite' ? '#0284C7' :
                        pqrs.estado === 'Cerrado' ? '#64748B' : '#D97706';

                      return (
                        <div
                          key={pqrs.id}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '11px',
                            padding: '1.1rem',
                            boxShadow: '0 3px 10px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.7rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--brand-cyan-dark)' }}>
                                  {pqrs.radicado}
                                </span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#F1F5F9', color: '#334155' }}>
                                  {pqrs.tipo}
                                </span>
                              </div>
                              <h4 style={{ fontSize: '0.92rem', color: '#0F172A', margin: 0, fontWeight: 700 }}>
                                {pqrs.asunto}
                              </h4>
                            </div>

                            <div
                              style={{
                                background: `${colorEstado}15`,
                                color: colorEstado,
                                border: `1px solid ${colorEstado}`,
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.74rem',
                                fontWeight: 800
                              }}
                            >
                              Estado: {pqrs.estado}
                            </div>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.7rem', lineHeight: 1.55 }}>
                            <b>Descripción:</b> {pqrs.descripcion}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', fontSize: '0.74rem', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '0.6rem' }}>
                            <div><b>Solicitante:</b> {pqrs.nombreCompleto} ({pqrs.tipoDocumento} {pqrs.numeroDocumento})</div>
                            <div><b>Fecha de Radicación:</b> {new Date(pqrs.fechaRadicado).toLocaleDateString()}</div>
                            <div><b>Servicio:</b> {pqrs.servicio}</div>
                          </div>

                          {/* Respuesta Oficial si existe */}
                          {pqrs.respuestaOficial && (
                            <div
                              style={{
                                marginTop: '0.9rem',
                                background: '#F0FDF4',
                                border: '1.5px solid #86EFAC',
                                borderRadius: '8px',
                                padding: '0.9rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 800, fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                                <CheckCircle2 size={15} />
                                <span>Respuesta Oficial Emitida por la Dirección Médica</span>
                              </div>
                              <p style={{ color: '#14532D', fontSize: '0.82rem', margin: 0, lineHeight: 1.55 }}>
                                {pqrs.respuestaOficial}
                              </p>
                              {pqrs.fechaRespuesta && (
                                <div style={{ fontSize: '0.68rem', color: '#15803D', marginTop: '0.4rem', fontWeight: 600 }}>
                                  Emitida el {new Date(pqrs.fechaRespuesta).toLocaleString()} por {pqrs.atendidoPor || 'Auditoría y Calidad'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 6. SEDES DE ATENCIÓN & CANALES DE CONTACTO OFICIALES */}
        {/* ======================================================== */}
        <section id="seccion-sedes" style={{ marginBottom: '2.8rem', scrollMarginTop: '110px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--brand-cyan)',
                background: 'var(--brand-cyan-light)',
                padding: '0.28rem 0.75rem',
                borderRadius: '9999px',
                marginBottom: '0.45rem'
              }}
            >
              <Building2 size={13} />
              <span>COBERTURA GEOGRÁFICA</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', color: '#0F172A', marginBottom: '0.35rem', fontWeight: 800 }}>
              Sedes Físicas & Canales de Contacto
            </h2>
            <p style={{ color: '#64748B', maxWidth: '640px', margin: '0 auto', fontSize: '0.84rem', lineHeight: 1.55 }}>
              Presencia estratégica para garantizar oportunidad en citas presenciales, entrega de reportes y toma de estudios de apoyo diagnóstico.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Sede Poblado Medellín */}
            <div className="card-panel" style={{ padding: '1.1rem', borderTop: '3.5px solid var(--brand-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <Building2 size={17} color="var(--brand-cyan)" />
                <h3 style={{ fontSize: '0.98rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>
                  Sede Medellín El Poblado
                </h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.55, marginBottom: '0.8rem' }}>
                <MapPin size={13} style={{ display: 'inline', marginRight: '3px', color: 'var(--brand-cyan)' }} />
                Calle 19A # 44-25, Torre Médica Salud y Servicios, Piso 22, Cons. 2209
              </p>
              <div style={{ fontSize: '0.76rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.65rem' }}>
                <div><b>PBX Medellín:</b> (604) 604 8956</div>
                <div><b>Celular / WhatsApp:</b> +57 323 230 7453</div>
                <div><b>Horario:</b> Lunes a Viernes 7:30 AM - 5:30 PM</div>
              </div>
            </div>

            {/* Sede Ciudad Bolívar */}
            <div className="card-panel" style={{ padding: '1.1rem', borderTop: '3.5px solid var(--brand-green)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <Building2 size={17} color="var(--brand-green)" />
                <h3 style={{ fontSize: '0.98rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>
                  Sede Ciudad Bolívar
                </h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.55, marginBottom: '0.8rem' }}>
                <MapPin size={13} style={{ display: 'inline', marginRight: '3px', color: 'var(--brand-green)' }} />
                Calle 48 # 48-01 Local 208, Centro Empresarial Privilegio
              </p>
              <div style={{ fontSize: '0.76rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.65rem' }}>
                <div><b>Celular de Contacto:</b> 311 601 0895</div>
                <div><b>Atención Especializada:</b> Consulta programada y ecografía</div>
                <div><b>Horario:</b> Lunes a Viernes 7:00 AM - 4:00 PM</div>
              </div>
            </div>

            {/* Sede Apartadó Urabá */}
            <div className="card-panel" style={{ padding: '1.1rem', borderTop: '3.5px solid #EF5E95' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <Building2 size={17} color="#EF5E95" />
                <h3 style={{ fontSize: '0.98rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>
                  Sede Apartadó (Urabá)
                </h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.55, marginBottom: '0.8rem' }}>
                <MapPin size={13} style={{ display: 'inline', marginRight: '3px', color: '#EF5E95' }} />
                Calle 99 # 105-44, Piso 1, Barrio Ortiz
              </p>
              <div style={{ fontSize: '0.76rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.65rem' }}>
                <div><b>Celular de Atención:</b> 314 826 5325</div>
                <div><b>Servicios:</b> Consulta médica y apoyo diagnóstico</div>
                <div><b>Horario:</b> Lunes a Viernes 7:00 AM - 5:00 PM</div>
              </div>
            </div>

            {/* Sede Bogotá */}
            <div className="card-panel" style={{ padding: '1.1rem', borderTop: '3.5px solid #0284C7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <Building2 size={17} color="#0284C7" />
                <h3 style={{ fontSize: '0.98rem', color: '#0F172A', margin: 0, fontWeight: 800 }}>
                  Sede Principal Bogotá
                </h3>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.55, marginBottom: '0.8rem' }}>
                <MapPin size={13} style={{ display: 'inline', marginRight: '3px', color: '#0284C7' }} />
                Carrera 15 # 118-45, Torre Médica Santa Bárbara, Cons. 402
              </p>
              <div style={{ fontSize: '0.76rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.65rem' }}>
                <div><b>PBX Bogotá:</b> (601) 745 8900</div>
                <div><b>Línea Nacional WhatsApp:</b> +57 310 854 9210</div>
                <div><b>Horario:</b> Lunes a Viernes 7:00 AM - 6:00 PM</div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 7. BANNER FINAL: LLAMADO A LA ACCIÓN (CONTROL DE CITAS) */}
        {/* ======================================================== */}
        <section
          style={{
            background: 'linear-gradient(135deg, #0B2233 0%, #0F3B4B 100%)',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '2.2rem 1.4rem',
            textAlign: 'center',
            boxShadow: '0 12px 28px -5px rgba(11, 34, 51, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '680px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.55rem' }}>
              Gestione su Salud sin Filas ni Esperas Innecesarias
            </h2>
            <p style={{ color: '#CBD5E1', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '1.4rem' }}>
              Reserve su consulta médica o examen diagnóstico con disponibilidad en tiempo real, confirmación inmediata y comprobante oficial con código de radicado y recomendaciones clínicas.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn"
                onClick={onIrControlCitas}
                style={{
                  background: 'linear-gradient(135deg, var(--brand-green) 0%, var(--brand-green-hover) 100%)',
                  color: '#0B2233',
                  padding: '0.7rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  boxShadow: '0 6px 16px rgba(153, 200, 93, 0.4)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Calendar size={17} />
                <span>Ir al Control de Citas Ahora</span>
              </button>

              <button
                className="btn"
                onClick={onIrConsulta}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  padding: '0.7rem 1.3rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer'
                }}
              >
                <Search size={15} style={{ display: 'inline', marginRight: '5px' }} />
                Consultar Cita Agendada
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ======================================================== */}
      {/* MODAL DETALLE DE ELEMENTO MULTIMEDIA */}
      {/* ======================================================== */}
      {modalElemento && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setModalElemento(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              maxWidth: '680px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.2rem', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '5px',
                    background: modalElemento.tipoMedia === 'video' ? '#FDF2F7' : 'var(--brand-cyan-light)',
                    color: modalElemento.tipoMedia === 'video' ? '#EF5E95' : 'var(--brand-cyan-dark)'
                  }}
                >
                  {modalElemento.tipoMedia === 'video' ? 'Video Informativo' : 'Fotografía'}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                  {modalElemento.categoria}
                </span>
              </div>

              <button
                onClick={() => setModalElemento(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '3px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Reproductor / Visor de Medio */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#0F172A' }}>
              {modalElemento.tipoMedia === 'video' ? (
                isDirectVideo(modalElemento.urlMedia) ? (
                  <video
                    src={modalElemento.urlMedia}
                    controls
                    autoPlay
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <iframe
                    src={formatVideoEmbed(modalElemento.urlMedia)}
                    title={modalElemento.titulo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                )
              ) : (
                <img
                  src={modalElemento.urlMedia}
                  alt={modalElemento.titulo}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>

            {/* Información y Descripción Completa */}
            <div style={{ padding: '1.1rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#0F172A', fontWeight: 800, marginBottom: '0.45rem' }}>
                {modalElemento.titulo}
              </h3>
              <p style={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.55, marginBottom: '0.7rem' }}>
                {modalElemento.descripcion}
              </p>
              {modalElemento.fuente && (
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                  Fuente de información: {modalElemento.fuente}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

