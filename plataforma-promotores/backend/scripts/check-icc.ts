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

async function checkICC() {
  try {
    const iccs = [
      '8952034000164445565', // ICC de Veronica
    ];

    console.log('🔍 Verificando ICCs duplicados...\n');

    for (const icc of iccs) {
      console.log(`Verificando ICC: ${icc}`);

      const duplicate = await prisma.tramite.findFirst({
        where: {
          icc,
          estado: { in: ['PENDIENTE', 'PROCESANDO', 'ERROR'] }
        }
      });

      if (duplicate) {
        console.log(`⚠️  ICC ENCONTRADO en trámite activo:`);
        console.log(`   ID: ${duplicate.id}`);
        console.log(`   DN: ${duplicate.dn}`);
        console.log(`   Nombre: ${duplicate.nombre} ${duplicate.apellidoPaterno}`);
        console.log(`   Estado: ${duplicate.estado}`);
        console.log(`   Creado: ${duplicate.fechaCreacion}`);
        console.log('');
      } else {
        console.log(`✅ ICC está disponible\n`);
      }
    }

    // Buscar TODOS los trámites con ese ICC (incluso cancelados/completados)
    console.log('📋 Historial completo del ICC de Veronica:\n');
    const todosLosTramites = await prisma.tramite.findMany({
      where: { icc: '8952034000164445565' },
      orderBy: { fechaCreacion: 'desc' }
    });

    if (todosLosTramites.length === 0) {
      console.log('❌ No se encontraron trámites con ese ICC');
    } else {
      todosLosTramites.forEach((t, i) => {
        const fecha = new Date(t.fechaCreacion);
        const fechaFormateada = fecha.toLocaleString('es-MX');
        console.log(`${i + 1}. ${t.nombre} ${t.apellidoPaterno}`);
        console.log(`   Estado: ${t.estado}`);
        console.log(`   Creado: ${fechaFormateada}`);
        console.log('');
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

checkICC();
