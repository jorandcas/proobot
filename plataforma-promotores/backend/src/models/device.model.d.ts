import { Device, DeviceStatus } from '../types';
export declare class DeviceModel {
    findById(id: string): Device | null;
    findByUdid(udid: string): Device | null;
    getAll(): Device[];
    getAvailable(): Device[];
    getByStatus(status: DeviceStatus): Device[];
    getStats(): {
        total: number;
        available: number;
        busy: number;
        offline: number;
    };
    create(data: {
        udid: string;
        name: string;
    }): Device;
    update(id: string, data: Partial<Omit<Device, 'id' | 'udid' | 'createdAt'>>): Device | null;
    markAsBusy(id: string): Device | null;
    markAsAvailable(id: string): Device | null;
    markAsOffline(id: string): Device | null;
    delete(id: string): boolean;
}
export declare const deviceModel: DeviceModel;
//# sourceMappingURL=device.model.d.ts.map