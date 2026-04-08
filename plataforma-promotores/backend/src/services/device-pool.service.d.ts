import { Device } from '../types';
export declare class DevicePoolService {
    getAvailableDevice(): Device | null;
    markDeviceBusy(deviceId: string): boolean;
    markDeviceAvailable(deviceId: string): boolean;
    markDeviceOffline(deviceId: string): boolean;
    hasAvailableDevice(): boolean;
    getAllDevices(): Device[];
    getStats(): {
        total: number;
        available: number;
        busy: number;
        offline: number;
    };
    addDevice(udid: string, name: string): Device;
    removeDevice(deviceId: string): boolean;
}
export declare const devicePoolService: DevicePoolService;
//# sourceMappingURL=device-pool.service.d.ts.map