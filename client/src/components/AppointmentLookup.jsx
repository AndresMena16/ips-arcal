import React, { useState } from 'react';
import { Search, Calendar, FileDown, AlertTriangle, Building2, User, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { generarComprobantePDF } from '../utils/pdfGenerator';

export default function AppointmentLookup() {
  const [criterio, setCriterio] = useState('');
  const [citasEncontradas, setCitasEncontradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [error, setError] = useState('');

  async function handleBuscar(e) {
    e.preventDefault();
    if (!criterio.trim()) return;

    try {
      setLoading(true);
      setError('');
      setBusquedaRealizada(true);

      // Buscar por número de documento o por código de cita
      const res = await api.getCitas({ pacienteNumDoc: criterio.trim() });
      if (res.data && res.data.length > 0) {
        setCitasEncontradas(res.data);
      } else {
        // Intentar buscar por código de cita exacto
        try {
          const resCita = await api.getCitaById(criterio.trim());
          if (resCita.data) {
            setCitasEncontradas([resCita.data]);
          } else {
            setCitasEncontradas([]);
          }
        } catch {
          setCitasEncontradas([]);
        }
      }
    } catch (err) {
      setError('Error al consultar el sistema de citas.');
      setCitasEncontradas([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="card-panel" style={{ maxWidth: '800px', margin: '0 auto 2rem', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', background: '#E0F2FE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Search size={28} color="#0369A1" />
        </div>

        <h2 style={{ fontSize: '1.7rem', color: '#0F172A', marginBottom: '0.4rem' }}>
          Consulte o Descargue su Comprobante de Cita
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
          Ingrese su número de documento de identidad (Cédula de Ciudadanía, Tarjeta de Identidad) o el código de cita (Ej: ARC-2026-7812) para descargar su comprobante en PDF con sus recomendaciones médicas.
        </p>

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
            <div className="card-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748B' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>
                No encontramos ninguna cita médica asociada a "{criterio}".
              </p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
                Verifique que el número de cédula sea correcto o agende una nueva cita en el portal web.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1E293B' }}>
                Citas Encontradas ({citasEncontradas.length}):
              </h3>

              {citasEncontradas.map(cita => (
                <div key={cita.id} className="card-panel" style={{ padding: '1.8rem', border: '1.5px solid var(--brand-cyan)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                      <img src="/arcal-logo.png" alt="ARCAL" style={{ height: '32px', width: 'auto' }} />
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Código de Radicado</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-cyan-dark)' }}>
                          {cita.codigoCita}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
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
                      <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                        Llegar 15 min antes
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

                  {/* Recomendaciones */}
                  <div className="clinical-rec-box" style={{ margin: '0 0 1.5rem' }}>
                    <div className="clinical-rec-header" style={{ fontSize: '0.85rem' }}>
                      <AlertTriangle size={16} />
                      <span>Recomendaciones obligatorias para {cita.especialidad?.nombre}:</span>
                    </div>
                    <ul className="clinical-rec-list">
                      {cita.especialidad?.recomendaciones?.map((r, i) => (
                        <li key={i} className="clinical-rec-item" style={{ fontSize: '0.78rem' }}>
                          <span className="rec-bullet">{i + 1}</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
