import { prisma } from '../config/database.prisma';
import { Device, DeviceStatus } from '../types';

export class DeviceModel {
  // Get device by ID
  async findById(id: string): Promise<Device | null> {
    const device = await prisma.device.findUnique({
      where: { id },
    });

    return device ? this.mapPrismaToDevice(device) : null;
  }

  // Get device by UDID
  async findByUdid(udid: string): Promise<Device | null> {
    const device = await prisma.device.findUnique({
      where: { udid },
    });

    return device ? this.mapPrismaToDevice(device) : null;
  }

  // Get all devices
  async getAll(): Promise<Device[]> {
    const devices = await prisma.device.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return devices.map(d => this.mapPrismaToDevice(d));
  }

  // Get available devices
  async getAvailable(): Promise<Device[]> {
    const devices = await prisma.device.findMany({
      where: { status: 'AVAILABLE' },
    });

    return devices.map(d => this.mapPrismaToDevice(d));
  }

  // Get devices by status
  async getByStatus(status: DeviceStatus): Promise<Device[]> {
    const devices = await prisma.device.findMany({
      where: { status: this.mapStatusToPrisma(status) },
    });

    return devices.map(d => this.mapPrismaToDevice(d));
  }

  // Get stats
  async getStats() {
    const devices = await prisma.device.findMany();

    return {
      total: devices.length,
      available: devices.filter(d => d.status === 'AVAILABLE').length,
      busy: devices.filter(d => d.status === 'BUSY').length,
      offline: devices.filter(d => d.status === 'OFFLINE').length,
    };
  }

  // Create new device
  async create(data: { udid: string; name: string; workerUrl?: string }): Promise<Device> {
    const nuevoDevice = await prisma.device.create({
      data: {
        udid: data.udid,
        name: data.name,
        status: 'AVAILABLE',
        workerUrl: data.workerUrl || '',
      },
    });

    return this.mapPrismaToDevice(nuevoDevice);
  }

  // Update device
  async update(
    id: string,
    data: Partial<Omit<Device, 'id' | 'udid' | 'createdAt'>>
  ): Promise<Device | null> {
    try {
      const prismaData: any = {};
      if (data.name !== undefined) prismaData.name = data.name;
      if (data.status !== undefined) prismaData.status = this.mapStatusToPrisma(data.status);
      if (data.workerUrl !== undefined) prismaData.workerUrl = data.workerUrl;
      if (data.lastUsed !== undefined) prismaData.lastUsed = data.lastUsed ? new Date(data.lastUsed) : null;

      const updatedDevice = await prisma.device.update({
        where: { id },
        data: prismaData,
      });

      return this.mapPrismaToDevice(updatedDevice);
    } catch {
      return null;
    }
  }

  // Mark as busy
  async markAsBusy(id: string): Promise<Device | null> {
    return this.update(id, {
      status: 'busy',
      lastUsed: new Date().toISOString(),
    });
  }

  // Mark as available
  async markAsAvailable(id: string): Promise<Device | null> {
    return this.update(id, {
      status: 'available',
    });
  }

  // Mark as offline
  async markAsOffline(id: string): Promise<Device | null> {
    return this.update(id, {
      status: 'offline',
    });
  }

  // Delete device
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.device.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Map Prisma model to legacy Device type
  private mapPrismaToDevice(prismaDevice: any): Device {
    return {
      id: prismaDevice.id,
      udid: prismaDevice.udid,
      name: prismaDevice.name,
      status: this.mapPrismaStatusToLegacy(prismaDevice.status),
      workerUrl: prismaDevice.workerUrl || '',
      lastUsed: prismaDevice.lastUsed?.toISOString() || null,
      createdAt: prismaDevice.createdAt.toISOString(),
    };
  }

  // Map legacy status to Prisma enum
  private mapStatusToPrisma(status: DeviceStatus): any {
    const map: Record<DeviceStatus, any> = {
      available: 'AVAILABLE',
      busy: 'BUSY',
      offline: 'OFFLINE',
    };
    return map[status];
  }

  // Map Prisma enum to legacy status
  private mapPrismaStatusToLegacy(status: any): DeviceStatus {
    const map: Record<string, DeviceStatus> = {
      AVAILABLE: 'available',
      BUSY: 'busy',
      OFFLINE: 'offline',
    };
    return map[status] || 'available';
  }
}

export const deviceModel = new DeviceModel();
