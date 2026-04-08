# 🔍 GUÍA - ESCÁNER ICC

## 📱 Problema: El escáner se queda cargando

### Causas posibles:

1. **La API `BarcodeDetector` no está soportada** en tu navegador
2. **Permisos de cámara denegados**
3. **Cámara no disponible**
4. **Problema de HTTPS** (requerido para acceso a cámara en algunos navegadores)

---

## ✅ SOLUCIONES

### 1. Verifica qué navegador usas

La API `BarcodeDetector` solo está soportada en:

| Navegador | Versión mínima | Soporta BarcodeDetector |
|-----------|---------------|-------------------------|
| Chrome (Android) | 83+ | ✅ Sí |
| Edge (Android) | 83+ | ✅ Sí |
| Samsung Internet | 14+ | ❌ No |
| Firefox | Cualquiera | ❌ No |
| Chrome (iOS) | Cualquiera | ❌ No |
| Safari | Cualquiera | ❌ No |

**Recomendación:** Usa **Chrome en Android** para el escáner.

---

### 2. Si NO puedes usar el escáner

**Solución: Ingresar el ICC manualmente**

El ICC tiene 19-20 dígitos numéricos y se encuentra en el código de barras del chip SIM:

```
Ejemplo: 8952034000174507529
```

Para ingresarlo manualmente:

1. Busca el código de barras en el chip SIM
2. Escribe los números (19-20 dígitos) en el campo ICC
3. Si termina con "F", no la incluyas (el sistema la quita automáticamente)

---

### 3. Verificar logs de debugging

Ahora el escáner tiene logs detallados. Para verlos:

1. **En el celular con Chrome Android:**
   - Ve a la página del dashboard
   - Toca la barra de dirección
   - Escribe: `chrome://debug`
   - O conecta el celular a la PC y usa `chrome://inspect`

2. **Qué buscar en los logs:**

Cuando presiones el botón de escanear, deberías ver:

```
🔍 [ESCÁNER ICC] Iniciando escáner...
📱 [ESCÁNER ICC] User-Agent: Mozilla/5.0 (Linux; Android 10) ...
🌐 [ESCÁNER ICC] BarcodeDetector disponible: true/false
```

**Si dice `false`:**
- Tu navegador no soporta la API
- **Solución:** Ingresa el ICC manualmente o usa Chrome Android

**Si dice `true`:**
- Deberías ver: `✅ [ESCÁNER ICC] BarcodeDetector disponible, solicitando cámara...`
- Luego: `✅ [ESCÁNER ICC] Cámara trasera accedida correctamente`

Si ves un error después de esto, revisa:
- **Permiso denegado:** Ve a Configuración > Apps > Chrome > Permisos > Cámara > Permitir
- **Cámara no encontrada:** Verifica que tu celular tenga cámara

---

## 🔧 Cómo depurar el escáner

### Paso 1: Abrir la consola remota

1. Conecta tu celular a la PC via USB
2. Habilita **USB Debugging** en el celular:
   - Configuración > Acerca del teléfono
   - Toca "Número de compilación" 7 veces
   - Ve a Configuración > Opciones de desarrollador
   - Activa "Depuración USB"

3. En Chrome en tu PC:
   - Escribe `chrome://inspect` en la barra de direcciones
   - En "Devices", deberías ver tu celular
   - Toca "inspect" en tu página del dashboard

### Paso 2: Presiona el botón de escanear

En la consola que se abrió, verás los logs:

```
🔍 [ESCÁNER ICC] Iniciando escáner...
📱 [ESCÁNER ICC] User-Agent: Mozilla/5.0 ...
🌐 [ESCÁNER ICC] BarcodeDetector disponible: true
✅ [ESCÁNER ICC] BarcodeDetector disponible, solicitando cámara...
✅ [ESCÁNER ICC] Cámara trasera accedida correctamente
✅ [ESCÁNER ICC] Video element iniciado
🔧 [ESCÁNER ICC] Configurando BarcodeDetector...
🚀 [ESCÁNER ICC] Iniciando bucle de escaneo...
```

### Paso 3: Apunta la cámara al código de barras

Cuando detecte un código, verás:

```
✅ [ESCÁNER ICC] Código detectado: [...]
📝 [ESCÁNER ICC] Código crudo: 8952034000174507529F
✂️ [ESCÁNER ICC] F final removida
✨ [ESCÁNER ICC] Código limpio: 8952034000174507529
📏 [ESCÁNER ICC] Longitud: 19
🛑 [ESCÁNER ICC] Cámara detenida
🔒 [ESCÁNER ICC] Modal cerrado
✅ [ESCÁNER ICC] ICC actualizado en el formulario
```

---

## ❌ Mensajes de error comunes

### "Tu navegador no soporta la API BarcodeDetector"

**Causa:** No estás usando un navegador compatible.

**Solución:**
- Usa Chrome Android (versión 83+)
- O ingresa el ICC manualmente

### "Permiso de cámara denegado"

**Causa:** Denegaste el permiso cuando te lo pidió.

**Solución:**
1. Ve a Configuración de Chrome en tu celular
2. Configuración del sitio > Cámara
3. Encuentra tu sitio y permite la cámara

### "No se encontró ninguna cámara"

**Causa:** El dispositivo no tiene cámara o está deshabilitada.

**Solución:**
- Verifica que la cámara funcione en otras apps
- Ingresa el ICC manualmente

### "Tiempo de escaneo agotado"

**Causa:** Pasaron 30 segundos sin detectar ningún código.

**Posibles razones:**
- Código de barras dañado o ilegible
- Poca luz
- Cámara desenfocada
- Código muy pequeño

**Solución:**
- Mejora la iluminación
- Acerca la cámara al código
- Asegúrate que el código esté claro
- O ingresa el ICC manualmente

---

## 📋 Formato del ICC

El ICC (Integrated Circuit Card Identifier) tiene:

- **19 o 20 dígitos numéricos**
- Puede terminar con "F" en el código de barras (el sistema la quita automáticamente)
- Ejemplo: `8952034000174507529` (19 dígitos)
- Ejemplo: `8952034000174507529F` -> `8952034000174507529` (después de limpiar)

---

## 💡 CONSEJOS PARA UN BUEN ESCANEo

1. **Iluminación:** Usa buena luz, evita sombras
2. **Enfoque:** Mantén el código enfocado
3. **Distancia:** Acerca la cámara (~10-15 cm del código)
4. **Ángulo:** Mantén el código paralelo a la cámara
5. **Calidad:** Asegúrate que el código esté legible (no dañado)

---

## 🚀 Alternativa futura

Para mejorar el escáner, podríamos implementar:

1. **Biblioteca de escaneo más compatible** (ej: QuaggaJS)
2. **Escaneo de foto** (tomar foto y luego escanear)
3. **Ingreso manual mejorado** con validación
4. **Detección automática de navegador** con mensaje claro

---

## 📞 Si nada funciona

**Ingresa el ICC manualmente:**

1. Busca el chip SIM del cliente
2. Encuentra el código de barras largo (19-20 dígitos)
3. Escribe los números en el campo ICC
4. Si termina con "F", no la incluyas
5. Guarda el trámite

Esta es la forma más confiable y funciona en cualquier navegador.
