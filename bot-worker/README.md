# Movistar Bot Worker

Bot Worker API para automatización de portabilidad Movistar usando WebDriverIO y Appium.

## Arquitectura

Este es un servicio HTTP que ejecuta el bot de portabilidad de forma remota. Se ejecuta en un contenedor Docker y se comunica con el backend vía HTTP.

## Variables de Entorno

```bash
# Worker Configuration
WORKER_PORT=3002              # Puerto del servidor HTTP
WORKER_ID=movistar-bot-worker-1  # ID único del worker

# TEMM App Credentials
TEMM_USER=your_username       # Usuario TEMM
TEMM_PASS=your_password       # Contraseña TEMM

# Device Configuration
DEVICE_UDID=your_device_udid  # UDID del dispositivo Android

# Appium Configuration
APPIUM_HOST=127.0.0.1         # Host de Appium
APPIUM_PORT=4723              # Puerto de Appium

# Verbose Mode
VERBOSE=false                 # Mostrar logs detallados
```

## API Endpoints

### GET /health
Health check para Coolify y monitoreo.

**Response:**
```json
{
  "status": "healthy",
  "workerId": "movistar-bot-worker-1",
  "deviceUdid": "emulator-5554",
  "uptime": 12345,
  "isExecuting": false,
  "hasDriver": false,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "appiumHost": "127.0.0.1",
  "appiumPort": 4723
}
```

### GET /appium-check
Verifica si el servidor Appium es alcanzable.

**Response:**
```json
{
  "reachable": true,
  "host": "127.0.0.1",
  "port": 4723
}
```

### POST /execute
Ejecuta el bot para un trámite de portabilidad.

**Request Body:**
```json
{
  "SEARCH_DN": "5512345678",
  "ICC": "8951012345678901234",
  "FVC_FECHA": "27/02/2026",
  "LINEA_NIP": "1234",
  "DATOS_NOMBRE": "Juan",
  "DATOS_NOMBRE_SEGUNDO": "",
  "DATOS_APELLIDO_PATERNO": "Pérez",
  "DATOS_APELLIDO_MATERNO": "López",
  "DATOS_CURP": "PELJ800101HDFXXX01",
  "DATOS_TELEFONO": "5587654321",
  "DATOS_TELEFONO_2": "",
  "DATOS_GENERO": "Masculino",
  "DATOS_EMAIL": "",
  "DATOS_FECHA_NACIMIENTO": "01/01/1980"
}
```

**Success Response:**
```json
{
  "success": true,
  "folioId": "123456789",
  "logs": ["Log line 1", "Log line 2", ...]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "logs": ["Log line 1", "Log line 2", ...]
}
```

### POST /cancel
Cancela la ejecución actual del bot (parada de emergencia).

**Response:**
```json
{
  "success": true,
  "message": "Bot execution cancelled"
}
```

### GET /status
Obtiene el estado actual de ejecución del bot.

**Response:**
```json
{
  "isExecuting": false,
  "hasDriver": false
}
```

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Compilar TypeScript
npm run build

# Produción
npm start
```

## Docker

```bash
# Construir imagen
docker build -t movistar-bot-worker .

# Ejecutar contenedor
docker run -p 3002:3002 \
  -e TEMM_USER=user \
  -e TEMM_PASS=pass \
  -e DEVICE_UDID=emulator-5554 \
  -e APPIUM_HOST=host.docker.internal \
  movistar-bot-worker
```

## Deploy en Coolify

Ver [COOLIFY.md](./COOLIFY.md) para instrucciones completas de despliegue.

## Estructura del Proyecto

```
bot-worker/
├── src/
│   ├── config/          # Configuración (env, timeouts, selectors)
│   ├── flows/           # Flujos del bot (login, secciones, etc.)
│   ├── utils/           # Utilidades (retry, ui-helpers)
│   ├── bot.ts           # Lógica de ejecución del bot
│   ├── health.ts        # Health checks
│   └── index.ts         # Servidor Express
├── dist/                # Código compilado (generado)
├── Dockerfile           # Configuración Docker
├── package.json         # Dependencias
└── tsconfig.json        # Configuración TypeScript
```
