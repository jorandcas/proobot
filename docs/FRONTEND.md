# Frontend - Plataforma de Promotores

Aplicación **React 18 + TypeScript + Vite + Tailwind CSS**.

---

## Estructura

```
plataforma-promotores/frontend/src/
├── main.tsx              # Punto de entrada
├── index.css             # Estilos globales (Tailwind)
├── App.tsx               # Router + rutas protegidas
├── vite-env.d.ts
│
├── types/
│   └── index.ts          # Tipos compartidos
│
├── services/
│   └── api.ts            # Axios + reintentos + mensajes de error
│
├── context/
│   ├── AuthContext.tsx    # Estado de autenticación
│   └── ToastContext.tsx   # Notificaciones toast
│
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx    # Layout del panel admin
│   │   └── AdminSidebar.tsx   # Sidebar de navegación admin
│   │
│   └── common/
│       ├── AnimatedBackground.tsx  # Fondo animado (login)
│       ├── BotProgress.tsx         # Barra de progreso del bot
│       ├── Button.tsx              # Botón reutilizable
│       ├── Card.tsx                # Tarjeta contenedora
│       ├── EstadoBadge.tsx         # Badge de estado con colores
│       ├── Input.tsx               # Campo de entrada
│       ├── LoadingSpinner.tsx      # Spinner de carga
│       ├── Modal.tsx               # Modal genérico
│       ├── PromotoresManager.tsx   # Gestor de promotores
│       ├── ScannerModal.tsx        # Modal de escáner ICC
│       ├── StatsCard.tsx           # Tarjeta de estadística
│       ├── Table.tsx               # Tabla de datos
│       └── Toast.tsx               # Notificación toast
│
└── pages/
    ├── Login.tsx                    # Login
    ├── DashboardPromotor.tsx        # Dashboard promotor
    ├── DashboardAdmin.tsx           # Dashboard admin
    ├── FormTramite.tsx              # Nuevo trámite
    ├── EditarTramite.tsx            # Editar/corregir trámite
    └── admin/
        ├── DashboardOverview.tsx     # Resumen admin
        ├── BotControl.tsx            # Control del bot
        ├── PromotoresManagement.tsx  # Gestión de promotores
        └── TramitesManagement.tsx    # Gestión de trámites
```

---

## Rutas

| Ruta | Componente | Rol | Descripción |
|------|-----------|-----|-------------|
| `/login` | Login | Público | Inicio de sesión |
| `/dashboard` | DashboardPromotor | promotor | Dashboard del promotor |
| `/tramites/nuevo` | FormTramite | promotor | Crear nuevo trámite |
| `/tramites/:id/editar` | EditarTramite | promotor | Editar/corregir trámite |
| `/admin/dashboard` | DashboardOverview | admin | Dashboard del admin |
| `/admin/tramites` | TramitesManagement | admin | Gestionar todos los trámites |
| `/admin/bot` | BotControl | admin | Control de ejecución del bot |
| `/admin/promotores` | PromotoresManagement | admin | Gestionar promotores |

---

## Componentes

### Common Components

#### `Button`
Botón reutilizable con variantes.

```tsx
<Button variant="primary" onClick={handleClick} loading={isLoading}>
  Guardar
</Button>
```

**Variantes:** `primary`, `secondary`, `danger`, `success`, `ghost`

#### `Input`
Campo de texto con label, error y estilos consistentes.

```tsx
<Input
  label="DN"
  value={dn}
  onChange={setDn}
  error={errors.dn}
  placeholder="5512345678"
  maxLength={10}
/>
```

#### `Card`
Contenedor con sombra y bordes redondeados.

```tsx
<Card title="Datos del Trámite" className="mb-4">
  <p>Contenido</p>
</Card>
```

#### `Table`
Tabla de datos con ordenamiento.

```tsx
<Table
  columns={[
    { key: 'dn', label: 'DN' },
    { key: 'estado', label: 'Estado', render: (v) => <EstadoBadge estado={v} /> }
  ]}
  data={tramites}
  onRowClick={(row) => navigate(`/tramites/${row.id}`)}
/>
```

#### `EstadoBadge`
Badge de color según estado del trámite.

| Estado | Color |
|--------|-------|
| pendiente | Amarillo |
| procesando | Azul |
| completado | Verde |
| error | Rojo |
| cancelado | Gris |

#### `Modal`
Modal genérico con overlay.

```tsx
<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Confirmar">
  <p>¿Estás seguro?</p>
  <Button onClick={handleConfirm}>Sí</Button>
</Modal>
```

#### `ScannerModal`
Modal con escáner de código de barras para ICC. Usa `@zxing/library` y `html5-qrcode` para leer el código de barras del SIM pack.

#### `StatsCard`
Tarjeta de métrica con ícono, valor y label.

```tsx
<StatsCard title="Hoy" value={totalHoy} icon={CalendarIcon} color="blue" />
```

#### `BotProgress`
Barra de progreso para ejecuciones del bot. Muestra el avance de trámites procesados vs totales.

### Admin Components

#### `AdminLayout`
Layout del panel admin con sidebar y header.

#### `AdminSidebar`
Sidebar de navegación con enlaces a las secciones admin.

---

## Páginas

### Login (`pages/Login.tsx`)

Pantalla de inicio de sesión con:
- Fondo animado (`AnimatedBackground`)
- Formulario de correo + contraseña
- Manejo de errores de autenticación
- Redirección según rol (admin → `/admin/dashboard`, promotor → `/dashboard`)

### DashboardPromotor (`pages/DashboardPromotor.tsx`)

Dashboard del promotor con:
- StatsCards: Hoy, Semana, Mes
- Distribución por estado
- Tabla de trámites recientes
- Filtros por estado y búsqueda
- Botón "Nuevo Trámite"

### DashboardAdmin (`pages/DashboardAdmin.tsx`)

Dashboard del admin (redirige a `DashboardOverview`).

### FormTramite (`pages/FormTramite.tsx`)

Formulario de creación de trámite:
- Campos: DN, ICC (con escáner), FVC Fecha, NIP, datos personales
- Validación en cliente
- Auto-creación de campaña del día

### EditarTramite (`pages/EditarTramite.tsx`)

Formulario de edición/corrección:
- Precarga datos existentes
- Campos editables
- Guardar como corrección o actualización

### admin/DashboardOverview (`pages/admin/DashboardOverview.tsx`)

Dashboard admin con:
- StatsCards: pendientes, dispositivos, hoy, semana, mes
- Estado de dispositivos (available/busy/offline)
- Última ejecución
- Promotores activos

### admin/BotControl (`pages/admin/BotControl.tsx`)

Panel de control del bot:
- Botón "Ejecutar Bot"
- Seleccionar cantidad de trámites
- Barra de progreso en vivo
- Historial de ejecuciones
- Gestión de dispositivos (agregar/eliminar)

### admin/PromotoresManagement (`pages/admin/PromotoresManagement.tsx`)

Gestión de usuarios promotores:
- Lista de promotores
- Crear nuevo promotor
- Revocar sesiones

### admin/TramitesManagement (`pages/admin/TramitesManagement.tsx`)

Gestión de todos los trámites:
- Tabla completa con filtros
- Cancelar, resetear, eliminar trámites
- Búsqueda por DN, nombre, CURP

---

## Servicios

### API Client (`services/api.ts`)

Cliente HTTP basado en Axios con:

- **Interceptor de autenticación:** Agrega token JWT automáticamente
- **Interceptor de errores:** Redirige a login en 401, reintenta en 5xx
- **Reintentos:** Hasta 3 reintentos con backoff exponencial para errores de red/5xx
- **Mensajes de error:** Mapas de códigos HTTP a mensajes en español
- **Métodos tipados:** `apiService.login()`, `apiService.getTramites()`, etc.

### Contextos

#### `AuthContext`
- `login(correo, contrasena)` - Iniciar sesión
- `logout()` - Cerrar sesión
- `isAuthenticated` - Si hay token válido
- `isLoading` - Cargando estado inicial
- `usuario` - Datos del usuario autenticado

#### `ToastContext`
- `showSuccess(message)` - Notificación verde
- `showError(message)` - Notificación roja
- `showInfo(message)` - Notificación azul

---

## Estilos

- **Framework:** Tailwind CSS
- **Diseño:** Responsive, mobile-first
- **Tema:** Colores corporativos (azul/gris)
- **Componentes:** Sin librería externa de UI, componentes propios

## Build & Deploy

```bash
# Desarrollo
cd plataforma-promotores/frontend
npm run dev          # http://localhost:3000 (con proxy a backend :3001)

# Producción
npm run build        # Genera dist/
npm run preview      # Vista previa de producción
```

El `vite.config.ts` configura un proxy para desarrollo:
```typescript
proxy: {
  '/api': 'http://localhost:3001'
}
```
