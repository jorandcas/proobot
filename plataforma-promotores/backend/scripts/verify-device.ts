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

async function verifyDevices() {
  try {
    console.log('🔍 Verifying devices configuration...\n');

    // Get all devices
    const devices = await prisma.device.findMany();

    if (devices.length === 0) {
      console.log('❌ No devices found in database');
      return;
    }

    console.log(`✅ Found ${devices.length} device(s):\n`);

    devices.forEach((device, index) => {
      console.log(`Device #${index + 1}:`);
      console.log(`  ID:          ${device.id}`);
      console.log(`  UDID:        ${device.udid}`);
      console.log(`  Name:        ${device.name}`);
      console.log(`  Status:      ${device.status}`);
      console.log(`  Worker URL:  ${device.workerUrl || '❌ NOT SET'}`);
      console.log(`  Last Used:   ${device.lastUsed || 'Never'}`);
      console.log(`  Created:     ${device.createdAt}`);
      console.log('');

      // Verify workerUrl is set
      if (!device.workerUrl || device.workerUrl.trim() === '') {
        console.log(`  ⚠️  WARNING: Worker URL is not set for this device!\n`);
      } else {
        console.log(`  ✅ Worker URL is properly configured\n`);
      }
    });

    // Test backend service logic
    console.log('🔧 Testing backend service logic...\n');

    const availableDevices = devices.filter(d => d.status === 'AVAILABLE');
    console.log(`Available devices: ${availableDevices.length}/${devices.length}`);

    if (availableDevices.length > 0) {
      const device = availableDevices[0];
      console.log(`\nFirst available device:`);
      console.log(`  Name: ${device.name}`);
      console.log(`  Worker URL: ${device.workerUrl}`);
      console.log(`  Execute URL: ${device.workerUrl}/execute`);
    }

  } catch (error) {
    console.error('❌ Error verifying devices:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verifyDevices();
