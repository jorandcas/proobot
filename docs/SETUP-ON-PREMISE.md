# Setup del Worker Agent (On-Premise)

## Requisitos de Hardware

- PC con **Windows 10/11** o **Linux**
- **Teléfono Android** con depuración USB activada
- Cable USB para conectar el teléfono

## Requisitos de Software

### 1. Node.js
- Versión **18+**
- Descargar de [nodejs.org](https://nodejs.org)

### 2. Android SDK y ADB
```bash
# Verificar instalación
adb --version

# Ver dispositivos conectados
adb devices
```

### 3. Appium
```bash
# Instalar Appium
npm install -g appium

# Verificar
appium --version

# Instalar driver UiAutomator2
appium driver install uiautomator2
```

## Configuración

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd proobot
```

### 2. Configurar worker-agent
```bash
cd worker-agent
cp .env.example .env
```

### 3. Editar `.env`
```env
# URL del backend (Coolify)
API_URL=https://api.tudominio.com/api

# API Key del worker (generada por el backend)
API_KEY=worker_api_key_aqui

# ID del worker (debe coincidir con el registrado)
WORKER_ID=nombre-del-worker

# Ubicación física
WORKER_LOCATION=Sede Norte
```

### 4. Iniciar Appium
```bash
appium --log-level info
```

### 5. Conectar teléfono Android
1. Activar **Depuración USB** en el teléfono (Ajustes → Opciones de desarrollador)
2. Conectar por USB
3. Aceptar el popup "Allow USB debugging"
4. Verificar:
```bash
adb devices
# Debe mostrar: <UDID> device
```

### 6. Iniciar el worker
```bash
cd worker-agent
npm install
npm run build
npm start
```

## Verificación

```bash
# Verificar que el worker se registró en el backend
curl https://api.tudominio.com/api/workers
```

## Troubleshooting

### ADB no detecta el dispositivo
- Verificar que la depuración USB esté activada
- Cambiar el cable USB
- Probar otro puerto USB

### Appium no conecta
- Verificar que Appium esté corriendo: `appium --version`
- Verificar puerto: `curl http://127.0.0.1:4723/status`
- Reinstalar driver: `appium driver uninstall uiautomator2 && appium driver install uiautomator2`

### Error de conexión al backend
- Verificar que `API_URL` esté correcta en `.env`
- Verificar que el backend esté accesible desde la red local
- Probar con `curl https://api.tudominio.com/health`
