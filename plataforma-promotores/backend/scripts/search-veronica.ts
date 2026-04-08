import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with adapter
const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

async function searchVeronica() {
  try {
    console.log('🔍 Buscando trámites de Veronica Cueva...\n');

    // Buscar por nombre
    const tramites = await prisma.tramite.findMany({
      where: {
        nombre: {
          contains: 'VERONICA'
        },
        apellidoPaterno: {
          contains: 'CUEVA'
        }
      },
      orderBy: {
        fechaCreacion: 'desc'
      },
      take: 10
    });

    if (tramites.length === 0) {
      console.log('❌ No se encontraron trámites de Veronica Cueva');
      return;
    }

    console.log(`✅ Se encontraron ${tramites.length} trámite(s):\n`);

    tramites.forEach((tramite, index) => {
      console.log(`Trámite #${index + 1}:`);
      console.log(`  ID: ${tramite.id}`);
      console.log(`  DN: ${tramite.dn}`);
      console.log(`  Nombre: ${tramite.nombre} ${tramite.apellidoPaterno} ${tramite.apellidoMaterno || ''}`);
      console.log(`  CURP: ${tramite.curp}`);
      console.log(`  ICC: ${tramite.icc}`);
      console.log(`  FVC: ${tramite.fvcFecha}`);
      console.log(`  Teléfono: ${tramite.telefono}`);
      console.log(`  Estado: ${tramite.estado}`);
      console.log(`  Campaña: ${tramite.idCampana}`);
      console.log(`  Creado: ${tramite.fechaCreacion}`);
      console.log(`  Resultado: ${tramite.resultado || 'Sin procesar'}`);
      console.log('');
    });

    // Buscar todos los trámites creados hoy
    console.log('\n📊 Trámites creados hoy (26/03/2026):\n');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const tramitesHoy = await prisma.tramite.findMany({
      where: {
        fechaCreacion: {
          gte: hoy
        }
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    });

    console.log(`Total de trámites hoy: ${tramitesHoy.length}\n`);
    tramitesHoy.forEach((t) => {
      console.log(`- ${t.nombre} ${t.apellidoPaterno} | DN: ${t.dn} | Estado: ${t.estado}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

searchVeronica();
