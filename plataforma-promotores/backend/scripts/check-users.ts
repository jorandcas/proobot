import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
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

async function checkAndCreateUsers() {
  try {
    console.log('🔍 Checking users in database...\n');

    // Get all users
    const users = await prisma.usuario.findMany();

    console.log(`📊 Total users found: ${users.length}\n`);

    if (users.length > 0) {
      console.log('✅ Existing users:\n');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.nombre} (${user.rol})`);
        console.log(`      Email: ${user.correo}`);
        console.log(`      ID: ${user.id}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found. Creating test users...\n');

      // Hash passwords
      const adminPassword = await bcrypt.hash('admin123', 10);
      const promotorPassword = await bcrypt.hash('promotor123', 10);

      // Create admin user
      const admin = await prisma.usuario.create({
        data: {
          correo: 'admin@movistar.com',
          contrasena: adminPassword,
          rol: 'ADMIN',
          nombre: 'Administrador',
          tokenVersion: 0,
        },
      });

      console.log('✅ Admin user created:');
      console.log(`   Email: admin@movistar.com`);
      console.log(`   Password: admin123`);
      console.log(`   ID: ${admin.id}\n`);

      // Create promotor user
      const promotor = await prisma.usuario.create({
        data: {
          correo: 'promotor@movistar.com',
          contrasena: promotorPassword,
          rol: 'PROMOTOR',
          nombre: 'Promotor de Prueba',
          tokenVersion: 0,
        },
      });

      console.log('✅ Promotor user created:');
      console.log(`   Email: promotor@movistar.com`);
      console.log(`   Password: promotor123`);
      console.log(`   ID: ${promotor.id}\n`);

      console.log('🎉 Test users created successfully!\n');
      console.log('📝 Login credentials:');
      console.log('   ADMIN:     admin@movistar.com / admin123');
      console.log('   PROMOTOR:  promotor@movistar.com / promotor123');
    }

    // Check for campaigns
    console.log('\n🔍 Checking campaigns...\n');
    const campaigns = await prisma.campana.findMany({
      where: { activa: true },
      orderBy: { fecha: 'desc' },
    });

    if (campaigns.length > 0) {
      console.log(`✅ Found ${campaigns.length} active campaign(s):\n`);
      campaigns.forEach((camp, index) => {
        console.log(`   ${index + 1}. ${camp.nombre}`);
        console.log(`      Date: ${camp.fecha}`);
        console.log(`      ID: ${camp.id}`);
      });
    } else {
      console.log('❌ No active campaigns found.');
      console.log('⚠️  You need to create a campaign before creating trámites.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkAndCreateUsers();
