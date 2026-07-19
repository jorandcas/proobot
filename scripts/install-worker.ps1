# ============================================================================
# PROOBOT WORKER - Instalador Automático (Windows)
# ============================================================================
# Este script instala y configura el worker agent automáticamente.
# Uso: irm https://raw.githubusercontent.com/jorandcas/proobot/master/scripts/install-worker.ps1 | iex
# ============================================================================

# Configuración de colores
$Host.UI.RawUI.ForegroundColor = "White"

function Write-Header {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "          PROOBOT WORKER - Instalador Automático            " -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Blue }
function Write-Step { param($num, $msg) Write-Host "`n📦 Paso $num`: $msg" -ForegroundColor Cyan }

# Variables
$BackendUrl = "http://ebpfykj4a0iv4uoux8avofjf.5.78.108.74.sslip.io/api"
$WorkerName = "Worker-Local-1"
$WorkerLocation = "Sede Principal"
$InstallDir = "$env:USERPROFILE\proobot-worker"
$KioskMode = "false"

# Detectar si está en WSL
function Test-Wsl {
    if (Test-Path "/proc/version") {
        $content = Get-Content "/proc/version" -ErrorAction SilentlyContinue
        if ($content -match "microsoft") {
            return $true
        }
    }
    return $false
}

# Verificar Node.js
function Test-Node {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js detectado: $nodeVersion"
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Instalar Node.js
function Install-Node {
    Write-Info "Instalando Node.js 20 LTS..."

    try {
        # Intentar con winget
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        Write-Success "Node.js instalado correctamente"
        return $true
    } catch {
        Write-Error "Error al instalar Node.js con winget"
        Write-Info "Instala Node.js manualmente desde: https://nodejs.org/"
        return $false
    }
}

# Verificar ADB
function Test-Adb {
    try {
        $adbVersion = adb version 2>$null
        if ($adbVersion) {
            Write-Success "ADB detectado"
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Verificar Git
function Test-Git {
    try {
        $gitVersion = git --version 2>$null
        if ($gitVersion) {
            Write-Success "Git detectado: $gitVersion"
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Instalar Git
function Install-Git {
    Write-Info "Instalando Git..."
    try {
        winget install Git.Git --silent --accept-package-agreements --accept-source-agreements
        Write-Success "Git instalado correctamente"
        return $true
    } catch {
        Write-Error "Error al instalar Git"
        return $false
    }
}

# Verificar dispositivos Android
function Check-Devices {
    Write-Info "Verificando dispositivos Android conectados..."
    try {
        $devices = adb devices 2>$null
        $deviceCount = ($devices | Select-String "device$" | Measure-Object).Count

        if ($deviceCount -gt 0) {
            Write-Success "$deviceCount dispositivo(s) Android detectado(s)"
            Write-Host $devices
        } else {
            Write-Warning "No se detectaron dispositivos Android"
            Write-Host ""
            Write-Host "Conecta un dispositivo Android por USB y asegúrate de:" -ForegroundColor Yellow
            Write-Host "1. Tener depuración USB activada"
            Write-Host "2. Autorizar la conexión en el dispositivo"
            Write-Host "3. Ejecutar: adb devices"
        }
    } catch {
        Write-Warning "ADB no está disponible. Instálalo desde: https://developer.android.com/studio/releases/platform-tools"
    }
}

# Descargar worker-agent
function Download-Worker {
    Write-Info "Descargando worker agent..."

    if (Test-Path $InstallDir) {
        Write-Info "Directorio existente encontrado. Actualizando..."
        Set-Location $InstallDir
        git pull origin master
    } else {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        Set-Location $InstallDir
        git clone https://github.com/jorandcas/proobot.git .
    }

    Write-Success "Worker agent descargado en $InstallDir"
}

# Instalar dependencias
function Install-Dependencies {
    Write-Info "Instalando dependencias..."
    Set-Location "$InstallDir\worker-agent"

    npm install
    npm install -g appium

    Write-Success "Dependencias instaladas"
}

# Wizard interactivo
function Run-Wizard {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " Configuración del Worker" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    # URL del Backend
    $inputUrl = Read-Host " URL del Backend [default: $BackendUrl]"
    if ($inputUrl) { $BackendUrl = $inputUrl }

    # Nombre del Worker
    $inputName = Read-Host "👷 Nombre del Worker [default: $WorkerName]"
    if ($inputName) { $WorkerName = $inputName }

    # Ubicación
    $inputLocation = Read-Host "📍 Ubicación [default: $WorkerLocation]"
    if ($inputLocation) { $WorkerLocation = $inputLocation }

    # Modo Kiosko
    $inputKiosk = Read-Host "🔒 ¿Activar modo kiosko (auto-reinicio)? (y/N)"
    if ($inputKiosk -eq "y" -or $inputKiosk -eq "Y") { $KioskMode = "true" }

    Write-Host ""
    Write-Info "Configuración guardada:"
    Write-Host "  URL: $BackendUrl"
    Write-Host "  Worker: $WorkerName"
    Write-Host "  Ubicación: $WorkerLocation"
    Write-Host "  Kiosko: $KioskMode"
}

# Crear archivo .env
function Create-Env {
    Write-Info "Creando archivo de configuración..."
    Set-Location "$InstallDir\worker-agent"

    $envContent = @"
# Backend Connection
API_URL="$BackendUrl"
API_KEY=""

# Worker Identity
WORKER_NAME="$WorkerName"
WORKER_LOCATION="$WorkerLocation"
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
KIOSK_MODE="$KioskMode"
"@

    Set-Content -Path ".env" -Value $envContent -Encoding UTF8
    Write-Success "Archivo .env creado"
}

# Compilar TypeScript
function Build-Worker {
    Write-Info "Compilando worker agent..."
    Set-Location "$InstallDir\worker-agent"

    npm run build

    Write-Success "Compilación completada"
}

# Iniciar worker
function Start-Worker {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "          ¡Instalación completada exitosamente!             " -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""

    Write-Info "Para iniciar el worker:"
    Write-Host ""
    Write-Host "  cd $InstallDir\worker-agent"
    Write-Host "  npm start"
    Write-Host ""

    if ($KioskMode -eq "true") {
        Write-Info "Modo kiosko activado. Para iniciar en modo kiosko:"
        Write-Host ""
        Write-Host "  npm run kiosk"
        Write-Host ""
    }

    Write-Info "Comandos disponibles:"
    Write-Host "  npm start      - Iniciar worker con TUI"
    Write-Host "  npm run kiosk  - Iniciar en modo kiosko (auto-reinicio)"
    Write-Host "  npm run build  - Recompilar después de cambios"
    Write-Host ""

    Write-Warning "Asegúrate de tener Appium corriendo antes de iniciar:"
    Write-Host "  npx appium"
    Write-Host ""

    # Preguntar si quiere iniciar ahora
    $startNow = Read-Host "¿Quieres iniciar el worker ahora? (y/N)"
    if ($startNow -eq "y" -or $startNow -eq "Y") {
        Write-Host ""
        Write-Info "Iniciando Appium en segundo plano..."
        Start-Process -FilePath "npx" -ArgumentList "appium" -WindowStyle Hidden
        Start-Sleep -Seconds 3

        Write-Info "Iniciando worker agent..."
        Set-Location "$InstallDir\worker-agent"
        npm start
    }
}

# Función principal
function Main {
    Write-Header

    # Detectar WSL
    if (Test-Wsl) {
        Write-Info "Detectado: WSL (Windows Subsystem for Linux)"
        Write-Warning "Estás ejecutando este script en WSL."
        Write-Info "Para una experiencia óptima en Windows, ejecuta este script en PowerShell nativo."
        Write-Host ""
    }

    # Paso 1: Verificar/Instalar Node.js
    Write-Step 1 "Verificando Node.js"
    if (-not (Test-Node)) {
        Install-Node
    }

    # Paso 2: Verificar/Instalar Git
    Write-Step 2 "Verificando Git"
    if (-not (Test-Git)) {
        Install-Git
    }

    # Paso 3: Verificar ADB
    Write-Step 3 "Verificando ADB"
    Test-Adb

    # Paso 4: Descargar worker
    Write-Step 4 "Descargando worker agent"
    Download-Worker

    # Paso 5: Instalar dependencias
    Write-Step 5 "Instalando dependencias"
    Install-Dependencies

    # Paso 6: Configuración
    Write-Step 6 "Configuración"
    Run-Wizard
    Create-Env

    # Paso 7: Compilar
    Write-Step 7 "Compilando"
    Build-Worker

    # Paso 8: Verificar dispositivos
    Write-Step 8 "Verificando dispositivos"
    Check-Devices

    # Paso 9: Iniciar
    Write-Step 9 "Listo para iniciar"
    Start-Worker
}

# Ejecutar
Main
