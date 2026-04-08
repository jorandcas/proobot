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

async function createTestTramite() {
  try {
    console.log('🧪 Creando TRÁMITE DE PRUEBA en PostgreSQL...\n');

    // Get active campaign
    const now = new Date();
    console.log('1️⃣ Buscando campaña activa...');
    const campana = await prisma.campana.findFirst({
      where: {
        fechaInicio: { lte: now },
        fechaFin: { gte: now },
        activa: true
      }
    });

    if (!campana) {
      console.error('❌ No hay campaña activa');
      return;
    }

    console.log(`✅ Campaña: ${campana.nombre} (${campana.id})`);

    // Get a promotor
    console.log('\n2️⃣ Buscando promotor...');
    const promotor = await prisma.usuario.findFirst({
      where: { rol: 'PROMOTOR' }
    });

    if (!promotor) {
      console.error('❌ No hay promotor');
      return;
    }

    console.log(`✅ Promotor: ${promotor.nombre} (${promotor.id})`);

    // Create test trámite with NEW ICC (not Veronica's)
    const timestamp = Date.now();
    const nuevoDN = `99999999${timestamp.toString().slice(-4)}`;
    const nuevoICC = `89520340001644${timestamp.toString().slice(-4)}`;

    console.log('\n3️⃣ Creando trámite de prueba...');
    console.log(`   DN: ${nuevoDN}`);
    console.log(`   ICC: ${nuevoICC}`);
    console.log(`   Nombre: USUARIO PRUEBA`);
    console.log(`   Campaña: ${campana.id}`);
    console.log(`   Promotor: ${promotor.id}`);

    const nuevoTramite = await prisma.tramite.create({
      data: {
        idCampana: campana.id,
        idPromotor: promotor.id,
        estado: 'PENDIENTE',
        dn: nuevoDN,
        icc: nuevoICC,
        fvcFecha: new Date().toISOString().split('T')[0],
        nip: '0000',
        nombre: 'USUARIO',
        nombreSegundo: 'PRUEBA',
        apellidoPaterno: 'TEST',
        apellidoMaterno: 'X',
        curp: 'TEST800101HDFXXX01',
        telefono: '5599999999',
        genero: 'F',
        email: null,
        fechaNacimiento: '1980-01-01'
      }
    });

    console.log('\n✅ TRÁMITE CREADO EXITOSAMENTE:');
    console.log(`   ID: ${nuevoTramite.id}`);
    console.log(`   Estado: ${nuevoTramite.estado}`);
    console.log(`   Creado: ${nuevoTramite.fechaCreacion}`);

    // Verify it was saved
    console.log('\n4️⃣ Verificando que se guardó en BD...');
    const verify = await prisma.tramite.findUnique({
      where: { id: nuevoTramite.id }
    });

    if (verify) {
      console.log('✅ VERIFICADO: Trámite SÍ está en la base de datos PostgreSQL');
      console.log(`   DN guardado: ${verify.dn}`);
      console.log(`   ICC guardado: ${verify.icc}`);
    } else {
      console.error('❌ ERROR: Trámite NO se encontró en la BD');
    }

    // Count total
    const total = await prisma.tramite.count();
    console.log(`\n📊 Total de trámites en BD PostgreSQL: ${total}`);

    // List last 5 trámites
    console.log('\n📋 Últimos 5 trámites en BD:');
    const ultimos = await prisma.tramite.findMany({
      orderBy: { fechaCreacion: 'desc' },
      take: 5
    });

    ultimos.forEach((t, i) => {
      console.log(`${i + 1}. ${t.nombre} ${t.apellidoPaterno}`);
      console.log(`   DN: ${t.dn}`);
      console.log(`   ICC: ${t.icc}`);
      console.log(`   Estado: ${t.estado}`);
      console.log('');
    });

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createTestTramite();
