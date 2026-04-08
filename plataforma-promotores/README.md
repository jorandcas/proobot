# Plataforma de Promotores - Sistema de Portabilidad

Sistema completo para gestionar trámites de portabilidad con ejecución automatizada de bots.

## Características

- **Gestión de Promotores**: Registro, autenticación y dashboard personalizado
- **Formulario de Portabilidad**: Captura y validación de datos completa
- **Campañas Diarias**: Agrupación automática por fecha
- **Ejecución de Bot**: Procesamiento automático de trámites pendientes
- **Pool de Dispositivos**: Arquitectura escalable para múltiples dispositivos
- **Dashboard Admin**: Monitoreo en tiempo real y gestión de dispositivos

## Arquitectura

```
plataforma-promotores/
├── backend/          # API Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/   # Configuración y base de datos JSON
│   │   ├── models/   # Modelos de datos
│   │   ├── controllers/ # Lógica de negocio
│   │   ├── routes/   # Rutas de Express
│   │   ├── services/ # Servicios (bot executor, device pool)
│   │   └── validators/ # Validaciones
│   └── package.json
│
└── frontend/         # React + Vite + TypeScript
    ├── src/
    │   ├── components/ # Componentes reutilizables
    │   ├── pages/      # Páginas principales
    │   ├── context/    # Contexto de autenticación
    │   └── services/   # Cliente API
    └── package.json
```

## Instalación

### Backend

```bash
cd plataforma-promotores/backend

# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env

# Editar .env con tus configuraciones
# - JWT_SECRET: Cambia esto en producción
# - ADMIN_EMAIL/ADMIN_PASSWORD: Credenciales del admin

# Inicializar base de datos (crea usuario admin)
npm run init-db

# Iniciar servidor (desarrollo)
npm run dev

# Compilar para producción
npm run build

# Iniciar en producción
npm start
```

### Frontend

```bash
cd plataforma-promotores/frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Credenciales por Defecto

```
Email: admin@telcel.mx
Contraseña: admin123
```

**Importante**: Cambia estas credenciales después del primer inicio.

## Uso

### 1. Primeros Pasos

1. **Iniciar el backend**:
   ```bash
   cd backend
   npm run dev
   ```
   El servidor estará en `http://localhost:3001`

2. **Iniciar el frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   La aplicación estará en `http://localhost:3000`

3. **Iniciar sesión** como admin

### 2. Configurar Dispositivos

1. Ve al panel de Admin
2. Agrega al menos un dispositivo con su UDID
3. El dispositivo debe estar conectado y configurado con Appium

### 3. Crear Promotores (Opcional)

1. Desde el panel de Admin, crea nuevos usuarios con rol "promotor"
2. Los promotores podrán iniciar sesión y crear trámites

### 4. Flujo de Trabajo

**Promotor**:
1. Inicia sesión
2. Click en "Nueva Porta"
3. Llena el formulario con los datos del cliente
4. El trámite se guarda con estado "pendiente"

**Admin**:
1. Monitorea los trámites pendientes en el dashboard
2. Click en "▶ Ejecutar Bot"
3. El bot procesa automáticamente todos los pendientes (FIFO)
4. Monitorea el progreso en tiempo real

## Campos del Formulario

### Búsqueda Porta
- **DN** (obligatorio): 10 dígitos
- **RFC** (opcional): 12-13 caracteres
- **Request ID** (opcional)
- **ICC** (opcional): 19-20 dígitos

### Línea
- **NIP** (obligatorio): 4-6 dígitos
- **Índice FVC** (obligatorio): 1-5

### Datos Personales
- **Nombre** (obligatorio)
- **Segundo Nombre** (opcional)
- **Apellido Paterno** (obligatorio)
- **Apellido Materno** (obligatorio)
- **CURP** (obligatorio): 18 caracteres
- **Teléfono** (obligatorio): 10 dígitos
- **Teléfono 2** (opcional)
- **Género** (obligatorio): Masculino/Femenino
- **Email** (opcional)
- **Fecha Nacimiento** (opcional): dd/mm/yyyy

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/users` - Crear usuario (admin)
- `GET /api/auth/users` - Listar usuarios (admin)

### Campañas
- `GET /api/campanas` - Listar campañas
- `GET /api/campanas/active` - Campañas activas
- `GET /api/campanas/:id` - Ver campaña con estadísticas
- `POST /api/campanas` - Crear campaña (admin)
- `PUT /api/campanas/:id` - Actualizar campaña (admin)
- `DELETE /api/campanas/:id` - Eliminar campaña (admin)

### Trámites
- `GET /api/tramites` - Listar trámites (con filtros)
- `GET /api/tramites/:id` - Ver trámite
- `POST /api/tramites` - Crear trámite
- `PUT /api/tramites/:id` - Actualizar trámite (admin)
- `PUT /api/tramites/:id/cancel` - Cancelar trámite
- `DELETE /api/tramites/:id` - Eliminar trámite (admin)
- `GET /api/tramites/pending/list` - Trámites pendientes (admin)

### Dashboard
- `GET /api/dashboard/promotor` - Estadísticas del promotor
- `GET /api/dashboard/admin` - Estadísticas globales (admin)
- `GET /api/dashboard/recent` - Trámites recientes
- `GET /api/dashboard/campana/:idCampana` - Trámites por campaña

### Bot (Admin)
- `POST /api/bot/execute` - Ejecutar bot
- `GET /api/bot/status` - Estado del bot
- `GET /api/bot/history` - Historial de ejecuciones
- `GET /api/bot/execution/:id` - Ver ejecución
- `GET /api/bot/devices` - Listar dispositivos
- `POST /api/bot/devices` - Agregar dispositivo
- `DELETE /api/bot/devices/:id` - Eliminar dispositivo

## Escalabilidad

### Múltiples Dispositivos

El sistema está diseñado para soportar múltiples dispositivos:

1. Agrega N dispositivos desde el panel de Admin
2. El bot ejecutará N trámites en paralelo (uno por dispositivo)
3. El pool de dispositivos gestiona la disponibilidad automáticamente

### Múltiples Promotores

Cada promotor tiene su propio dashboard y solo ve sus trámites. El admin ve todos.

## Validaciones

El sistema valida automáticamente:

- **DN**: Exactamente 10 dígitos numéricos
- **RFC**: Formato válido de persona física o moral
- **CURP**: Formato válido de 18 caracteres
- **Teléfonos**: 10 dígitos
- **Email**: Formato válido
- **Fecha Nacimiento**: dd/mm/yyyy y fecha válida

## Estados de Trámite

- **Pendiente**: Esperando ser procesado por el bot
- **Procesando**: El bot está trabajando en él
- **Completado**: Procesamiento exitoso
- **Error**: Falló el procesamiento (requiere revisión manual)
- **Cancelado**: Cancelado por el promotor o admin

## Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Middleware de autenticación en rutas protegidas
- Validación de datos en backend
- Roles de usuario (admin/promotor)

## Desarrollo

### Backend

```bash
cd backend
npm run dev  # Modo desarrollo con recarga automática
```

### Frontend

```bash
cd frontend
npm run dev  # Modo desarrollo con recarga automática
```

## Troubleshooting

### Error: "No hay dispositivos disponibles"
- Asegúrate de haber agregado al menos un dispositivo
- Verifica que el dispositivo esté conectado
- Revisa la configuración de Appium

### Error: "Token inválido o expirado"
- Cierra sesión e inicia nuevamente
- Verifica que el backend esté corriendo

### El bot no se ejecuta
- Verifica que haya trámites en estado "pendiente"
- Asegúrate de tener dispositivos disponibles
- Revisa los logs del backend

## Próximos Pasos

1. **Integración con Bot**: El servicio `bot-executor.service.ts` está listo para integrarse con tu bot existente
2. **Manejo de Errores**: Implementa lógica de reintentos y manejo de errores específicos
3. **Notificaciones**: Agrega notificaciones por email o en la app
4. **Reportes**: Exporta a CSV o genera reportes PDF
5. **Base de Datos**: Migrar de JSON a SQLite o PostgreSQL para producción

## Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.
