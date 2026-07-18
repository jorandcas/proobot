#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
ERRORS=""

pass() { PASS=$((PASS+1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); ERRORS="$ERRORS\n  ❌ $1"; echo "  ❌ $1"; }

section() { echo ""; echo "════════════════════════════════════════════"; echo "  $1"; echo "════════════════════════════════════════════"; }

check_env() {
  local var="$1"
  local label="${2:-$var}"
  if [ -z "${!var:-}" ]; then
    fail "$label no definida"
  else
    pass "$label = ${!var:0:20}..."
  fi
}

check_cmd() {
  if command -v "$1" &>/dev/null; then
    pass "$2 instalado"
  else
    fail "$2 no instalado"
  fi
}

# ═══════════════════════════════════════════
#  A. VARIABLES DE ENTORNO
# ═══════════════════════════════════════════
section "A. Variables de Entorno"

check_env "DATABASE_URL" "DATABASE_URL"
check_env "JWT_SECRET" "JWT_SECRET"
check_env "REDIS_HOST" "REDIS_HOST"

if [ -n "${JWT_SECRET:-}" ]; then
  if [ ${#JWT_SECRET} -ge 32 ]; then
    pass "JWT_SECRET longitud >= 32"
  else
    fail "JWT_SECRET demasiado corto (< 32 caracteres)"
  fi
fi

if [ -n "${DATABASE_URL:-}" ]; then
  if echo "$DATABASE_URL" | grep -qE '^postgresql://'; then
    pass "DATABASE_URL formato vÃ¡lido"
  else
    fail "DATABASE_URL formato invÃ¡lido (debe comenzar con postgresql://)"
  fi
fi

# ═══════════════════════════════════════════
#  B. CONEXIONES
# ═══════════════════════════════════════════
section "B. Conexiones"

if command -v node &>/dev/null; then
  if node -e "
    const p = require('pg');
    const pool = new p.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
    pool.query('SELECT 1').then(() => { console.log('pg_ok'); process.exit(0); }).catch(() => { process.exit(1); });
  " 2>/dev/null | grep -q pg_ok; then
    pass "PostgreSQL conexiÃ³n exitosa"
  else
    fail "PostgreSQL no responde (verifica DATABASE_URL y que el servidor estÃ© corriendo)"
  fi

  if node -e "
    const Redis = require('ioredis');
    const r = new Redis({ host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379'), password: process.env.REDIS_PASSWORD, lazyConnect: true });
    r.connect().then(() => { r.disconnect(); process.exit(0); }).catch(() => process.exit(1));
  " 2>/dev/null; then
    pass "Redis conexiÃ³n exitosa"
  else
    fail "Redis no responde (verifica REDIS_HOST y que el servidor estÃ© corriendo)"
  fi
else
  fail "Node.js no instalado (no se pueden probar conexiones)"
fi

# ═══════════════════════════════════════════
#  C. PRISMA
# ═══════════════════════════════════════════
section "C. Prisma"

BACKEND_DIR="$ROOT_DIR/plataforma-promotores/backend"

if [ -f "$BACKEND_DIR/package.json" ]; then
  if [ -f "$BACKEND_DIR/node_modules/.prisma/client/index.js" ]; then
    pass "Prisma Client generado"
  else
    fail "Prisma Client no generado (correr: cd $BACKEND_DIR && npx prisma generate)"
  fi

  if [ -d "$BACKEND_DIR/prisma/migrations" ]; then
    pass "Carpeta de migraciones existe"
  else
    fail "No hay migraciones en prisma/migrations"
  fi
else
  fail "backend/package.json no encontrado"
fi

# ═══════════════════════════════════════════
#  D. BUILDS
# ═══════════════════════════════════════════
section "D. Builds"

build_check() {
  local name="$1"
  local dir="$2"
  echo "  --- $name ---"
  if (cd "$dir" && npm run build 2>&1 | tail -5); then
    pass "$name build exitoso"
  else
    fail "$name build fallÃ³"
  fi
}

build_check "Backend" "$BACKEND_DIR"

FRONTEND_DIR="$ROOT_DIR/plataforma-promotores/frontend"
if [ -d "$FRONTEND_DIR" ]; then
  build_check "Frontend" "$FRONTEND_DIR"
fi

WORKER_DIR="$ROOT_DIR/worker-agent"
if [ -d "$WORKER_DIR" ]; then
  build_check "Worker Agent" "$WORKER_DIR"
fi

# ═══════════════════════════════════════════
#  E. ON-PREMISE (WORKER AGENT)
# ═══════════════════════════════════════════
section "E. On-Premise (Worker Agent)"

ENV_FILE="$WORKER_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  pass "worker-agent/.env existe"
  API_URL=$(grep -E '^API_URL=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)
  if [ -n "$API_URL" ]; then
    pass "API_URL = $API_URL"
  fi
else
  fail "worker-agent/.env no encontrado (copiar desde .env.example y configurar)"
fi

check_cmd "adb" "ADB (Android Debug Bridge)"
check_cmd "appium" "Appium"

if command -v adb &>/dev/null; then
  DEVICES=$(adb devices 2>/dev/null | grep -v "^List" | grep -v "^$" | grep -v "offline" | grep "device" | wc -l)
  if [ "$DEVICES" -gt 0 ]; then
    pass "Dispositivos Android conectados: $DEVICES"
  else
    fail "No se detectan dispositivos Android (adb devices)"
  fi
fi

if command -v node &>/dev/null; then
  if node -e "
    const p = require('child_process');
    const r = p.execSync('appium --version 2>/dev/null || echo no');
    if (r.toString().trim() !== 'no') process.exit(0); else process.exit(1);
  " 2>/dev/null; then
    pass "Appium versiÃ³n detectada"
  else
    fail "Appium no responde (appium --version)"
  fi
fi

if [ -d "$WORKER_DIR/dist" ]; then
  if [ -f "$WORKER_DIR/dist/index.js" ]; then
    pass "Worker Agent compilado (dist/index.js existe)"
  else
    fail "Worker Agent no compilado (falta dist/index.js)"
  fi
fi

# ═══════════════════════════════════════════
#  F. HEALTH CHECK
# ═══════════════════════════════════════════
section "F. Health Check"

if curl -sf http://localhost:3001/health 2>/dev/null; then
  pass "Backend health check (puerto 3001)"
else
  fail "Backend no disponible en http://localhost:3001/health (puede no estar corriendo)"
fi

if curl -sf http://localhost:3001/api/workers/health 2>/dev/null; then
  pass "Workers health check"
else
  fail "Workers endpoint no disponible"
fi

# ═══════════════════════════════════════════
#  G. SEGURIDAD
# ═══════════════════════════════════════════
section "G. Seguridad"

if [ "${JWT_SECRET:-}" = "your-secret-key-change-in-production" ] || [ "${JWT_SECRET:-}" = "tu_secreto_jwt_aqui_cambialo_en_produccion" ]; then
  fail "JWT_SECRET usa valor por defecto - CAMBIAR"
else
  pass "JWT_SECRET no usa valor por defecto"
fi

GITIGNORED=$(cd "$ROOT_DIR" && git check-ignore plataforma-promotores/backend/.env 2>/dev/null || true)
if [ -n "$GITIGNORED" ]; then
  pass ".env en .gitignore"
else
  fail ".env no estÃ¡ en .gitignore - riesgo de filtrar credenciales"
fi

# ═══════════════════════════════════════════
#  RESUMEN
# ═══════════════════════════════════════════
section "Resumen"
echo "  ✅ Pasaron:  $PASS"
echo "  ❌ Fallaron: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "Errores:$ERRORS"
  echo ""
  echo "⚠️  Algunas verificaciones fallaron. Revisa los detalles arriba."
  exit 1
else
  echo ""
  echo "🎉 Todas las verificaciones pasaron exitosamente."
  exit 0
fi
