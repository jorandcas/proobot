-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'PROMOTOR');

-- CreateEnum
CREATE TYPE "EstadoTramite" AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoLog" AS ENUM ('EXITOSO', 'FALLIDO');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "EstadoEjecucion" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramites" (
    "id" TEXT NOT NULL,
    "idCampana" TEXT NOT NULL,
    "idPromotor" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoTramite" NOT NULL DEFAULT 'PENDIENTE',
    "fechaProcesamiento" TIMESTAMP(3),
    "dn" TEXT,
    "rfc" TEXT,
    "requestId" TEXT,
    "icc" TEXT,
    "nip" TEXT,
    "fvcIndice" INTEGER,
    "fvcFecha" TEXT,
    "nombre" TEXT,
    "nombreSegundo" TEXT,
    "apellidoPaterno" TEXT,
    "apellidoMaterno" TEXT,
    "curp" TEXT,
    "telefono" TEXT,
    "telefono2" TEXT,
    "genero" TEXT,
    "email" TEXT,
    "fechaNacimiento" TEXT,
    "resultado" TEXT,
    "botLogId" TEXT,

    CONSTRAINT "tramites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_logs" (
    "id" TEXT NOT NULL,
    "idTramite" TEXT NOT NULL,
    "idDevice" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoLog" NOT NULL,
    "logs" TEXT[],
    "error" TEXT,

    CONSTRAINT "bot_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "udid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_executions" (
    "id" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoEjecucion" NOT NULL DEFAULT 'PENDIENTE',
    "totalTramites" INTEGER NOT NULL DEFAULT 0,
    "completados" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "logs" TEXT[],
    "ejecutadoPor" TEXT NOT NULL,

    CONSTRAINT "bot_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "campanas_fecha_idx" ON "campanas"("fecha");

-- CreateIndex
CREATE INDEX "campanas_activa_idx" ON "campanas"("activa");

-- CreateIndex
CREATE UNIQUE INDEX "tramites_botLogId_key" ON "tramites"("botLogId");

-- CreateIndex
CREATE INDEX "tramites_idCampana_idx" ON "tramites"("idCampana");

-- CreateIndex
CREATE INDEX "tramites_idPromotor_idx" ON "tramites"("idPromotor");

-- CreateIndex
CREATE INDEX "tramites_estado_idx" ON "tramites"("estado");

-- CreateIndex
CREATE INDEX "tramites_fechaCreacion_idx" ON "tramites"("fechaCreacion");

-- CreateIndex
CREATE UNIQUE INDEX "bot_logs_idTramite_key" ON "bot_logs"("idTramite");

-- CreateIndex
CREATE INDEX "bot_logs_idDevice_idx" ON "bot_logs"("idDevice");

-- CreateIndex
CREATE INDEX "bot_logs_fechaInicio_idx" ON "bot_logs"("fechaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "devices_udid_key" ON "devices"("udid");

-- CreateIndex
CREATE INDEX "devices_status_idx" ON "devices"("status");

-- CreateIndex
CREATE INDEX "bot_executions_fechaInicio_idx" ON "bot_executions"("fechaInicio");

-- CreateIndex
CREATE INDEX "bot_executions_estado_idx" ON "bot_executions"("estado");

-- AddForeignKey
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_idCampana_fkey" FOREIGN KEY ("idCampana") REFERENCES "campanas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_idPromotor_fkey" FOREIGN KEY ("idPromotor") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_logs" ADD CONSTRAINT "bot_logs_idTramite_fkey" FOREIGN KEY ("idTramite") REFERENCES "tramites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_logs" ADD CONSTRAINT "bot_logs_idDevice_fkey" FOREIGN KEY ("idDevice") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_executions" ADD CONSTRAINT "bot_executions_ejecutadoPor_fkey" FOREIGN KEY ("ejecutadoPor") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
