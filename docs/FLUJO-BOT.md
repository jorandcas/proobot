# Flujo de Automatización del Bot

El bot automatiza la app **TEMM (Telcel/Movistar)** usando **Appium + WebDriverIO** para procesar portabilidades. Reemplaza 15 operadores humanos.

---

## Vista General

```
src/main.ts (orquestador)
  │
  ├─ PASO 1  ─ login()                  ─ Login en TEMM
  ├─ PASO 2  ─ navigateToPortSinDnTransito()  ─ Menú de portas
  ├─ PASO 3  ─ fillBusquedaPortForm()   ─ Formulario de búsqueda
  ├─ PASO 4  ─ handleInterconexionModal() ─ Modal de interconexión
  ├─ PASO 5  ─ bloquearICC()            ─ Bloqueo de ICC
  ├─ PASO 6  ─ continuarTramite()       ─ Continuar trámite
  ├─ PASO 7  ─ seccionLinea()           ─ Sección Línea (NIP + FVC)
  ├─ PASO 8  ─ seccionDatosPersonales() ─ Sección Datos Personales
  ├─ PASO 9  ─ seccionDocumentos()      ─ Sección Documentos
  └─ PASO 10 ─ seccionEnvio()           ─ Envío + FolioID
```

---

## Paso 1: Login (`packages/flows/src/login.ts`)

Autentica en la app TEMM con credenciales del archivo `.env`.

**Input:** `TEMM_USER`, `TEMM_PASS`
**Flujo:**
1. Espera que cargue la pantalla de login
2. Ingresa el usuario en el campo correspondiente
3. Ingresa la contraseña
4. Toca "Iniciar Sesión"
5. Maneja el selector de dominio/página
6. Espera que la sesión se estabilice

**Cold start:** En el primer login se usan timeouts más largos (la app tarda más en arrancar).

---

## Paso 2: Navegación (`packages/flows/src/post-login.ts`)

Navega al menú de portabilidad "Porta SIN DN Transitorio".

**Flujo:**
1. Espera que cargue el menú principal
2. Toca "Portabilidad"
3. Selecciona "Porta SIN DN Transitorio"
4. Espera que cargue el formulario de búsqueda

---

## Paso 3: Búsqueda (`packages/flows/src/busqueda-port.ts`)

Llena el formulario de búsqueda con los datos del trámite.

**Input:** `SEARCH_DN`, `SEARCH_RFC` (del `.env`)
**Flujo:**
1. Ingresa el DN (número a portar)
2. Ingresa RFC (opcional)
3. Toca "Buscar"
4. Espera resultados

---

## Paso 4: Modal de Interconexión (`packages/flows/src/handle-modal.ts`)

Maneja el modal que muestra el resultado de la interconexión.

**Flujo:**
1. Espera que aparezca el modal
2. Detecta si es éxito o error
3. Si es éxito: toca "Aceptar" y continúa
4. Si es error: captura el mensaje

---

## Paso 5: Bloqueo ICC (`packages/flows/src/bloqueo-icc.ts`)

Bloquea el ICC (identificador de la SIM) como parte del proceso.

**Input:** `ICC` (del `.env`)
**Flujo:**
1. Espera la pantalla de bloqueo ICC
2. Ingresa el número ICC
3. Toca "Bloquear"
4. Espera confirmación

---

## Paso 6: Continuar Trámite (`packages/flows/src/continuar-tramite.ts`)

Toca el botón "Continuar" para avanzar a las secciones del formulario.

**Flujo:**
1. Espera que aparezca el botón
2. Toca "Continuar Trámite"
3. Espera que cargue la primera sección

---

## Paso 7: Sección Línea (`packages/flows/src/seccion-linea.ts`)

Primera sección del formulario: datos de la línea.

**Input:** `LINEA_NIP`, `FVC_FECHA` (del `.env`)
**Flujo:**
1. Espera que cargue la sección
2. Ingresa el NIP (4 dígitos del SIM pack)
3. Selecciona la fecha FVC (Fecha de Vencimiento)
   - La fecha puede seleccionarse por índice (1-5) o por valor directo
4. Toca "Siguiente"

---

## Paso 8: Datos Personales (`packages/flows/src/seccion-datos-personales.ts`)

Segunda sección: datos personales del titular.

**Input:** Variables `DATOS_*` del `.env`
**Flujo:**
1. Espera que cargue la sección
2. Ingresa nombre(s)
3. Ingresa apellido paterno
4. Ingresa apellido materno
5. Ingresa CURP
6. Ingresa teléfono(s)
7. Selecciona género
8. Ingresa fecha de nacimiento
9. Toca "Siguiente"

---

## Paso 9: Documentos (`packages/flows/src/seccion-documentos.ts`)

Tercera sección: documentos (solo requiere tocar siguiente).

**Flujo:**
1. Espera que cargue la sección
2. Toca "Siguiente" (los documentos ya están precargados)

---

## Paso 10: Envío (`packages/flows/src/seccion-envio.ts`)

Cuarta y última sección: envía el trámite y captura el FolioID.

**Output:** `EnvioResult` con `success`, `folioId`, `message`
**Flujo:**
1. Espera que cargue la sección de envío
2. Toca "ENVIAR"
3. Espera el diálogo de resultado (hasta 60 segundos):
   - **Éxito:** Detecta texto "Tramite enviado correctamente a ONIX" y extrae `FolioID: XXXX`
   - **Error:** Detecta el mensaje de error del APK
4. Clasifica el error:
   - **Error de datos** (CURP, DN, ICC, NIP, nombre, etc.) → El promotor debe corregir
   - **Error técnico** (timeout, conexión, etc.) → Reintento automático
5. Cierra el diálogo tocando "Aceptar"

---

## Manejo de Errores

### Clasificación de Errores

El bot clasifica los errores en dos categorías:

| Tipo | Causas | Acción |
|------|--------|--------|
| **Error de datos** | CURP inválido, DN incorrecto, ICC erróneo, NIP mal escrito | Marcar trámite como `error` con mensaje de corrección. Promotor debe corregir y reintentar. |
| **Error técnico** | Timeout de red, Appium crash, conexión USB perdida | Reintento automático (hasta 3 intentos con backoff exponencial). |

### Sistema de Reintentos

```typescript
// packages/core/src/retry.ts
- Hasta 3 reintentos por defecto
- Backoff exponencial: 1s → 2s → 4s
- Solo reintenta errores técnicos (no errores de datos)
```

### UI Helpers (`packages/core/src/ui-helpers.ts`)

Estrategias de click robustas:
1. Intentar click por ID de elemento
2. Fallback: buscar por texto
3. Fallback: buscar por coordenadas
4. Esperar y reintentar si el elemento no está visible

---

## Flujo de Trabajo Completo

```
[Promotor crea trámite en web]
        │
        ▼
[Trámite → PENDIENTE en PostgreSQL]
        │
        ▼
[Admin: Ejecutar Bot (POST /api/bot/execute)]
        │
        ▼
[Backend busca trámites pendientes]
        │
        ▼
[Por cada trámite:]
    │
    ├─ 1. Buscar device disponible
    ├─ 2. Device → BUSY
    ├─ 3. Llamar BotWorker HTTP
    │
    ▼
[Worker Agent recibe trabajo]
    │
    ├─ 1. Inicia Appium session
    ├─ 2. Ejecuta PASOS 1-10
    ├─ 3. Captura logs + screenshots
    │
    ▼
[Resultado]
    │
    ├─ ✅ ÉXITO: FolioID capturado
    │   ├─ Tramite → COMPLETADO
    │   ├─ Device → AVAILABLE
    │   └─ Job → COMPLETED
    │
    └─ ❌ ERROR:
        ├─ ¿Error de datos?
        │   ├─ Tramite → ERROR + mensajeCorreccion
        │   └─ Promotor corrige y reintenta
        │
        └─ ¿Error técnico?
            ├─ ¿Quedan reintentos? → WAITING
            └─ Sin reintentos → FAILED
```

---

## Configuración del Bot

### Variables de Entorno (`.env`)

```env
# Credenciales TEMM
TEMM_USER=30T9M57026
TEMM_PASS=7UE=awo1

# Dispositivo
DEVICE_UDID=ZY22FDGBWW

# Appium
APPIUM_HOST=127.0.0.1
APPIUM_PORT=4723

# Datos del trámite (modo standalone)
SEARCH_DN=5512345678
ICC=1234567890123456789
LINEA_NIP=1234
FVC_FECHA=08/04/2026

# Datos personales (modo standalone)
DATOS_NOMBRE=Juan
DATOS_APELLIDO_PATERNO=Pérez
DATOS_CURP=XXXX000101HDFRRN01
DATOS_TELEFONO=5512345678
DATOS_GENERO=Masculino
```

### Timeouts (`packages/config/src/timeouts.ts`)

| Constante | Valor | Uso |
|-----------|-------|-----|
| ELEMENT_WAIT | 10000ms | Esperar elemento |
| SHORT_WAIT | 3000ms | Pausa corta |
| MEDIUM_WAIT | 5000ms | Pausa media |
| LONG_WAIT | 10000ms | Pausa larga |
| COLD_START | 30000ms | Primer inicio de app |
| CHECK_INTERVAL | 500ms | Intervalo de chequeo de modales |

### Selectores (`packages/config/src/selectors.ts`)

Los selectores Android están centralizados usando `resource-id` y `text`:

```typescript
SEL = {
  // Login
  loginUser: 'es.indra.pc.mobile.activity.temm:id/edtUsuario',
  loginPass: 'es.indra.pc.mobile.activity.temm:id/edtClave',
  
  // Formulario
  inputDN: 'es.indra.pc.mobile.activity.temm:id/edtNumero',
  inputICC: 'es.indra.pc.mobile.activity.temm:id/edtIcc',
  
  // Diálogos de resultado
  dialogSuccessText: 'android:id/message',
  dialogSuccessFolio: '//*[contains(@text, "FolioID:")]',
  dialogErrorMessage: 'android:id/message',
  
  // Botones comunes
  btnAceptarByText: '//android.widget.Button[@text="Aceptar"]',
  btnEnviar: 'es.indra.pc.mobile.activity.temm:id/btnEnviar',
  // ... más selectores
}
```
