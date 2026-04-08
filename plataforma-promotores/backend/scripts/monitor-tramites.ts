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
  log: ['error', 'warn'],
});

async function monitorTramites() {
  try {
    console.log('🔍 Monitoreando trámites...\n');

    const tramites = await prisma.tramite.findMany({
      orderBy: { fechaCreacion: 'desc' },
      take: 10
    });

    console.log(`📊 Total: ${tramites.length}\n`);

    tramites.forEach((t, i) => {
      const fecha = new Date(t.fechaCreacion);
      console.log(`${i + 1}. ${t.nombre} ${t.apellidoPaterno}`);
      console.log(`   ID: ${t.id}`);
      console.log(`   DN: ${t.dn}`);
      console.log(`   Estado: ${t.estado}`);
      console.log(`   Campaña: ${t.idCampana}`);
      console.log(`   Creado: ${fecha.toLocaleString('es-MX')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

monitorTramites();
