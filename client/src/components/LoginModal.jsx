import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, User, AlertCircle, X, KeyRound, Building2 } from 'lucide-react';
import { api } from '../services/api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingrese su usuario y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.login(username, password);
      if (res.success && res.data) {
        onLoginSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  }

  function prefillCredentials(user, pass) {
    setUsername(user);
    setPassword(pass);
    setError('');
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '480px', padding: '2rem' }}>
        {/* Encabezado con Logo Oficial */}
        <div style={{ textAlign: 'center', marginBottom: '1.2rem', position: 'relative' }}>
          <button
            style={{ position: 'absolute', right: 0, top: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '0.3rem' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
          <img
            src="/arcal-logo.png"
            alt="ARCAL Protección Radiológica IPS"
            style={{ height: '54px', width: 'auto', marginBottom: '0.6rem' }}
          />
          <div style={{ fontSize: '0.72rem', color: 'var(--brand-cyan-dark)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Portal de Colaboradores & Admisiones
          </div>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--primary-900)', margin: '0.2rem 0 0', fontWeight: 800 }}>
            Acceso Corporativo Seguro
          </h3>
        </div>

        <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '1.4rem', lineHeight: 1.5 }}>
          Ingrese con sus credenciales autorizadas. El sistema asignará automáticamente su rol (<b>Administrador</b> o <b>Agente de Atención al Cliente</b> con sedes habilitadas).
        </p>

        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            color: '#991B1B',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.2rem',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              Usuario Corporativo:
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: admin / laura.gomez"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.4rem' }}>
            <label className="form-label">
              Contraseña:
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontWeight: 800 }}
            disabled={loading}
          >
            {loading ? 'Validando Acceso...' : 'Ingresar al Sistema'}
          </button>
        </form>

        {/* Cuentas Demostrativas para Pruebas Rápidas 
        <div style={{ marginTop: '1.6rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.2rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Cuentas de Demostración para Pruebas:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.7rem', fontSize: '0.75rem', justifyContent: 'flex-start', textAlign: 'left', background: 'linear-gradient(90deg, #F5F3FF 0%, #EDE9FE 100%)', borderColor: '#C4B5FD', color: '#5B21B6' }}
              onClick={() => prefillCredentials('superadmin', 'superadmin123')}
            >
              <b>Super Administrador:</b> <span style={{ color: '#6D28D9', marginLeft: 'auto', fontWeight: 800 }}>superadmin / superadmin123</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.7rem', fontSize: '0.75rem', justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => prefillCredentials('admin', 'admin123')}
            >
              <b>Administrador General:</b> <span style={{ color: '#028090', marginLeft: 'auto' }}>admin / admin123</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.7rem', fontSize: '0.75rem', justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => prefillCredentials('laura.gomez', '123')}
            >
              <b>Agente de Atención (Sedes Bogotá):</b> <span style={{ color: '#028090', marginLeft: 'auto' }}>laura.gomez / 123</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.7rem', fontSize: '0.75rem', justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => prefillCredentials('andres.ruiz', '123')}
            >
              <b>Agente de Atención (Sede Medellín):</b> <span style={{ color: '#028090', marginLeft: 'auto' }}>andres.ruiz / 123</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.7rem', fontSize: '0.75rem', justifyContent: 'flex-start', textAlign: 'left', color: '#991B1B', background: '#FEF2F2' }}
              onClick={() => prefillCredentials('carolina.morales', '123')}
            >
              <b>Agente Inactivo (Prueba de Bloqueo):</b> <span style={{ marginLeft: 'auto' }}>carolina.morales / 123</span>
            </button>
          </div>
        </div>*/}
      </div>
    </div>
  );
}
