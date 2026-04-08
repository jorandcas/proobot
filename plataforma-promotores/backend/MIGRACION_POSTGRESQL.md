# Migración de JSON a PostgreSQL

## 📋 Estado Actual
- ✅ Esquema Prisma creado
- ✅ Modelos definidos
- ⏳ PostgreSQL necesita ser instalado/configurado
- ⏳ Migración pendiente

---

## 1️⃣ Instalar PostgreSQL

### Opción A: Windows (Recomendado para desarrollo local)

1. **Descargar PostgreSQL**
   - Ir a: https://www.postgresql.org/download/windows/
   - Descargar la última versión (16.x o 17.x)

2. **Instalar**
   - Ejecutar el instalador
   - Puerto por defecto: `5432`
   - Contraseña de `postgres`: **GUARDARLA** (la necesitarás)
   - Asegurarte de instalar **pgAdmin 4** (opcional pero útil)

3. **Verificar instalación**
   ```bash
   psql --version
   # Debe mostrar: psql (PostgreSQL) 16.x
   ```

### Opción B: Docker (Más simple)

```bash
docker run --name postgres-govi \
  -e POSTGRES_PASSWORD=tu_contraseña_segura \
  -e POSTGRES_DB=govi_db \
  -p 5432:5432 \
  -d postgres:16-alpine
```

### Opción C: Cloud (Recomendado para producción)

- **Neon.tech**: https://neon.tech (Gratis hasta 0.5GB)
- **Supabase**: https://supabase.com (Gratis hasta 500MB)
- **Railway**: https://railway.app (Gratis $5 crédito)

---

## 2️⃣ Crear la Base de Datos

### Usando psql (terminal):

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE govi_db;

# Crear usuario (opcional, puedes usar postgres)
CREATE USER govi_user WITH PASSWORD 'tu_contraseña_segura';

# Dar permisos
GRANT ALL PRIVILEGES ON DATABASE govi_db TO govi_user;

# Salir
\q
```

### Usando pgAdmin (GUI):

1. Abrir pgAdmin 4
2. Click derecho en "Databases" → "Create" → "Database"
3. Nombre: `govi_db`
4. Click en "Save"

---

## 3️⃣ Configurar DATABASE_URL

Editar `plataforma-promotores/backend/.env`:

```env
# OPCIÓN 1: Usuario por defecto (postgres)
DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/govi_db?schema=public"

# OPCIÓN 2: Usuario dedicado (recomendado)
DATABASE_URL="postgresql://govi_user:tu_contraseña_segura@localhost:5432/govi_db?schema=public"

# OPCIÓN 3: Cloud (Neon/Supabase/Railway)
DATABASE_URL="postgresql://usuario:contraseña@host-cloud:5432/govi_db?schema=public&sslmode=require"
```

⚠️ **IMPORTANTE**: Reemplazar `TU_CONTRASEÑA` con la contraseña real.

---

## 4️⃣ Ejecutar Migraciones

Una vez PostgreSQL esté configurado:

```bash
# Desde la raíz del backend
cd plataforma-promotores/backend

# Generar cliente Prisma
npx prisma generate

# Crear migración inicial
npx prisma migrate dev --name init

# (Opcional) Abrir Prisma Studio para visualizar datos
npx prisma studio
```

---

## 5️⃣ Migrar Datos Existentes

```bash
# Ejecutar script de migración
npm run migrate:data
```

Este script:
1. Lee `database.json` (base de datos actual)
2. Inserta todos los datos en PostgreSQL
3. Verifica la migración
4. Crea backup del JSON original

---

## 6️⃣ Verificar Migración

```bash
# Abrir Prisma Studio
npx prisma studio

# Verificar que veas:
# ✓ usuarios (3 registros)
# ✓ campanas (8+ registros)
# ✓ tramites (todos los registros)
# ✓ bot_logs (todos los registros)
# ✓ devices (1 registro)
# ✓ bot_executions (todos los registros)
```

---

## 🚨 Solución de Problemas

### Error: "Connection refused"

**Problema**: PostgreSQL no está corriendo

**Solución**:
```bash
# Windows: Iniciar servicio PostgreSQL
# Abre "Services" (services.msc) → busca "PostgreSQL" → Iniciar

# Docker:
docker start postgres-govi
```

### Error: "password authentication failed"

**Problema**: Contraseña incorrecta en DATABASE_URL

**Solución**:
1. Verificar contraseña de PostgreSQL
2. Actualizar `.env` con la contraseña correcta

### Error: "database does not exist"

**Problema**: Base de datos no creada

**Solución**:
```bash
psql -U postgres -c "CREATE DATABASE govi_db;"
```

---

## ✅ Checklist de Migración

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `govi_db` creada
- [ ] `.env` actualizado con DATABASE_URL correcto
- [ ] `npx prisma generate` ejecutado
- [ ] `npx prisma migrate dev --name init` ejecutado
- [ ] Datos migrados con `npm run migrate:data`
- [ ] Prisma Studio abre y muestra datos
- [ ] Backend inicia sin errores
- [ ] Tests manuales pasan

---

## 📞 Próximos Pasos

Una vez migrado a PostgreSQL:

1. **Actualizar código backend**
   - Reemplazar `database-manager.ts` con Prisma Client
   - Actualizar todos los services

2. **Testing**
   - Verificar login
   - Crear trámite
   - Ejecutar bot

3. **Backup automático**
   - Configurar pg_dump para backups diarios
   - Implementar restores de prueba

---

## 🎯 Ventajas de la Migración

- ✅ **Concurrencia**: Múltiples admins pueden operar simultáneamente
- ✅ **Transacciones**: ACID guarantees
- ✅ **Escalabilidad**: Soporta millones de registros
- ✅ **Queries complejas**: JOINs, agregaciones, etc.
- ✅ **Backup automático**: Herramientas maduras de PostgreSQL
- ✅ **Performance**: Índices y query optimization
