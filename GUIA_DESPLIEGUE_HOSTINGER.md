# Guía Oficial de Despliegue en Hostinger — Plataforma Web & Citas IPS ARCAL

Este documento detalla paso a paso cómo subir y poner en producción la plataforma web institucional y el sistema de agendamiento de **IPS ARCAL** en **Hostinger**.

---

## 1. Arquitectura del Proyecto Preparada para Hostinger

El sistema cuenta con una arquitectura optimizada para que un único servidor Node.js en Hostinger sirva tanto el **Frontend compilado (React + Vite)** como la **API REST (Express)** sin problemas de CORS ni configuraciones complejas:

```text
Proyecto ips/
├── client/                     # Código fuente del Frontend React 19 + Vite
│   ├── dist/                   # Archivos estáticos de producción generados
│   └── src/
├── server/                     # Backend API Express
│   ├── data/
│   │   └── ips_database.json   # Base de datos JSON persistente con historial, citas, PQRS y datos curiosos
│   └── server.js               # Servidor principal (sirve la API y los estáticos de client/dist)
├── ecosystem.config.cjs        # Archivo de configuración para PM2 (VPS / Cloud)
└── package.json                # Scripts de orquestación raíz
```

---

## 2. Opción A: Despliegue en Hostinger Web / Cloud Hosting (hPanel con Node.js)

Si tu plan de Hostinger cuenta con la sección **Node.js** en el panel de control (hPanel):

### Paso 1: Compilar el Frontend Localmente
Antes de subir los archivos, ejecuta en la raíz del proyecto:
```bash
npm run build
```
Esto generará la carpeta `client/dist` con el código de producción optimizado.

### Paso 2: Subir los Archivos a Hostinger
1. Comprime en un archivo `.zip` los siguientes elementos (excluye las carpetas `node_modules`):
   - `client/dist`
   - `server/`
   - `ecosystem.config.cjs`
   - `package.json`
2. Ve al **Administrador de Archivos** de Hostinger en tu dominio (ej: `public_html` o en una carpeta de aplicación como `app`).
3. Sube el `.zip` y extráelo.

### Paso 3: Configurar la Aplicación Node.js en hPanel
1. En el panel de Hostinger, busca la opción **Node.js** o **Administrador de aplicaciones Node.js**.
2. Haz clic en **Crear Aplicación**:
   - **Versión de Node.js:** Selecciona `18.x`, `20.x` o superior.
   - **Modo de aplicación:** `Production`.
   - **Directorio raíz de la aplicación:** La carpeta donde subiste los archivos (por ejemplo `/public_html` o `/app`).
   - **Archivo de inicio (Startup File):** `server/server.js`.
3. Haz clic en **Crear**.
4. En la consola o botón de dependencias de hPanel, haz clic en **Ejecutar NPM Install** o ejecuta:
   ```bash
   cd server && npm install --production
   ```
5. Haz clic en **Reiniciar Aplicación**.

---

## 3. Opción B: Despliegue en Hostinger VPS (Ubuntu / Debian con Nginx y PM2)

Si tienes un servidor VPS en Hostinger:

### Paso 1: Conectarte por SSH a tu VPS
```bash
ssh root@IP_DE_TU_VPS
```

### Paso 2: Instalar Node.js y PM2
```bash
# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
npm install -g pm2
```

### Paso 3: Clonar o Subir el Proyecto
```bash
mkdir -p /var/www/ips-arcal
cd /var/www/ips-arcal

# Subir por SCP, Git o Git Clone
# Instalar dependencias del servidor y compilar cliente
cd server && npm install --production
cd ../client && npm install && npm run build
cd ..
```

### Paso 4: Iniciar la Aplicación con PM2
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Paso 5: Configurar Nginx como Proxy Inverso
Edita `/etc/nginx/sites-available/ips-arcal`:
```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Activa el sitio y recarga Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/ips-arcal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Para activar SSL gratuito con Certbot:
```bash
sudo apt-get install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## 4. Verificación de Funcionamiento

Una vez desplegado en tu dominio:
1. **Página Principal:** Al ingresar a `https://tudominio.com/` cargará la página web institucional con portafolio clínico, datos curiosos, galería multimedia y módulo de PQRS.
2. **Acceso al Control de Citas:** El botón **"Ir al Control de Citas"** en el hero y en la barra superior dirigirá a los pacientes al agendamiento web en tiempo real.
3. **Panel Administrativo:** El personal médico y administrativo puede ingresar desde el botón **"Acceso Empleados"** o directamente en el panel con las credenciales oficiales de Administrador o Super Administrador (`superadmin` / `superadmin123`).
4. **Alimentación del Portal:** En el panel de control se encuentran las pestañas **"Datos Curiosos"**, **"Galería Multimedia"** y **"Atención PQRS"** para gestionar todo el contenido en vivo.

