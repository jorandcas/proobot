import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../src/data/database.json');
const BACKUP_PATH = path.join(__dirname, '../../src/data/database.backup.json');

interface Database {
  usuarios: any[];
  campanas: any[];
  tramites: any[];
  botLogs: any[];
  devices: any[];
  botExecutions: any[];
}

function cleanDatabase() {
  console.log('🧹 Limpiando base de datos...');

  // Respaldar
  console.log('📦 Creando respaldo...');
  fs.copyFileSync(DB_PATH, BACKUP_PATH);

  // Leer base de datos
  const db: Database = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  // Estadísticas antes
  console.log('\n📊 Antes de la limpieza:');
  console.log(`  - Usuarios: ${db.usuarios.length}`);
  console.log(`  - Campañas: ${db.campanas.length}`);
  console.log(`  - Trámites: ${db.tramites.length}`);
  console.log(`  - BotLogs: ${db.botLogs.length}`);
  console.log(`  - Devices: ${db.devices.length}`);
  console.log(`  - BotExecutions: ${db.botExecutions.length}`);

  // Limpiar logs antiguos de botLogs (mantener solo los últimos 100 por log)
  let totalLogsAntes = 0;
  let totalLogsDespues = 0;

  db.botLogs.forEach((bl: any) => {
    totalLogsAntes += bl.logs?.length || 0;
    if (bl.logs && bl.logs.length > 100) {
      bl.logs = bl.logs.slice(-100); // Mantener solo los últimos 100
    }
    totalLogsDespues += bl.logs?.length || 0;
  });

  // Limpiar logs antiguos de botExecutions (mantener solo los últimos 50 por ejecución)
  db.botExecutions.forEach((be: any) => {
    totalLogsAntes += be.logs?.length || 0;
    if (be.logs && be.logs.length > 50) {
      be.logs = be.logs.slice(-50); // Mantener solo los últimos 50
    }
    totalLogsDespues += be.logs?.length || 0;
  });

  // Limpiar botLogs y botExecutions completos antiguos (más de 7 días)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const botLogsBefore = db.botLogs.length;
  db.botLogs = db.botLogs.filter((bl: any) => {
    const fecha = new Date(bl.fechaInicio);
    return fecha > sevenDaysAgo || bl.estado === 'en_progreso';
  });
  const botLogsDeleted = botLogsBefore - db.botLogs.length;

  const botExecutionsBefore = db.botExecutions.length;
  db.botExecutions = db.botExecutions.filter((be: any) => {
    const fecha = new Date(be.fechaInicio);
    return fecha > sevenDaysAgo || be.estado === 'en_progreso';
  });
  const botExecutionsDeleted = botExecutionsBefore - db.botExecutions.length;

  // Limpiar trámites antiguos (más de 30 días, mantener solo completados)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const tramitesBefore = db.tramites.length;
  db.tramites = db.tramites.filter((t: any) => {
    const fecha = new Date(t.fechaCreacion);
    return fecha > thirtyDaysAgo || t.estado === 'pendiente' || t.estado === 'procesando';
  });
  const tramitesDeleted = tramitesBefore - db.tramites.length;

  // Escribir base de datos limpia
  console.log('\n💾 Escribiendo base de datos limpia...');
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

  // Estadísticas después
  console.log('\n📊 Después de la limpieza:');
  console.log(`  - Usuarios: ${db.usuarios.length}`);
  console.log(`  - Campañas: ${db.campanas.length}`);
  console.log(`  - Trámites: ${db.tramites.length} (eliminados: ${tramitesDeleted})`);
  console.log(`  - BotLogs: ${db.botLogs.length} (eliminados: ${botLogsDeleted})`);
  console.log(`  - Devices: ${db.devices.length}`);
  console.log(`  - BotExecutions: ${db.botExecutions.length} (eliminados: ${botExecutionsDeleted})`);

  console.log(`\n📝 Logs eliminados: ${totalLogsAntes - totalLogsDespues}`);

  // Nuevo tamaño
  const newSize = (fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Base de datos limpia: ${newSize}MB`);
  console.log(`📦 Respaldo guardado en: ${BACKUP_PATH}`);
}

cleanDatabase();
