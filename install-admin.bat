@echo off
echo ============================================================
echo   ONIX BOT AGENT - Instalador para Admin
echo ============================================================
echo.
echo Este instalador configurara tu computadora para procesar
echo portabilidades automaticamente con multiples dispositivos.
echo.
pause
echo.

REM ============================================================
REM PASO 1: Verificar Node.js
REM ============================================================
echo [1/7] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no esta instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js instalado
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    Version: %NODE_VERSION%
echo.

REM ============================================================
REM PASO 2: Verificar Git
REM ============================================================
echo [2/7] Verificando Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git no esta instalado
    echo Por favor instala Git desde: https://git-scm.com/downloads
    pause
    exit /b 1
)
echo ✅ Git instalado
echo.

REM ============================================================
REM PASO 3: Instalar Appium
REM ============================================================
echo [3/7] Verificando Appium...
appium --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Appium no esta instalado. Instalando...
    npm install -g appium
    if %errorlevel% neq 0 (
        echo ❌ Error al instalar Appium
        pause
        exit /b 1
    )
    echo ✅ Appium instalado correctamente
) else (
    echo ✅ Appium ya esta instalado
    appium --version
)
echo.

REM ============================================================
REM PASO 4: Verificar dispositivos Android
REM ============================================================
echo [4/7] Verificando dispositivos Android conectados...
echo Por favor conecta todos los celulares por USB...
pause
echo.
adb devices
echo.
echo Si ves varios dispositivos en la lista, esta todo bien.
echo Si no ves dispositivos, verifica:
echo   - Los celulares esten conectados por USB
echo   - Tengan depuracion USB activada
echo.
pause
echo.

REM ============================================================
REM PASO 5: Clonar/Actualizar bot-worker
REM ============================================================
echo [5/7] Descargando Bot Worker...
if not exist "bot-worker" (
    echo Clonando repositorio...
    REM Descomenta la siguiente linea si tienes un repo Git:
    REM git clone https://github.com/tu-repo/bot-worker.git
    echo ⚠️  Por favor copia la carpeta 'bot-worker' en este directorio
    pause
) else (
    echo ✅ Bot Worker ya existe
)
cd bot-worker

REM Instalar dependencias
echo Instalando dependencias...
call npm install
echo ✅ Dependencias instaladas
cd ..
echo.

REM ============================================================
REM PASO 6: Configurar .env
REM ============================================================
echo [6/7] Configuracion del Bot Worker...
if not exist "bot-worker\.env" (
    echo Creando archivo .env...
    copy bot-worker\.env.example bot-worker\.env
    echo ✅ Archivo .env creado
    echo.
    echo ⚠️  IMPORTANTE: Edita el archivo bot-worker\.env y configura:
    echo    - TEMM_USER (tu usuario de TEMM)
    echo    - TEMM_PASS (tu password de TEMM)
    echo    - DEVICE_UDID (se usaran todos los conectados)
    echo.
    pause
) else (
    echo ✅ Archivo .env ya existe
)
echo.

REM ============================================================
REM PASO 7: Instalar Cloudflare Tunnel
REM ============================================================
echo [7/7] Verificando Cloudflare Tunnel...
cloudflared --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Cloudflare Tunnel no esta instalado.
    echo Descargando instalador...
    echo.
    echo Por favor visita: https://github.com/cloudflare/cloudflared/releases
    echo Descarga: cloudflared-windows-amd64.exe
    echo Renombra a: cloudflared.exe
    echo Colocalo en: C:\Windows\System32\
    echo.
    pause
) else (
    echo ✅ Cloudflare Tunnel instalado
    cloudflared --version
)
echo.

REM ============================================================
REM FINALIZAR
REM ============================================================
echo.
echo ============================================================
echo   ✅ INSTALACION COMPLETADA
echo ============================================================
echo.
echo Siguientes pasos:
echo.
echo 1. Conecta todos los celulares Android por USB
echo    (minimo 1, maximo los que quieras)
echo.
echo 2. Verifica que ADB los detecte:
echo    adb devices
echo.
echo 3. Inicia Appium (primera vez):
echo    appium
echo.
echo 4. En otra terminal, inicia el Bot Worker:
echo    cd bot-worker
echo    npm run dev
echo.
echo 5. En otra terminal, crea el tunel:
echo    cloudflared tunnel --url http://localhost:3002
echo.
echo 6. Copia la URL que te da cloudflared
echo    (ejemplo: https://abc-def-123.trycloudflare.com)
echo.
echo 7. Envia esa URL al administrador del sistema
echo    para que la configure en Hetzner
echo.
echo ============================================================
pause
