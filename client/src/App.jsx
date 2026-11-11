import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PortalWebIPS from './components/PortalWebIPS';
import WebBookingWizard from './components/WebBookingWizard';
import PresencialBooking from './components/PresencialBooking';
import AdminDashboard from './components/AdminDashboard';
import AppointmentLookup from './components/AppointmentLookup';
import LoginModal from './components/LoginModal';
import { ShieldCheck, Phone, MapPin, Mail, Clock, ExternalLink } from 'lucide-react';
import { api } from './services/api';

export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(() => {
    try {
      const saved = localStorage.getItem('ips_arcal_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTabState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const vista = params.get('vista');
    if (vista === 'control-citas' || vista === 'web') {
      return 'web';
    }
    if (vista === 'consulta') {
      return 'consulta';
    }
    try {
      const saved = localStorage.getItem('ips_arcal_user');
      if (saved) {
        const u = JSON.parse(saved);
        return (u.rol === 'admin' || u.rol === 'superadmin') ? 'admin' : 'presencial';
      }
    } catch { }
    // Portal institucional como página web principal
    return 'portal';
  });

  function setActiveTab(nuevoTab) {
    setActiveTabState(nuevoTab);
    try {
      const url = new URL(window.location.href);
      if (nuevoTab === 'web') {
        url.searchParams.set('vista', 'control-citas');
      } else if (nuevoTab === 'consulta') {
        url.searchParams.set('vista', 'consulta');
      } else {
        url.searchParams.delete('vista');
      }
      window.history.replaceState({}, '', url.toString());
    } catch { }
  }

  function abrirControlCitasNuevaPestana() {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('vista', 'control-citas');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [sedesFooter, setSedesFooter] = useState([]);

  async function cargarSedesFooter() {
    try {
      const res = await api.getSedes();
      setSedesFooter(res.data || []);
    } catch {
      // Silencioso en caso de fallo de red temporal
    }
  }

  useEffect(() => {
    cargarSedesFooter();
  }, [activeTab]);

  function handleLoginSuccess(user) {
    setUsuarioActual(user);
    localStorage.setItem('ips_arcal_user', JSON.stringify(user));
    if (user.rol === 'admin' || user.rol === 'superadmin') {
      setActiveTab('admin');
    } else {
      setActiveTab('presencial');
    }
  }

  function handleLogout() {
    setUsuarioActual(null);
    localStorage.removeItem('ips_arcal_user');
    setActiveTab('portal');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de Navegación Oficial con Gestión de Roles */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        usuarioActual={usuarioActual}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Contenido Principal según Vista y Rol */}
      <main style={{ flex: 1 }} className={activeTab === 'portal' ? 'portal-wrapper' : 'main-wrapper'}>
        {activeTab === 'portal' && (
          <PortalWebIPS
            onIrControlCitas={abrirControlCitasNuevaPestana}
            onIrConsulta={() => setActiveTab('consulta')}
          />
        )}
        {activeTab === 'web' && (
          <WebBookingWizard onVerInstitucional={() => setActiveTab('portal')} />
        )}
        {activeTab === 'institucional' && (
          <PortalWebIPS
            onIrControlCitas={abrirControlCitasNuevaPestana}
            onIrConsulta={() => setActiveTab('consulta')}
          />
        )}
        {activeTab === 'consulta' && (
          <AppointmentLookup
            usuarioActual={usuarioActual}
            onAgendarClick={() => setActiveTab('web')}
          />
        )}
        {activeTab === 'presencial' && (
          <PresencialBooking usuarioActual={usuarioActual} onOpenLogin={() => setLoginModalOpen(true)} />
        )}
        {activeTab === 'admin' && (
          <AdminDashboard
            usuarioActual={usuarioActual}
            onOpenLogin={() => setLoginModalOpen(true)}
            onSedesChange={cargarSedesFooter}
          />
        )}
      </main>

      {/* Modal de Inicio de Sesión para Colaboradores */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Pie de Página Institucional */}
      <footer className="footer-main">
        {/* Banner Oficial de Vigilancia MinSalud & Supersalud */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.8rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                background: 'rgba(153, 200, 93, 0.15)',
                border: '1px solid rgba(153, 200, 93, 0.35)',
                color: '#99c85d',
                padding: '0.35rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                  INSTITUCIÓN PRESTADORA DE SERVICIOS DE SALUD VIGILADA POR MINSALUD
                </div>
                <div style={{ fontSize: '0.73rem', color: '#CBD5E1' }}>
                  Vigilada por el Ministerio de Salud y Protección Social de Colombia y la Superintendencia Nacional de Salud (Supersalud)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#99c85d',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.22rem 0.65rem',
                borderRadius: '6px'
              }}>
                Habilitación MinSalud: 0500109842-01
              </span>
              <span style={{
                background: 'rgba(54, 176, 193, 0.15)',
                border: '1px solid rgba(54, 176, 193, 0.3)',
                color: 'var(--brand-cyan)',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.22rem 0.65rem',
                borderRadius: '6px'
              }}>
                Vigilado Supersalud
              </span>
            </div>
          </div>
        </div>

        <div className="footer-container">
          <div>
            <div style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img
                src="/arcal-logo.png"
                alt="ARCAL Protección Radiológica IPS"
                style={{ height: '36px', width: 'auto', background: 'rgba(255,255,255,0.95)', padding: '4px 10px', borderRadius: '8px' }}
              />
            </div>
            <h3 style={{ color: '#FFFFFF', fontSize: '1.05rem', marginBottom: '0.4rem', fontWeight: 800 }}>
              ARCAL PROTECCIÓN RADIOLÓGICA S.A.S. (IPS)
            </h3>
            <p style={{ color: '#E2E8F0', fontSize: '0.78rem', lineHeight: '1.5', maxWidth: '460px' }}>
              Institución Prestadora de Servicios de Salud y Apoyo Diagnóstico. Comprometidos con la integralidad en la prestación de servicios de salud con calidad, capacidad científica, técnica y administrativa con trato humanizado. Habilitada por el Ministerio de Salud y Protección Social.
            </p>
            <div style={{ marginTop: '0.7rem', fontSize: '0.75rem', color: '#99c85d', fontWeight: 700 }}>
              Habilitación MinSalud: 0500109842-01 • NIT: 901.365.419-8 • Vigilado MinSalud y Supersalud
            </div>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.88rem', marginBottom: '0.6rem', fontWeight: 700, borderBottom: '2px solid var(--brand-cyan)', display: 'inline-block', paddingBottom: '3px' }}>
              Departamentos & Portafolio
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.76rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li>• Consulta Médica Especializada</li>
              <li>• Consulta Medicina General & Terapias</li>
              <li>• Diagnóstico Vascular (Holter, MAPA, EKG, Eco)</li>
              <li>• Procedimientos Menores (Otorrino, Derma, Uro, Orto)</li>
              <li>• Ecografía Especializada & Doppler Vascular</li>
              <li>• Radiología Digital Convencional</li>
              <li>• Protección Radiológica & Dosimetría Ocupacional</li>
              <li>• Medicina Laboral & Seguridad Radiológica (POE)</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.88rem', marginBottom: '0.6rem', fontWeight: 700, borderBottom: '2px solid var(--brand-green)', display: 'inline-block', paddingBottom: '3px' }}>
              Sedes de Atención & Contacto
            </h4>
            <div style={{ fontSize: '0.76rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {sedesFooter
                .filter(s => s.activa !== false && s.mostrarEnWeb !== false)
                .map(sede => (
                  <div key={sede.id}>
                    <b style={{ color: '#FFFFFF' }}>{sede.nombre}:</b><br />
                    {sede.direccion}
                    {sede.telefono ? ` • Tel: ${sede.telefono}` : ''}
                    {sede.whatsapp ? ` • WhatsApp: ${sede.whatsapp}` : ''}
                  </div>
                ))}
              <div>
                <b style={{ color: '#FFFFFF' }}>WhatsApp Citas Nacional:</b> <span style={{ color: '#99c85d', fontWeight: 700 }}>+57 310 854 9210</span><br />
                <b>Correo:</b> contacto@arcal.com.co
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Horario General: Lunes a Viernes 7:00 AM - 5:00 PM | Sábados 8:00 AM - 1:00 PM
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div style={{ fontSize: '0.73rem' }}>
            © {new Date().getFullYear()} ARCAL Protección Radiológica S.A.S. (IPS) — NIT: 901.365.419-8 — Todos los derechos reservados.
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>
            Página Web Oficial Vigilada por el <b>Ministerio de Salud y Protección Social</b> y la <b>Supersalud</b>
          </div>
        </div>
      </footer>
    </div>
  );
}
