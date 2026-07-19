# Proobot Worker - Guía de Instalación Rápida

## Instalación en un Solo Comando

### Linux / WSL
```bash
curl -sL https://raw.githubusercontent.com/jorandcas/proobot/master/scripts/install-worker.sh | bash
```

### Windows (PowerShell como Administrador)
```powershell
irm https://raw.githubusercontent.com/jorandcas/proobot/master/scripts/install-worker.ps1 | iex
```

---

## ¿Qué Hace el Instalador?

1. ✅ Verifica/Instala **Node.js 20 LTS**
2. ✅ Verifica/Instala **Git**
3. ✅ Verifica **ADB** (Android Debug Bridge)
4. ✅ Descarga el **worker agent**
5. ✅ Instala **dependencias** (incluyendo Appium)
6. ✅ **Wizard interactivo** (3 preguntas):
   - URL del Backend
   - Nombre del Worker
   - Ubicación
7. ✅ Crea archivo `.env` con tu configuración
8. ✅ **Compila** el código TypeScript
9. ✅ Verifica **dispositivos Android** conectados
10. ✅ Opción de **iniciar inmediatamente**

---

## Uso Diario

### Iniciar Worker
```bash
cd ~/proobot-worker/worker-agent  # Linux/WSL
cd $env:USERPROFILE\proobot-worker\worker-agent  # Windows
npm start
```

### Iniciar en Modo Kiosko (Auto-reinicio)
```bash
npm run kiosk
```

### Comandos Disponibles
| Comando | Descripción |
|---------|-------------|
| `npm start` | Iniciar worker con interfaz visual (TUI) |
| `npm run kiosk` | Iniciar en modo kiosko (se reinicia automáticamente si falla) |
| `npm run build` | Recompilar después de hacer cambios al código |

---

## Interfaz Visual (TUI)

Al iniciar el worker, verás una interfaz visual en la terminal:

```
┌──────────────────────────────────────────────────────────────────┐
│  PROOBOT WORKER - Sede Norte          🟢 ONLINE  [F1]Ayuda     │
──────────────────────────────────────────────────────────────────┤
│  Dispositivos Conectados:                                       │
│  [1] 🟢 Samsung Galaxy A12 (ABC123)  Batería: 85%               │
│                                                                  │
│  📊 Resumen del Día:  ✅ 12 completados  ❌ 2 errores  85% éxito │
│                                                                  │
│  Trabajo Actual: #1234 - Trámite TR-001                         │
│  ████████████████░░░░░░░░░░░░ 65% - Procesando formulario...     │
│                                                                  │
│  📝 Logs en Vivo:                                               │
│  [10:30:15] ✅ Job #1233 completado - Folio: MOV-2026-001       │
│  [10:30:20]  Nuevo trabajo recibido #1234                     │
│  [10:30:21] ▶️ Iniciando ejecución...                           │
──────────────────────────────────────────────────────────────────┤
│  ←→Cambiar pantalla  F5:Reiniciar  R:Reconectar  Q:Salir        │
└──────────────────────────────────────────────────────────────────┘
```

### Navegación
| Tecla | Acción |
|-------|--------|
| `←` `→` | Cambiar entre pantallas (Dashboard, Configuración, Historial) |
| `Enter` | Seleccionar/Editar |
| `F1` | Mostrar ayuda |
| `F5` | Reiniciar worker |
| `R` | Reconectar dispositivos ADB |
| `S` | Guardar configuración (en pantalla de Configuración) |
| `Esc` | Volver al dashboard |
| `Q` | Salir |

---

## Pantallas de la TUI

### 1. Dashboard (Principal)
- Estado del worker y conexión al backend
- Dispositivos Android conectados
- Estadísticas del día
- Trabajo actual con barra de progreso
- Logs en vivo

### 2. Configuración
- Editar nombre del worker y ubicación
- Cambiar URL del backend
- Ajustar intervalos (polling, heartbeat)
- Activar/desactivar screenshots, evidencias, video
- **Modo Kiosko**: Activar/desactivar auto-reinicio
- Acciones rápidas: Reconectar ADB, Limpiar evidencias, Re-registrar worker

### 3. Historial
- Últimos 20 trabajos con estado
- Espacio en disco para evidencias
- Acciones: Reintentar trabajo fallido, Limpiar evidencias

---

## Solución de Problemas

### Dispositivo No Detectado
1. Verifica que el cable USB esté conectado
2. Asegúrate de tener **Depuración USB** activada en el dispositivo
3. Presiona `R` en la TUI para reconectar ADB
4. En WSL: Usa `usbipd` para conectar el dispositivo:
   ```powershell
   # En Windows (PowerShell como Admin)
   usbipd wsl list
   usbipd wsl attach --busid <BUSID>
   ```

### Error de Conexión al Backend
1. Verifica que la URL del backend sea correcta
2. Verifica la conexión a internet
3. El worker intentará reconectar automáticamente
4. Revisa los logs en la TUI para ver el error específico

### El Worker Se Cierra Solo
1. Activa el **modo kiosko** en la pantalla de Configuración
2. O inicia con: `npm run kiosk`
3. Revisa los logs para identificar la causa del error

### Appium No Funciona
1. Asegúrate de que Appium esté instalado: `npm install -g appium`
2. Inicia Appium: `npx appium`
3. Verifica que el dispositivo esté conectado: `adb devices`

---

## Requisitos del Sistema

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **SO** | Windows 10+ / Ubuntu 20.04+ | Windows 11 / Ubuntu 22.04+ |
| **RAM** | 4 GB | 8 GB |
| **Disco** | 2 GB libres | 10 GB libres |
| **Node.js** | 18+ | 20 LTS |
| **Android** | 8.0+ | 10.0+ |

---

## Soporte

Para problemas o preguntas:
1. Revisa los logs en la TUI
2. Revisa esta documentación
3. Contacta al equipo de desarrollo
