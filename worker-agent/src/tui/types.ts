import type * as blessed from 'blessed';

import type * as blessed from 'blessed';

import type * as blessed from 'blessed';

import type * as blessed from 'blessed';

export type ScreenType = 'dashboard' | 'config' | 'history';

export interface ScreenProps {
  screen: blessed.Widgets.Screen;
  blessed: typeof blessed;
  contrib: any;
}

export interface DashboardState {
  workerId: string | null;
  isOnline: boolean;
  backendConnected: boolean;
  currentJob: {
    id: string | null;
    tramiteId: string | null;
    progress: number;
    message: string;
  } | null;
  devices: DeviceInfo[];
  dailyStats: {
    completed: number;
    failed: number;
    successRate: number;
  };
  logs: LogEntry[];
}

export interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'unauthorized';
  battery?: number;
  storageFree?: string;
}

export interface JobHistoryEntry {
  id: string;
  tramiteId: string;
  status: 'completed' | 'failed' | 'cancelled';
  timestamp: Date;
  folioId?: string;
  error?: string;
}

export interface ConfigData {
  workerName: string;
  workerLocation: string;
  apiUrl: string;
  pollInterval: number;
  heartbeatInterval: number;
  botTimeout: number;
  screenshotsEnabled: boolean;
  evidenceUploadEnabled: boolean;
  videoRecording: boolean;
  kioskMode: boolean;
  logLevel: string;
}
