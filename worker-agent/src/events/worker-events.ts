import { EventEmitter } from 'events';

export interface DeviceInfo {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'unauthorized';
  battery?: number;
  storageFree?: string;
}

export interface JobInfo {
  id: string;
  tramiteId: string;
  status: 'received' | 'started' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  message?: string;
  folioId?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkerEvents {
  'worker:registered': (data: { workerId: string; apiKey: string }) => void;
  'worker:online': () => void;
  'worker:offline': () => void;
  'worker:error': (error: string) => void;
  'job:received': (job: JobInfo) => void;
  'job:started': (jobId: string) => void;
  'job:progress': (data: { jobId: string; progress: number; message: string }) => void;
  'job:completed': (data: { jobId: string; folioId: string }) => void;
  'job:failed': (data: { jobId: string; error: string }) => void;
  'job:cancelled': (jobId: string) => void;
  'device:connected': (device: DeviceInfo) => void;
  'device:disconnected': (deviceId: string) => void;
  'device:list': (devices: DeviceInfo[]) => void;
  'backend:connected': () => void;
  'backend:disconnected': () => void;
  'backend:reconnecting': () => void;
  'log:new': (data: { level: string; message: string; timestamp: Date }) => void;
  'stats:updated': (stats: DailyStats) => void;
  'config:changed': (key: string, value: any) => void;
}

export interface DailyStats {
  completed: number;
  failed: number;
  cancelled: number;
  successRate: number;
  totalJobs: number;
}

class WorkerEventEmitter extends EventEmitter {
  private static instance: WorkerEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  static getInstance(): WorkerEventEmitter {
    if (!WorkerEventEmitter.instance) {
      WorkerEventEmitter.instance = new WorkerEventEmitter();
    }
    return WorkerEventEmitter.instance;
  }

  emit<K extends keyof WorkerEvents>(event: K, ...args: Parameters<WorkerEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof WorkerEvents>(event: K, listener: WorkerEvents[K]): this {
    return super.on(event, listener);
  }

  once<K extends keyof WorkerEvents>(event: K, listener: WorkerEvents[K]): this {
    return super.once(event, listener);
  }

  off<K extends keyof WorkerEvents>(event: K, listener: WorkerEvents[K]): this {
    return super.off(event, listener);
  }
}

export const workerEvents = WorkerEventEmitter.getInstance();
export default workerEvents;
