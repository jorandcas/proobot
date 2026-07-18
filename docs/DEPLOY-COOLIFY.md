# Deploy en Coolify

Esta guía asume que tienes un servidor Coolify funcionando (Hetzner, DigitalOcean, etc.) con acceso a la UI web de Coolify.

---

## 1. Obtener el repositorio

Conecta tu repositorio Git en Coolify con la rama principal. La estructura relevante es:

```
proobot/
├── plataforma-promotores/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── prisma/        ← migraciones + schema
│   │   └── src/
│   └── frontend/
│       ├── Dockerfile
│       ├── nginx.conf     ← proxy /api al backend
│       └── src/
```

---

## 2. Recursos a crear

| # | Recurso | Tipo en Coolify | Puerto expuesto | Nombre interno |
|---|---------|-----------------|-----------------|----------------|
| 1 | PostgreSQL | Database | 5432 | `movistar-postgres` |
| 2 | Redis | Database | 6379 | `movistar-redis` |
| 3 | Backend | App (Dockerfile) | 3001 | `movistar-backend` |
| 4 | Frontend | App (Dockerfile) | 80 | `movistar-frontend` |

> Los "nombres internos" los asigna Coolify automáticamente y se usan como hostname dentro de la red Docker.

---

## 3. Crear PostgreSQL

- **Name**: `movistar-postgres` (o el que quieras)
- **Image**: `postgres:15-alpine`
- **Port**: `5432`
- Coolify genera automáticamente: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- **Anota los valores generados** — los necesitas para `DATABASE_URL`

---

## 4. Crear Redis

- **Name**: `movistar-redis` (o el que quieras)
- **Image**: `redis:7-alpine`
- **Port**: `6379`

---

## 5. Desplegar Backend

Tipo: **App** → **Dockerfile**

| Configuración | Valor |
|--------------|-------|
| **Build Pack** | `Dockerfile` |
| **Dockerfile Location** | `/plataforma-promotores/backend/Dockerfile` |
| **Dockerfile Context** | `/plataforma-promotores/backend` |
| **Port** | `3001` |

### Variables de Entorno

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://user:pass@movistar-postgres:5432/movistar_bot` |
| `REDIS_HOST` | Nombre interno del servicio Redis | `movistar-redis` |
| `REDIS_PORT` | `6379` | `6379` |
| `REDIS_PASSWORD` | Déjalo vacío si no configuraste contraseña | *(vacío)* |
| `JWT_SECRET` | **Al menos 32 caracteres aleatorios** | Genera con: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `24h` | `24h` |
| `NODE_ENV` | `production` | `production` |
| `ADMIN_EMAIL` | Email del admin inicial | `admin@ejemplo.com` |
| `ADMIN_PASSWORD` | Contraseña del admin inicial | *(cambiar después)* |
| `ADMIN_NAME` | Nombre del admin | `Administrador` |

### Health Check

Coolify lo detecta automáticamente por el `HEALTHCHECK` en el Dockerfile:
```
curl http://localhost:3001/health
```

---

## 6. Desplegar Frontend

Tipo: **App** → **Dockerfile**

| Configuración | Valor |
|--------------|-------|
| **Build Pack** | `Dockerfile` |
| **Dockerfile Location** | `/plataforma-promotores/frontend/Dockerfile` |
| **Dockerfile Context** | `/plataforma-promotores/frontend` |
| **Port** | `80` |

### Build Args (obligatorio)

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | URL del backend **desde el navegador**. Si usas dominio propio: `https://api.tudominio.com/api`. Si frontend y backend están bajo el mismo dominio con Traefik: `/api` |

> El nginx del frontend ya proxy `/api` → `movistar-backend:3001`. Si usas Rutas Traefik en Coolify, apunta el frontend a `tudominio.com` y el backend a `api.tudominio.com`.

### Health Check

Coolify detecta el puerto 80.

---

## 7. Después del deploy

### 7.1 Generar JWT_SECRET (si no lo hiciste)

```bash
openssl rand -hex 32
# Ejemplo output: 7f8a9b3c2d1e0f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f
```

Actualiza la variable `JWT_SECRET` en Coolify y redeployea el backend.

### 7.2 Verificar que funciona

```bash
# Health check
curl https://api.tudominio.com/health

# Login de admin
curl -X POST https://api.tudominio.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@ejemplo.com","contrasena":"tu_password"}'
```

Si el login responde con un `token`, todo está bien.

### 7.3 Crear admin inicial

Si no configuraste `ADMIN_EMAIL`/`ADMIN_PASSWORD` antes del primer deploy, créalo manualmente:

```bash
# Ejecutar dentro del contenedor del backend
node dist/scripts/create-admin.js --admin
```

O desde la terminal de Coolify (exec en el contenedor):

```bash
DATABASE_URL="postgresql://..." node -e "
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.create({ data: { correo: 'admin@ejemplo.com', contrasena: hash, rol: 'ADMIN', nombre: 'Admin' } });
  console.log('Admin creado');
  await prisma.\$disconnect();
})();
```

---

## 8. Conectar el Worker Agent

Después del deploy, en la **PC local** con el teléfono Android conectado:

```bash
# 1. Clonar repo o copiar worker-agent/
cd worker-agent

# 2. Configurar
cp .env.example .env
# Editar API_URL = https://api.tudominio.com/api
# Editar WORKER_ID = nombre-unico-del-worker (ej: "pc-oficina-1")
# Editar WORKER_LOCATION = "Sede Norte" (donde está físicamente)

# 3. Instalar y compilar
npm install && npm run build

# 4. Iniciar Appium
appium

# 5. Conectar teléfono Android por USB y verificar
adb devices

# 6. Iniciar worker
npm start
```

El worker se registrará automáticamente y empezará a tomar Jobs de la cola.

---

## 9. Flujo completo

```
Promotor web → crea trámite → queda PENDIENTE
Admin web → click "Ejecutar Bot" → crea Jobs en cola
Worker Agent (PC local) → detecta Job → ejecuta Appium en teléfono → reporta resultado
Backend → actualiza trámite (COMPLETADO / ERROR) + BotLog
Promotor web → ve resultado
```

---

## 10. Troubleshooting

| Problema | Causa probable | Solución |
|----------|---------------|----------|
| Backend no arranca | `DATABASE_URL` incorrecta | Verificar credenciales en la UI de Coolify |
| Frontend carga pero API no responde | `VITE_API_URL` incorrecta | Revisar Build Args, redeployear |
| Worker no se conecta | `API_URL` incorrecta o backend no accesible | Verificar que `api.tudominio.com` resuelva desde la red local |
| Login no funciona | Admin no creado | Ejecutar script de creación en el contenedor |
| Prisma migration falla | DB no disponible al iniciar | El Dockerfile reintenta 30 veces (60s) antes de fallar |
