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

async function deleteTestTramite() {
  try {
    console.log('🗑️  Buscando y eliminando trámites de prueba...\n');

    // Buscar trámite de prueba por DN que empieza con 999999
    const testTramites = await prisma.tramite.findMany({
      where: {
        dn: { startsWith: '999999' }
      }
    });

    console.log(`📊 Trámites de prueba encontrados: ${testTramites.length}\n`);

    if (testTramites.length === 0) {
      console.log('✅ No hay trámites de prueba\n');
      return;
    }

    for (const tramite of testTramites) {
      console.log(`Eliminando: ${tramite.nombre} ${tramite.apellidoPaterno}`);
      console.log(`   DN: ${tramite.dn}`);
      console.log(`   ICC: ${tramite.icc}`);
      console.log(`   Estado: ${tramite.estado}\n`);

      await prisma.tramite.delete({
        where: { id: tramite.id }
      });

      console.log('✅ Eliminado\n');
    }

    // Verificar
    const total = await prisma.tramite.count();
    console.log(`📊 Total de trámites en BD: ${total}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

deleteTestTramite();
