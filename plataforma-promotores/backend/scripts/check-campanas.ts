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
  log: ['query', 'error', 'warn'],
});

async function checkCampanas() {
  try {
    console.log('🔍 Verificando campañas...\n');

    // Buscar campaña de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    console.log(`Fecha de hoy: ${hoy.toLocaleDateString('es-MX')}`);
    console.log(`Buscando campañas entre: ${hoy.toISOString()} y ${manana.toISOString()}\n`);

    const campanaHoy = await prisma.campana.findFirst({
      where: {
        fechaInicio: {
          lte: new Date()
        },
        fechaFin: {
          gte: new Date()
        }
      }
    });

    if (campanaHoy) {
      console.log('✅ Campaña activa encontrada:');
      console.log(`   ID: ${campanaHoy.id}`);
      console.log(`   Nombre: ${campanaHoy.nombre}`);
      console.log(`   Fecha: ${campanaHoy.fecha}`);
      console.log(`   Inicio: ${campanaHoy.fechaInicio}`);
      console.log(`   Fin: ${campanaHoy.fechaFin}`);
      console.log(`   Activa: ${campanaHoy.activa}`);
    } else {
      console.log('❌ NO hay campaña activa para hoy');
      console.log('⚠️  Esto podría causar que fallen las creaciones de trámites');
    }

    console.log('\n📋 Todas las campañas:\n');
    const todasCampanas = await prisma.campana.findMany({
      orderBy: { fecha: 'desc' },
      take: 10
    });

    todasCampanas.forEach((c, i) => {
      console.log(`${i + 1}. ${c.nombre}`);
      console.log(`   Fecha: ${c.fecha}`);
      console.log(`   Activa: ${c.activa ? 'Sí' : 'No'}`);
      console.log(`   Inicio: ${new Date(c.fechaInicio).toLocaleString('es-MX')}`);
      console.log(`   Fin: ${new Date(c.fechaFin).toLocaleString('es-MX')}`);
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

checkCampanas();
