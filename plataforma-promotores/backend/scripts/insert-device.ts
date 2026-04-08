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

async function insertDevice() {
  try {
    console.log('✅ Connected to database');

    // Check if device already exists
    const existingDevice = await prisma.device.findUnique({
      where: { udid: 'ZY22FDGBWW' },
    });

    if (existingDevice) {
      console.log('✅ Device already exists, updating workerUrl...');
      await prisma.device.update({
        where: { udid: 'ZY22FDGBWW' },
        data: {
          workerUrl: 'http://l4coksw4cwokkgk4s4oo40s4.77.42.75.118.sslip.io',
        },
      });
      console.log('✅ Device workerUrl updated successfully!');
    } else {
      console.log('📱 Inserting new device...');
      const device = await prisma.device.create({
        data: {
          udid: 'ZY22FDGBWW',
          name: 'Device 1 - Movistar',
          status: 'AVAILABLE',
          workerUrl: 'http://l4coksw4cwokkgk4s4oo40s4.77.42.75.118.sslip.io',
        },
      });
      console.log('✅ Device created successfully!');
      console.log(`   ID: ${device.id}`);
      console.log(`   UDID: ${device.udid}`);
      console.log(`   Name: ${device.name}`);
      console.log(`   Worker URL: ${device.workerUrl}`);
      console.log(`   Status: ${device.status}`);
    }

    // Show all devices
    const allDevices = await prisma.device.findMany();
    console.log(`\n📊 Total devices in database: ${allDevices.length}`);
    allDevices.forEach((d, i) => {
      console.log(`   ${i + 1}. ${d.name} (${d.udid}) - ${d.status}`);
      console.log(`      Worker URL: ${d.workerUrl || 'NOT SET'}`);
    });

  } catch (error) {
    console.error('❌ Error inserting device:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

insertDevice();
