import React, { useState } from 'react';
import {
  Search, Calendar, FileDown, AlertTriangle, Building2,
  User, Clock, CheckCircle2, ShieldCheck, History, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { generarComprobantePDF } from '../utils/pdfGenerator';

/**
 * Determina si una cita es a futuro con respecto a la fecha y hora actual local.
 * - Citas con fecha posterior a hoy -> a futuro (true)
 * - Citas con fecha anterior a hoy -> ya pasaron (false)
 * - Citas de hoy: se consideran a futuro si la hora no ha transcurrido
 *   (con una ventana de gracia de 30 min durante la consulta).
 * - Citas con estado 'atendida' o 'no_asistio' -> ya transcurrieron (false)
 */
export function esCitaFutura(cita) {
  if (!cita || !cita.fecha) return false;

  // Citas ya atendidas o con inasistencia registrada se consideran transcurridas
  if (cita.estado === 'atendida' || cita.estado === 'no_asistio') {
    return false;
  }

  const now = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  // Si la fecha es posterior a hoy, la cita es a futuro
  if (cita.fecha > todayStr) {
    return true;
  }

  // Si la fecha es anterior a hoy, la fecha ya pasó
  if (cita.fecha < todayStr) {
    return false;
  }

  // Si es la fecha actual (hoy):
  if (!cita.hora) return true;

  const [h, m] = cita.hora.split(':').map(Number);
  const citaMinutes = (h || 0) * 60 + (m || 0);
  const currentNowMinutes = now.getHours() * 60 + now.getMinutes();

  // Se considera a futuro o activa si no ha culminado la ventana de atención (30 min)
  return (citaMinutes + 30) >= currentNowMinutes;
}

function formatFechaLegible(fechaISO) {
  if (!fechaISO) return '';
  const [y, m, d] = fechaISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default function AppointmentLookup({ usuarioActual, onAgendarClick }) {
  const [criterio, setCriterio] = useState('');
  const [citasEncontradas, setCitasEncontradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [error, setError] = useState('');
  const [mostrarHistorialAdmin, setMostrarHistorialAdmin] = useState(false);

  const esPersonalIPS = usuarioActual && (
    usuarioActual.rol === 'admin' ||
    usuarioActual.rol === 'superadmin' ||
    usuarioActual.rol === 'agente'
  );

  const hoyLegible = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  async function handleBuscar(e, forzarHistorial = mostrarHistorialAdmin) {
    if (e && e.preventDefault) e.preventDefault();
    if (!criterio.trim()) return;

    try {
      setLoading(true);
      setError('');
      setBusquedaRealizada(true);

      const params = {
        criterio: criterio.trim(),
        pacienteNumDoc: criterio.trim()
      };

      // Si no se solicita expresamente el historial administrativo, filtrar solo futuras
      if (!forzarHistorial) {
        params.soloFuturas = true;
      }

      const res = await api.getCitas(params);
      let encontradas = res.data || [];

      // Si no encontró por cédula, intentar buscar por código exacto
      if (encontradas.length === 0) {
        try {
          const resCita = await api.getCitaById(
            criterio.trim(),
            !forzarHistorial ? { soloFuturas: true } : {}
          );
          if (resCita.data) {
            encontradas = [resCita.data];
          }
        } catch {
          // No se encontró por código
        }
      }

      // Filtro de seguridad en el cliente: para usuarios/pacientes solo citas a futuro
      if (!forzarHistorial) {
        encontradas = encontradas.filter(esCitaFutura);
      }

      setCitasEncontradas(encontradas);
    } catch (err) {
      setError('Error al consultar el sistema de citas.');
      setCitasEncontradas([]);
    } finally {
      setLoading(false);
    }
  }

  function handleToggleHistorialAdmin(nuevoValor) {
    setMostrarHistorialAdmin(nuevoValor);
    if (busquedaRealizada && criterio.trim()) {
      handleBuscar(null, nuevoValor);
    }
  }

  return (
    <div>
      <div className="card-panel" style={{ maxWidth: '800px', margin: '0 auto 2rem', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', background: '#E0F2FE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Search size={28} color="#0369A1" />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: '0.25rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.8rem' }}>
          <Calendar size={14} />
          <span>Consulta Pública de Citas Vigentes a Futuro</span>
        </div>

        <h2 style={{ fontSize: '1.7rem', color: '#0F172A', marginBottom: '0.4rem' }}>
          Consulte o Descargue su Comprobante de Cita
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.6rem', maxWidth: '640px', margin: '0 auto 1.6rem' }}>
          Ingrese su número de documento de identidad (Cédula de Ciudadanía, Tarjeta de Identidad) o el código de cita (Ej: ARC-2026-7812) para descargar su comprobante en PDF.
          <br />
          <span style={{ fontSize: '0.82rem', color: 'var(--brand-cyan-dark)', fontWeight: 600 }}>
            ● Solo se muestran citas vigentes y a futuro para la fecha actual ({hoyLegible}).
          </span>
        </p>

        {/* Barra Administrativa exclusiva para personal de la IPS */}
        {esPersonalIPS && (
          <div style={{
            background: '#F8FAFC',
            border: '1.5px dashed #CBD5E1',
            borderRadius: '10px',
            padding: '0.7rem 1rem',
            marginBottom: '1.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#334155' }}>
              <ShieldCheck size={16} color="var(--brand-cyan-dark)" />
              <span><b>Sesión IPS:</b> {usuarioActual.nombre} ({usuarioActual.rol})</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mostrarHistorialAdmin}
                onChange={e => handleToggleHistorialAdmin(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--brand-cyan)' }}
              />
              <History size={14} />
              <span>Ver historial completo (incluir citas pasadas)</span>
            </label>
          </div>
        )}

        <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '0.6rem', maxWidth: '520px', margin: '0 auto' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Número de cédula o código ARC-..."
            value={criterio}
            onChange={e => setCriterio(e.target.value)}
            style={{ fontSize: '1rem', fontWeight: 600 }}
            required
          />
          <button type="submit" className="btn btn-accent" disabled={loading} style={{ padding: '0.8rem 1.6rem' }}>
            {loading ? 'Consultando...' : 'Buscar Cita'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ maxWidth: '800px', margin: '0 auto 1.5rem', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      {/* Resultados de la búsqueda */}
      {busquedaRealizada && (
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          {citasEncontradas.length === 0 ? (
            <div className="card-panel" style={{ textAlign: 'center', padding: '3rem 1.8rem', color: '#64748B' }}>
              <div style={{ width: '56px', height: '56px', background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Calendar size={28} color="#D97706" />
              </div>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>
                No encontramos citas médicas futuras para "{criterio}".
              </p>
              <p style={{ fontSize: '0.88rem', color: '#64748B', maxWidth: '540px', margin: '0 auto 1.4rem', lineHeight: '1.6' }}>
                En este portal público únicamente se muestran las citas médicas vigentes y a futuro para la fecha actual ({hoyLegible}). Las citas de fechas que ya transcurrieron no aparecen aquí y permanecen resguardadas en el historial administrativo de la IPS.
              </p>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {onAgendarClick && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onAgendarClick}
                    style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span>Agendar Nueva Cita Web</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '1.2rem' }}>
                Si requiere consultar un comprobante de una cita que ya fue atendida en fechas anteriores, comuníquese con Atención al Usuario o acérquese a recepción.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#1E293B', fontWeight: 800, margin: 0 }}>
                  {mostrarHistorialAdmin ? 'Historial Completo de Citas' : 'Citas Médicas Programadas a Futuro'} ({citasEncontradas.length}):
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#0369A1', background: '#E0F2FE', padding: '0.25rem 0.75rem', borderRadius: '15px', fontWeight: 600 }}>
                  ● Criterio: {criterio}
                </span>
              </div>

              {!mostrarHistorialAdmin && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.82rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle2 size={18} color="#16A34A" />
                  <span>
                    Mostrando únicamente citas vigentes a futuro a partir de la fecha actual (<b>{hoyLegible}</b>).
                  </span>
                </div>
              )}

              {citasEncontradas.map(cita => {
                const esFutura = esCitaFutura(cita);

                return (
                  <div
                    key={cita.id}
                    className="card-panel"
                    style={{
                      padding: '1.8rem',
                      border: esFutura ? '1.5px solid var(--brand-cyan)' : '1.5px solid #CBD5E1',
                      background: esFutura ? '#FFFFFF' : '#F8FAFC'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <img src="/arcal-logo.png" alt="ARCAL" style={{ height: '32px', width: 'auto' }} />
                        <div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Código de Radicado</span>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: esFutura ? 'var(--brand-cyan-dark)' : '#64748B' }}>
                            {cita.codigoCita}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {!esFutura && (
                          <span style={{ fontSize: '0.75rem', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#64748B', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
                            🕒 Cita ya transcurrida
                          </span>
                        )}
                        <span className={`badge ${cita.tipoAgendamiento === 'web' ? 'badge-web' : 'badge-presencial'}`}>
                          {cita.tipoAgendamiento}
                        </span>
                        <span className={`badge badge-${cita.estado}`}>
                          {cita.estado === 'no_asistio' ? 'No Asistió' :
                           cita.estado === 'llego_tarde' ? 'Llegó Tarde' :
                           cita.estado === 'en_sala' ? 'En Sala' :
                           cita.estado}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Paciente:</span>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>
                          {cita.pacienteNombres} {cita.pacienteApellidos}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {cita.pacienteTipoDoc} {cita.pacienteNumDoc}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Especialidad:</span>
                        <div style={{ fontWeight: 700, color: '#028090' }}>
                          {cita.especialidad?.nombre}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          {cita.medico?.nombre}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Fecha y Hora:</span>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>
                          {cita.fecha} a las {cita.hora}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: esFutura ? '#DC2626' : '#64748B', fontWeight: 600 }}>
                          {esFutura ? 'Llegar 15 min antes' : 'Fecha transcurrida'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'capitalize' }}>
                          {formatFechaLegible(cita.fecha)}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Sede Presencial:</span>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>
                          {cita.sede?.nombre}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {cita.sede?.direccion}
                        </div>
                      </div>
                    </div>

                    {/* Recomendaciones médicas (solo si aplican) */}
                    {cita.especialidad?.recomendaciones?.length > 0 && (
                      <div className="clinical-rec-box" style={{ margin: '0 0 1.5rem' }}>
                        <div className="clinical-rec-header" style={{ fontSize: '0.85rem' }}>
                          <AlertTriangle size={16} />
                          <span>Recomendaciones obligatorias para {cita.especialidad?.nombre}:</span>
                        </div>
                        <ul className="clinical-rec-list">
                          {cita.especialidad.recomendaciones.map((r, i) => (
                            <li key={i} className="clinical-rec-item" style={{ fontSize: '0.78rem' }}>
                              <span className="rec-bullet">{i + 1}</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-accent"
                        onClick={() => generarComprobantePDF(cita)}
                        style={{ padding: '0.8rem 1.6rem' }}
                      >
                        <FileDown size={18} />
                        <span>Descargar Comprobante Oficial en PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
