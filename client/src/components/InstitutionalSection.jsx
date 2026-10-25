import React, { useState } from 'react';
import {
  Shield, Target, Award, CheckCircle2, Stethoscope, HeartPulse,
  Activity, Sparkles, ArrowRight, Building2, ChevronDown, ChevronUp,
  FileText, Scissors, Bone, Ear, Salad, Brain, Baby, Droplets, Wind
} from 'lucide-react';

export default function InstitutionalSection({ onAgendarClick }) {
  const [activeDepartmentTab, setActiveDepartmentTab] = useState('Consulta Médica Especializada');

  const departamentosPortafolio = [
    {
      id: 'Consulta Médica Especializada',
      nombre: 'Consulta Médica Especializada',
      icono: Stethoscope,
      badgeColor: 'var(--brand-cyan)',
      descripcion: 'Atención diagnóstica y terapéutica de alto nivel con especialistas calificados.',
      items: [
        'Hola',
        'Cardiología',
        'Medicina Interna',
        'Pediatría',
        'Dermatología',
        'Cirugía General',
        'Ortopedia y Traumatología',
        'Otorrinolaringología',
        'Ginecología',
        'Obstetricia',
        'Urología',
        'Hematología',
        'Reumatología, entre otras'
      ]
    },
    {
      id: 'Consulta Medicina General',
      nombre: 'Consulta Medicina General & Bienestar',
      icono: Salad,
      badgeColor: 'var(--brand-green)',
      descripcion: 'Cuidado primario de la salud, prevención integral y apoyo terapéutico humanizado.',
      items: [
        'Medicina General Integral',
        'Nutrición y Dietética',
        'Psicología Clínica',
        'Terapia Respiratoria'
      ]
    },
    {
      id: 'Diagnóstico Vascular',
      nombre: 'Diagnóstico Vascular & Cardíaco',
      icono: HeartPulse,
      badgeColor: '#E11D48',
      descripcion: 'Monitoreo dinámico y estudios no invasivos de función cardiovascular con tecnología digital.',
      items: [
        'Electrocardiograma de ritmo o superficie (12 derivaciones)',
        'Ecocardiograma transtorácico de alta resolución',
        'Electrocardiografía dinámica (Holter de 24 horas)',
        'Monitoreo ambulatorio de presión arterial (MAPA 24 horas)'
      ]
    },
    {
      id: 'Procedimientos Menores',
      nombre: 'Procedimientos Menores Especializados',
      icono: Scissors,
      badgeColor: '#D97706',
      descripcion: 'Intervenciones ambulatorias seguras realizadas en salas de procedimientos dotadas.',
      items: [
        'Procedimientos menores de Otorrino: Nasolaringoscopia, Biopsias, Lavado y curación de oídos',
        'Procedimientos menores Dermatológicos: Biopsias, Onicectomía, Matricectomía parcial/total, Crioterapia, Infiltraciones',
        'Procedimientos menores de Urología: Fulguración de lesiones uretrales, Cistoscopia transureteral',
        'Procedimientos menores de Ortopedia: Infiltraciones articulares, Onicectomía, Retiro de pines y material ortopédico'
      ]
    },
    {
      id: 'Imágenes Diagnósticas & Ecografía',
      nombre: 'Imágenes Diagnósticas & Ecografía',
      icono: Activity,
      badgeColor: 'var(--brand-cyan-dark)',
      descripcion: 'Ecografía especializada de alta definición y radiología digital convencional.',
      items: [
        'Ecografía General, Abdominal, Pélvica y Renal',
        'Ecografía Doppler Vascular arterial y venoso',
        'Ecografía Obstétrica de detalle anatómico',
        'Radiología Digital Convencional y Rayos X de baja dosis'
      ]
    },
    {
      id: 'Protección Radiológica & Dosimetría',
      nombre: 'Protección Radiológica & Dosimetría Ocupacional',
      icono: Shield,
      badgeColor: 'var(--brand-green-dark)',
      descripcion: 'Líderes en vigilancia radiológica ocupacional, licenciamiento y seguridad en Colombia.',
      items: [
        'Dosimetría Personal Ocupacional (OSL / TLD)',
        'Control de Calidad de Equipos Generadores de Rayos X',
        'Levantamiento Radiométrico y Cálculo de Blindajes',
        'Medicina Laboral para Personal Ocupacionalmente Expuesto (POE)'
      ]
    }
  ];

  const depSeleccionado = departamentosPortafolio.find(d => d.id === activeDepartmentTab) || departamentosPortafolio[0];
  const IconoDep = depSeleccionado.icono;

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* Encabezado Institucional */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="hero-badge" style={{ margin: '0 auto 0.6rem auto', display: 'inline-flex' }}>
          <Shield size={14} color="var(--brand-green)" />
          IDENTIDAD INSTITUCIONAL & PORTAFOLIO OFICIAL
        </div>
        <h2 style={{ fontSize: '1.9rem', color: 'var(--primary-900)', marginBottom: '0.4rem' }}>
          ARCAL Protección Radiológica IPS
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Prestamos servicios de salud integral con capacidad científica, técnica y administrativa, con un amplio portafolio y un equipo humano enfocado en su bienestar y seguridad.
        </p>
      </div>

      {/* Grid de Misión, Visión y Política Institucional */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* MISIÓN */}
        <div
          className="card-panel"
          style={{
            borderTop: '4px solid var(--brand-green)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', opacity: 0.06, pointerEvents: 'none' }}>
            <Shield size={140} color="var(--brand-green)" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--brand-green-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-green-dark)'
                }}
              >
                <Target size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-green-dark)' }}>
                  Propósito Fundamental
                </span>
                <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--primary-900)' }}>MISIÓN</h3>
              </div>
            </div>

            <p style={{ color: '#334155', fontSize: '0.92rem', lineHeight: '1.7', textAlign: 'justify' }}>
              Prestar servicios de salud integral enfocados en el bienestar de las personas, brindando atención con calidad, seguridad, confiabilidad, tecnología avanzada y un personal altamente calificado con trato humanizado.
            </p>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '0.8rem', borderTop: '1px dashed var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-green-dark)', fontSize: '0.8rem', fontWeight: 700 }}>
            <CheckCircle2 size={16} />
            <span>Atención con calidad y trato humanizado</span>
          </div>
        </div>

        {/* VISIÓN */}
        <div
          className="card-panel"
          style={{
            borderTop: '4px solid var(--brand-cyan)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', opacity: 0.06, pointerEvents: 'none' }}>
            <Sparkles size={140} color="var(--brand-cyan)" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--brand-cyan-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-cyan)'
                }}
              >
                <Sparkles size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-cyan)' }}>
                  Horizonte Estratégico
                </span>
                <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--primary-900)' }}>VISIÓN 2028</h3>
              </div>
            </div>

            <p style={{ color: '#334155', fontSize: '0.92rem', lineHeight: '1.7', textAlign: 'justify' }}>
              Ser para el 2028 una empresa reconocida a nivel nacional por la excelencia en la prestación de Servicios Integrales en Salud, con capacidad científica, técnica y administrativa. Contando con un amplio portafolio, brindando confiabilidad a nuestros usuarios y aliados estratégicos.
            </p>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '0.8rem', borderTop: '1px dashed var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-cyan)', fontSize: '0.8rem', fontWeight: 700 }}>
            <CheckCircle2 size={16} />
            <span>Reconocimiento nacional y amplio portafolio</span>
          </div>
        </div>

        {/* POLÍTICA INSTITUCIONAL */}
        <div
          className="card-panel"
          style={{
            borderTop: '4px solid var(--brand-pink)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ position: 'absolute', top: '-15px', right: '-15px', opacity: 0.06, pointerEvents: 'none' }}>
            <Award size={140} color="var(--brand-pink)" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--brand-pink-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-pink-hover)'
                }}
              >
                <Award size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand-pink-hover)' }}>
                  Compromiso de Calidad
                </span>
                <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--primary-900)' }}>POLÍTICA INSTITUCIONAL</h3>
              </div>
            </div>

            <p style={{ color: '#334155', fontSize: '0.88rem', lineHeight: '1.65', textAlign: 'justify' }}>
              En ARCAL estamos comprometidos en la integralidad en la prestación de los servicios de salud con calidad, capacidad científica, técnica, administrativa y enfocados en el bienestar de nuestros usuarios para satisfacer sus necesidades, con calidez en la atención y el profesionalismo del talento humano, por ello desarrollamos procesos basados en la planificación y el mejoramiento continúo articulados con el Sistema de Gestión de Calidad.
            </p>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '0.8rem', borderTop: '1px dashed var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-pink-hover)', fontSize: '0.8rem', fontWeight: 700 }}>
            <CheckCircle2 size={16} />
            <span>Sistema de Gestión de Calidad articulado</span>
          </div>
        </div>
      </div>

      {/* PORTAFOLIO DE SERVICIOS POR DEPARTAMENTOS */}
      <div className="card-panel" style={{ padding: '2rem', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Portafolio de Servicios ARCAL
            </span>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-900)', margin: '0.2rem 0' }}>
              Estructura por Departamentos de Salud
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              Seleccione un departamento para conocer todas las especialidades y procedimientos disponibles para agendamiento:
            </p>
          </div>

          {onAgendarClick && (
            <button
              className="btn btn-accent"
              onClick={onAgendarClick}
              style={{ padding: '0.65rem 1.2rem', fontSize: '0.88rem', fontWeight: 700 }}
            >
              Agendar Cita en este Departamento <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* Pestañas de Departamentos */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
          {departamentosPortafolio.map(dep => {
            const isSelected = activeDepartmentTab === dep.id;
            const Icon = dep.icono;
            return (
              <button
                key={dep.id}
                onClick={() => setActiveDepartmentTab(dep.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  border: isSelected ? `2px solid ${dep.badgeColor}` : '1px solid var(--border-light)',
                  background: isSelected ? 'white' : 'var(--bg-subtle)',
                  color: isSelected ? 'var(--primary-900)' : '#475569',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} color={isSelected ? dep.badgeColor : '#64748B'} />
                <span>{dep.nombre}</span>
              </button>
            );
          })}
        </div>

        {/* Detalle del Departamento Seleccionado */}
        <div style={{ background: 'var(--bg-main)', borderRadius: '14px', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.8rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <IconoDep size={22} color={depSeleccionado.badgeColor} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', color: 'var(--primary-900)', margin: 0 }}>
                {depSeleccionado.nombre}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                {depSeleccionado.descripcion}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.8rem', marginTop: '1.2rem' }}>
            {depSeleccionado.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  padding: '0.8rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: depSeleccionado.badgeColor,
                    flexShrink: 0
                  }}
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
