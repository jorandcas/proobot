#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     MOVISTAR BOT - QUICK START SETUP                       ║"
echo "║     Script de configuración inicial rápida                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js no está instalado${NC}"
    echo "Por favor instala Node.js 18+ LTS desde https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js instalado: $NODE_VERSION${NC}"

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Debes ejecutar este script desde el directorio del backend${NC}"
    echo "Ejecuta: cd plataforma-promotores/backend"
    exit 1
fi

echo ""
echo "Este script te guiará en la configuración inicial del backend."
echo "Presiona Ctrl+C en cualquier momento para cancelar."
echo ""

# Paso 1: Instalar dependencias
echo -e "${YELLOW}[1/6] Instalando dependencias...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error instalando dependencias${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# Paso 2: Crear archivo .env
echo ""
echo -e "${YELLOW}[2/6] Configurando variables de entorno...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Archivo .env creado${NC}"
        echo -e "${YELLOW}⚠️  Por favor edita .env con tu configuración de base de datos${NC}"
    else
        echo -e "${RED}❌ Error: No se encuentra .env.example${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Archivo .env ya existe${NC}"
fi

# Paso 3: Generar cliente Prisma
echo ""
echo -e "${YELLOW}[3/6] Generando cliente Prisma...${NC}"
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error generando cliente Prisma${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Cliente Prisma generado${NC}"

# Paso 4: Ejecutar migraciones
echo ""
echo -e "${YELLOW}[4/6] Ejecutando migraciones de base de datos...${NC}"
read -p "¿Ya has creado la base de datos 'movistar_bot'? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate dev
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error en migraciones${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Migraciones ejecutadas${NC}"
else
    echo -e "${YELLOW}⚠️  Por favor crea la base de datos primero:${NC}"
    echo "  psql -U postgres"
    echo "  CREATE DATABASE movistar_bot;"
    echo "  \\q"
    echo ""
    read -p "Presiona Enter cuando hayas creado la base de datos..."
    npx prisma migrate dev
fi

# Paso 5: Crear directorios
echo ""
echo -e "${YELLOW}[5/6] Creando directorios necesarios...${NC}"
mkdir -p uploads/evidence
echo -e "${GREEN}✓ Directorios creados${NC}"

# Paso 6: Crear usuario admin
echo ""
echo -e "${YELLOW}[6/6] Creando usuario administrador...${NC}"
read -p "¿Deseas crear un usuario admin ahora? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run create-admin
fi

# Resumen
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ✓ CONFIGURACIÓN COMPLETADA                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "Siguientes pasos:"
echo ""
echo "1. Iniciar el backend:"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "2. En otra terminal, iniciar el frontend:"
echo -e "   ${BLUE}cd ../frontend && npm run dev${NC}"
echo ""
echo "3. En otra terminal, iniciar el worker agent:"
echo -e "   ${BLUE}cd ../../worker-agent && npm run dev${NC}"
echo ""
echo "4. Abrir el navegador:"
echo -e "   ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}⚠️  No olvides iniciar Redis antes de ejecutar el backend:${NC}"
echo -e "   ${BLUE}docker run -d -p 6379:6379 redis:7-alpine${NC}"
echo ""
echo -e "Para más información, consulta: ${BLUE}GUIA-PASO-A-PASO.md${NC}"
echo ""
