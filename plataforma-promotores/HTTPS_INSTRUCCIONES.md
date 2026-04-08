# 🔐 CONFIGURACIÓN HTTPS - ESCÁNER ICC

## ✅ HTTPS ya está configurado

He generado un certificado SSL y configurado Vite para usar HTTPS.

---

## 🔄 PASO 1: Reinicia el frontend

**MUY IMPORTANTE:** Debes reiniciar el servidor para que HTTPS funcione.

```bash
# En la terminal del frontend:
# 1. Presiona Ctrl+C para detener
# 2. Reinicia:
cd plataforma-promotores/frontend
npm run dev
```

---

## 📱 PASO 2: Accede desde tu celular con HTTPS

1. **Abre Chrome en tu celular**
2. **Entra a:** `https://192.168.1.66:3000`

   **Nota el "https://"** al principio (antes era "http://")

3. **Verás una advertencia de seguridad:** "Tu conexión no es privada"

   Esto es **NORMAL** porque el certificado es auto-firmado para desarrollo.

---

## 🔓 PASO 3: Confiar en el certificado

### En Chrome Android:

1. **Verás una pantalla que dice:**
   - "Tu conexión no es privada"
   - "Ataque: Error de CERTIFICADO"

2. **Toca "Avanzado"** (Advanced)

3. **Toca "Continuar al sitio"** o **"Ir a 192.168.1.66 (no seguro)"**

   - El texto puede variar ligeramente
   - Puede decir "Proceder de manera insegura"

4. **La página cargará** y verás el dashboard

---

## 📷 PASO 4: Probar el escáner

1. **Entra al formulario** de nuevo trámite
2. **Presiona el botón del escáner** (ícono de código de barras)
3. **Chrome te pedirá permiso:**
   - Toca **"Permitir"** cuando pregunte si el sitio puede usar la cámara
4. **La cámara se abrirá** y podrás escanear el ICC

---

## 🎯 ¿Sabrás que funcionó?

Cuando presiones el botón del escáner:
- ✅ Chrome mostrará un diálogo: "Permitir que 192.168.1.66 use la cámara"
- ✅ Tocas "Permitir"
- ✅ Se abre un modal con la cámara trasera
- ✅ Aparece un recuadro verde para guiar el escaneo

---

## ⚠️ Si la advertencia de seguridad no aparece

Si ves directamente la página sin advertencia, **es posible que Chrome ya esté usando HTTP**.

Verifica:
1. **Mira la barra de direcciones**
2. **Debiera decir:** `https://192.168.1.66:3000`
3. **NO debe decir:** `http://192.168.1.66:3000`

Si dice http:
1. Escribe manualmente: `https://192.168.1.66:3000`
2. Presiona Enter
3. Debería aparecer la advertencia de seguridad

---

## 🔧 Solución de problemas

### Problema: "La conexión se reinició"

**Causa:** Es posible que el firewall esté bloqueando el puerto 3000 para HTTPS.

**Solución:**
```powershell
# Windows PowerShell como administrador
netsh advfirewall firewall add rule name="Vite HTTPS" dir=in action=allow protocol=TCP localport=3000
```

### Problema: El certificado no es válido

**Causa:** Algunas versiones de Android son muy estrictas.

**Solución:**
1. Toca "Avanzado" > "Continuar al sitio"
2. Si no funciona, ingresa el ICC manualmente

### Problema: Chrome cierra la página inmediatamente

**Causa:** Versión muy reciente de Chrome con seguridad estricta.

**Solución:**
- Ingresa el ICC manualmente
- O usa un navegador diferente (Firefox)

---

## 📋 Resumen rápido

1. ✅ Reinicia el frontend: `cd plataforma-promotores/frontend && npm run dev`
2. ✅ Entra en el celular: `https://192.168.1.66:3000` (¡con HTTPS!)
3. ✅ Toca "Avanzado" > "Continuar al sitio" (ignorar advertencia)
4. ✅ Presiona el botón del escáner
5. ✅ Permite el acceso a la cámara
6. ✅ ¡Escanea el ICC!

---

## 🆘 Si nada funciona

**Último recurso:** Ingresa el ICC manualmente
- 19-20 dígitos numéricos
- Ejemplo: `8952034000174507529`
- Siempre funciona

---

**¡Reinicia el frontend y prueba con HTTPS!** 🚀
