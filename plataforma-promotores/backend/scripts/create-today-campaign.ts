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

async function createTodayCampaign() {
  try {
    const today = new Date();
    const fechaStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const nombre = `Campaña ${fechaStr}`;

    console.log('📅 Creando campaña para hoy...\n');
    console.log(`Fecha: ${fechaStr}`);
    console.log(`Nombre: ${nombre}\n`);

    // Check if already exists
    const existing = await prisma.campana.findFirst({
      where: { fecha: new Date(fechaStr) }
    });

    if (existing) {
      console.log('⚠️  La campaña ya existe:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Nombre: ${existing.nombre}`);
      return;
    }

    // Calculate time range: 6:00 AM today to 5:59 AM tomorrow
    const date = new Date(fechaStr);
    const fechaInicio = new Date(date);
    fechaInicio.setHours(6, 0, 0, 0); // 6:00 AM del día

    const fechaFin = new Date(date);
    fechaFin.setDate(fechaFin.getDate() + 1); // Día siguiente
    fechaFin.setHours(5, 59, 59, 999); // 5:59 AM

    console.log(`Inicio: ${fechaInicio.toLocaleString('es-MX')}`);
    console.log(`Fin: ${fechaFin.toLocaleString('es-MX')}\n`);

    // Create campaign
    const nuevaCampana = await prisma.campana.create({
      data: {
        nombre,
        fecha: date,
        fechaInicio,
        fechaFin,
        activa: true,
      },
    });

    console.log('✅ Campaña creada exitosamente:');
    console.log(`   ID: ${nuevaCampana.id}`);
    console.log(`   Nombre: ${nuevaCampana.nombre}`);
    console.log(`   Fecha: ${nuevaCampana.fecha}`);
    console.log(`   Activa: ${nuevaCampana.activa}`);

  } catch (error) {
    console.error('❌ Error creando campaña:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createTodayCampaign();
