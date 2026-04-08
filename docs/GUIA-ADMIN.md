# 🚀 GUÍA PARA EL ADMIN - ONIX BOT AGENT

## 📋 ¿Qué hace este sistema?

**Antes:** 15 personas haciendo 400 portabilidades manualmente (todo el día)

**Ahora:** 1 Admin conecta varios celulares y el bot hace las 400 portabilidades automáticamente

---

## 🖥️ REQUISITOS PARA TU COMPUTADORA

- Windows 10 o superior
- 4 puertos USB libres (para 4 celulares)
- 8 GB RAM o más
- Conexión a internet

---

## 📦 PASO 1: INSTALACIÓN (Solo una vez)

### 1.1 Instalar programas necesarios

**Node.js** (si no lo tienes):
- Ve a: https://nodejs.org/
- Descarga la versión LTS
- Instala con "Next, Next, Finish"

**Git** (si no lo tienes):
- Ve a: https://git-scm.com/downloads
- Descarga para Windows
- Instala con "Next, Next, Finish"

**ADB Drivers** (si no los tienes):
- Ve a: https://developer.android.com/studio/run/win-usb
- Descarga el SDK Tools
- Instala

### 1.2 Ejecutar el instalador

1. Copia la carpeta del proyecto en tu escritorio
2. Haz doble clic en `install-admin.bat`
3. Sigue las instrucciones en pantalla

**Este instalador hará:**
- ✅ Verificar que tengas Node.js y Git
- ✅ Instalar Appium
- ✅ Instalar dependencias del Bot Worker
- ✅ Crear archivo de configuración

---

## 📱 PASO 2: PREPARAR CELULARES

### 2.1 Activar depuración USB en cada celular

**En cada celular Android:**

1. Ve a: **Ajustes** > **Información del teléfono**
2. Toca 7 veces en **Número de compilación** (hasta que diga "Eres un desarrollador")
3. Ve a: **Ajustes** > **Opciones de desarrollador**
4. Activa **Depuración USB**

### 2.2 Conectar los celulares

1. Conecta **4 celulares** (o los que tengas) por USB
2. Abre una terminal y escribe:
   ```
   adb devices
   ```
3. Deberías ver algo como:
   ```
   ZY22FDGBWW    device
   ZY22FDGBXX    device
   ZY22FDGBYY    device
   ZY22FDGBZZ    device
   ```

**Si NO los ves:**
- Desconecta y vuelve a conectar
- Acepta la pregunta "¿Permitir depuración USB?" en cada celular
- Prueba con otro cable USB

---

## ⚙️ PASO 3: CONFIGURAR CREDENCIALES

### 3.1 Editar archivo .env

1. Abre la carpeta `bot-worker`
2. Abre el archivo `.env` con el Bloc de notas
3. Configura tus credenciales:

```env
# TEMM App Credentials
TEMM_USER=30T9M57026
TEMM_PASS=7UE=awo1

# Device Configuration
DEVICE_UDID=ZY22FDGBWW

# Appium Configuration
APPIUM_HOST=127.0.0.1
APPIUM_PORT=4723
```

4. Guarda y cierra el archivo

---

## 🚀 PASO 4: INICIAR EL SISTEMA

### 4.1 Ejecutar el sistema

**Haz doble clic en:** `start-admin.bat`

**Esto abrirá automáticamente:**
- ✅ Appium Server (ventana negra)
- ✅ Bot Worker (ventana con logs)
- ✅ Cloudflare Tunnel (ventana con URL pública)

### 4.2 Copiar la URL del túnel

En la ventana de **Cloudflare Tunnel**, verás algo como:

```
https://abc-def-123.trycloudflare.com
```

**COPIA ESA URL** → La necesitarás después

---

## 🔗 PASO 5: CONECTAR CON HETZNER

### 5.1 Enviar la URL al administrador del sistema

Envía un mensaje con:
- La URL del túnel: `https://abc-def-123.trycloudflare.com`
- Los UDIDs de tus celulares: `ZY22FDGBWW, ZY22FDGBXX, ...`

### 5.2 Esperar confirmación

El administrador te confirmará cuando esté todo configurado.

---

## ✅ PASO 6: USO DIARIO

### Cada día:

1. **Llegar a la oficina**
2. **Conectar los 4 celulares** por USB
3. **Haz doble clic en:** `start-admin.bat`
4. **Esperar 30 segundos** a que inicie todo
5. **Listo!** ✅

Los sistemas se mantendrán solos. No necesitas hacer nada más.

---

## 📊 FLUJO DE TRABAJO

```
8:00 AM
  ├─ Llegas a la oficina
  ├─ Conectas 4 celulares
  ├─ Ejecutas start-admin.bat
  └─ ✅ Sistema listo

9:00 AM - 3:00 PM
  ├─ Promotores crean trámites en plataforma web
  ├─ Los trámites llegan a Hetzner
  ├─ Hetzner llama a tu Bot Worker
  ├─ Tu Bot Worker procesa automáticamente
  └─ Los 4 celulares trabajan en paralelo

3:00 PM
  ├─ 400 trámites procesados
  ├- Cierras las ventanas
  └─ 🎉 A casa
```

---

## ⚠️ PROBLEMAS COMUNES

### "No se detectan los celulares"

**Solución:**
1. Desconecta y vuelve a conectar los cables USB
2. Acepta la pregunta "¿Permitir depuración USB?" en cada celular
3. Ejecuta: `adb devices` para verificar

### "Appium no inicia"

**Solución:**
1. Cierra todas las ventanas
2. Espera 10 segundos
3. Ejecuta nuevamente: `start-admin.bat`

### "Cloudflare Tunnel no se inicia"

**Solución:**
1. Descarga cloudflared desde: https://github.com/cloudflare/cloudflared/releases
2. Descarga: `cloudflared-windows-amd64.exe`
3. Renombra a: `cloudflared.exe`
4. Mueve a: `C:\Windows\System32\`

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisa las ventanas de logs (mensaje en rojo)
2. Toma una captura de pantalla
3. Envía al soporte técnico

---

## 🎯 RESUMEN RÁPIDO

| Hora | Acción |
|------|--------|
| 8:00 AM | Conectar 4 celulares + Ejecutar `start-admin.bat` |
| 9:00 AM | Verificar que las 3 ventanas estén abiertas |
| 9:00 AM - 3:00 PM | No hacer nada (el bot trabaja solo) |
| 3:00 PM | Cerrar ventanas |

---

**¡Listo!** Ahora tienes el sistema automatizado configurado en tu computadora. 🎉
