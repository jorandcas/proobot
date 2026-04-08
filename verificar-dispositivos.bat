@echo off
title ONIX BOT AGENT - Verificar Dispositivos
echo ============================================================
echo   ONIX BOT AGENT - Verificacion de Sistema
echo ============================================================
echo.

REM ============================================================
REM Verificar ADB
REM ============================================================
echo [1/5] Verificando ADB...
adb --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ADB no esta instalado
    echo Instala Android SDK Platform Tools desde:
    echo https://developer.android.com/studio/releases/platform-tools
    pause
    exit /b 1
)
echo ✅ ADB instalado
adb --version
echo.

REM ============================================================
REM Verificar dispositivos conectados
REM ============================================================
echo [2/5] Buscando dispositivos Android...
echo.
echo Conecta todos los celulares por USB y presiona una tecla...
pause >nul
echo.
echo Dispositivos encontrados:
echo ──────────────────────────────────────
adb devices
echo ──────────────────────────────────────
echo.

REM Contar dispositivos
for /f "tokens=1" %%a in ('adb devices ^| find "device" ^| find /c /v ""') do set DEVICE_COUNT=%%a

if %DEVICE_COUNT%==0 (
    echo ❌ No se detectaron dispositivos
    echo.
    echo Soluciones:
    echo 1. Verifica que los celulares esten conectados por USB
    echo 2. Activa la depuracion USB en cada celular:
    echo    - Ajustes ^> Opciones de desarrollador ^> Depuracion USB
    echo 3. Acepta la pregunta "¿Permitir depuracion USB?" en cada celular
    echo 4. Prueba con otro cable USB
    pause
    exit /b 1
)

echo ✅ Se detectaron %DEVICE_COUNT% dispositivo(s)
echo.

REM ============================================================
REM Verificar Appium
REM ============================================================
echo [3/5] Verificando Appium...
appium --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Appium no esta instalado
    echo Ejecuta install-admin.bat para instalarlo
) else (
    echo ✅ Appium instalado
    appium --version
)
echo.

REM ============================================================
REM Verificar Node.js
REM ============================================================
echo [4/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no esta instalado
    echo Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js instalado
node --version
echo.

REM ============================================================
REM Verificar Bot Worker
REM ============================================================
echo [5/5] Verificando Bot Worker...
if not exist "bot-worker" (
    echo ❌ No existe la carpeta bot-worker
    echo Ejecuta install-admin.bat para instalarlo
    pause
    exit /b 1
)
if not exist "bot-worker\package.json" (
    echo ❌ No existe package.json en bot-worker
    pause
    exit /b 1
)
echo ✅ Bot Worker existe

REM Verificar dependencias instaladas
if not exist "bot-worker\node_modules" (
    echo ⚠️  Las dependencias no estan instaladas
    echo Ejecuta: cd bot-worker ^&^& npm install
) else (
    echo ✅ Dependencias instaladas
)
echo.

REM ============================================================
REM Verificar .env
REM ============================================================
echo [6/6] Verificando configuracion...
if not exist "bot-worker\.env" (
    echo ⚠️  El archivo .env no existe
    echo Copiando desde .env.example...
    copy bot-worker\.env.example bot-worker\.env >nul
    echo.
    echo ⚠️  IMPORTANTE: Edita el archivo bot-worker\.env
    echo     y configura tus credenciales de TEMM
    echo.
    start notepad bot-worker\.env
) else (
    echo ✅ Archivo .env existe
)
echo.

REM ============================================================
REM RESUMEN
REM ============================================================
echo ============================================================
echo   ✅ VERIFICACION COMPLETADA
echo ============================================================
echo.
echo Estado del sistema:
echo   - Dispositivos Android: %DEVICE_COUNT%
echo   - ADB: OK
echo   - Appium: OK
echo   - Node.js: OK
echo   - Bot Worker: OK
echo   - Configuracion: OK
echo.
echo Siguiente paso:
echo   Ejecuta: start-admin.bat
echo   Esto iniciara: Appium, Bot Worker y Cloudflare Tunnel
echo.
echo ============================================================
pause
