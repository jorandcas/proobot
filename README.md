# POC-LOGIN - Sistema de Automatización de Portabilidades Movistar Onix

Sistema completo de automatización para procesar portabilidades de Movistar Onix, reemplazando el trabajo manual de 15 promotores con un sistema automatizado.

## 📊 Problema y Solución

**Antes:** 15 personas realizando portabilidades manualmente (8 horas diarias, 400 trámites/día)
**Después:** 1 admin supervisando el sistema (3-4 horas diarias, mismas 400 trámites)

**Ahorro:** $7,000 USD mensuales (14 sueldos) | ROI: 3 meses

## 🏗️ Arquitectura

```
poc-login/
├── packages/                    # Código compartido (monorepo)
│   ├── config/                  # Selectores, Timeouts, Environment
│   ├── core/                    # Retry, UI Helpers, Date Helpers
│   └── flows/                   # Flujos de automatización
├── src/                         # Bot principal
├── bot-worker/                  # Worker API (Hetzner)
├── worker-agent/                # Agente local (Admin Office)
├── plataforma-promotores/       # Web para promotores
└── docs/                        # Documentación detallada
```

## 🚀 Instalación Rápida

### 1. Requisitos Previos

- **Node.js** 18+
- **Appium** con UiAutomator2 driver
- **Android SDK** con ADB
- **Dispositivo Android** con depuración USB activada

### 2. Instalar Dependencias

```bash
# Instalar workspaces
npm install

# O instalar individualmente
cd packages/config && npm install
cd ../core && npm install
cd ../flows && npm install
cd ../.. && npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env`:

```env
# Credenciales TEMM
TEMM_USER=tu_usuario
TEMM_PASS=tu_password

# Dispositivo Android
DEVICE_UDID=Tu_UDID

# Appium
APPIUM_HOST=127.0.0.1
APPIUM_PORT=4723

# Datos del trámite
SEARCH_DN=
ICC=
LINEA_NIP=1234
FVC_FECHA=08/04/2026

# Datos personales (opcional)
DATOS_NOMBRE=Juan
DATOS_APELLIDO_PATERNO=Pérez
DATOS_CURP=AAAAAAA
DATOS_TELEFONO=5512345678
DATOS_GENERO=Masculino
```

### 4. Ejecutar

```bash
# Desarrollo
npm run dev

# Compilar
npm run build

# Producción
npm start
```

## 📦 Packages

### @poc-login/config
Configuración compartida - Selectors, Timeouts y Environment

```typescript
import { SEL, TIMEOUTS, ENV, createDriver } from '@poc-login/config';
```

### @poc-login/core
Utilidades core - Retry, UI Helpers, Date Helpers

```typescript
import { safeClick, safeSetValue, waitForWithRetry } from '@poc-login/core';
```

### @poc-login/flows
Flujos de automatización - Login, Secciones, Envío

```typescript
import { login, seccionLinea, seccionDatosPersonales } from '@poc-login/flows';
```

## 🔧 Scripts Disponibles

```bash
npm run dev              # Ejecutar bot principal
npm run build            # Compilar todos los packages
npm run build:packages   # Compilar solo packages
npm start                # Ejecutar compilado
```

## 📖 Documentación Detallada

- **ARQUITECTURA.md** - Arquitectura técnica detallada
- **GUIA-ADMIN.md** - Guía del administrador
- **COMANDOS-UTILES.md** - Comandos útiles de desarrollo

## 🔍 Verificación de Dispositivos

```bash
# Ver dispositivos conectados
adb devices

# Verificar Appium
curl http://127.0.0.1:4723/status

# Desinstalar UiAutomator2 (si es necesario)
adb uninstall io.appium.uiautomator2.server
```

## 🐛 Troubleshooting

### Error: "Neither ANDROID_HOME nor ANDROID_SDK_ROOT"

Configurar variables de entorno en Windows:
```
ANDROID_SDK_ROOT = C:\Users\{usuario}\AppData\Local\Android\Sdk
ANDROID_HOME = C:\Users\{usuario}\AppData\Local\Android\Sdk
```

Agregar al PATH:
```
C:\Users\{usuario}\AppData\Local\Android\Sdk\platform-tools
C:\Users\{usuario}\AppData\Local\Android\Sdk\cmdline-tools\latest\bin
```

### Dispositivo "unauthorized"

En el celular: Aceptar popup "Allow USB debugging"

## 📝 Notas

- El sistema usa **monorepo con workspaces npm**
- Los packages están versionados y son independientes
- El código está en TypeScript con tipado estricto
- Usa WebDriverIO + Appium para automatización mobile

## 📄 Licencia

ISC

---

**Generado con [Claude Code](https://claude.com/claude-code)**
