@echo off
title ONIX BOT AGENT - Admin
echo ============================================================
echo   ONIX BOT AGENT - Iniciando Sistema
echo ============================================================
echo.

REM ============================================================
REM Verificar dispositivos conectados
REM ============================================================
echo [1/4] Verificando dispositivos Android...
adb devices
echo.
echo Si no ves dispositivos arriba, conectalos por USB y presiona una tecla
pause >nul
echo.

REM ============================================================
REM Iniciar Appium (en background)
REM ============================================================
echo [2/4] Iniciando Appium...
start "Appium Server" cmd /k "appium"
timeout /t 3 >nul
echo ✅ Appium iniciado en Puerto 4723
echo.

REM ============================================================
REM Iniciar Bot Worker (en background)
REM ============================================================
echo [3/4] Iniciando Bot Worker...
cd bot-worker
start "Bot Worker" cmd /k "npm run dev"
cd ..
timeout /t 3 >nul
echo ✅ Bot Worker iniciado en Puerto 3002
echo.

REM ============================================================
REM Iniciar Cloudflare Tunnel
REM ============================================================
echo [4/4] Iniciando Cloudflare Tunnel...
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  COPIA LA URL DE ABAJO (la que dice https://...)       ║
echo ║  ESA URL ES LA QUE NECESITAS CONFIGURAR EN HETZNER    ║
echo ╚════════════════════════════════════════════════════════╝
echo.
cloudflared tunnel --url http://localhost:3002

REM Si cloudflared se cierra, cerrar todo
echo.
echo Tunnel cerrado. Deteniendo servicios...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM appium.exe >nul 2>&1
echo.
