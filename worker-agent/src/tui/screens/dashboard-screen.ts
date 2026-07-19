import blessed from 'blessed';
import { workerEvents } from '../../events/worker-events';
import { colors } from '../utils/colors';
import { createStatusBar, updateStatusBar } from '../components/status-bar';
import { createDevicePanel, updateDevicePanel } from '../components/device-panel';
import { createStatsPanel, updateStatsPanel } from '../components/stats-card';
import { createJobProgress, updateJobProgress } from '../components/job-progress';
import { createLogViewer, addLogEntry } from '../components/log-viewer';
import { createFooter, updateFooter } from '../components/footer';
import { AdbHelper } from '../utils/adb-helper';
import config from '../../config/env';
import logger from '../../utils/logger';

interface DashboardScreen {
  screen: blessed.Widgets.Screen;
  statusBar: blessed.Widgets.BoxElement;
  devicePanel: blessed.Widgets.BoxElement;
  statsPanel: blessed.Widgets.BoxElement;
  jobProgress: blessed.Widgets.BoxElement;
  logViewer: blessed.Widgets.Log;
  footer: blessed.Widgets.BoxElement;
}

let dashboard: DashboardScreen | null = null;
let currentJob: { id: string | null; tramiteId: string | null; progress: number; message: string } | null = null;
let isOnline = false;
let backendConnected = false;
let dailyStats = { completed: 0, failed: 0, successRate: 0 };

export function createDashboardScreen(): blessed.Widgets.Screen {
  const screen = blessed.screen({
    smartCSR: true,
    fullUnicode: true,
    title: 'Proobot Worker',
    dockBorders: true,
  });

  // Crear componentes
  const statusBar = createStatusBar(screen);
  const devicePanel = createDevicePanel(screen);
  const statsPanel = createStatsPanel(screen);
  const jobProgress = createJobProgress(screen);
  const logViewer = createLogViewer(screen);
  const footer = createFooter(screen);

  dashboard = {
    screen,
    statusBar,
    devicePanel,
    statsPanel,
    jobProgress,
    logViewer,
    footer,
  };

  // Actualizar estado inicial
  updateStatusBar(statusBar, screen, config.workerName, false, false, null);
  updateDevicePanel(devicePanel, screen);
  updateStatsPanel(statsPanel, screen, dailyStats);
  updateJobProgress(jobProgress, screen, null);
  updateFooter(footer, screen, 'dashboard');

  // Escuchar eventos del worker
  setupEventListeners();

  // Actualizar dispositivos periódicamente
  setInterval(() => {
    if (dashboard) {
      updateDevicePanel(dashboard.devicePanel, dashboard.screen);
    }
  }, 30000); // Cada 30 segundos

  // Manejar teclas
  screen.key(['q', 'C-c'], () => {
    screen.destroy();
    process.exit(0);
  });

  screen.key('f5', () => {
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: 'info',
      message: 'Reiniciando worker...',
    });
    // Emitir señal para reiniciar
    process.emit('SIGUSR1' as any);
  });

  screen.key('r', async () => {
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: 'info',
      message: 'Reconectando dispositivos ADB...',
    });
    const success = await AdbHelper.restartAdb();
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: success ? 'info' : 'error',
      message: success ? 'ADB reiniciado correctamente' : 'Error al reiniciar ADB',
    });
    if (dashboard) {
      await updateDevicePanel(dashboard.devicePanel, dashboard.screen);
    }
  });

  screen.key('f1', () => {
    showHelp(screen);
  });

  screen.render();
  return screen;
}

function setupEventListeners(): void {
  if (!dashboard) return;

  const { statusBar, devicePanel, statsPanel, jobProgress, logViewer, screen } = dashboard;

  workerEvents.on('worker:registered', (data) => {
    isOnline = true;
    updateStatusBar(statusBar, screen, config.workerName, true, backendConnected, currentJob?.id || null);
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: 'info',
      message: `Worker registrado: ${data.workerId}`,
    });
  });

  workerEvents.on('worker:online', () => {
    isOnline = true;
    updateStatusBar(statusBar, screen, config.workerName, true, backendConnected, currentJob?.id || null);
  });

  workerEvents.on('worker:offline', () => {
    isOnline = false;
    updateStatusBar(statusBar, screen, config.workerName, false, backendConnected, null);
  });

  workerEvents.on('worker:error', (error) => {
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: 'error',
      message: `Error del worker: ${error}`,
    });
  });

  workerEvents.on('backend:connected', () => {
    backendConnected = true;
    updateStatusBar(statusBar, screen, config.workerName, isOnline, true, currentJob?.id || null);
  });

  workerEvents.on('backend:disconnected', () => {
    backendConnected = false;
    updateStatusBar(statusBar, screen, config.workerName, isOnline, false, currentJob?.id || null);
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: 'warn',
      message: '⚠️ Conexión con el backend perdida',
    });
  });

  workerEvents.on('backend:reconnecting', () => {
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: 'warn',
      message: ' Reconectando con el backend...',
    });
  });

  workerEvents.on('job:received', (job) => {
    currentJob = {
      id: job.id,
      tramiteId: job.tramiteId,
      progress: 0,
      message: 'Trabajo recibido',
    };
    updateStatusBar(statusBar, screen, config.workerName, isOnline, backendConnected, job.id);
    updateJobProgress(jobProgress, screen, currentJob);
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: 'info',
      message: `📋 Nuevo trabajo recibido: #${job.id} (Trámite: ${job.tramiteId})`,
    });
  });

  workerEvents.on('job:started', (jobId) => {
    if (currentJob) {
      currentJob.progress = 10;
      currentJob.message = 'Iniciando ejecución...';
      updateJobProgress(jobProgress, screen, currentJob);
    }
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: 'info',
      message: `▶️ Iniciando trabajo #${jobId}...`,
    });
  });

  workerEvents.on('job:progress', (data) => {
    if (currentJob && currentJob.id === data.jobId) {
      currentJob.progress = data.progress;
      currentJob.message = data.message;
      updateJobProgress(jobProgress, screen, currentJob);
    }
  });

  workerEvents.on('job:completed', (data) => {
    if (currentJob && currentJob.id === data.jobId) {
      currentJob.progress = 100;
      currentJob.message = 'Completado';
      updateJobProgress(jobProgress, screen, currentJob);
    }
    dailyStats.completed++;
    updateDailyStats();
    updateStatusBar(statusBar, screen, config.workerName, isOnline, backendConnected, null);
    currentJob = null;
    setTimeout(() => {
      if (dashboard) {
        updateJobProgress(dashboard.jobProgress, dashboard.screen, null);
      }
    }, 2000);
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: 'info',
      message: `✅ Trabajo #${data.jobId} completado - Folio: ${data.folioId}`,
    });
  });

  workerEvents.on('job:failed', (data) => {
    if (currentJob && currentJob.id === data.jobId) {
      currentJob.message = `Fallido: ${data.error}`;
      updateJobProgress(jobProgress, screen, currentJob);
    }
    dailyStats.failed++;
    updateDailyStats();
    updateStatusBar(statusBar, screen, config.workerName, isOnline, backendConnected, null);
    currentJob = null;
    setTimeout(() => {
      if (dashboard) {
        updateJobProgress(dashboard.jobProgress, dashboard.screen, null);
      }
    }, 2000);
    addLogEntry(logViewer, screen, {
      timestamp: new Date(),
      level: 'error',
      message: `❌ Trabajo #${data.jobId} fallido: ${data.error}`,
    });
  });

  workerEvents.on('log:new', (data) => {
    addLogEntry(logViewer, screen, data);
  });
}

function updateDailyStats(): void {
  if (!dashboard) return;
  const total = dailyStats.completed + dailyStats.failed;
  dailyStats.successRate = total > 0 ? Math.round((dailyStats.completed / total) * 100) : 0;
  updateStatsPanel(dashboard.statsPanel, dashboard.screen, dailyStats);
}

function showHelp(screen: blessed.Widgets.Screen): void {
  const helpBox = blessed.box({
    top: 'center',
    left: 'center',
    width: '60%',
    height: '70%',
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: colors.primary,
      },
      fg: colors.text,
      bg: colors.background,
    },
    label: ' {bold} Ayuda - Proobot Worker {/bold} ',
    scrollable: true,
    keys: true,
    vi: true,
    mouse: true,
  });

  const helpContent = `
  {bold} PROOBOT WORKER - Guía de Uso{/bold}

  {bold}Pantallas:{/bold}
    ← →  Navegar entre pantallas (Dashboard, Configuración, Historial)

  {bold}Dashboard (Pantalla Principal):{/bold}
    F5   Reiniciar el worker
    R    Reconectar dispositivos ADB
    F1   Mostrar esta ayuda
    Q    Salir del programa

  {bold}Estados:{/bold}
    {green-fg}🟢 ONLINE{/green-fg}    Worker conectado y funcionando
    {red-fg}🔴 OFFLINE{/red-fg}   Worker desconectado o detenido
    {yellow-fg}🟡 Conectando{/yellow-fg} Intentando conectar con el backend

  {bold}Trabajos:{/bold}
    Los trabajos se reciben automáticamente del backend.
    La barra de progreso muestra el avance del trabajo actual.

  {bold}Dispositivos:{/bold}
    Los dispositivos Android se detectan automáticamente.
    Si no se detecta un dispositivo, presiona R para reconectar.

  {bold}Problemas Comunes:{/bold}
    ️ Dispositivo no detectado:
      1. Verifica que el cable USB esté conectado
      2. Presiona R para reconectar ADB
      3. En WSL: usa usbipd para conectar el dispositivo

    ❌ Error de conexión al backend:
      1. Verifica que la URL del backend sea correcta
      2. Verifica la conexión a internet
      3. El worker intentará reconectar automáticamente

    ❌ El worker se cierra solo:
      1. Activa el modo kiosko en Configuración
      2. Revisa los logs para ver el error

  {bold}Soporte:{/bold}
    Para más ayuda, contacta al equipo de desarrollo.

  {yellow-fg}Presiona cualquier tecla para cerrar{/yellow-fg}
  `;

  helpBox.setContent(helpContent);
  screen.append(helpBox);
  helpBox.focus();

  helpBox.once('keypress', () => {
    screen.remove(helpBox);
    screen.render();
  });

  screen.render();
}

export function getDashboard(): DashboardScreen | null {
  return dashboard;
}

export function addLogToDashboard(level: string, message: string): void {
  if (dashboard) {
    addLogEntry(dashboard.logViewer, dashboard.screen, {
      timestamp: new Date(),
      level,
      message,
    });
  } else {
    logger.info(`[TUI no disponible] ${message}`);
  }
}
