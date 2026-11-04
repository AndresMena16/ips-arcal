// Configuración de URL dinámica compatible con desarrollo local y despliegue en Hostinger
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Error en la petición: ${res.statusText}`);
    }
    return data;
  } catch (err) {
    console.error(`Error en API ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Configuración
  getConfig: () => request('/config'),

  // Sedes
  getSedes: () => request('/sedes'),
  createSede: (data) => request('/sedes', { method: 'POST', body: JSON.stringify(data) }),
  updateSede: (id, data) => request(`/sedes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSede: (id) => request(`/sedes/${id}`, { method: 'DELETE' }),

  // Especialidades
  getEspecialidades: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/especialidades${query ? `?${query}` : ''}`);
  },
  createEspecialidad: (data) => request('/especialidades', { method: 'POST', body: JSON.stringify(data) }),
  updateEspecialidad: (id, data) => request(`/especialidades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEspecialidad: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/especialidades/${id}${query ? `?${query}` : ''}`, { method: 'DELETE' });
  },

  // Médicos
  getMedicos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/medicos${query ? `?${query}` : ''}`);
  },
  createMedico: (data) => request('/medicos', { method: 'POST', body: JSON.stringify(data) }),
  updateMedico: (id, data) => request(`/medicos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedico: (id, permanente = false) => request(`/medicos/${id}${permanente ? '?permanente=true' : ''}`, { method: 'DELETE' }),

  // Disponibilidad en tiempo real
  getDisponibilidad: (medicoId, fecha, sedeId, excluirCitaId = '') => {
    const params = { medicoId, fecha };
    if (sedeId) params.sedeId = sedeId;
    if (excluirCitaId) params.excluirCitaId = excluirCitaId;
    const query = new URLSearchParams(params).toString();
    return request(`/disponibilidad?${query}`);
  },
  getDisponibilidadProximosDias: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/disponibilidad/proximos-dias?${query}`);
  },

  // Citas
  getCitas: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/citas${query ? `?${query}` : ''}`);
  },
  getCitaById: (identificador, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/citas/${identificador}${query ? `?${query}` : ''}`);
  },
  createCita: (data) => request('/citas', { method: 'POST', body: JSON.stringify(data) }),
  updateCita: (id, data) => request(`/citas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateEstadoCita: (id, estado, motivoCancelacion = '') =>
    request(`/citas/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado, motivoCancelacion }) }),
  reasignarCita: (id, data) =>
    request(`/citas/${id}/reasignar`, { method: 'POST', body: JSON.stringify(data) }),

  // Autenticación
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // Usuarios y Agentes de Atención al Cliente
  getUsuarios: () => request('/usuarios'),
  createUsuario: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  updateUsuario: (id, data) => request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleEstadoUsuario: (id) => request(`/usuarios/${id}/toggle-estado`, { method: 'PUT' }),
  deleteUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  // Métricas
  getMetricas: () => request('/metricas'),

  // Módulo Portal Web: Datos Curiosos
  getDatosCuriosos: (admin = false) => request(`/datos-curiosos${admin ? '?admin=true' : ''}`),
  createDatoCurioso: (data) => request('/datos-curiosos', { method: 'POST', body: JSON.stringify(data) }),
  updateDatoCurioso: (id, data) => request(`/datos-curiosos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDatoCurioso: (id) => request(`/datos-curiosos/${id}`, { method: 'DELETE' }),

  // Módulo Portal Web: Galería Multimedia (Fotos y Videos Cortos)
  getGaleria: (admin = false) => request(`/galeria${admin ? '?admin=true' : ''}`),
  createGaleriaItem: (data) => request('/galeria', { method: 'POST', body: JSON.stringify(data) }),
  updateGaleriaItem: (id, data) => request(`/galeria/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGaleriaItem: (id) => request(`/galeria/${id}`, { method: 'DELETE' }),

  // Módulo Portal Web: Atención al Usuario & PQRS
  getPqrs: () => request('/pqrs'),
  consultarPqrs: (termino) => request(`/pqrs/consultar/${encodeURIComponent(termino)}`),
  radicarPqrs: (data) => request('/pqrs', { method: 'POST', body: JSON.stringify(data) }),
  responderPqrs: (id, data) => request(`/pqrs/${id}/responder`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePqrs: (id) => request(`/pqrs/${id}`, { method: 'DELETE' }),

  // Reiniciar
  resetDatabase: () => request('/reset', { method: 'POST' })
};
