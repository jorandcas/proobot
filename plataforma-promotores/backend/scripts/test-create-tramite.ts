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

async function testCreateTramite() {
  try {
    console.log('🧪 Test: Crear trámite...\n');

    // Get active campaign
    console.log('1️⃣ Buscando campaña activa...');
    const now = new Date();
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

    console.log(`✅ Campaña encontrada: ${campana.nombre} (${campana.id})`);

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

    // Test data
    const testData = {
      idCampana: campana.id,
      idPromotor: promotor.id,
      estado: 'PENDIENTE',
      dn: '1234567890',
      icc: '8952034000164445565', // ICC de prueba (Veronica)
      fvcFecha: new Date().toISOString().split('T')[0],
      nip: '1234',
      nombre: 'TEST',
      nombreSegundo: null,
      apellidoPaterno: 'PRUEBA',
      apellidoMaterno: 'X',
      curp: 'TEST800101HDFXXX01',
      telefono: '5512345678',
      telefono2: null,
      genero: 'F',
      email: null,
      fechaNacimiento: '1980-01-01'
    };

    console.log('\n3️⃣ Creando trámite de prueba...');
    console.log(`   DN: ${testData.dn}`);
    console.log(`   Nombre: ${testData.nombre} ${testData.apellidoPaterno}`);
    console.log(`   ICC: ${testData.icc}`);

    const nuevoTramite = await prisma.tramite.create({
      data: testData
    });

    console.log('\n✅ Trámite creado exitosamente:');
    console.log(`   ID: ${nuevoTramite.id}`);
    console.log(`   Estado: ${nuevoTramite.estado}`);
    console.log(`   Creado: ${nuevoTramite.fechaCreacion}`);

    // Verify it was saved
    console.log('\n4️⃣ Verificando que se guardó...');
    const verify = await prisma.tramite.findUnique({
      where: { id: nuevoTramite.id }
    });

    if (verify) {
      console.log('✅ Trámite verificado en BD');
    } else {
      console.error('❌ Trámite NO encontrado en BD');
    }

    // Count all trámites
    const total = await prisma.tramite.count();
    console.log(`\n📊 Total de trámites en BD: ${total}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testCreateTramite();
