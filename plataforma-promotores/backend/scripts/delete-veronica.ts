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

async function deleteVeronicaTramites() {
  try {
    console.log('🔍 Buscando TODOS los trámites con VERONICA o CUEVA...\n');

    // Search for any variation of Veronica
    const tramites = await prisma.tramite.findMany({
      where: {
        OR: [
          { nombre: { contains: 'VERONICA', mode: 'insensitive' } },
          { nombre: { contains: 'VERÓNICA', mode: 'insensitive' } },
          { apellidoPaterno: { contains: 'CUEVA', mode: 'insensitive' } },
        ]
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    if (tramites.length === 0) {
      console.log('✅ No se encontraron trámites de Veronica');
      return;
    }

    console.log(`⚠️  Se encontraron ${tramites.length} trámite(s):\n`);

    for (const tramite of tramites) {
      const fecha = new Date(tramite.fechaCreacion);
      console.log(`ID: ${tramite.id}`);
      console.log(`Nombre: ${tramite.nombre} ${tramite.apellidoPaterno}`);
      console.log(`DN: ${tramite.dn}`);
      console.log(`ICC: ${tramite.icc}`);
      console.log(`Estado: ${tramite.estado}`);
      console.log(`Creado: ${fecha.toLocaleString('es-MX')}\n`);

      console.log('🗑️  Eliminando...');
      await prisma.tramite.delete({
        where: { id: tramite.id }
      });
      console.log('✅ Eliminado\n');
    }

    // Verify deletion
    const remaining = await prisma.tramite.findMany({
      where: {
        OR: [
          { nombre: { contains: 'VERONICA', mode: 'insensitive' } },
          { nombre: { contains: 'VERÓNICA', mode: 'insensitive' } },
          { apellidoPaterno: { contains: 'CUEVA', mode: 'insensitive' } },
        ]
      }
    });

    if (remaining.length === 0) {
      console.log('✅ Todos los trámites de Veronica han sido eliminados');
    } else {
      console.log(`⚠️  Quedaron ${remaining.length} trámite(s) sin eliminar`);
    }

    // Total count
    const total = await prisma.tramite.count();
    console.log(`\n📊 Total de trámites en BD: ${total}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

deleteVeronicaTramites();
