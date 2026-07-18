# Referencia Completa de la API REST

## Base URL

```
http://localhost:3001/api
```

## Autenticación

La mayoría de los endpoints requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

Los endpoints de workers usan autenticación por API Key:

```
X-API-Key: <worker-api-key>
```

---

## Índice de Endpoints

| Grupo | Prefijo |
|-------|---------|
| Auth | `/auth` |
| Trámites | `/tramites` |
| Campañas | `/campanas` |
| Dashboard | `/dashboard` |
| Bot | `/bot` |
| Workers | `/workers` |

---

## Auth (`/api/auth`)

### POST `/login`
Iniciar sesión.

**Request:**
```json
{
  "correo": "admin@example.com",
  "contrasena": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "usuario": {
      "id": "uuid",
      "correo": "admin@example.com",
      "rol": "admin",
      "nombre": "Admin Name",
      "fechaCreacion": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Credenciales inválidas"
}
```

### POST `/init-admin`
Crear el primer usuario administrador (solo funciona si no hay admins).

**Request:**
```json
{
  "correo": "admin@example.com",
  "contrasena": "password123",
  "nombre": "Admin Name"
}
```

### GET `/me`
Obtener información del usuario autenticado. Requiere JWT.

### POST `/change-password`
Cambiar contraseña. Requiere JWT.

**Request:**
```json
{
  "contrasenaActual": "oldpass",
  "contrasenaNueva": "newpass"
}
```

### POST `/users` (admin)
Crear un nuevo usuario (admin o promotor).

**Request:**
```json
{
  "correo": "promotor@example.com",
  "contrasena": "password123",
  "nombre": "Promotor Name",
  "rol": "promotor"
}
```

### GET `/users` (admin)
Listar todos los usuarios.

### POST `/revoke-session/:usuarioId` (admin)
Revocar todas las sesiones de un usuario (incrementa tokenVersion).

---

## Trámites (`/api/tramites`)

### GET `/`
Listar trámites. Requiere JWT. Filtros opcionales por query params.

**Query params:** `estado`, `idCampana`, `idPromotor`, `search` (DN, nombre, CURP), `fechaDesde`, `fechaHasta`, `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "idCampana": "uuid",
      "idPromotor": "uuid",
      "fechaCreacion": "2024-01-01T00:00:00.000Z",
      "estado": "pendiente",
      "dn": "5512345678",
      "icc": "1234567890123456789",
      "nip": "1234",
      "fvcFecha": "08/04/2026",
      "nombre": "Juan",
      "apellidoPaterno": "Pérez",
      "curp": "XXXX000101HDFRRN01",
      "telefono": "5512345678",
      "genero": "Masculino",
      "campanaNombre": "Campaña 2024-01-01",
      "promotorNombre": "Promotor Name"
    }
  ]
}
```

### GET `/:id`
Obtener detalle de un trámite.

### POST `/`
Crear un nuevo trámite. Requiere autenticación.

**Request:**
```json
{
  "dn": "5512345678",
  "icc": "1234567890123456789",
  "fvcFecha": "08/04/2026",
  "nip": "1234",
  "nombre": "Juan",
  "nombreSegundo": "",
  "apellidoPaterno": "Pérez",
  "apellidoMaterno": "López",
  "curp": "XXXX000101HDFRRN01",
  "telefono": "5512345678",
  "telefono2": "",
  "genero": "Masculino",
  "email": "correo@example.com",
  "fechaNacimiento": "01/01/2000"
}
```

**Campos obligatorios:** `dn`, `icc`, `fvcFecha`, `nip`, `nombre`, `apellidoPaterno`, `curp`, `telefono`, `genero`, `fechaNacimiento`

### PUT `/:id/cancel`
Cancelar un trámite (propio o cualquier si es admin).

### PUT `/:id/corregir`
Corregir datos y reintentar un trámite en estado `error`. Requiere JWT.

**Request:** Mismos campos que `POST /` (solo se envían los campos a corregir).

### PUT `/:id` (admin)
Actualizar cualquier campo de un trámite.

### DELETE `/:id` (admin)
Eliminar un trámite.

### PUT `/:id/reset` (admin)
Reintentar un trámite fallido (cambia estado a `pendiente`).

### GET `/pending/list` (admin)
Listar trámites pendientes.

### GET `/fvc/fechas`
Obtener fechas de vencimiento FVC disponibles calculadas por el backend.

---

## Campañas (`/api/campanas`)

### GET `/`
Listar todas las campañas.

### GET `/active`
Obtener campañas activas.

### GET `/with-tramites`
Obtener campañas que tienen trámites asociados.

### GET `/today-ensure`
Obtener o crear la campaña del día de hoy.

### GET `/:id`
Obtener detalle de campaña.

### POST `/` (admin)
Crear campaña.

**Request:**
```json
{
  "nombre": "Campaña Julio 2026",
  "fecha": "2026-07-16"
}
```

### PUT `/:id` (admin)
Actualizar campaña.

### DELETE `/:id` (admin)
Eliminar campaña.

---

## Dashboard (`/api/dashboard`)

### GET `/promotor`
Estadísticas del promotor autenticado.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalHoy": 15,
    "totalSemana": 75,
    "totalMes": 300,
    "porEstado": {
      "pendiente": 5,
      "procesando": 2,
      "completado": 8,
      "error": 0,
      "cancelado": 0
    }
  }
}
```

### GET `/admin`
Estadísticas globales del admin.

**Response:**
```json
{
  "success": true,
  "data": {
    "tramitesPendientes": 42,
    "devicesAvailable": 3,
    "devicesBusy": 1,
    "devicesOffline": 0,
    "tramitesHoy": 120,
    "tramitesSemana": 580,
    "tramitesMes": 2400,
    "exitoHoy": 115,
    "erroresHoy": 5,
    "ultimaEjecucion": { ... },
    "promotoresActivos": 4
  }
}
```

### GET `/recent`
Últimos trámites creados. Query param: `limit` (default 10).

### GET `/campana/:idCampana`
Trámites de una campaña específica.

---

## Bot (`/api/bot`)

Todos los endpoints requieren rol `admin`.

### POST `/execute`
Iniciar ejecución del bot.

**Request:**
```json
{
  "maxTramites": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ejecucionId": "uuid",
    "totalTramites": 50
  }
}
```

### POST `/cancel`
Cancelar ejecución en curso.

### GET `/status`
Estado actual de la ejecución del bot.

### GET `/history`
Historial de ejecuciones.

### GET `/execution/:id`
Detalle de una ejecución específica.

### GET `/tramite/:idTramite/logs`
Logs del bot para un trámite específico.

### GET `/devices`
Listar dispositivos Android registrados.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "udid": "ZY22FDGBWW",
      "name": "Samsung A54",
      "status": "available",
      "workerUrl": "http://192.168.1.100:3000",
      "lastUsed": "2026-07-15T10:30:00.000Z",
      "createdAt": "2026-07-01T00:00:00.000Z"
    }
  ]
}
```

### POST `/devices`
Agregar un nuevo dispositivo.

**Request:**
```json
{
  "udid": "ZY22FDGBWW",
  "name": "Samsung A54"
}
```

### DELETE `/devices/:id`
Eliminar un dispositivo.

---

## Workers (`/api/workers`)

### POST `/register`
Registrar un nuevo worker. Pública (sin auth). El backend genera una API key automáticamente.

**Request:**
```json
{
  "name": "Worker-Sede-Norte-1",
  "location": "Sede Norte",
  "deviceId": "ZY22FDGBWW"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Worker-Sede-Norte-1",
    "apiKey": "generated-api-key"
  }
}
```

### GET `/health`
Health check del sistema de workers. Autenticación opcional.

### PUT `/:id/heartbeat`
Actualizar heartbeat del worker.

**Request body:** `{ "status": "ONLINE" }` (opcional)

### GET `/jobs/pending`
Obtener siguiente trabajo pendiente para el worker.

**Query param:** `workerId`

**Response (con trabajo):**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": "uuid",
      "tramiteId": "uuid",
      "status": "WAITING",
      "tramite": {
        "dn": "5512345678",
        "icc": "1234567890123456789",
        "nip": "1234",
        "fvcFecha": "08/04/2026",
        "nombre": "Juan",
        "apellidoPaterno": "Pérez",
        "curp": "XXXX000101HDFRRN01",
        "telefono": "5512345678",
        "genero": "Masculino"
      }
    }
  }
}
```

**Response (sin trabajo):**
```json
{
  "success": true,
  "data": { "job": null }
}
```

### POST `/jobs/:id/start`
Marcar trabajo como iniciado.

### POST `/jobs/:id/complete`
Marcar trabajo como completado.

**Request:**
```json
{
  "folioId": "1234567890"
}
```

### POST `/jobs/:id/fail`
Marcar trabajo como fallido.

**Request:**
```json
{
  "error": "Mensaje de error"
}
```

### POST `/jobs/:id/screenshots`
Subir screenshot del trabajo.

**Request:** Multipart form-data con campo `screenshot` (imagen).

### GET `/`
Listar workers registrados.

### GET `/stats`
Estadísticas de workers.

### GET `/:id`
Obtener worker por ID.

### PATCH `/:id`
Actualizar worker.

### DELETE `/:id`
Eliminar worker.

### GET `/queue/stats`
Estadísticas de la cola de trabajos.

---

## Códigos de Error

| Código | Significado |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado |
| 400 | Datos inválidos |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | No encontrado |
| 409 | Conflicto |
| 500 | Error interno |

## Formato de Respuesta

Todas las respuestas siguen el formato:

```json
{
  "success": true|false,
  "data": { ... },
  "error": "Mensaje de error (solo si success=false)",
  "message": "Mensaje informativo (opcional)"
}
```
