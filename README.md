# 🏥 Sistema Integrado de Agendamiento Presencial & Web — IPS ARCAL

### **IPS ARCAL Protección Radiológica S.A.S.**
- **NIT:** 901.482.319-4
- **Código de Habilitación en Salud (MinSalud):** 1100109842-01
- **Plataforma:** Sistema de Citas Web & Taquilla Presencial con Generación de Comprobantes PDF y Sincronización en Tiempo Real.

---

## 🌟 Descripción General del Sistema

Este sistema fue desarrollado para resolver integralmente la operación de agendamiento de **IPS ARCAL**, permitiendo:

1. **🌐 Portal de Pacientes (Web Pública):**
   - Agendamiento autónomo en 4 sencillos pasos.
   - Selección de sede, especialidad médica y profesional de la salud.
   - Consulta de horarios libres en tiempo real (bloques de 30 a 45 minutos).
   - Generación y descarga inmediata del **Comprobante Oficial en PDF** con membrete de IPS ARCAL, código de radicado único y **recomendaciones médicas preparatorias específicas según la especialidad seleccionada**.

2. **🏥 Módulo de Recepción Presencial (Sedes Físicas):**
   - Diseñado para recepcionistas y personal de admisiones en taquilla/ventanilla.
   - Selector dinámico de la sede activa donde está laborando el funcionario.
   - Búsqueda ágil de pacientes por documento de identidad (autocompleta datos de historial clínico).
   - Asignación inmediata de cita en taquilla que **inhabilita ese cupo al instante para la web**, evitando cruces de horarios o sobrecupos.
   - Generación e impresión del tiquete/comprobante físico para entregar al paciente en mano.
   - Agenda del día con estados de atención: *Agendada*, *En Sala de Espera*, *Atendido*, *Cancelada*.

3. **⚙️ Panel de Control Administrador:**
   - **Gestión de Sedes:** Crear, editar información física (dirección, teléfonos, horario, consultorios disponibles) y activar/desactivar sedes.
   - **Gestión de Especialidades:** Supervisión de las 9 especialidades médicas y **edición personalizada de las recomendaciones clínicas** que se imprimen en el comprobante en PDF.
   - **Gestión de Médicos:** Registro de profesionales, tarjetas profesionales, especialidad, sede y franjas de atención.
   - **Control Maestro de Citas & KPIs:** Métricas en vivo (citas web vs. presenciales, ocupación por sede, volumen por especialidad) y auditoría.

4. **🔍 Consulta Pública de Citas por Documento:**
   - Permite a cualquier paciente ingresar su cédula o código de cita para consultar sus citas vigentes y volver a descargar su comprobante en PDF cuantas veces lo requiera.

---

## 🩺 Especialidades Médicas Habilitadas (9)

El sistema cuenta con las 9 especialidades configuradas con sus respectivas instrucciones preparatorias para los pacientes:

| Especialidad | Código | Duración | Recomendaciones Preparatorias en el PDF |
| :--- | :---: | :---: | :--- |
| **UROLOGÍA** | `URO` | 30 min | Orden médica, ecografía con vejiga llena (4 vasos de agua 1h antes), exámenes de PSA y creatinina. |
| **OTORRINOLARINGOLOGÍA** | `ORL` | 30 min | No aplicar gotas óticas ni lavados caseros 24h antes, llevar audiometrías o TAC previos. |
| **PEDIATRÍA** | `PED` | 30 min | Acompañamiento obligatorio de padre/tutor con documento original, carné de vacunación físico al día. |
| **MEDICINA INTERNA** | `MED-INT` | 30 min | Lista y fórmulas de medicamentos actuales, controles de tensión arterial/glucometrías, laboratorios recientes. |
| **PSICOLOGÍA** | `PSI` | 45 min | Consulta confidencial, informes o valoraciones previas, acompañamiento inicial para menores. |
| **CARDIOLOGÍA** | `CARDIO` | 30 min | No ingerir cafeína ni fumar 6h previas, ropa cómoda de 2 piezas, electros y ecocardiogramas anteriores. |
| **NUTRICIÓN** | `NUTRI` | 30 min | Ayuno de 2 a 3 horas previas para bioimpedancia, evitar ejercicio extenuante 24h antes, exámenes de perfil lipídico. |
| **DERMATOLOGÍA** | `DERMA` | 30 min | Piel limpia sin maquillaje, bases ni cremas espesas; uñas sin esmalte; lista de cremas/bloqueadores tópicos en uso. |
| **GINECOLOGÍA** | `GIN` | 30 min | No periodo menstrual, abstinencia sexual 48h antes de citología, sin óvulos ni duchas vaginales 3 días previos. |

---

## 🏢 Sedes Operativas Iniciales

1. **Sede Principal Bogotá Norte:** Carrera 15 # 118-45, Torre Médica Santa Bárbara, Cons. 402.
2. **Sede Chapinero Radiología & Consultas:** Calle 63 # 9-28, Edificio Quirúrgico Central, Piso 3.
3. **Sede Medellín El Poblado:** Carrera 43A # 1 Sur-180, San Fernando Plaza, Cons. 610.
4. **Sede Cali Tequendama Especializada:** Carrera 42 # 5B-75, Centro Médico Tequendama, Piso 4.

*(El Administrador puede crear, modificar o desactivar cualquier sede desde el panel de control).*

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:**
  - **React 18** con **Vite** para compilación ultrarrápida.
  - **Vanilla CSS Modular:** Sistema de diseño clínico propio (Design Tokens, variables HSL/HEX, glassmorphism sutil, tipografías Google Fonts *Plus Jakarta Sans* y *Outfit*).
  - **Lucide React:** Iconografía médica y de navegación estandarizada.
  - **jsPDF & jsPDF-AutoTable:** Motor de renderizado vectorial de documentos PDF membretados.
  - **Canvas-Confetti:** Micro-animación de confirmación de cita.

- **Backend:**
  - **Node.js & Express 4:** API REST con validación estricta de cruce de horarios y concurrencia.
  - **Base de Datos Persistente:** Capa de almacenamiento en `server/data/ips_database.json` con soporte relacional para Sedes, Médicos, Especialidades, Citas y Auditoría.
  - **CORS & UUID:** Comunicación segura y generación de identificadores únicos de seguridad médica.

---

## 🚀 Cómo Ejecutar el Proyecto

### 1. Iniciar el Servidor Backend:
```bash
cd server
npm start
```
*El servidor iniciará en: `http://localhost:3001`*

### 2. Iniciar la Aplicación Frontend:
En otra terminal:
```bash
cd client
npm run dev
```
*La aplicación web estará disponible en: `http://localhost:5173`*

---

## 📄 Características del Comprobante PDF de IPS ARCAL

Al confirmar la cita (sea por la web o en la taquilla presencial), el sistema genera un PDF con:
- Membrete legal de **IPS ARCAL Protección Radiológica S.A.S.** (NIT, Código de Habilitación MinSalud, PBX, WhatsApp).
- Código único de radicado: `ARC-2026-XXXX`.
- Datos personales y de identificación del paciente con su entidad aseguradora (EPS o Particular).
- Especialidad médica y datos del profesional asignado (con Registro Médico y número de consultorio).
- Fecha, hora exacta y dirección completa de la sede física de atención.
- **Cuadro de Alerta Médica con las Recomendaciones Preparatorias Obligatorias según la especialidad seleccionada**.
- Condiciones de asistencia, tiempo de tolerancia y canales de reprogramación.
- Sello de certificación y fecha/hora exacta de emisión electrónica.
