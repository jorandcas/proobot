# Guía del Promotor - Plataforma de Portabilidades

## ¿Qué hago aquí?

Como promotor, tu trabajo es **crear trámites de portabilidad** en la plataforma web. El bot automático se encarga de procesarlos en la app de Movistar Onix.

Ya no necesitas entrar a la app TEMM ni hacer ningún paso manual en el celular. Todo se hace desde el navegador.

---

## Primeros Pasos

### 1. Acceder a la Plataforma

Abre tu navegador (Chrome, Edge, Firefox) y ve a la URL que te dio tu administrador.

### 2. Iniciar Sesión

```
Correo: el que te asignó el admin
Contraseña: la que te asignó el admin
```

### 3. Pantalla Principal (Dashboard)

Al entrar verás tu dashboard con:
- **Total hoy** - Trámites que has creado hoy
- **Total semana** - Trámites de esta semana
- **Total mes** - Trámites de este mes
- **Por estado** - Cuántos están pendientes, procesando, completados, etc.

---

## Crear un Trámite

Desde el dashboard, haz clic en **"Nuevo Trámite"**.

### Paso 1: Datos del Número (DN)

```
DN:          Número a portar (10 dígitos, ej: 5512345678)
```

### Paso 2: ICC (Identificador de la SIM)

El ICC es el número de 18-20 dígitos de la SIM. Puedes:

**Opción A - Escanear código de barras (recomendado):**
1. Haz clic en el botón de escáner
2. Apunta la cámara al código de barras del SIM pack
3. El ICC se llena automáticamente

**Opción B - Escribir manualmente:**
1. Escribe el ICC directamente en el campo

### Paso 3: Fecha FVC

Selecciona la fecha de vencimiento (FVC) de las opciones disponibles.

### Paso 4: NIP

```
NIP:  Código de 4 dígitos que viene en el SIM pack
```

### Paso 5: Datos Personales

```
Nombre:              Juan
Segundo Nombre:      (opcional)
Apellido Paterno:    Pérez
Apellido Materno:    López
CURP:                XXXXXX000101HDFRRN01
Teléfono:            5512345678
Teléfono 2:          (opcional)
Género:              Masculino / Femenino
Email:               (opcional)
Fecha de Nacimiento: 01/01/2000
```

### Paso 6: Guardar

Haz clic en **"Guardar"**.

El trámite se guarda como **pendiente** y quedará en la cola para que el bot lo procese automáticamente.

---

## Estados de un Trámite

| Estado | Significado | ¿Qué hago? |
|--------|-------------|------------|
| **Pendiente** | Esperando ser procesado | Nada, espera |
| **Procesando** | El bot lo está haciendo | Nada, espera |
| **Completado** | ¡Éxito! El trámite se portó | Entregar SIM al cliente |
| **Error** | Falló por datos incorrectos | Corregir datos y reintentar |
| **Cancelado** | Cancelado por el admin | Consultar con admin |

---

## Corregir un Trámite en Error

Si un trámite queda en estado **error**, significa que el bot encontró un problema con los datos.

1. Haz clic en el trámite con estado **error**
2. Revisa el **mensaje de corrección** (explica qué está mal)
3. Haz clic en **"Corregir"**
4. Corrige los campos indicados
5. Guarda los cambios
6. El trámite se pone en **pendiente** para reprocesar

**Errores comunes:**
- CURP inválido o mal escrito
- DN no coincide con el titular
- NIP incorrecto (revisa el SIM pack)
- Fecha FVC vencida

---

## Cancelar un Trámite

Si creaste un trámite por error:

1. Abre el trámite
2. Haz clic en **"Cancelar"**
3. Confirma la cancelación

---

## Dashboard - Tu Resumen

En tu dashboard puedes ver:

- **Métricas rápidas:** Trámites de hoy, esta semana, este mes
- **Distribución por estado:** Cuántos están en cada estado
- **Trámites recientes:** Lista de tus últimos trámites
- **Filtrar:** Por estado, campaña, o buscar por DN/nombre

---

## Preguntas Frecuentes

### ¿Cuánto tarda en procesarse un trámite?
Depende de la cola, pero generalmente entre 1-5 minutos.

### ¿Puedo crear varios trámites a la vez?
Sí, crea todos los que necesites. El bot los procesa en orden.

### ¿Qué hago cuando un trámite se completa?
Entrega la SIM al cliente. Ya está portado.

### ¿Por qué falló mi trámite?
El bot deja un mensaje de error explicando la causa. Normalmente es un dato mal escrito.

### ¿Necesito tener el celular encendido?
No. El bot se encarga de todo. Tú solo capturas datos en la web.

---

## Tips

1. **Siempre escanea el ICC** - Evita errores de dedo
2. **Verifica el CURP** - Es la causa más común de errores
3. **Revisa el SIM pack** - El NIP y la fecha FVC están ahí
4. **No tardes en corregir** - Los trámites en error se acumulan
5. **Pregunta si tienes dudas** - Es mejor confirmar que adivinar
