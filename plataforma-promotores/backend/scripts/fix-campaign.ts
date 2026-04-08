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

async function fixCampaign() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaStr = hoy.toISOString().split('T')[0];

    console.log('🔧 Corrigiendo campaña para hoy...\n');
    console.log(`Fecha objetivo: ${hoy.toLocaleDateString('es-MX')} (${fechaStr})`);

    // Delete campaign with wrong dates
    const wrongCampaign = await prisma.campana.findFirst({
      where: { nombre: `Campaña ${fechaStr}` }
    });

    if (wrongCampaign) {
      console.log('\n🗑️  Eliminando campaña con fechas incorrectas...');
      console.log(`   Inicio anterior: ${new Date(wrongCampaign.fechaInicio).toLocaleString('es-MX')}`);
      console.log(`   Fin anterior: ${new Date(wrongCampaign.fechaFin).toLocaleString('es-MX')}`);

      await prisma.campana.delete({
        where: { id: wrongCampaign.id }
      });

      console.log('✅ Campaña eliminada');
    }

    // Calculate correct time range: 6:00 AM today to 5:59 AM tomorrow (LOCAL TIME)
    const fechaInicio = new Date(hoy);
    fechaInicio.setHours(6, 0, 0, 0);

    const fechaFin = new Date(hoy);
    fechaFin.setDate(fechaFin.getDate() + 1);
    fechaFin.setHours(5, 59, 59, 999);

    console.log('\n📅 Creando campaña con fechas correctas:');
    console.log(`   Inicio: ${fechaInicio.toLocaleString('es-MX')}`);
    console.log(`   Fin: ${fechaFin.toLocaleString('es-MX')}`);
    console.log(`   En UTC: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}\n`);

    // Create campaign
    const nuevaCampana = await prisma.campana.create({
      data: {
        nombre: `Campaña ${fechaStr}`,
        fecha: hoy,
        fechaInicio,
        fechaFin,
        activa: true,
      },
    });

    console.log('✅ Campaña creada exitosamente:');
    console.log(`   ID: ${nuevaCampana.id}`);
    console.log(`   Nombre: ${nuevaCampana.nombre}`);
    console.log(`   Activa: ${nuevaCampana.activa}\n`);

    // Verify it's active now
    const ahora = new Date();
    console.log('⏰ Verificación:');
    console.log(`   Hora actual: ${ahora.toLocaleString('es-MX')}`);
    console.log(`   ¿Está dentro del rango? ${ahora >= fechaInicio && ahora <= fechaFin ? 'SÍ ✅' : 'NO ❌'}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

fixCampaign();
