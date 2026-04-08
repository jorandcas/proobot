# Arquitectura de Dos Capas - Sistema de Automatización Movistar

## 📊 Vista General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CAPA 1: NUBE (Hetzner + Coolify)              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        Frontend Web (React)                           │  │
│  │  - Panel Promotores                                                   │  │
│  │  - Panel Admin                                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      ↓                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      API Backend (Node.js + Express)                 │  │
│  │  - /api/auth          Autenticación                                   │  │
│  │  - /api/tramites      CRUD trámites                                   │  │
│  │  - /api/jobs          Gestión de colas                                │  │
│  │  - /api/workers       Registro de workers                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      ↓                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Sistema de Colas (Redis + Bull)                   │  │
│  │  - Cola: portability-jobs                                             │  │
│  │  - Estados: waiting, active, completed, failed                       │  │
│  │  - Retries, delays, prioridades                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      ↓                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Base de Datos (PostgreSQL)                        │  │
│  │  - trámites, usuarios, campañas, logs, executions, devices          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↕ HTTPS/WebSocket
                                      ↕ Polling (5-10s)
                                      ↕ Heartbeat (30s)
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CAPA 2: NODO EJECUTOR LOCAL                         │
│                    (Por distribuidor o por sede)                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Worker Agent (Node.js)                          │  │
│  │  - Poll de trabajos pendientes                                       │  │
│  │  - Heartbeat al backend                                              │  │
│  │  - Descarga trabajo                                                   │  │
│  │  - Ejecuta Appium                                                     │  │
│  │  - Sube evidencias                                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      ↓                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                  WebDriverIO + Appium Server                         │  │
│  │  - UiAutomator2 Driver                                               │  │
│  │  - Control de dispositivo Android                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                      ↓                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                 ADB + Android Device (USB)                           │  │
│  │  - Dispositivo físico Android                                        │  │
│  │  - App Movistar Onix instalada                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Componentes de la Arquitectura

### Capa 1: Nube (Hetzner + Coolify)

#### 1. Frontend Web
- **Tecnología:** React + Vite + TypeScript
- **Ubicación:** `plataforma-promotores/frontend/`
- **Funciones:**
  - Panel de promotores para crear trámites
  - Panel admin para monitorear workers y ejecuciones
  - Dashboard con estadísticas en tiempo real

#### 2. API Backend
- **Tecnología:** Node.js + Express + TypeScript + Prisma
- **Ubicación:** `plataforma-promotores/backend/`
- **Nuevos endpoints:**
  ```
  POST   /api/workers/register           Registrar nuevo worker
  PUT    /api/workers/:id/heartbeat      Actualizar heartbeat
  GET    /api/workers                    Listar workers activos
  DELETE /api/workers/:id                Desconectar worker

  POST   /api/jobs/create                Crear trabajo en cola
  GET    /api/jobs/pending               Obtener trabajos pendientes (workers)
  POST   /api/jobs/:id/start             Marcar como iniciado
  POST   /api/jobs/:id/complete          Marcar como completado
  POST   /api/jobs/:id/fail              Marcar como fallado
  POST   /api/jobs/:id/retry             Reintentar trabajo

  POST   /api/evidence/upload            Subir logs/screenshots
  GET    /api/evidence/:jobId            Descargar evidencias
  ```

#### 3. Sistema de Colas
- **Tecnología:** Redis + Bull
- **Cola:** `portability-jobs`
- **Procesamiento:**
  - Los workers hacen polling de trabajos pendientes
  - Opcional: WebSockets para push en tiempo real
- **Estados del trabajo:**
  - `WAITING` - Esperando worker disponible
  - `ASSIGNED` - Asignado a un worker
  - `PROCESSING` - En ejecución
  - `COMPLETED` - Completado exitosamente
  - `FAILED` - Falló (con reintentos)
  - `CANCELLED` - Cancelado por admin

#### 4. Base de Datos
- **Tecnología:** PostgreSQL
- **Nuevo modelo:**
  ```prisma
  model Worker {
    id            String    @id @default(uuid())
    name          String
    location      String    // Ubicación: "Sede Norte", "Distribuidor X"
    deviceId      String?   // ID del dispositivo Android
    status        WorkerStatus @default(OFFLINE)
    lastHeartbeat DateTime?
    ip            String?
    createdAt     DateTime  @default(now())
    jobs          Job[]
    device        Device?   @relation(fields: [deviceId], references: [id])

    @@map("workers")
  }

  model Job {
    id            String    @id @default(uuid())
    tramiteId     String
    tramite       Tramite   @relation(fields: [tramiteId], references: [id])
    workerId      String?
    worker        Worker?   @relation(fields: [workerId], references: [id])
    status        JobStatus @default(WAITING)
    priority      Int       @default(0)
    retryCount    Int       @default(0)
    maxRetries    Int       @default(3)
    assignedAt    DateTime?
    startedAt     DateTime?
    completedAt   DateTime?
    errorMessage  String?
    evidence      JobEvidence?

    @@map("jobs")
  }

  model JobEvidence {
    id            String   @id @default(uuid())
    jobId         String   @unique
    job           Job      @relation(fields: [jobId], references: [id])
    logsPath      String?
    screenshots   String[] // Array de URLs
    videoPath     String?
    metadata      Json?    // Datos adicionales

    @@map("job_evidence")
  }

  enum WorkerStatus {
    ONLINE
    BUSY
    OFFLINE
    ERROR
  }

  enum JobStatus {
    WAITING
    ASSIGNED
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }
  ```

### Capa 2: Nodo Ejecutor Local

#### 1. Worker Agent
- **Tecnología:** Node.js + TypeScript
- **Ubicación:** `worker-agent/` (nuevo directorio)
- **Funciones:**
  - **Registro:** Se registra en el backend al iniciar
  - **Heartbeat:** Envía heartbeat cada 30s
  - **Polling:** Consulta trabajos cada 5-10s
  - **Ejecución:** Ejecuta el script de Appium
  - **Reporting:** Sube logs, screenshots y resultados

#### 2. Stack de Automatización
- **Tecnología:** WebDriverIO + Appium
- **Ubicación:** `poc-login/` (existente)
- **Driver:** UiAutomator2
- **Conexión:** USB (preferido) o Wi-Fi ADB

#### 3. Requisitos del Nodo Local
- **Sistema:** Windows 10/11 o Linux (Ubuntu 20.04+)
- **Android SDK:** Platform Tools instalado
- **ADB:** Funcionando y dispositivo reconocido
- **Node.js:** v18+ LTS
- **Appium:** v2.x con UiAutomator2 driver
- **Dispositivo:** Android físico con app Movistar Onix

## 🔄 Flujo de Trabajo Detallado

### 1. Registro del Worker
```
1. Admin inicia worker-agent en nodo local
2. Agent lee configuración (API_URL, WORKER_NAME, LOCATION)
3. Agent POST /api/workers/register
4. Backend crea registro Worker con status=ONLINE
5. Agent inicia loop de heartbeat (cada 30s)
```

### 2. Procesamiento de Trabajo
```
PROMOTOR:
1. Promotor crea trámite en frontend
2. Backend guarda Tramite con status=PENDIENTE
3. Backend crea Job con status=WAITING
4. Job se añade a la cola

ADMIN:
5. Admin activa campaña/bot
6. Backend marca trámites como listos para procesar

WORKER AGENTE:
7. Agent hace GET /api/jobs/pending?workerId=X
8. Backend retorna trabajo disponible (o null)
9. Si hay trabajo:
   a. Agent POST /api/jobs/:id/start
   b. Job status → PROCESSING, startedAt=now
   c. Worker status → BUSY
   d. Agent ejecuta script Appium
   e. Agent captura logs y screenshots
   f. Si éxito:
      - Agent POST /api/jobs/:id/complete + folioId
      - Job status → COMPLETED, completedAt=now
      - Tramite status → COMPLETADO
      - Worker status → ONLINE
   g. Si error:
      - Agent POST /api/jobs/:id/fail + error
      - Si retryCount < maxRetries:
        - Job status → WAITING, retryCount++
      - Sino:
        - Job status → FAILED
      - Worker status → ONLINE (u ERROR si es crítico)
10. Si no hay trabajo:
    - Agent espera 5-10s y repite desde paso 7
```

### 3. Heartbeat y Monitoreo
```
WORKER AGENTE:
1. Cada 30s: PUT /api/workers/:id/heartbeat
2. Backend actualiza lastHeartbeat=now

BACKEND:
3. Cron job cada 60s: verifica workers
4. Si lastHeartbeat > 120s:
   - Worker status → OFFLINE
   - Jobs en PROCESSING → FAILED
   - Notifica admin
```

## 🛠️ Configuración

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Redis (Colas)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# JWT
JWT_SECRET="tu-secret-aqui"

# API
API_PORT="3000"
API_URL="https://api.tu-dominio.com"

# Workers
HEARTBEAT_TIMEOUT="120000"  # 2 minutos sin heartbeat = offline
JOB_TIMEOUT="600000"        # 10 minutos max por trabajo
MAX_RETRIES="3"

# Evidence Storage
EVIDENCE_PATH="/app/uploads/evidence"
EVIDENCE_URL_PREFIX="https://cdn.tu-dominio.com/evidence"
```

### Worker Agent (.env)
```env
# Backend Connection
API_URL="https://api.tu-dominio.com"
API_KEY="worker-api-key-aqui"  # Opcional, para autenticación adicional

# Worker Identity
WORKER_NAME="Worker-Sede-Norte-1"
WORKER_LOCATION="Sede Norte"
DEVICE_ID="emulator-5554"  # O identificador del dispositivo físico

# Polling
POLL_INTERVAL="5000"        # 5 segundos
HEARTBEAT_INTERVAL="30000"  # 30 segundos

# Appium
APPIUM_SERVER="http://localhost:4723"
APPIUM_CAPABILITIES='{"platformName":"Android","automationName":"UiAutomator2","appPackage":"es.indra.pc.mobile.activity.temm","appActivity":"es.indra.pc.mobile.activity.temm.LoginActivityTEMM","newCommandTimeout":"300"}'

# Evidence
EVIDENCE_UPLOAD_ENABLED="true"
EVIDENCE_PATH="./evidence"
```

## 📦 Deploy en Coolify

### docker-compose.yml
```yaml
version: "3.8"

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: movistar_bot
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  # Redis (Colas)
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Backend API
  backend:
    image: ghcr.io/tu-usuario/backend:latest
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/movistar_bot
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      NODE_ENV: production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # Frontend
  frontend:
    image: ghcr.io/tu-usuario/frontend:latest
    environment:
      VITE_API_URL: https://api.tu-dominio.com
    restart: unless-stopped

  # Nginx (Reverse Proxy)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## 🔧 Setup del Nodo Ejecutor Local

### Windows (PowerShell)
```powershell
# 1. Instalar dependencies
# Descargar Node.js LTS desde https://nodejs.org/

# 2. Instalar Android SDK Platform Tools
# Descargar desde https://developer.android.com/tools/releases/platform-tools
# Agregar a PATH

# 3. Verificar dispositivo ADB
adb devices
# Debe mostrar tu dispositivo

# 4. Habilitar ADB sobre USB en el dispositivo
# Config > Desarrollo > Opciones de programador > Depuración USB

# 5. Clonar repositorio worker-agent
git clone https://github.com/tu-usuario/worker-agent.git
cd worker-agent

# 6. Instalar dependencies
npm install

# 7. Configurar .env
cp .env.example .env
# Editar .env con tus valores

# 8. Iniciar Appium (en terminal separada)
npx appium

# 9. Iniciar worker agent
npm start
```

### Linux (Ubuntu)
```bash
# 1. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Instalar Android SDK Platform Tools
sudo apt-get update
sudo apt-get install android-tools-adb

# 3. Configurar reglas udev para ADB
sudo nano /etc/udev/rules.d/51-android.rules
# Agregar: SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0666"
sudo udevadm control --reload-rules

# 4. Verificar dispositivo
adb devices

# 5. Clonar e instalar worker-agent
git clone https://github.com/tu-usuario/worker-agent.git
cd worker-agent
npm install

# 6. Configurar
cp .env.example .env
nano .env

# 7. Crear servicio systemd
sudo cp worker-agent.service /etc/systemd/system/
sudo systemctl enable worker-agent
sudo systemctl start worker-agent

# 8. Verificar logs
sudo journalctl -u worker-agent -f
```

### worker-agent.service (systemd)
```ini
[Unit]
Description=Movistar Bot Worker Agent
After=network.target

[Service]
Type=simple
User=bot-worker
WorkingDirectory=/opt/worker-agent
ExecStart=/usr/bin/node /opt/worker-agent/dist/index.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
EnvironmentFile=/opt/worker-agent/.env

[Install]
WantedBy=multi-user.target
```

## 📊 Monitoreo y Logs

### Métricas del Worker
- Estado: ONLINE/BUSY/OFFLINE/ERROR
- Último heartbeat
- Trabajos completados
- Trabajos fallidos
- Tiempo promedio de ejecución
- Dispositivo conectado

### Métricas del Trabajo
- ID del trámite
- Worker asignado
- Tiempo de ejecución
- Estado actual
- Reintentos
- Evidencias (logs, screenshots)

### Alertas
- Worker offline > 2 minutos
- Trabajo fallado > 3 reintentos
- Tiempo de ejecución > 10 minutos
- Dispositivo no detectado

## 🔒 Seguridad

### Autenticación de Workers
- Opción 1: API Key en header
- Opción 2: JWT específico para workers
- Opción 3: Certificados mTLS

### Comunicación Segura
- HTTPS obligatorio (TLS 1.3)
- API rate limiting
- IP whitelist (opcional)
- VPN entre nodos y backend (opcional)

### Aislamiento
- Cada worker en su propia base de datos o schema (opcional)
- Sandboxing de scripts de Appium
- Límites de recursos por worker

## 🚀 Escalabilidad

### Horizontal Scaling
- Agregar más workers locales
- Cada worker puede manejar 1 dispositivo
- Máximo: 1 worker por dispositivo

### Vertical Scaling
- Mejor hardware en nodo local
- Múltiples dispositivos por nodo
- Paralelización de trabajos

### Geographic Distribution
- Workers en diferentes sedes
- Trabajos enrutados por ubicación
- Failover entre workers

## 📝 Próximos Pasos

1. ✅ Diseñar arquitectura
2. ⏳ Implementar sistema de colas (Redis + Bull)
3. ⏳ Crear API de workers en backend
4. ⏳ Desarrollar worker agent local
5. ⏳ Implementar sistema de heartbeat
6. ⏳ Agregar upload de evidencias
7. ⏳ Configurar deploy en Coolify
8. ⏳ Documentar setup completo
9. ⏳ Testing end-to-end
10. ⏳ Deploy a producción

## 💡 Ventajas de Esta Arquitectura

1. **Separación de responsabilidades:** Cloud maneja datos, local ejecuta
2. **Resilience:** Si un worker falla, otros continúan
3. **Flexibilidad:** Workers pueden agregarse dinámicamente
4. **Seguridad:** Dispositivos físicos no están expuestos directamente
5. **Costo:** Infraestructura optimizada, solo se escala backend
6. **Mantenimiento:** Workers pueden actualizarse independientemente
7. **Monitoreo:** Visibilidad completa de la operación
