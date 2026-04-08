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

async function diagnosticoCompleto() {
  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO - ICC de Veronica\n');

    const iccVeronica = '8952034000164445565';

    // 1. Buscar TODOS los trámites con ese ICC (cualquier estado)
    console.log('1️⃣ Buscando trámites con ICC:', iccVeronica);
    const todosConICC = await prisma.tramite.findMany({
      where: { icc: iccVeronica },
      orderBy: { fechaCreacion: 'desc' }
    });

    console.log(`   Total encontrados: ${todosConICC.length}\n`);

    if (todosConICC.length > 0) {
      todosConICC.forEach((t, i) => {
        const fecha = new Date(t.fechaCreacion);
        console.log(`${i + 1}. ${t.nombre} ${t.apellidoPaterno}`);
        console.log(`   ID: ${t.id}`);
        console.log(`   DN: ${t.dn}`);
        console.log(`   Estado: ${t.estado}`);
        console.log(`   Campaña: ${t.idCampana}`);
        console.log(`   Creado: ${fecha.toLocaleString('es-MX')}`);
        console.log(`   ¿Bloquea el ICC?: ${['PENDIENTE', 'PROCESANDO', 'ERROR'].includes(t.estado) ? 'SÍ ⛔' : 'NO ✅'}`);
        console.log('');
      });
    } else {
      console.log('   ✅ No hay trámites con ese ICC\n');
    }

    // 2. Buscar trámites de Veronica (por nombre)
    console.log('2️⃣ Buscando trámites de VERONICA (por nombre):');
    const veronicas = await prisma.tramite.findMany({
      where: {
        OR: [
          { nombre: { contains: 'VERONICA', mode: 'insensitive' } },
          { nombre: { contains: 'VERÓNICA', mode: 'insensitive' } },
          { apellidoPaterno: { contains: 'CUEVA', mode: 'insensitive' } },
        ]
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    console.log(`   Total encontrados: ${veronicas.length}\n`);

    if (veronicas.length > 0) {
      veronicas.forEach((t, i) => {
        const fecha = new Date(t.fechaCreacion);
        console.log(`${i + 1}. ${t.nombre} ${t.apellidoPaterno}`);
        console.log(`   ID: ${t.id}`);
        console.log(`   DN: ${t.dn}`);
        console.log(`   ICC: ${t.icc}`);
        console.log(`   Estado: ${t.estado}`);
        console.log(`   Creado: ${fecha.toLocaleString('es-MX')}`);
        console.log('');
      });
    } else {
      console.log('   ✅ No hay trámites de Veronica\n');
    }

    // 3. Total de trámites
    const total = await prisma.tramite.count();
    console.log(`3️⃣ Total de trámites en BD: ${total}\n`);

    // 4. Verificar si el ICC está bloqueado
    const iccBloqueado = await prisma.tramite.findFirst({
      where: {
        icc: iccVeronica,
        estado: { in: ['PENDIENTE', 'PROCESANDO', 'ERROR'] }
      }
    });

    console.log('4️⃣ Estado del ICC:');
    if (iccBloqueado) {
      console.log(`   ⛔ ICC BLOQUEADO por trámite:`);
      console.log(`   ID: ${iccBloqueado.id}`);
      console.log(`   Estado: ${iccBloqueado.estado}`);
      console.log(`   ACCIÓN: Eliminar este trámite para liberar el ICC\n`);
    } else {
      console.log(`   ✅ ICC DISPONIBLE - No está bloqueado\n`);
    }

    // 5. Si está bloqueado, ofrecer eliminación
    if (iccBloqueado) {
      console.log('🗑️  Eliminando trámite que bloquea el ICC...');
      await prisma.tramite.delete({
        where: { id: iccBloqueado.id }
      });
      console.log('✅ Trámite eliminado - ICC liberado\n');

      // Verificar nuevamente
      const verificacion = await prisma.tramite.findFirst({
        where: { icc: iccVeronica }
      });

      if (!verificacion) {
        console.log('✅ Verificado: No hay más trámites con ese ICC');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

diagnosticoCompleto();
