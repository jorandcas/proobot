import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn'],
});

async function checkICCNow() {
  try {
    const icc = '8952034000164445565';

    console.log('🔍 Verificación inmediata del ICC\n');
    console.log(`ICC: ${icc}\n`);

    // Buscar con estados activos
    console.log('1️⃣ Trámites con ICC en estados BLOQUEANTES (PENDIENTE, PROCESANDO, ERROR):');
    const bloqueantes = await prisma.tramite.findMany({
      where: {
        icc: icc,
        estado: { in: ['PENDIENTE', 'PROCESANDO', 'ERROR'] }
      }
    });

    if (bloqueantes.length === 0) {
      console.log('   ✅ Ninguno encontrado - ICC debería estar disponible\n');
    } else {
      console.log(`   ⛔ ${bloqueantes.length} trámite(s) encontrado(s):`);
      bloqueantes.forEach(t => {
        console.log(`   - ID: ${t.id}`);
        console.log(`   - Nombre: ${t.nombre} ${t.apellidoPaterno}`);
        console.log(`   - DN: ${t.dn}`);
        console.log(`   - Estado: ${t.estado}`);
        console.log(`   - Creado: ${t.fechaCreacion}\n`);
      });
    }

    // Buscar TODOS los trámites con ese ICC
    console.log('2️⃣ TODOS los trámites con ese ICC (cualquier estado):');
    const todos = await prisma.tramite.findMany({
      where: { icc: icc },
      orderBy: { fechaCreacion: 'desc' }
    });

    if (todos.length === 0) {
      console.log('   ✅ Ninguno encontrado\n');
    } else {
      console.log(`   Total: ${todos.length}`);
      todos.forEach(t => {
        console.log(`   - ${t.nombre} ${t.apellidoPaterno} | DN: ${t.dn} | Estado: ${t.estado}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkICCNow();
