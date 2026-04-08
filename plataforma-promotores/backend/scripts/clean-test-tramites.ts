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

async function cleanTestTramites() {
  try {
    console.log('🧹 Limpiando trámites de prueba...\n');

    // Find TEST PRUEBA tramite
    const testTramite = await prisma.tramite.findFirst({
      where: {
        nombre: 'TEST',
        apellidoPaterno: 'PRUEBA'
      }
    });

    if (testTramite) {
      console.log('🗑️  Eliminando trámite de prueba:');
      console.log(`   ID: ${testTramite.id}`);
      console.log(`   DN: ${testTramite.dn}`);
      console.log(`   ICC: ${testTramite.icc}\n`);

      await prisma.tramite.delete({
        where: { id: testTramite.id }
      });

      console.log('✅ Trámite eliminado');
    } else {
      console.log('ℹ️  No se encontró trámite de prueba');
    }

    // Check all trámites with Veronica's ICC
    console.log('\n🔍 Buscando trámites con ICC de Veronica (8952034000164445565)...\n');
    const veronicaTramites = await prisma.tramite.findMany({
      where: { icc: '8952034000164445565' },
      orderBy: { fechaCreacion: 'desc' }
    });

    if (veronicaTramites.length === 0) {
      console.log('✅ No hay trámites con ese ICC - está disponible');
    } else {
      console.log(`⚠️  Se encontraron ${veronicaTramites.length} trámite(s) con ese ICC:\n`);
      veronicaTramites.forEach((t, i) => {
        const fecha = new Date(t.fechaCreacion);
        console.log(`${i + 1}. ${t.nombre} ${t.apellidoPaterno}`);
        console.log(`   ID: ${t.id}`);
        console.log(`   DN: ${t.dn}`);
        console.log(`   Estado: ${t.estado}`);
        console.log(`   Creado: ${fecha.toLocaleString('es-MX')}`);
        console.log(`   Campaña: ${t.idCampana}`);

        // Check if it's blocking (active states)
        if (['PENDIENTE', 'PROCESANDO', 'ERROR'].includes(t.estado)) {
          console.log('   ⛔ ESTE ESTÁ BLOQUEANDO el ICC');
        }
        console.log('');
      });
    }

    // Total count
    const total = await prisma.tramite.count();
    console.log(`📊 Total de trámites en BD: ${total}\n`);

    // Check DATABASE_URL
    console.log('🔗 Conexión a BD:');
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      // Hide password
      const masked = dbUrl.replace(/:([^:@]{4})[^:@]*@/, ':****@');
      console.log(`   ${masked}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

cleanTestTramites();
