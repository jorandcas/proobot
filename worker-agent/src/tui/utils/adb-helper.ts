import { spawn } from 'child_process';
import { DeviceInfo } from '../../events/worker-events';
import logger from '../../utils/logger';

export class AdbHelper {
  static async listDevices(): Promise<DeviceInfo[]> {
    return new Promise((resolve) => {
      const child = spawn('adb', ['devices', '-l']);
      let output = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', () => {
        const devices: DeviceInfo[] = [];
        const lines = output.split('\n').slice(1); // Skip header

        for (const line of lines) {
          if (!line.trim() || line.includes('List of devices')) continue;

          const parts = line.trim().split(/\s+/);
          if (parts.length < 2) continue;

          const id = parts[0];
          const status = parts[1];

          if (status === 'device' || status === 'unauthorized') {
            devices.push({
              id,
              name: this.extractModel(line) || id,
              status: status === 'device' ? 'connected' : 'unauthorized',
            });
          }
        }

        resolve(devices);
      });

      child.on('error', () => {
        resolve([]);
      });
    });
  }

  static async restartAdb(): Promise<boolean> {
    return new Promise((resolve) => {
      logger.info('Reiniciando ADB server...');

      const killChild = spawn('adb', ['kill-server']);
      killChild.on('close', () => {
        setTimeout(() => {
          const startChild = spawn('adb', ['start-server']);
          startChild.on('close', (code) => {
            resolve(code === 0);
          });
        }, 1000);
      });
    });
  }

  static async getDeviceDetails(deviceId: string): Promise<Partial<DeviceInfo>> {
    const details: Partial<DeviceInfo> = {};

    // Get model
    try {
      const model = await this.runAdbCommand(deviceId, 'shell', 'getprop', 'ro.product.model');
      details.name = model.trim() || deviceId;
    } catch {
      details.name = deviceId;
    }

    // Get battery
    try {
      const battery = await this.runAdbCommand(deviceId, 'shell', 'dumpsys', 'battery');
      const level = battery.match(/level:\s*(\d+)/);
      if (level) {
        details.battery = parseInt(level[1]);
      }
    } catch {
      // Ignore battery errors
    }

    return details;
  }

  private static runAdbCommand(deviceId: string, ...args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('adb', ['-s', deviceId, ...args]);
      let output = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`ADB command failed with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  private static extractModel(line: string): string {
    const modelMatch = line.match(/model:(\S+)/);
    return modelMatch ? modelMatch[1].replace(/_/g, ' ') : '';
  }
}

export default AdbHelper;
