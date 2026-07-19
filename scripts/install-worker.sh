#!/bin/bash
# ============================================================================
# PROOBOT WORKER - Instalador Automático (Linux / WSL)
# ============================================================================
# Este script instala y configura el worker agent automáticamente.
# Uso: curl -sL https://raw.githubusercontent.com/jorandcas/proobot/master/scripts/install-worker.sh | bash
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variables
BACKEND_URL="http://ebpfykj4a0iv4uoux8avofjf.5.78.108.74.sslip.io/api"
WORKER_NAME="Worker-Local-1"
WORKER_LOCATION="Sede Principal"
INSTALL_DIR="$HOME/proobot-worker"

# Funciones de utilidad
print_header() {
    echo -e "\n${CYAN}════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}          ${YELLOW}PROOBOT WORKER - Instalador Automático${NC}            ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_step() { echo -e "\n${CYAN}📦 Paso $1: $2${NC}"; }

# Detectar si es WSL
detect_wsl() {
    if grep -qi microsoft /proc/version 2>/dev/null; then
        IS_WSL=true
        print_info "Detectado: WSL (Windows Subsystem for Linux)"
    else
        IS_WSL=false
    fi
}

# Verificar Node.js
check_node() {
    if command -v node &>/dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js detectado: $NODE_VERSION"
        return 0
    fi
    return 1
}

# Instalar Node.js
install_node() {
    print_info "Instalando Node.js 20 LTS..."

    if command -v curl &>/dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        print_error "curl no está instalado. Instálalo manualmente."
        exit 1
    fi

    if check_node; then
        print_success "Node.js instalado correctamente"
    else
        print_error "Error al instalar Node.js"
        exit 1
    fi
}

# Verificar ADB
check_adb() {
    if command -v adb &>/dev/null; then
        print_success "ADB detectado"
        return 0
    fi
    return 1
}

# Verificar dispositivos Android
check_devices() {
    print_info "Verificando dispositivos Android conectados..."
    if command -v adb &>/dev/null; then
        DEVICES=$(adb devices 2>/dev/null | grep -v "List" | grep "device$" | wc -l)
        if [ "$DEVICES" -gt 0 ]; then
            print_success "$DEVICES dispositivo(s) Android detectado(s)"
            adb devices
        else
            print_warning "No se detectaron dispositivos Android"
            if [ "$IS_WSL" = true ]; then
                echo ""
                echo -e "${YELLOW}Para conectar un dispositivo USB a WSL:${NC}"
                echo "1. En Windows (PowerShell como Admin): usbipd wsl list"
                echo "2. usbipd wsl attach --busid <BUSID>"
                echo "3. Vuelve a ejecutar este script"
                echo ""
                echo "Más info: https://github.com/dorssel/usbipd-win"
            else
                echo ""
                echo -e "${YELLOW}Conecta un dispositivo Android por USB y asegúrate de:${NC}"
                echo "1. Tener depuración USB activada"
                echo "2. Autorizar la conexión en el dispositivo"
                echo "3. Ejecutar: adb devices"
            fi
        fi
    else
        print_warning "ADB no está instalado. Instálalo con: sudo apt install adb"
    fi
}

# Descargar worker-agent
download_worker() {
    print_info "Descargando worker agent..."

    if [ -d "$INSTALL_DIR" ]; then
        print_info "Directorio existente encontrado. Actualizando..."
        cd "$INSTALL_DIR"
        git pull origin master
    else
        mkdir -p "$INSTALL_DIR"
        cd "$INSTALL_DIR"
        git clone https://github.com/jorandcas/proobot.git .
    fi

    print_success "Worker agent descargado en $INSTALL_DIR"
}

# Instalar dependencias
install_dependencies() {
    print_info "Instalando dependencias..."
    cd "$INSTALL_DIR/worker-agent"

    npm install
    npm install -g appium

    print_success "Dependencias instaladas"
}

# Wizard interactivo
run_wizard() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} Configuración del Worker${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""

    # URL del Backend
    read -p " URL del Backend [default: $BACKEND_URL]: " INPUT_URL
    BACKEND_URL=${INPUT_URL:-$BACKEND_URL}

    # Nombre del Worker
    read -p "👷 Nombre del Worker [default: $WORKER_NAME]: " INPUT_NAME
    WORKER_NAME=${INPUT_NAME:-$WORKER_NAME}

    # Ubicación
    read -p "📍 Ubicación [default: $WORKER_LOCATION]: " INPUT_LOCATION
    WORKER_LOCATION=${INPUT_LOCATION:-$WORKER_LOCATION}

    # Modo Kiosko
    read -p "🔒 ¿Activar modo kiosko (auto-reinicio)? (y/N): " INPUT_KIOSK
    KIOSK_MODE=${INPUT_KIOSK:-n}

    echo ""
    print_info "Configuración guardada:"
    echo "  URL: $BACKEND_URL"
    echo "  Worker: $WORKER_NAME"
    echo "  Ubicación: $WORKER_LOCATION"
    echo "  Kiosko: $KIOSK_MODE"
}

# Crear archivo .env
create_env() {
    print_info "Creando archivo de configuración..."

    cd "$INSTALL_DIR/worker-agent"

    cat > .env << EOF
# Backend Connection
API_URL="$BACKEND_URL"
API_KEY=""

# Worker Identity
WORKER_NAME="$WORKER_NAME"
WORKER_LOCATION="$WORKER_LOCATION"
DEVICE_ID=""

# Polling Configuration
POLL_INTERVAL="5000"
HEARTBEAT_INTERVAL="30000"

# Appium Configuration
APPIUM_SERVER="http://localhost:4723"
APPIUM_CAPABILITIES='{"platformName":"Android","automationName":"UiAutomator2","newCommandTimeout":"300","noReset":"true"}'

# Evidence Configuration
EVIDENCE_UPLOAD_ENABLED="true"
EVIDENCE_PATH="./evidence"
SCREENSHOTS_ENABLED="true"
VIDEO_RECORDING="false"

# Bot Configuration
BOT_SCRIPT_PATH="../src"
BOT_TIMEOUT="600000"

# Logging
LOG_LEVEL="info"
LOG_FILE="./logs/worker.log"

# Kiosk Mode
KIOSK_MODE="$([ "$KIOSK_MODE" = "y" ] || [ "$KIOSK_MODE" = "Y" ] && echo "true" || echo "false")"
EOF

    print_success "Archivo .env creado"
}

# Compilar TypeScript
build_worker() {
    print_info "Compilando worker agent..."
    cd "$INSTALL_DIR/worker-agent"

    npm run build

    print_success "Compilación completada"
}

# Iniciar worker
start_worker() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}          ${YELLOW}¡Instalación completada exitosamente!${NC}           ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    print_info "Para iniciar el worker:"
    echo ""
    echo "  cd $INSTALL_DIR/worker-agent"
    echo "  npm start"
    echo ""

    if [ "$KIOSK_MODE" = "y" ] || [ "$KIOSK_MODE" = "Y" ]; then
        print_info "Modo kiosko activado. Para iniciar en modo kiosko:"
        echo ""
        echo "  npm run kiosk"
        echo ""
    fi

    print_info "Comandos disponibles:"
    echo "  npm start      - Iniciar worker con TUI"
    echo "  npm run kiosk  - Iniciar en modo kiosko (auto-reinicio)"
    echo "  npm run build  - Recompilar después de cambios"
    echo ""

    print_warning "Asegúrate de tener Appium corriendo antes de iniciar:"
    echo "  npx appium"
    echo ""

    # Preguntar si quiere iniciar ahora
    read -p "¿Quieres iniciar el worker ahora? (y/N): " START_NOW
    if [ "$START_NOW" = "y" ] || [ "$START_NOW" = "Y" ]; then
        echo ""
        print_info "Iniciando Appium en segundo plano..."
        npx appium &>/dev/null &
        sleep 3

        print_info "Iniciando worker agent..."
        cd "$INSTALL_DIR/worker-agent"
        npm start
    fi
}

# Función principal
main() {
    print_header

    # Detectar entorno
    detect_wsl

    # Paso 1: Verificar/Instalar Node.js
    print_step "1" "Verificando Node.js"
    if ! check_node; then
        install_node
    fi

    # Paso 2: Verificar ADB
    print_step "2" "Verificando ADB"
    check_adb || print_warning "ADB no encontrado. Instálalo con: sudo apt install adb"

    # Paso 3: Descargar worker
    print_step "3" "Descargando worker agent"
    download_worker

    # Paso 4: Instalar dependencias
    print_step "4" "Instalando dependencias"
    install_dependencies

    # Paso 5: Configuración
    print_step "5" "Configuración"
    run_wizard
    create_env

    # Paso 6: Compilar
    print_step "6" "Compilando"
    build_worker

    # Paso 7: Verificar dispositivos
    print_step "7" "Verificando dispositivos"
    check_devices

    # Paso 8: Iniciar
    print_step "8" "Listo para iniciar"
    start_worker
}

# Ejecutar
main
