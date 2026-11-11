import nodemailer from 'nodemailer';

// Configuración SMTP adaptable para Hostinger, cPanel o servidores empresariales
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || '"IPS ARCAL - Calidad y Auditoría" <notificaciones@arcal.com.co>';
const APP_URL = process.env.APP_URL || 'https://ipsarcal.com';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    return transporter;
  } catch (err) {
    console.error('Error al inicializar transporte SMTP:', err.message);
    return null;
  }
}

/**
 * Notificación por correo cuando una PQRS es respondida por el personal médico / administrativo
 */
export async function enviarNotificacionRespuestaPqrs({
  email,
  nombreCompleto,
  radicado,
  tipo,
  asunto,
  respuestaOficial,
  atendidoPor,
  fechaRadicado,
  fechaRespuesta
}) {
  if (!email || !email.includes('@')) {
    return { sent: false, motivo: 'Correo electrónico no suministrado o inválido' };
  }

  const fechaFormateada = fechaRadicado ? new Date(fechaRadicado).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO');
  const fechaRespFormateada = fechaRespuesta ? new Date(fechaRespuesta).toLocaleString('es-CO') : new Date().toLocaleString('es-CO');
  const portalUrl = APP_URL;
  const pqrsUrl = `${APP_URL}/#seccion-pqrs`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 20px; }
    .container { max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0B3B4B 100%); color: #FFFFFF; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.01em; color: #FFFFFF; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #99c85d; font-weight: 600; }
    .body { padding: 26px 24px; line-height: 1.6; }
    .badge { display: inline-block; background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; font-weight: 700; font-size: 12px; padding: 4px 10px; borderRadius: 6px; }
    .radicado-box { background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 10px; padding: 14px; margin: 18px 0; text-align: center; }
    .radicado-numero { font-size: 18px; font-weight: 800; color: #166534; letter-spacing: 0.04em; }
    .instrucciones { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13.5px; }
    .instrucciones ol { margin: 8px 0 0 0; padding-left: 20px; }
    .instrucciones li { margin-bottom: 6px; }
    .btn { display: inline-block; background: #99c85d; color: #0B2233 !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 14px; margin-top: 10px; text-align: center; }
    .respuesta-preview { background: #FFFFFF; border-left: 4px solid #10B981; padding: 12px 14px; margin: 16px 0; font-size: 13px; color: #334155; font-style: italic; }
    .footer { background: #0F172A; color: #94A3B8; padding: 20px 24px; font-size: 11.5px; text-align: center; line-height: 1.5; }
    .footer b { color: #E2E8F0; }
    .vigilado { background: rgba(153, 200, 93, 0.15); color: #99c85d; padding: 6px 12px; border-radius: 6px; display: inline-block; margin-bottom: 8px; font-weight: 700; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ARCAL PROTECCIÓN RADIOLÓGICA S.A.S. (IPS)</h1>
      <p>Sistema Oficial de Atención al Usuario & Auditoría Médica</p>
    </div>

    <div class="body">
      <div style="margin-bottom: 14px;">
        <span class="badge">SOLICITUD RESUELTA FORMALMENTE</span>
      </div>

      <p style="font-size: 15px; margin-top: 0;">
        Estimado(a) <b>${nombreCompleto}</b>:
      </p>

      <p style="font-size: 13.5px; color: #334155;">
        Le informamos que su solicitud de tipo <b>${tipo}</b> (Asunto: <i>${asunto}</i>), radicada en nuestra institución el día <b>${fechaFormateada}</b>, ha sido atendida y resuelta formalmente por el área de Calidad y Auditoría Médica de IPS ARCAL el <b>${fechaRespFormateada}</b>.
      </p>

      <div class="radicado-box">
        <div style="font-size: 12px; color: #166534; font-weight: 700; text-transform: uppercase;">Número de Radicado Oficial</div>
        <div class="radicado-numero">${radicado}</div>
      </div>

      <div class="instrucciones">
        <b style="color: #0F172A; font-size: 14px;">¿Cómo consultar su respuesta oficial en la página web?</b>
        <p style="margin: 6px 0; color: #475569;">
          Para consultar y verificar el texto completo de la resolución emitida por la Dirección Médica:
        </p>
        <ol>
          <li>Ingrese a nuestra página web oficial: <b><a href="${pqrsUrl}" style="color: #0284C7; text-decoration: underline;">Portal IPS ARCAL</a></b>.</li>
          <li>Diríjase a la sección <b>PQRS</b> (o en el menú superior seleccione <b>PQRS</b>).</li>
          <li>Haga clic en la pestaña <b>"Consultar Estado de Radicado"</b>.</li>
          <li>Ingrese su número de radicado: <b style="color: #0F172A;">${radicado}</b> (o su número de documento de identidad) y presione <b>Consultar</b>.</li>
        </ol>
        <div style="text-align: center; margin-top: 14px;">
          <a href="${pqrsUrl}" class="btn">Consultar Mi Respuesta en la Página Web</a>
        </div>
      </div>

      <div style="font-size: 12.5px; color: #475569; margin-top: 16px;">
        <b>Atendido por:</b> ${atendidoPor || 'Dirección de Calidad y Auditoría'}<br>
        <b>Fecha de emisión:</b> ${fechaRespFormateada}
      </div>

      <div class="respuesta-preview">
        <b>Extracto de la resolución:</b><br>
        "${respuestaOficial.length > 250 ? respuestaOficial.substring(0, 250) + '...' : respuestaOficial}"
      </div>
    </div>

    <div class="footer">
      <div class="vigilado">
        PÁGINA Y SERVICIOS VIGILADOS POR EL MINISTERIO DE SALUD Y LA SUPERSALUD
      </div>
      <div>
        <b>ARCAL PROTECCIÓN RADIOLÓGICA S.A.S. (IPS)</b><br>
        NIT: 901.365.419-8 • Habilitación MinSalud: 0500109842-01<br>
        Medellín: (604) 604 8956 | Bogotá: (601) 745 8900 | WhatsApp Citas: +57 310 854 9210<br>
        Este es un correo automático generado por el Sistema de Gestión de Calidad en Salud. Por favor no responda a este mensaje.
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
ARCAL PROTECCIÓN RADIOLÓGICA S.A.S. (IPS)
Notificación de Respuesta a su Solicitud PQRS

Estimado(a) ${nombreCompleto}:

Le informamos que su solicitud (${tipo}) con radicado ${radicado} ha sido atendida y resuelta formalmente por la Dirección de Calidad de IPS ARCAL.

¿CÓMO CONSULTAR SU RESPUESTA EN LA PÁGINA WEB?
1. Ingrese a: ${pqrsUrl}
2. Vaya a la pestaña "Consultar Estado de Radicado".
3. Ingrese su número de radicado: ${radicado} o su número de documento.

Atendido por: ${atendidoPor || 'Dirección de Calidad y Auditoría'}
Fecha de respuesta: ${fechaRespFormateada}

ARCAL Protección Radiológica S.A.S. (IPS)
Vigilada por el Ministerio de Salud y Protección Social y la Superintendencia Nacional de Salud (Supersalud).
NIT: 901.365.419-8 | Habilitación MinSalud: 0500109842-01
  `;

  const client = getTransporter();
  if (!client) {
    console.log(`[SIMULACIÓN CORREO PQRS - Sin SMTP configurado]`);
    console.log(`Para: ${email} | Asunto: Respuesta oficial a su solicitud ${radicado}`);
    console.log(`Mensaje: Su PQRS ${radicado} ha sido respondido. Consultar en ${pqrsUrl}`);
    return {
      sent: false,
      simulado: true,
      mensaje: `Notificación registrada para ${email}. Para envío real, configure las variables SMTP en el servidor.`
    };
  }

  try {
    const info = await client.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: `Respuesta Oficial a su Solicitud ${radicado} - IPS ARCAL`,
      text: textContent,
      html: htmlContent
    });
    console.log(`Correo de PQRS enviado exitosamente a ${email} (ID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error al enviar correo vía SMTP:', err.message);
    return { sent: false, error: err.message };
  }
}

/**
 * Notificación por correo cuando una PQRS es radicada formalmente por el usuario
 */
export async function enviarConfirmacionRadicadoPqrs({
  email,
  nombreCompleto,
  radicado,
  tipo,
  asunto
}) {
  if (!email || !email.includes('@')) {
    return { sent: false };
  }

  const pqrsUrl = `${APP_URL}/#seccion-pqrs`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 20px; }
    .container { max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0B3B4B 100%); color: #FFFFFF; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF; }
    .body { padding: 24px; line-height: 1.6; }
    .radicado-box { background: #FEF3C7; border: 1.5px solid #F59E0B; border-radius: 10px; padding: 14px; text-align: center; margin: 16px 0; }
    .radicado-numero { font-size: 18px; font-weight: 800; color: #B45309; }
    .footer { background: #0F172A; color: #94A3B8; padding: 18px; font-size: 11.5px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ARCAL PROTECCIÓN RADIOLÓGICA S.A.S. (IPS)</h1>
      <p style="margin: 6px 0 0 0; color: #99c85d; font-size: 13px;">Confirmación de Radicación de Solicitud PQRS</p>
    </div>
    <div class="body">
      <p>Estimado(a) <b>${nombreCompleto}</b>:</p>
      <p>Su solicitud de tipo <b>${tipo}</b> ha sido radicada formalmente ante el área de Calidad y Auditoría Médica de IPS ARCAL.</p>
      <div class="radicado-box">
        <div style="font-size: 12px; color: #92400E; font-weight: 700;">NÚMERO DE RADICADO OFICIAL</div>
        <div class="radicado-numero">${radicado}</div>
      </div>
      <p style="font-size: 13px; color: #475569;">
        <b>Asunto:</b> ${asunto}<br>
        <b>Plazo legal de respuesta:</b> Hasta 15 días hábiles conforme a la normativa de salud.
      </p>
      <p style="font-size: 13px; color: #334155;">
        Tan pronto su solicitud sea resuelta, recibirá una notificación a este correo informándole que la respuesta oficial se encuentra disponible para su consulta en nuestra página web: <a href="${pqrsUrl}">${pqrsUrl}</a>.
      </p>
    </div>
    <div class="footer">
      <b>ARCAL Protección Radiológica S.A.S. (IPS)</b> — Vigilada por MinSalud y Supersalud<br>
      NIT: 901.365.419-8 • Habilitación MinSalud: 0500109842-01
    </div>
  </div>
</body>
</html>
  `;

  const client = getTransporter();
  if (!client) {
    console.log(`[SIMULACIÓN RADICACIÓN PQRS] Para: ${email} | Radicado: ${radicado}`);
    return { sent: false, simulado: true };
  }

  try {
    const info = await client.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: `Confirmación de Radicación ${radicado} - IPS ARCAL`,
      html: htmlContent
    });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error al enviar correo de radicación:', err.message);
    return { sent: false, error: err.message };
  }
}

