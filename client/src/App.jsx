import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WebBookingWizard from './components/WebBookingWizard';
import PresencialBooking from './components/PresencialBooking';
import AdminDashboard from './components/AdminDashboard';
import AppointmentLookup from './components/AppointmentLookup';
import LoginModal from './components/LoginModal';
import InstitutionalSection from './components/InstitutionalSection';
import { ShieldCheck, Phone, MapPin, Mail, Clock, ExternalLink } from 'lucide-react';

export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(() => {
    try {
      const saved = localStorage.getItem('ips_arcal_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('ips_arcal_user');
      if (saved) {
        const u = JSON.parse(saved);
        return (u.rol === 'admin' || u.rol === 'superadmin') ? 'admin' : 'presencial';
      }
    } catch { }
    return 'web';
  });

  const [loginModalOpen, setLoginModalOpen] = useState(false);

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
    setActiveTab('web');
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
      <main className="main-wrapper" style={{ flex: 1 }}>
        {activeTab === 'web' && (
          <WebBookingWizard onVerInstitucional={() => setActiveTab('institucional')} />
        )}
        {activeTab === 'institucional' && (
          <InstitutionalSection onAgendarClick={() => setActiveTab('web')} />
        )}
        {activeTab === 'consulta' && <AppointmentLookup />}
        {activeTab === 'presencial' && (
          <PresencialBooking usuarioActual={usuarioActual} onOpenLogin={() => setLoginModalOpen(true)} />
        )}
        {activeTab === 'admin' && (
          <AdminDashboard usuarioActual={usuarioActual} onOpenLogin={() => setLoginModalOpen(true)} />
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
        <div className="footer-container">
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <img
                src="/arcal-logo.png"
                alt="ARCAL Protección Radiológica IPS"
                style={{ height: '48px', width: 'auto', background: 'rgba(255,255,255,0.95)', padding: '6px 12px', borderRadius: '10px' }}
              />
            </div>
            <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 800 }}>
              ARCAL PROTECCIÓN RADIOLÓGICA S.A.S. (IPS)
            </h3>
            <p style={{ color: '#E2E8F0', fontSize: '0.85rem', lineHeight: '1.6', maxWidth: '480px' }}>
              Institución Prestadora de Servicios de Salud y Apoyo Diagnóstico. Comprometidos con la integralidad en la prestación de servicios de salud con calidad, capacidad científica, técnica y administrativa con trato humanizado. Habilitada por el Ministerio de Salud y Protección Social.
            </p>
            <div style={{ marginTop: '0.9rem', fontSize: '0.8rem', color: '#99c85d', fontWeight: 700 }}>
              Habilitación MinSalud: 0500109842-01 • NIT: 901.365.419-8
            </div>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', marginBottom: '0.8rem', fontWeight: 700, borderBottom: '2px solid var(--brand-cyan)', display: 'inline-block', paddingBottom: '4px' }}>
              Departamentos & Portafolio
            </h4>
            <ul style={{ listStyle: 'none', fontSize: '0.8rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
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
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', marginBottom: '0.8rem', fontWeight: 700, borderBottom: '2px solid var(--brand-green)', display: 'inline-block', paddingBottom: '4px' }}>
              Sedes de Atención & Contacto
            </h4>
            <div style={{ fontSize: '0.8rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <div>
                <b style={{ color: '#FFFFFF' }}>Sede Poblado Medellín:</b><br />
                Calle 19a Nro. 44-25, Torre Médica Salud y Servicios piso 22 Cons. 2209<br />
                PBX: (604) 604 8956 • Cel: 323 230 7453
              </div>
              <div>
                <b style={{ color: '#FFFFFF' }}>Sede Ciudad Bolívar:</b><br />
                Calle 48 #48-01 Local 208, Centro Empresarial Privilegio • Cel: 311 601 0895
              </div>
              <div>
                <b style={{ color: '#FFFFFF' }}>Sede Apartadó (Urabá):</b><br />
                Cll 99 # 105-44 piso 1 Barrio Ortiz • Cel: 314 826 5325
              </div>
              <div>
                <b style={{ color: '#FFFFFF' }}>WhatsApp Citas:</b> <span style={{ color: '#99c85d', fontWeight: 700 }}>+57 310 854 9210</span><br />
                <b>Correo:</b> contacto@arcal.com.co
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Horario: Lunes a Viernes 7:00 AM - 5:00 PM | Sábados 8:00 AM - 1:00 PM
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} ARCAL Protección Radiológica S.A.S. (IPS) — Todos los derechos reservados.
          </div>
          <div style={{ color: '#000000ff' }}>
            Portal Oficial de Agendamiento Médico & Radiológico v3.0
          </div>
        </div>
      </footer>
    </div>
  );
}
