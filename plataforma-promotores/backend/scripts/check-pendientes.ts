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
const prisma = new PrismaClient({ adapter });

async function checkPendientes() {
  try {
    const pendientes = await prisma.tramite.findMany({
      where: { estado: 'PENDIENTE' },
      orderBy: { fechaCreacion: 'asc' },
      select: {
        id: true,
        nombre: true,
        apellidoPaterno: true,
        dn: true,
        icc: true,
        fechaCreacion: true
      }
    });

    console.log('📋 TRÁMITES PENDIENTES:\n');
    console.log(`Total: ${pendientes.length}\n`);

    if (pendientes.length === 0) {
      console.log('✅ No hay trámites pendientes');
      return;
    }

    pendientes.forEach((t, i) => {
      const fecha = new Date(t.fechaCreacion);
      console.log(`${i + 1}. ${t.nombre} ${t.apellidoPaterno}`);
      console.log(`   DN: ${t.dn}`);
      console.log(`   ICC: ${t.icc}`);
      console.log(`   Creado: ${fecha.toLocaleString('es-MX')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkPendientes();
