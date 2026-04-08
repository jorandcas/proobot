# Movistar Worker Agent

Agente local de ejecución para el sistema de automatización de portabilidad Movistar.

## 📋 Descripción

Este worker agent se ejecuta en máquinas locales (sedes de distribuidores) y se comunica con el backend central para:
- Consultar trabajos pendientes
- Ejecutar automatización de Appium en dispositivos Android locales
- Reportar resultados y evidencias al backend

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ LTS
- Android SDK Platform Tools
- ADB funcionando
- Appium Server corriendo
- Dispositivo Android conectado por USB

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   cd worker-agent
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tu configuración
   ```

4. **Verificar dispositivo Android**
   ```bash
   adb devices
   # Debe mostrar tu dispositivo
   ```

5. **Iniciar Appium Server** (en otra terminal)
   ```bash
   npx appium
   ```

6. **Iniciar worker agent**
   ```bash
   npm run dev    # Desarrollo
   npm start      # Producción
   ```

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Backend Connection
API_URL="http://localhost:3001"
API_KEY=""  # Se generará automáticamente al registrar el worker

# Worker Identity
WORKER_NAME="Worker-Local-1"
WORKER_LOCATION="Local Development"
DEVICE_ID=""  # Se detectará automáticamente

# Polling Configuration
POLL_INTERVAL="5000"        # 5 segundos
HEARTBEAT_INTERVAL="30000"  # 30 segundos

# Appium Configuration
APPIUM_SERVER="http://localhost:4723"
APPIUM_CAPABILITIES='{"platformName":"Android","automationName":"UiAutomator2","appPackage":"es.indra.pc.mobile.activity.temm","appActivity":"es.indra.pc.mobile.activity.temm.LoginActivityTEMM","newCommandTimeout":"300"}'

# Evidence Configuration
EVIDENCE_UPLOAD_ENABLED="true"
EVIDENCE_PATH="./evidence"
SCREENSHOTS_ENABLED="true"

# Bot Configuration
BOT_SCRIPT_PATH="../poc-login"
BOT_TIMEOUT="600000"  # 10 minutos

# Logging
LOG_LEVEL="info"
LOG_FILE="./logs/worker.log"
```

## 🔄 Flujo de Trabajo

1. **Registro**: El agente se registra en el backend al iniciar
2. **Heartbeat**: Envía heartbeat cada 30 segundos para mantener conexión
3. **Polling**: Consulta trabajos pendientes cada 5 segundos
4. **Ejecución**: Cuando hay un trabajo:
   - Descarga datos del trámite
   - Ejecuta bot de Appium
   - Captura logs y screenshots
   - Reporta resultado al backend

## 📊 Monitoreo

### Logs

Los logs se guardan en:
- `logs/worker.log` - Todos los logs
- `logs/error.log` - Solo errores

### Evidencias

Las evidencias de cada trabajo se guardan en:
- `evidence/<job-id>/` - Directorio con logs y screenshots

### Verificación de Salud

```bash
# Verificar conexión con backend
npm run test
```

## 🛠️ Troubleshooting

### Worker no se conecta al backend

1. Verificar que el backend esté corriendo
2. Verificar la URL del API en .env
3. Verificar conectividad de red
4. Revisar logs en `logs/worker.log`

### Appium no encuentra el dispositivo

1. Verificar que el dispositivo esté conectado:
   ```bash
   adb devices
   ```
2. Verificar que ADB reconozca el dispositivo
3. Reiniciar ADB si es necesario:
   ```bash
   adb kill-server
   adb start-server
   ```

### El bot falla durante la ejecución

1. Verificar que Appium Server esté corriendo
2. Verificar que la app de Movistar esté instalada
3. Revisar logs del bot en `evidence/<job-id>/`
4. Verificar capabilities de Appium en .env

### Worker se marca como OFFLINE en el backend

1. Verificar que el heartbeat se esté enviando (revisar logs)
2. Verificar conexión de red estable
3. Verificar que el intervalo de heartbeat sea correcto (30s por defecto)

## 🚀 Deploy en Producción

### Windows (Servicio)

1. Instalar como servicio usando PM2:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name movistar-worker
   pm2 save
   pm2 startup
   ```

2. O crear servicio de Windows con NSSM:
   ```bash
   nssm install MovistarWorker node "C:\path\to\worker-agent\dist\index.js"
   nssm start MovistarWorker
   ```

### Linux (systemd)

1. Crear archivo de servicio:
   ```bash
   sudo cp worker-agent.service /etc/systemd/system/
   ```

2. Habilitar e iniciar:
   ```bash
   sudo systemctl enable worker-agent
   sudo systemctl start worker-agent
   sudo systemctl status worker-agent
   ```

3. Ver logs:
   ```bash
   sudo journalctl -u worker-agent -f
   ```

## 📝 Scripts Disponibles

- `npm run dev` - Modo desarrollo con hot-reload
- `npm run build` - Compilar TypeScript
- `npm start` - Iniciar en producción
- `npm run register` - Registrar worker manualmente
- `npm run test` - Ejecutar test de conexión

## 🔒 Seguridad

- La API key se genera automáticamente al registrar el worker
- La API key se guarda en .env (nunca compartirla)
- Usar HTTPS en producción para comunicación con el backend

## 📞 Soporte

Para problemas o questions:
1. Revisar logs en `logs/worker.log`
2. Revisar documentación en `ARQUITECTURA.md`
3. Contactar al equipo de desarrollo
