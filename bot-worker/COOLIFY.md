# Deploy en Coolify - Movistar Bot Worker

Esta guía explica cómo desplegar los Bot Workers de Movistar en Coolify.

## Arquitectura en Coolify

```
┌─────────────────────────────────────────────────────────┐
│  Backend API (port 3001)                                 │
│  ├── POST /api/bot/ejecutar → Llama a workers           │
│  └── Gestiona colas y estado                             │
├─────────────────────────────────────────────────────────┤
│  Bot Worker 1 (port 3002) - Device A                     │
│  Bot Worker 2 (port 3003) - Device B                     │
│  Bot Worker 3 (port 3004) - Device C                     │
└─────────────────────────────────────────────────────────┘
```

## Requisitos Previos

1. **Appium Server**: Debes tener un servidor Appium corriendo y accesible desde los contenedores de Coolify.
2. **Dispositivos Android**: Los dispositivos deben estar conectados al servidor Appium.
3. **Coolify Instance**: Tener acceso a una instancia de Coolify.
4. **Git Repository**: El código debe estar en un repositorio Git (GitHub, GitLab, Bitbucket).

## Paso 1: Preparar el Repositorio

El proyecto `bot-worker` debe estar en su propio repositorio Git o en una subcarpeta del repositorio principal.

### Opción A: Repositorio Separado (Recomendado)

1. Crear un nuevo repositorio solo para `bot-worker`
2. Mover el contenido de `bot-worker/` a la raíz del repositorio
3. Hacer push del código

### Opción B: Subcarpeta del Repositorio Principal

1. Mantener `bot-worker` en el repositorio principal
2. Configurar Coolify para usar la subcarpeta

## Paso 2: Crear el Servicio en Coolify

### 2.1 Crear Nuevo Proyecto

1. En Coolify, ir a **Projects** → **New Project**
2. Conectar tu repositorio Git
3. Seleccionar el repositorio

### 2.2 Configurar el Servicio

1. **Resource Type**: Dockerfile
2. **Dockerfile Path**: `./Dockerfile` (o `./bot-worker/Dockerfile` si es subcarpeta)
3. **Context Path**: `.` (o `./bot-worker` si es subcarpeta)

### 2.3 Configurar Variables de Entorno

Para cada worker, necesitas configurar las siguientes variables de entorno:

#### Worker 1 (Device A)
```bash
WORKER_PORT=3002
WORKER_ID=movistar-bot-worker-1
TEMM_USER=tu_usuario_temm
TEMM_PASS=tu_password_temm
DEVICE_UDID=device_a_udid
APPIUM_HOST=appium-server  # IP o hostname del servidor Appium
APPIUM_PORT=4723
VERBOSE=false
```

#### Worker 2 (Device B)
```bash
WORKER_PORT=3003
WORKER_ID=movistar-bot-worker-2
TEMM_USER=tu_usuario_temm
TEMM_PASS=tu_password_temm
DEVICE_UDID=device_b_udid
APPIUM_HOST=appium-server
APPIUM_PORT=4723
VERBOSE=false
```

#### Worker 3 (Device C)
```bash
WORKER_PORT=3004
WORKER_ID=movistar-bot-worker-3
TEMM_USER=tu_usuario_temm
TEMM_PASS=tu_password_temm
DEVICE_UDID=device_c_udid
APPIUM_HOST=appium-server
APPIUM_PORT=4723
VERBOSE=false
```

### 2.4 Configurar Puertos

Para cada worker, exponer el puerto correspondiente:

- **Worker 1**: Port `3002`
- **Worker 2**: Port `3003`
- **Worker 3**: Port `3004`

## Paso 3: Configurar Health Checks

Coolify automatically health checks the `/health` endpoint:

- **Health Check Path**: `/health`
- **Interval**: 30 segundos
- **Timeout**: 10 segundos
- **Start Period**: 5 segundos
- **Retries**: 3

Esto está configurado en el Dockerfile, no necesita configuración adicional.

## Paso 4: Configurar el Backend

Actualizar el modelo `Device` en la base de datos para incluir la URL del worker:

```sql
ALTER TABLE devices ADD COLUMN worker_url TEXT;
```

Luego, actualizar cada dispositivo con su URL correspondiente:

```sql
UPDATE devices SET worker_url = 'http://movistar-bot-worker-1:3002' WHERE id = 'device-1-id';
UPDATE devices SET worker_url = 'http://movistar-bot-worker-2:3003' WHERE id = 'device-2-id';
UPDATE devices SET worker_url = 'http://movistar-bot-worker-3:3004' WHERE id = 'device-3-id';
```

O alternativamente, si usás IPs externas:

```sql
UPDATE devices SET worker_url = 'http://123.45.67.89:3002' WHERE id = 'device-1-id';
UPDATE devices SET worker_url = 'http://123.45.67.89:3003' WHERE id = 'device-2-id';
UPDATE devices SET worker_url = 'http://123.45.67.89:3004' WHERE id = 'device-3-id';
```

## Paso 5: Networking

### Opción A: Coolify Docker Network (Recomendado)

Si el backend y los workers están en el mismo servidor Coolify:

1. Los contenedores pueden comunicarse usando los nombres de los servicios
2. Ejemplo: `http://movistar-bot-worker-1:3002`

### Opción B: IPs Externas

Si el servidor Appium está en un servidor diferente:

1. Usar la IP del servidor donde está Appium
2. Configurar `APPIUM_HOST` con la IP correcta
3. Asegurarse de que el firewall permita conexiones

## Paso 6: Deploy

1. Hacer commit y push de los cambios
2. Coolify detectará los cambios automáticamente
3. El deploy comenzará automáticamente
4. Monitorear el deploy en la pestaña "Deployments" de Coolify

## Paso 7: Verificar Deploy

### Verificar Health Check

```bash
curl http://movistar-bot-worker-1:3002/health
curl http://movistar-bot-worker-2:3003/health
curl http://movistar-bot-worker-3:3004/health
```

### Verificar Appium Connection

```bash
curl http://movistar-bot-worker-1:3002/appium-check
```

### Verificar desde el Backend

El backend ya está configurado para llamar a los workers. Solo asegúrate de que:

1. Los workers estén corriendo
2. La tabla `devices` tenga las URLs correctas
3. El servidor Appium esté accesible

## Troubleshooting

### Error: "Cannot connect to Appium"

**Solución**: Verificar que `APPIUM_HOST` y `APPIUM_PORT` sean correctos. Si Appium está en otro servidor, usar la IP externa.

### Error: "Device not found"

**Solución**: Verificar que el dispositivo esté conectado al servidor Appium:
```bash
adb devices
```

### Error: "Worker is already executing"

**Solución**: El worker solo puede procesar un trámite a la vez. Esperar a que termine o cancelar con `POST /cancel`.

### Worker no responde

**Solución**: Verificar los logs del contenedor en Coolify:
1. Ir al servicio
2. Click en "Logs"
3. Buscar errores o warnings

## Escalado

Para agregar más workers:

1. Crear un nuevo servicio en Coolify
2. Usar el mismo Dockerfile
3. Cambiar `WORKER_ID` y `WORKER_PORT`
4. Configurar el `DEVICE_UDID` del nuevo dispositivo
5. Agregar el dispositivo a la base de datos

## Monitoreo

Coolify provee monitoreo automático vía:

- **Health Checks**: Verifica `/health` cada 30 segundos
- **Logs**: Logs del contenedor en tiempo real
- **Metrics**: CPU, RAM, y uso de disco

## Seguridad

1. No hacer commit de `.env` con credenciales reales
2. Usar Coolify Secrets para variables sensibles
3. Rotar credenciales TEMM periódicamente
4. Limitar acceso a los endpoints del worker (firewall)
