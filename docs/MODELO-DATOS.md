# Modelo de Datos

El sistema usa **PostgreSQL** con **Prisma ORM**. El esquema completo está en `plataforma-promotores/backend/prisma/schema.prisma`.

---

## Diagrama de Entidades

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Usuario    │     │   Campaña    │     │   Device    │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)      │     │ id (PK)     │
│ correo      │◄────│ nombre       │     │ udid (UQ)   │
│ contrasena  │     │ fecha        │     │ name        │
│ rol         │     │ fechaInicio  │     │ status      │
│ nombre      │     │ fechaFin     │     │ workerUrl   │
│ tokenVersion│     │ activa       │     │ lastUsed    │
└──────┬──────┘     └──────┬───────┘     └──────┬──────┘
       │                   │                    │
       │ 1:N               │ 1:N                │ 1:1
       │                   │                    │
       │    ┌──────────────┴──────────────┐     │
       │    │          Trámite            │     │
       │    ├─────────────────────────────┤     │
       │    │ id (PK)                    │     │
       ├────│ idPromotor                 │     │
       │    │ idCampana                  │     │
       │    │ estado                     │     │
       │    │ fechaCreacion              │     │
       │    │ fechaProcesamiento         │     │
       │    │ dn, icc, nip, rfc         │     │
       │    │ fvcFecha, fvcIndice        │     │
       │    │ nombre, apellidos          │     │
       │    │ curp, telefono, genero    │     │
       │    │ email, fechaNacimiento    │     │
       │    │ resultado                 │     │
       │    │ mensajeCorreccion         │     │
       │    └────────────┬───────────────┘     │
       │                 │                     │
       │                 │ 1:N                 │ 1:N
       │                 │                     │
       │    ┌────────────┴──────────────┐     │
       │    │         BotLog           │     │
       │    ├──────────────────────────┤──────┘
       │    │ id (PK)                 │
       │    │ idTramite               │
       │    │ idDevice                │
       │    │ fechaInicio             │
       │    │ fechaFin                │
       │    │ estado (EXITOSO/FALLIDO)│
       │    │ logs[]                  │
       │    │ error?                  │
       │    └─────────────────────────┘
       │
       │    ┌─────────────────────────┐
       │    │     BotExecution        │
       │    ├─────────────────────────┤
       └────│ ejecutadoPor            │
            │ id (PK)                │
            │ fechaInicio            │
            │ fechaFin               │
            │ estado                 │
            │ totalTramites          │
            │ completados            │
            │ errores                │
            │ logs[]                 │
            └─────────────────────────┘

    ┌──────────────────┐     ┌───────────────────┐
    │     Worker        │     │       Job         │
    ├──────────────────┤     ├───────────────────┤
    │ id (PK)          │     │ id (PK)           │
    │ name             │     │ tramiteId         │
    │ location         │────►│ workerId          │
    │ deviceId (UQ)    │     │ status            │
    │ status           │     │ priority          │
    │ lastHeartbeat    │     │ retryCount        │
    │ ip               │     │ maxRetries        │
    │ apiKey           │     │ folioId?          │
    └──────────────────┘     │ errorMessage?     │
                             │ assignedAt        │
                             │ startedAt         │
                             │ completedAt       │
                             └────────┬──────────┘
                                      │ 1:1
                                      │
                             ┌────────┴──────────┐
                             │   JobEvidence     │
                             ├───────────────────┤
                             │ id (PK)           │
                             │ logsPath          │
                             │ screenshots[]     │
                             │ videoPath?        │
                             │ metadata (JSON)?   │
                             └───────────────────┘
```

---

## Entidades

### Usuario

Representa a los usuarios del sistema: administradores y promotores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| correo | String (único) | Email del usuario |
| contrasena | String | Hash bcrypt de la contraseña |
| rol | Enum (ADMIN/PROMOTOR) | Rol del usuario |
| nombre | String | Nombre completo |
| fechaCreacion | DateTime | Fecha de registro |
| tokenVersion | Int (default 0) | Para revocar sesiones |

**Relaciones:**
- `tramites[]` - Trámites creados por el usuario (1:N)
- `botExecutions[]` - Ejecuciones iniciadas por el usuario (1:N)

### Campaña

Agrupa trámites por fecha/período.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| nombre | String | Nombre de la campaña |
| fecha | DateTime | Fecha de la campaña |
| fechaInicio | DateTime | Inicio del rango (6:00 AM del día anterior) |
| fechaFin | DateTime | Fin del rango (5:59 AM del día actual) |
| activa | Boolean | Si la campaña está activa |
| createdAt | DateTime | Fecha de creación |

**Índices:** `[fecha]`, `[activa]`
**Relaciones:** `tramites[]` (1:N)

### Trámite

Representa una solicitud de portabilidad (porta).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| idCampana | String (FK) | Campaña a la que pertenece |
| idPromotor | String (FK) | Promotor que lo creó |
| fechaCreacion | DateTime | Fecha de creación |
| estado | Enum (ver abajo) | Estado actual del trámite |
| fechaProcesamiento | DateTime? | Cuándo fue procesado |
| dn | String? | Número de teléfono a portar |
| rfc | String? | RFC (para búsqueda) |
| requestId | String? | ID de solicitud |
| icc | String? | ICC (identificador SIM) |
| nip | String? | NIP (4 dígitos) |
| fvcIndice | Int? | Índice de fecha de vencimiento (1-5) |
| fvcFecha | String? | Fecha de vencimiento (DD/MM/YYYY) |
| nombre | String? | Nombre del titular |
| nombreSegundo | String? | Segundo nombre |
| apellidoPaterno | String? | Apellido paterno |
| apellidoMaterno | String? | Apellido materno |
| curp | String? | CURP del titular |
| telefono | String? | Teléfono de contacto |
| telefono2 | String? | Teléfono alternativo |
| genero | String? | Masculino/Femenino |
| email | String? | Correo electrónico |
| fechaNacimiento | String? | Fecha de nacimiento (DD/MM/YYYY) |
| resultado | String? | Mensaje de éxito/error |
| botLogId | String? | ID del log (no único - múltiples intentos) |
| mensajeCorreccion | String? | Mensaje de corrección para promotor |

**Estados (`EstadoTramite`):**
| Valor | Descripción |
|-------|-------------|
| PENDIENTE | Esperando procesamiento |
| PROCESANDO | Siendo procesado por el bot |
| COMPLETADO | Procesado exitosamente |
| ERROR | Falló (requiere corrección o reintento) |
| CANCELADO | Cancelado por admin/promotor |

**Índices:** `[idCampana]`, `[idPromotor]`, `[estado]`, `[fechaCreacion]`
**Relaciones:** `campana` (N:1), `promotor` (N:1), `botLogs[]` (1:N), `jobs[]` (1:N)

### BotLog

Registro detallado de cada ejecución del bot para un trámite.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| idTramite | String (FK) | Trámite asociado |
| idDevice | String (FK) | Dispositivo usado |
| fechaInicio | DateTime | Inicio de la ejecución |
| fechaFin | DateTime | Fin de la ejecución |
| estado | Enum (EXITOSO/FALLIDO) | Resultado |
| logs | String[] | Array de mensajes de log |
| error | String? | Mensaje de error si falló |

**Relaciones:** `tramite` (N:1), `device` (N:1)

### Device

Dispositivo Android registrado para ejecutar bots.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| udid | String (único) | UDID del Android |
| name | String | Nombre descriptivo |
| status | Enum (AVAILABLE/BUSY/OFFLINE) | Estado actual |
| workerUrl | String | URL del bot worker |
| lastUsed | DateTime? | Último uso |
| createdAt | DateTime | Fecha de registro |

**Relaciones:** `botLogs[]` (1:N), `worker` (1:1)

### BotExecution

Registro de una ejecución batch (procesar múltiples trámites).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| fechaInicio | DateTime | Inicio de la ejecución |
| fechaFin | DateTime? | Fin de la ejecución |
| estado | Enum | PENDIENTE/EN_PROGRESO/COMPLETADO/CANCELADO |
| totalTramites | Int | Cantidad a procesar |
| completados | Int | Cantidad exitosa |
| errores | Int | Cantidad fallida |
| logs | String[] | Logs de la ejecución |
| ejecutadoPor | String (FK) | Admin que la inició |

**Relaciones:** `ejecutor` (N:1 → Usuario)

### Worker

Nodo ejecutor local que procesa los trabajos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| name | String | Nombre del worker |
| location | String | Ubicación física |
| deviceId | String? (único) | Dispositivo asignado |
| status | Enum (ver abajo) | Estado del worker |
| lastHeartbeat | DateTime? | Último heartbeat |
| ip | String? | Dirección IP |
| apiKey | String? | API key para autenticación |
| createdAt | DateTime | Fecha de registro |
| updatedAt | DateTime | Última actualización |

**Estados (`WorkerStatus`):**
| Valor | Descripción |
|-------|-------------|
| ONLINE | Conectado y disponible |
| BUSY | Procesando un trabajo |
| OFFLINE | Desconectado (sin heartbeat > 2 min) |
| ERROR | Error crítico |

**Relaciones:** `jobs[]` (1:N), `device` (1:1)

### Job

Trabajo en cola para ser procesado por un worker.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| tramiteId | String (FK) | Trámite a procesar |
| workerId | String? (FK) | Worker asignado |
| status | Enum (ver abajo) | Estado del trabajo |
| priority | Int (default 0) | Prioridad |
| retryCount | Int (default 0) | Intentos realizados |
| maxRetries | Int (default 3) | Máximo de intentos |
| folioId | String? | FolioID de la portabilidad (éxito) |
| errorMessage | String? | Mensaje de error |
| assignedAt | DateTime? | Asignado a worker |
| startedAt | DateTime? | Iniciado |
| completedAt | DateTime? | Completado |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

**Estados (`JobStatus`):**
| Valor | Descripción |
|-------|-------------|
| WAITING | Esperando worker disponible |
| ASSIGNED | Asignado a un worker |
| PROCESSING | En ejecución |
| COMPLETED | Completado exitosamente |
| FAILED | Falló (sin más reintentos) |
| CANCELLED | Cancelado por admin |

**Relaciones:** `tramite` (N:1), `worker` (N:1), `evidence` (1:1)

### JobEvidence

Evidencias de la ejecución de un trabajo (logs, screenshots).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| jobId | String (FK, único) | Trabajo asociado |
| logsPath | String? | Ruta al archivo de logs |
| screenshots | String[] | URLs de screenshots |
| videoPath | String? | URL del video (opcional) |
| metadata | JSON? | Datos adicionales (timing, steps) |
| createdAt | DateTime | Fecha de creación |

---

## Convenciones

- **IDs:** UUID v4 generados automáticamente
- **Fechas:** Siempre en formato ISO 8601 (UTC)
- **Timestamps:** `createdAt` y `updatedAt` manejados por Prisma
- **Soft delete:** No implementado. Se usa estado `CANCELADO`
- **Enums:** Mapeados como strings en PostgreSQL
- **Naming:** `snake_case` en DB (vía `@@map`), `camelCase` en TypeScript
