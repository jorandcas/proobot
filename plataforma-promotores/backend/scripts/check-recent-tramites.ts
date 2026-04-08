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

async function checkRecentTramites() {
  try {
    console.log('🔍 Buscando trámites recientes...\n');

    // Buscar todos los trámites, ordenados por fecha de creación
    const allTramites = await prisma.tramite.findMany({
      orderBy: {
        fechaCreacion: 'desc'
      },
      take: 20
    });

    console.log(`📊 Total de trámites en BD: ${allTramites.length}\n`);

    if (allTramites.length === 0) {
      console.log('❌ No hay trámites en la base de datos');
      return;
    }

    console.log('📋 Últimos 20 trámites:\n');
    allTramites.forEach((tramite, index) => {
      const fecha = new Date(tramite.fechaCreacion);
      const fechaFormateada = fecha.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      console.log(`${index + 1}. ${tramite.nombre} ${tramite.apellidoPaterno}`);
      console.log(`   DN: ${tramite.dn}`);
      console.log(`   Estado: ${tramite.estado}`);
      console.log(`   Creado: ${fechaFormateada}`);
      console.log(`   Campaña: ${tramite.idCampana}`);
      console.log('');
    });

    // Buscar específicamente trámites de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const tramitesHoy = await prisma.tramite.findMany({
      where: {
        fechaCreacion: {
          gte: hoy,
          lt: manana
        }
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    });

    console.log(`\n📅 Trámites creados HOY (${hoy.toLocaleDateString('es-MX')}): ${tramitesHoy.length}\n`);

    if (tramitesHoy.length === 0) {
      console.log('⚠️  NO se crearon trámites hoy');
    } else {
      tramitesHoy.forEach((t) => {
        const fecha = new Date(t.fechaCreacion);
        const hora = fecha.toLocaleTimeString('es-MX');
        console.log(`- ${hora} - ${t.nombre} ${t.apellidoPaterno} | DN: ${t.dn} | ${t.estado}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkRecentTramites();
