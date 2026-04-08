import { deviceModel } from '../models/device.model';
import { Device, DeviceStatus } from '../types';

export class DevicePoolService {
  // Get available device
  async getAvailableDevice(): Promise<Device | null> {
    const availableDevices = await deviceModel.getAvailable();

    if (availableDevices.length === 0) {
      return null;
    }

    // Return first available device
    return availableDevices[0];
  }

  // Mark device as busy
  async markDeviceBusy(deviceId: string): Promise<boolean> {
    const device = await deviceModel.markAsBusy(deviceId);
    return device !== null;
  }

  // Mark device as available
  async markDeviceAvailable(deviceId: string): Promise<boolean> {
    const device = await deviceModel.markAsAvailable(deviceId);
    return device !== null;
  }

  // Mark device as offline
  async markDeviceOffline(deviceId: string): Promise<boolean> {
    const device = await deviceModel.markAsOffline(deviceId);
    return device !== null;
  }

  // Check if any device is available
  async hasAvailableDevice(): Promise<boolean> {
    const available = await deviceModel.getAvailable();
    return available.length > 0;
  }

  // Get all devices with status
  async getAllDevices(): Promise<Device[]> {
    return await deviceModel.getAll();
  }

  // Get device stats
  async getStats() {
    return await deviceModel.getStats();
  }

  // Add new device to pool
  async addDevice(udid: string, name: string, workerUrl?: string): Promise<Device> {
    return await deviceModel.create({ udid, name, workerUrl });
  }

  // Remove device from pool
  async removeDevice(deviceId: string): Promise<boolean> {
    return await deviceModel.delete(deviceId);
  }
}

export const devicePoolService = new DevicePoolService();
