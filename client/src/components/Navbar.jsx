import React, { useState, useEffect } from 'react';
import {
  Calendar, Building2, ShieldCheck, Search, Phone,
  MessageSquare, Activity, LogIn, LogOut, UserCheck, ShieldAlert,
  BookOpen, Image as ImageIcon, FileText
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, usuarioActual, onOpenLogin, onLogout }) {
  const [seccionActiva, setSeccionActiva] = useState('inicio');

  // ScrollSpy para actualizar pestaña activa según la sección visible
  useEffect(() => {
    if (activeTab !== 'portal') return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const threshold = 180;
          const pqrsEl = document.getElementById('seccion-pqrs');
          const galeriaEl = document.getElementById('seccion-galeria');
          const curiososEl = document.getElementById('seccion-datos-curiosos');

          if (pqrsEl && pqrsEl.getBoundingClientRect().top <= threshold) {
            setSeccionActiva('pqrs');
          } else if (galeriaEl && galeriaEl.getBoundingClientRect().top <= threshold) {
            setSeccionActiva('galeria');
          } else if (curiososEl && curiososEl.getBoundingClientRect().top <= threshold) {
            setSeccionActiva('datos-curiosos');
          } else {
            setSeccionActiva('inicio');
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [activeTab]);

  // Navegación fluida hacia secciones del portal institucional
  function irASeccion(seccionId, idClave) {
    if (idClave) setSeccionActiva(idClave);

    const scrollTarget = () => {
      if (seccionId === 'inicio' || seccionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(seccionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (activeTab !== 'portal') {
      setActiveTab('portal');
      setTimeout(scrollTarget, 100);
    } else {
      scrollTarget();
    }
  }

  return (
    <>
      {/* Top Banner Oficial */}
      <div className="top-notice-bar">
        <div className="top-notice-item">
          <ShieldCheck size={14} color="var(--primary-700)" />
          <span><b>ARCAL Protección Radiológica S.A.S. (IPS)</b> — NIT: 901.365.419-8 | Habilitación MinSalud: 0500109842-01</span>
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <div className="top-notice-item">
            <Phone size={13} color="var(--primary-700)" />
            <span>PBX Medellín: (604) 604 8956</span>
          </div>
          <div className="top-notice-item">
            <MessageSquare size={13} color="var(--brand-green)" />
            <span>WhatsApp Citas: +57 310 854 9210</span>
          </div>
        </div>
      </div>

      {/* Header Principal */}
      <header className="header-main">
        <div className="header-container">
          <div
            className="brand-wrapper"
            onClick={() => {
              if (usuarioActual?.rol === 'agente') {
                setActiveTab('presencial');
              } else if (usuarioActual?.rol === 'admin' || usuarioActual?.rol === 'superadmin') {
                setActiveTab('admin');
              } else {
                setActiveTab('portal');
                setSeccionActiva('inicio');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            title="ARCAL Protección Radiológica IPS"
          >
            <img
              src="/arcal-logo.png"
              alt="ARCAL Protección Radiológica IPS"
              className="brand-logo-img"
            />
            <div className="brand-info">
              <div className="brand-subtitle">
                {usuarioActual
                  ? (usuarioActual.rol === 'superadmin'
                    ? 'Dirección General — Super Administrador'
                    : usuarioActual.rol === 'admin'
                      ? 'Administración General del Sistema'
                      : 'Atención al Cliente & Recepción')
                  : 'Portal Oficial & Apoyo Diagnóstico'}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '2px', alignItems: 'center' }}>
                <span className="brand-tag">Apoyo Diagnóstico</span>
                <span className="brand-tag" style={{ background: 'var(--brand-green-light)', color: 'var(--brand-green-dark)', borderColor: 'rgba(140, 198, 63, 0.35)' }}>
                  Protección Radiológica
                </span>
              </div>
            </div>
          </div>

          {/* Menú de Navegación según Rol */}
          <nav className="nav-tabs-wrapper" aria-label="Módulos del Sistema">
            {/* VISTA 1: PÚBLICA (PACIENTES / USUARIOS SIN SESIÓN INICIADA) */}
            {!usuarioActual && (
              <>
                <button
                  className={`nav-tab-btn ${activeTab === 'portal' && seccionActiva === 'inicio' ? 'active' : ''}`}
                  onClick={() => irASeccion('inicio', 'inicio')}
                  id="tab-inicio"
                >
                  <ShieldCheck size={16} />
                  <span>Inicio</span>
                </button>

                <button
                  className={`nav-tab-btn ${activeTab === 'portal' && seccionActiva === 'datos-curiosos' ? 'active' : ''}`}
                  onClick={() => irASeccion('seccion-datos-curiosos', 'datos-curiosos')}
                  id="tab-datos-curiosos"
                >
                  <BookOpen size={16} />
                  <span>Datos Curiosos</span>
                </button>

                <button
                  className={`nav-tab-btn ${activeTab === 'portal' && seccionActiva === 'galeria' ? 'active' : ''}`}
                  onClick={() => irASeccion('seccion-galeria', 'galeria')}
                  id="tab-galeria"
                >
                  <ImageIcon size={16} />
                  <span>Galería Multimedia</span>
                </button>

                <button
                  className={`nav-tab-btn ${activeTab === 'portal' && seccionActiva === 'pqrs' ? 'active' : ''}`}
                  onClick={() => irASeccion('seccion-pqrs', 'pqrs')}
                  id="tab-pqrs"
                >
                  <FileText size={16} />
                  <span>PQRS</span>
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('web')}
                  style={{
                    background: activeTab === 'web'
                      ? 'linear-gradient(135deg, var(--brand-green-hover) 0%, var(--brand-green-dark) 100%)'
                      : 'linear-gradient(135deg, var(--brand-green) 0%, var(--brand-green-hover) 100%)',
                    color: '#0B2233',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    padding: '0.45rem 1.1rem',
                    borderRadius: '10px',
                    boxShadow: activeTab === 'web'
                      ? '0 0 0 2px #FFFFFF, 0 0 0 4px var(--brand-green)'
                      : '0 4px 12px rgba(153, 200, 93, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    border: 'none',
                    cursor: 'pointer',
                    marginLeft: '0.4rem',
                    whiteSpace: 'nowrap'
                  }}
                  id="btn-ir-control-citas-navbar"
                  title="Ir al sistema de agendamiento y control de citas"
                >
                  <Calendar size={15} />
                  <span>Ir al Control de Citas</span>
                </button>
              </>
            )}

            {/* VISTA 2: AGENTE DE ATENCIÓN AL CLIENTE */}
            {usuarioActual && usuarioActual.rol === 'agente' && (
              <>
                <button
                  className={`nav-tab-btn ${activeTab === 'presencial' ? 'active' : ''}`}
                  onClick={() => setActiveTab('presencial')}
                  id="tab-presencial-agente"
                >
                  <Building2 size={16} />
                  <span>Recepción Presencial</span>
                </button>

                <button
                  className={`nav-tab-btn ${activeTab === 'consulta' ? 'active' : ''}`}
                  onClick={() => setActiveTab('consulta')}
                  id="tab-consultar-cita-agente"
                >
                  <Search size={16} />
                  <span>Consultar Citas</span>
                </button>

                <button
                  className={`nav-tab-btn ${activeTab === 'portal' ? 'active' : ''}`}
                  onClick={() => setActiveTab('portal')}
                  id="tab-portal-agente"
                >
                  <ShieldCheck size={16} />
                  <span>Ver Portal Web</span>
                </button>

                <button
                  className={`nav-tab-btn ${activeTab === 'web' ? 'active' : ''}`}
                  onClick={() => setActiveTab('web')}
                  id="tab-web-agente"
                >
                  <Calendar size={16} />
                  <span>Control de Citas</span>
                </button>
              </>
            )}

            {/* VISTA 3: ADMINISTRADOR GENERAL O SUPER ADMIN */}
            {usuarioActual && (usuarioActual.rol === 'admin' || usuarioActual.rol === 'superadmin') && (
              <>
                <button
                  className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admin')}
                  id="tab-admin-ips"
                  style={usuarioActual.rol === 'superadmin' ? { borderBottomColor: '#7C3AED' } : {}}
                >
                  <ShieldCheck size={16} color={usuarioActual.rol === 'superadmin' ? '#7C3AED' : undefined} />
                  <span>{usuarioActual.rol === 'superadmin' ? 'Panel Super Admin' : 'Panel de Administración'}</span>
                </button>

                <button
                  className={`nav-tab-btn ${activeTab === 'presencial' ? 'active' : ''}`}
                  onClick={() => setActiveTab('presencial')}
                  id="tab-presencial-supervision"
                >
                  <Building2 size={16} />
                  <span>Recepción Presencial</span>
                </button>

                <button
                  className={`nav-tab-btn ${activeTab === 'portal' ? 'active' : ''}`}
                  onClick={() => setActiveTab('portal')}
                  id="tab-portal-admin"
                >
                  <ShieldCheck size={16} />
                  <span>Ver Portal Web</span>
                </button>

                <button
                  className={`nav-tab-btn ${activeTab === 'web' ? 'active' : ''}`}
                  onClick={() => setActiveTab('web')}
                  id="tab-web-admin"
                >
                  <Calendar size={16} />
                  <span>Control de Citas</span>
                </button>

                <button
                  className={`nav-tab-btn ${activeTab === 'consulta' ? 'active' : ''}`}
                  onClick={() => setActiveTab('consulta')}
                  id="tab-consultar-cita-admin"
                >
                  <Search size={16} />
                  <span>Consultar Citas</span>
                </button>
              </>
            )}
          </nav>

          {/* Bloque de Sesión / Botón Login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {!usuarioActual ? (
              <button
                className="btn btn-secondary"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1.5px solid var(--brand-cyan)',
                  color: 'var(--brand-cyan-dark)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '0.5rem 0.9rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onClick={onOpenLogin}
                id="btn-login-colaboradores"
              >
                <LogIn size={15} color="var(--brand-cyan)" />
                <span>Acceso Empleados</span>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{
                  background: usuarioActual.rol === 'superadmin' ? 'linear-gradient(135deg, #FAF5FF 0%, #EDE9FE 100%)' : 'rgba(255, 255, 255, 0.9)',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '10px',
                  border: usuarioActual.rol === 'superadmin' ? '1.5px solid #C4B5FD' : '1px solid #CBD5E1',
                  textAlign: 'right',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ fontWeight: 800, color: usuarioActual.rol === 'superadmin' ? 'black' : '#0F172A' }}>
                    {usuarioActual.nombre}
                  </div>
                  <div style={{
                    fontSize: '0.68rem',
                    color: usuarioActual.rol === 'superadmin' ? 'var(--primary-700)' : (usuarioActual.rol === 'admin' ? '#028090' : '#D97706'),
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}>
                    {usuarioActual.rol === 'superadmin' ? 'Super Administrador' : (usuarioActual.rol === 'admin' ? 'Administrador General' : (usuarioActual.cargo || 'Agente de Atención'))}
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', color: '#991B1B', background: '#FEE2E2', borderColor: '#FECACA' }}
                  onClick={onLogout}
                  title="Cerrar sesión"
                  id="btn-logout"
                >
                  <LogOut size={14} />
                  <span>Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
