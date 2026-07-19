export interface TUIColors {
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  text: string;
  border: string;
  header: string;
  footer: string;
}

export const colors: TUIColors = {
  primary: '#4A90D9',
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
  background: '#1a1a2e',
  text: '#FFFFFF',
  border: '#16213e',
  header: '#0f3460',
  footer: '#16213e',
};

export const statusColors = {
  online: '#2ECC71',
  offline: '#E74C3C',
  connecting: '#F39C12',
  busy: '#9B59B6',
};

export const jobStatusColors = {
  received: '#3498DB',
  started: '#F39C12',
  processing: '#9B59B6',
  completed: '#2ECC71',
  failed: '#E74C3C',
  cancelled: '#95A5A6',
};
