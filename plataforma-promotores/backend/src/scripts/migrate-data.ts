/**
 * Script de migración de JSON a PostgreSQL
 *
 * Migra todos los datos desde database.json a PostgreSQL usando Prisma
 *
 * Uso:
 *   npm run migrate:data
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
import 'dotenv/config';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with adapter
const prisma = new PrismaClient({
  adapter,
});

interface JSONDatabase {
  usuarios: any[];
  campanas: any[];
  tramites: any[];
  botLogs: any[];
  devices: any[];
  botExecutions: any[];
}

/**
 * Carga el archivo database.json
 */
async function loadJSONDatabase(): Promise<JSONDatabase> {
  const dbPath = path.join(__dirname, '../data/database.json');
  const content = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Crea un backup del database.json
 */
async function createBackup() {
  const dbPath = path.join(__dirname, '../data/database.json');
  const backupPath = path.join(__dirname, '../data/database.backup.json');

  const content = fs.readFileSync(dbPath);
  fs.writeFileSync(backupPath, content);

  console.log('✅ Backup creado: database.backup.json');
}

/**
 * Migrar usuarios
 */
async function migrateUsuarios(usuarios: any[]) {
  console.log(`\n📝 Migrando ${usuarios.length} usuarios...`);

  for (const usuario of usuarios) {
    await prisma.usuario.upsert({
      where: { correo: usuario.correo },
      update: {},
      create: {
        id: usuario.id,
        correo: usuario.correo,
        contrasena: usuario.contrasena,
        rol: usuario.rol === 'admin' ? 'ADMIN' : 'PROMOTOR',
        nombre: usuario.nombre,
        fechaCreacion: new Date(usuario.fechaCreacion),
      },
    });
  }

  console.log(`✅ ${usuarios.length} usuarios migrados`);
}

/**
 * Migrar campañas
 */
async function migrateCampanas(campanas: any[]) {
  console.log(`\n📝 Migrando ${campanas.length} campañas...`);

  for (const campana of campanas) {
    await prisma.campana.upsert({
      where: { id: campana.id },
      update: {},
      create: {
        id: campana.id,
        nombre: campana.nombre,
        fecha: new Date(campana.fecha),
        fechaInicio: new Date(campana.fechaInicio),
        fechaFin: new Date(campana.fechaFin),
        activa: campana.activa,
        createdAt: new Date(campana.createdAt),
      },
    });
  }

  console.log(`✅ ${campanas.length} campañas migradas`);
}

/**
 * Migrar dispositivos
 */
async function migrateDevices(devices: any[]) {
  console.log(`\n📝 Migrando ${devices.length} dispositivos...`);

  for (const device of devices) {
    await prisma.device.upsert({
      where: { udid: device.udid },
      update: {},
      create: {
        id: device.id,
        udid: device.udid,
        name: device.name,
        status: device.status.toUpperCase(),
        lastUsed: device.lastUsed ? new Date(device.lastUsed) : null,
        createdAt: new Date(device.createdAt),
      },
    });
  }

  console.log(`✅ ${devices.length} dispositivos migrados`);
}

/**
 * Migrar trámites
 */
async function migrateTramites(tramites: any[]) {
  console.log(`\n📝 Migrando ${tramites.length} trámites...`);

  let count = 0;
  for (const tramite of tramites) {
    // Mapear estados
    const estadoMap: Record<string, any> = {
      'pendiente': 'PENDIENTE',
      'procesando': 'PROCESANDO',
      'completado': 'COMPLETADO',
      'error': 'ERROR',
      'cancelado': 'CANCELADO',
    };

    await prisma.tramite.upsert({
      where: { id: tramite.id },
      update: {},
      create: {
        id: tramite.id,
        idCampana: tramite.idCampana,
        idPromotor: tramite.idPromotor,
        fechaCreacion: new Date(tramite.fechaCreacion),
        estado: estadoMap[tramite.estado] || 'PENDIENTE',
        fechaProcesamiento: tramite.fechaProcesamiento ? new Date(tramite.fechaProcesamiento) : null,

        // Datos del formulario
        dn: tramite.dn || null,
        rfc: tramite.rfc || null,
        requestId: tramite.requestId || null,

        // ICC y Línea
        icc: tramite.icc || null,
        nip: tramite.nip || null,
        fvcIndice: tramite.fvcIndice || null,
        fvcFecha: tramite.fvcFecha || null,

        // Datos personales
        nombre: tramite.nombre || null,
        nombreSegundo: tramite.nombreSegundo || null,
        apellidoPaterno: tramite.apellidoPaterno || null,
        apellidoMaterno: tramite.apellidoMaterno || null,
        curp: tramite.curp || null,
        telefono: tramite.telefono || null,
        telefono2: tramite.telefono2 || null,
        genero: tramite.genero || null,
        email: tramite.email || null,
        fechaNacimiento: tramite.fechaNacimiento || null,

        // Resultado
        resultado: tramite.resultado || null,
        botLogId: tramite.botLogId || null,
      },
    });

    count++;
  }

  console.log(`✅ ${count} trámites migrados`);
}

/**
 * Migrar bot logs
 */
async function migrateBotLogs(botLogs: any[]) {
  console.log(`\n📝 Migrando ${botLogs.length} bot logs...`);

  for (const botLog of botLogs) {
    const estadoMap: Record<string, any> = {
      'exitoso': 'EXITOSO',
      'fallido': 'FALLIDO',
    };

    await prisma.botLog.upsert({
      where: { id: botLog.id },
      update: {},
      create: {
        id: botLog.id,
        idTramite: botLog.idTramite,
        idDevice: botLog.idDevice,
        fechaInicio: new Date(botLog.fechaInicio),
        fechaFin: new Date(botLog.fechaFin),
        estado: estadoMap[botLog.estado] || 'FALLIDO',
        logs: botLog.logs || [],
        error: botLog.error || null,
      },
    });
  }

  console.log(`✅ ${botLogs.length} bot logs migrados`);
}

/**
 * Migrar ejecuciones de bot
 */
async function migrateBotExecutions(botExecutions: any[]) {
  console.log(`\n📝 Migrando ${botExecutions.length} ejecuciones de bot...`);

  for (const execution of botExecutions) {
    const estadoMap: Record<string, any> = {
      'pendiente': 'PENDIENTE',
      'en_progreso': 'EN_PROGRESO',
      'completado': 'COMPLETADO',
      'cancelado': 'CANCELADO',
    };

    await prisma.botExecution.upsert({
      where: { id: execution.id },
      update: {},
      create: {
        id: execution.id,
        fechaInicio: new Date(execution.fechaInicio),
        fechaFin: execution.fechaFin ? new Date(execution.fechaFin) : null,
        estado: estadoMap[execution.estado] || 'PENDIENTE',
        totalTramites: execution.totalTramites,
        completados: execution.completados,
        errores: execution.errores,
        logs: execution.logs || [],
        ejecutadoPor: execution.ejecutadoPor,
      },
    });
  }

  console.log(`✅ ${botExecutions.length} ejecuciones migradas`);
}

/**
 * Verificar la migración
 */
async function verifyMigration(jsonDb: JSONDatabase) {
  console.log('\n🔍 Verificando migración...');

  const usuariosCount = await prisma.usuario.count();
  const campanasCount = await prisma.campana.count();
  const tramitesCount = await prisma.tramite.count();
  const botLogsCount = await prisma.botLog.count();
  const devicesCount = await prisma.device.count();
  const botExecutionsCount = await prisma.botExecution.count();

  console.log('\n📊 Resumen de migración:');
  console.log(`   Usuarios:      ${usuariosCount} / ${jsonDb.usuarios.length}`);
  console.log(`   Campañas:      ${campanasCount} / ${jsonDb.campanas.length}`);
  console.log(`   Trámites:      ${tramitesCount} / ${jsonDb.tramites.length}`);
  console.log(`   Bot Logs:      ${botLogsCount} / ${jsonDb.botLogs.length}`);
  console.log(`   Dispositivos:   ${devicesCount} / ${jsonDb.devices.length}`);
  console.log(`   Ejecuciones:   ${botExecutionsCount} / ${jsonDb.botExecutions.length}`);

  const allMatch =
    usuariosCount === jsonDb.usuarios.length &&
    campanasCount === jsonDb.campanas.length &&
    tramitesCount === jsonDb.tramites.length &&
    botLogsCount === jsonDb.botLogs.length &&
    devicesCount === jsonDb.devices.length &&
    botExecutionsCount === jsonDb.botExecutions.length;

  if (allMatch) {
    console.log('\n✅ ¡Migración exitosa! Todos los datos fueron migrados correctamente.');
  } else {
    console.log('\n⚠️  Advertencia: Algunos datos no fueron migrados. Revisa los logs arriba.');
  }
}

/**
 * Función principal de migración
 */
async function main() {
  try {
    console.log('🚀 Iniciando migración de JSON a PostgreSQL...\n');

    // Crear backup
    await createBackup();

    // Cargar datos JSON
    const jsonDb = await loadJSONDatabase();
    console.log(`📦 Base de datos JSON cargada:`);
    console.log(`   - ${jsonDb.usuarios.length} usuarios`);
    console.log(`   - ${jsonDb.campanas.length} campañas`);
    console.log(`   - ${jsonDb.tramites.length} trámites`);
    console.log(`   - ${jsonDb.botLogs.length} bot logs`);
    console.log(`   - ${jsonDb.devices.length} dispositivos`);
    console.log(`   - ${jsonDb.botExecutions.length} ejecuciones`);

    // Migrar en orden (respetando foreign keys)
    await migrateUsuarios(jsonDb.usuarios);
    await migrateCampanas(jsonDb.campanas);
    await migrateDevices(jsonDb.devices);
    await migrateTramites(jsonDb.tramites);
    await migrateBotLogs(jsonDb.botLogs);
    await migrateBotExecutions(jsonDb.botExecutions);

    // Verificar
    await verifyMigration(jsonDb);

    console.log('\n🎉 Migración completada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Verificar los datos con: npx prisma studio');
    console.log('   2. Iniciar el backend: npm run dev');
    console.log('   3. Probar login y creación de trámites');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
