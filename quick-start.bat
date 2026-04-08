@echo off
REM Quick Start Script para Windows - Movistar Bot

echo ╔════════════════════════════════════════════════════════════╗
echo ║     MOVISTAR BOT - QUICK START SETUP                       ║
echo ║     Script de configuracion inicial rapida                 ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js no esta instalado
    echo Por favor instala Node.js 18+ LTS desde https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js instalado: %NODE_VERSION%
echo.

REM Verificar directorio
if not exist "package.json" (
    echo [ERROR] Debes ejecutar este script desde el directorio del backend
    echo Ejecuta: cd plataforma-promotores\backend
    pause
    exit /b 1
)

echo Este script te guiara en la configuracion inicial del backend.
echo Presiona Ctrl+C en cualquier momento para cancelar.
echo.

REM Paso 1: Instalar dependencias
echo [1/6] Instalando dependencias...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Error instalando dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas
echo.

REM Paso 2: Crear archivo .env
echo [2/6] Configurando variables de entorno...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [OK] Archivo .env creado
        echo [ADVERTENCIA] Por favor edita .env con tu configuracion de base de datos
    ) else (
        echo [ERROR] No se encuentra .env.example
        pause
        exit /b 1
    )
) else (
    echo [OK] Archivo .env ya existe
)
echo.

REM Paso 3: Generar cliente Prisma
echo [3/6] Generando cliente Prisma...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Error generando cliente Prisma
    pause
    exit /b 1
)
echo [OK] Cliente Prisma generado
echo.

REM Paso 4: Ejecutar migraciones
echo [4/6] Ejecutando migraciones de base de datos...
set /p DB_CREATED="¿Ya has creado la base de datos 'movistar_bot'? (y/n): "
if /i "%DB_CREATED%"=="y" (
    call npx prisma migrate dev
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Error en migraciones
        pause
        exit /b 1
    )
    echo [OK] Migraciones ejecutadas
) else (
    echo [ADVERTENCIA] Por favor crea la base de datos primero:
    echo   psql -U postgres
    echo   CREATE DATABASE movistar_bot;
    echo   \q
    echo.
    pause
    call npx prisma migrate dev
)
echo.

REM Paso 5: Crear directorios
echo [5/6] Creando directorios necesarios...
if not exist "uploads\evidence" mkdir uploads\evidence
echo [OK] Directorios creados
echo.

REM Paso 6: Crear usuario admin
echo [6/6] Creando usuario administrador...
set /p CREATE_ADMIN="¿Deseas crear un usuario admin ahora? (y/n): "
if /i "%CREATE_ADMIN%"=="y" (
    call npm run create-admin
)
echo.

REM Resumen
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     CONFIGURACION COMPLETADA                                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Siguientes pasos:
echo.
echo 1. Iniciar el backend:
echo    npm run dev
echo.
echo 2. En otra terminal, iniciar el frontend:
echo    cd ..\frontend ^&^& npm run dev
echo.
echo 3. En otra terminal, iniciar el worker agent:
echo    cd ..\..\worker-agent ^&^& npm run dev
echo.
echo 4. Abrir el navegador:
echo    http://localhost:5173
echo.
echo [ADVERTENCIA] No olvides iniciar Redis antes de ejecutar el backend:
echo    docker run -d -p 6379:6379 redis:7-alpine
echo.
echo Para mas informacion, consulta: GUIA-PASO-A-PASO.md
echo.
pause
