# 🚀 Comandos Útiles - Referencia Rápida

## 📋 Setup Inicial

### Backend
```bash
cd plataforma-promotores/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env

# Ejecutar script de quick start
./quick-start.sh        # Linux/Mac
quick-start.bat         # Windows

# O manual:
npx prisma generate
npx prisma migrate dev
mkdir -p uploads/evidence

# Crear usuario admin
npm run create-admin
```

### Frontend
```bash
cd plataforma-promotores/frontend

npm install
cp .env.example .env
# Editar: VITE_API_URL=http://localhost:3001
```

### Worker Agent
```bash
cd worker-agent

npm install
cp .env.example .env
# Editar: API_URL=http://localhost:3001
```

---

## 🎯 Comandos de Desarrollo

### Backend
```bash
cd plataforma-promotores/backend

# Iniciar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar en producción
npm start

# Ver base de datos (UI)
npx prisma studio

# Crear usuario admin
npm run create-admin

# Crear usuario (admin o promotor)
npm run create-user
```

### Frontend
```bash
cd plataforma-promotores/frontend

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar producción
npm run preview
```

### Worker Agent
```bash
cd worker-agent

# Desarrollo
npm run dev

# Compilar
npm run build

# Producción
npm start

# Test de conexión
npm run test
```

---

## 🗄️ Base de Datos

### PostgreSQL
```bash
# Entrar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE movistar_bot;

# Conectarse a la base
\c movistar_bot;

# Ver tablas
\dt

# Salir
\q
```

### Prisma
```bash
# Generar cliente
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones pendientes
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio

# Resetear base de datos (cuidado: borra todo)
npx prisma migrate reset

# Formatear schema
npx prisma format
```

---

## 🔧 Redis

### Docker
```bash
# Iniciar Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Ver logs
docker logs -f redis

# Detener
docker stop redis

# Iniciar de nuevo
docker start redis

# Eliminar
docker rm redis
```

### Redis CLI
```bash
# Conectarse
redis-cli

# Ver todas las keys
KEYS *

# Ver una key
GET keyname

# Eliminar key
DEL keyname

# Eliminar todas las keys
FLUSHDB

# Salir
exit
```

---

## 📱 ADB (Android Debug Bridge)

### Dispositivos
```bash
# Ver dispositivos conectados
adb devices

# Reiniciar ADB
adb kill-server
adb start-server

# Conectar dispositivo por WiFi (previamente conectado por USB)
adb tcpip 5555
adb connect 192.168.1.x:5555

# Desconectar WiFi
adb disconnect
```

### Apps
```bash
# Listar apps instaladas
adb shell pm list packages

# Instalar app
adb install mi-app.apk

# Desinstalar app
adb uninstall com.package.app

# Limpiar datos de app
adb shell pm clear com.package.app

# Iniciar app
adb shell monkey -p com.package.app -c android.intent.category.LAUNCHER 1

# Detener app
adb shell am force-stop com.package.app
```

### Logs
```bash
# Ver logs en tiempo real
adb logcat

# Filtrar logs
adb logcat | grep "MiApp"

# Guardar logs a archivo
adb logcat > logs.txt

# Limpiar logs
adb logcat -c
```

---

## 🤖 Appium

### Iniciar
```bash
# Iniciar Appium
appium

# Iniciar con dirección IP específica
appium -a 127.0.0.1 -p 4723

# Verificar instalación
appium -v

# Ver drivers instalados
appium driver list

# Instalar UiAutomator2 driver
appium driver install uiautomator2

# Doctores (verificar instalación)
appium doctor
```

---

## 🔍 Debugging

### Backend
```bash
# Ver logs del proceso
npm run dev 2>&1 | tee logs.txt

# Ver logs de Docker
docker logs -f movistar-backend
docker logs -f movistar-postgres
docker logs -f movistar-redis

# Ver logs de Worker Agent
tail -f worker-agent/logs/worker.log
tail -f worker-agent/logs/error.log
```

### Base de Datos
```bash
# Ver querys en tiempo real
# Abrir Prisma Studio
npx prisma studio

# Ver conexiones a PostgreSQL
psql -U postgres -c "SELECT * FROM pg_stat_activity;"
```

### Worker Agent
```bash
# Ver logs completos
cd worker-agent
tail -f logs/worker.log

# Ver solo errores
tail -f logs/error.log

# Ver últimos 100 logs
tail -n 100 logs/worker.log

# Buscar en logs
grep "ERROR" logs/worker.log
grep "Job completed" logs/worker.log
```

---

## 🧹 Limpieza y Mantenimiento

### Backend
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar compilación
rm -rf dist
npm run build

# Limpiar evidencias antiguas
# (El sistema lo hace automáticamente, pero puedes forzar)
# En Prisma Studio, eliminar registros antiguos de job_evidence
```

### Worker Agent
```bash
# Limpiar evidencias
cd worker-agent
rm -rf evidence/*

# Limpiar logs
rm -rf logs/*.log

# Reiniciar worker agent
# Si está corriendo como servicio:
sudo systemctl restart worker-agent  # Linux
nssm restart MovistarWorker          # Windows
```

### Docker
```bash
# Detener todos los contenedores
docker stop $(docker ps -aq)

# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes no usadas
docker image prune -a

# Eliminar volúmenes no usados
docker volume prune

# Limpiar todo
docker system prune -a
```

---

## 📊 Monitoreo

### Verificar Estado del Sistema
```bash
# Backend
curl http://localhost:3001/health

# Worker Agent
curl -H "X-Worker-API-Key: tu-key" http://localhost:3001/api/workers/health

# Redis
redis-cli ping

# PostgreSQL
pg_isready -U postgres
```

### Estadísticas en Vivo
```bash
# Backend - Ver workers conectados
curl http://localhost:3001/api/workers

# Backend - Ver cola de trabajos
curl http://localhost:3001/api/workers/queue/stats

# Backend - Ver estadísticas de dashboard
curl http://localhost:3001/api/dashboard/stats
```

---

## 🔐 Seguridad

### Cambiar Contraseñas
```bash
# Usuario admin/promotor
cd plataforma-promotores/backend
npm run create-user

# O en Prisma Studio:
# 1. Abrir npx prisma studio
# 2. Ir a tabla usuarios
# 3. Editar usuario
# 4. Cambiar contrasena (se hashea automáticamente)
```

### Regenerar API Keys
```bash
# Si necesitas regenerar la API key de un worker:
# En Prisma Studio:
# 1. Ir a tabla workers
# 2. Editar worker
# 3. Generar nueva apiKey (usa nanoid)
# 4. Actualizar .env del worker agent
```

---

## 🚀 Deploy a Producción

### Build para Producción
```bash
# Backend
cd plataforma-promotores/backend
npm run build
npm start

# Frontend
cd plataforma-promotores/frontend
npm run build

# Worker Agent
cd worker-agent
npm run build
npm start
```

### Coolify
```bash
# Seguir guía en COOLIFY.md

# Resumen rápido:
# 1. Push a GitHub
# 2. En Coolify: New Resource → Git Repository
# 3. Configurar variables de entorno
# 4. Deploy
```

---

## 🆘 Emergencias

### Backend no inicia
```bash
# Verificar PostgreSQL
pg_isready -U postgres

# Verificar Redis
redis-cli ping

# Verificar puerto no esté en uso
lsof -i :3001  # Linux/Mac
netstat -ano | findstr :3001  # Windows

# Reiniciar servicios
sudo systemctl restart postgresql
sudo systemctl restart redis
```

### Worker Agent no se conecta
```bash
# Verificar API key
cat worker-agent/.env

# Verificar backend esté corriendo
curl http://localhost:3001/health

# Verificar conectividad
ping localhost
telnet localhost 3001

# Reiniciar worker agent
cd worker-agent
npm run dev
```

### Dispositivo Android no se conecta
```bash
# Verificar ADB
adb devices

# Si no aparece:
# 1. Habilitar depuración USB en el dispositivo
# 2. Aceptar prompt de autorización en el dispositivo
# 3. Reconectar cable USB
# 4. Reiniciar ADB: adb kill-server && adb start-server

# Verificar Appium
appium doctor
```

---

## 📞 Ayuda

### Documentación
- `ARQUITECTURA.md` - Arquitectura completa
- `COOLIFY.md` - Guía de deploy
- `GUIA-PASO-A-PASO.md` - Setup detallado
- `worker-agent/README.md` - Worker agent

### Logs Importantes
- Backend: Consola o `logs/`
- Worker Agent: `worker-agent/logs/`
- Prisma Studio: http://localhost:5555
- Appium: Consola donde corre `appium`

### Ver Versiones
```bash
node -v
npm -v
adb version
appium -v
redis-cli --version
psql --version
```

---

**Tip:** Guarda este archivo como referencia rápida. Agrega tus propios comandos personalizadas según tus necesidades.
