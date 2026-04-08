# 🔍 GUÍA DE DEBUGGING - ACCESO MÓVIL

## 📱 Problema: Error de red desde el celular

Si puedes ingresar al dashboard desde tu computadora pero desde el celular obtienes "Network Error", sigue esta guía.

---

## 🎯 SOLUCIÓN RÁPIDA

### Paso 1: Obtén la IP de tu computadora

**Windows:**
```bash
ipconfig
```
Busca "IPv4 Address" bajo tu adaptador WiFi/Ethernet. Ejemplo: `192.168.1.100`

**Linux:**
```bash
ip addr show
# o
ifconfig
```

**Mac:**
```bash
ifconfig
```

### Paso 2: Actualiza la configuración del Frontend

Crea o edita el archivo `plataforma-promotores/frontend/.env`:

```env
VITE_API_URL=http://192.168.1.100:3001/api
```

⚠️ **Reemplaza `192.168.1.100` con tu IP real**

### Paso 3: Reinicia el Frontend

```bash
cd plataforma-promotores/frontend
npm run dev
```

### Paso 4: Accede desde tu celular

1. Conecta el celular a la misma red WiFi
2. Abre el navegador y entra a: `http://192.168.1.100:3000` (o 5173, según el puerto que use Vite)
3. Intenta iniciar sesión

---

## 🖥️ Verificando Logs del Backend

Cuando intentes login desde el celular, el backend mostrará logs detallados:

```
============================================================
📅 [2025-03-07T12:34:56.789Z] PETICIÓN RECIBIDA
============================================================
🔗 POST /api/auth/login
📱 Cliente IP: 192.168.1.105
🌐 User-Agent: Mozilla/5.0 (Linux; Android 10) ...
📱 DISPOSITIVO MÓVIL DETECTADO
📦 Body: {
  "correo": "test@test.com",
  "contrasena": "***"
}
============================================================
```

**Si NO ves estos logs:** El celular no está alcanzando el backend.
**Si SÍ ves los logs:** El backend está recibiendo la petición, revisa la respuesta.

---

## 🔧 SOLUCIÓN DE PROBLEMAS COMUNES

### Problema 1: "Network Error" en el celular

**Síntoma:** El navegador muestra un error de red genérico.

**Posibles causas:**
1. ❌ El frontend no está configurado con la IP correcta
2. ❌ El backend solo escucha en localhost (ya solucionado en el código)
3. ❌ Firewall de Windows bloqueando el puerto 3001

**Solución:**
```bash
# Windows Firewall - Permitir puerto 3001
# Abre PowerShell como administrador:
netsh advfirewall firewall add rule name="API Backend" dir=in action=allow protocol=TCP localport=3001

# También permitir puerto del frontend (3000 o 5173)
netsh advfirewall firewall add rule name="Vite Dev" dir=in action=allow protocol=TCP localport=3000
```

### Problema 2: "Connection Refused"

**Síntoma:** Error de conexión rechazada.

**Solución:**
- Asegúrate que el backend esté corriendo: `cd plataforma-promotores/backend && npm run dev`
- Asegúrate que el frontend esté corriendo: `cd plataforma-promotores/frontend && npm run dev`

### Problema 3: "CORS Error"

**Síntoma:** Error de CORS en la consola del navegador.

**Solución:** Ya solucionado en el código (backend/src/server.ts), pero si persiste:
- Verifica que el backend tenga `app.use(cors({ origin: '*' }))`
- Revisa que no haya firewalls intermediarios

### Problema 4: Login fallido pero sin error de red

**Síntoma:** La petición llega pero el login falla.

**Solución:**
- Revisa los logs del backend para ver el error exacto
- Verifica que las credenciales sean correctas
- Revisa que el usuario exista en la base de datos

---

## 📊 Herramientas de Debugging

### 1. Verificar que el puerto esté abierto

```bash
# Windows (PowerShell)
Test-NetConnection -ComputerName localhost -Port 3001
```

### 2. Verificar qué procesos están usando los puertos

```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :3000
```

### 3. Ver logs en tiempo real

El backend ahora muestra información detallada de cada petición:
- IP del cliente
- User-Agent (detecta si es móvil)
- Método HTTP y ruta
- Body de la petición (passwords ocultos)
- Código de respuesta

### 4. Remote Debugging en Chrome Android

1. En el celular: Habilita "USB Debugging" en opciones de desarrollador
2. Conecta el celular via USB
3. En Chrome PC: `chrome://inspect`
4. Selecciona tu dispositivo para ver la consola

---

## ✅ CHECKLIST ANTES DE REPORTAR UN PROBLEMA

- [ ] Tanto el backend como el frontend están corriendo
- [ ] El celular y la PC están en la misma red WiFi
- [ ] El archivo `.env` del frontend tiene la IP correcta de la PC
- [] El firewall de Windows permite los puertos 3000 y 3001
- [ ] Puedes hacer ping desde el celular a la IP de la PC
- [ ] Los logs del backend muestran las peticiones del celular
- [ ] El User-Agent en los logs indica que es un dispositivo móvil

---

## 🆘 AÚN ASÍ NO FUNCIONA?

Si después de seguir todos los pasos sigues teniendo problemas:

1. **Captura los logs completos del backend** cuando intentas login desde el celular
2. **Abre las DevTools del navegador en el celular** (si es posible) y captura:
   - Pestaña Console (errores de JavaScript)
   - Pestaña Network (la petición fallida y su código de estado)
3. **Verifica la consola del frontend** donde está corriendo Vite
4. **Confirma la IP de tu PC** con `ipconfig` en Windows

Con esta información será mucho más fácil identificar el problema.

---

## 📝 ARCHIVOS MODIFICADOS

- `backend/src/server.ts` - Agregados logs detallados y escucha en 0.0.0.0
- `frontend/.env.example` - Plantilla de configuración con instrucciones

## 🎓 CONCEPTOS CLAVE

**¿Por qué localhost no funciona desde el celular?**
- `localhost` siempre se refiere al dispositivo actual
- En el celular, `localhost` = el celular mismo
- En la PC, `localhost` = la PC misma
- Por eso necesitamos usar la IP de la red

**¿Por qué 0.0.0.0?**
- `0.0.0.0` significa "escuchar en TODAS las interfaces de red"
- Permite conexiones desde localhost Y desde otras computadoras en la red
- Es necesario para que el backend acepte peticiones del celular
