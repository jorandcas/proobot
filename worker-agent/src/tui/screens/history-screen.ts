import blessed from 'blessed';
import fs from 'fs';
import path from 'path';
import { colors } from '../utils/colors';
import { JobHistoryEntry } from '../types';
import { addLogToDashboard } from './dashboard-screen';

let historyScreen: blessed.Widgets.Screen | null = null;
let jobHistory: JobHistoryEntry[] = [];

export function createHistoryScreen(parentScreen: blessed.Widgets.Screen): blessed.Widgets.Screen {
  jobHistory = loadJobHistory();

  const screen = blessed.screen({
    smartCSR: true,
    fullUnicode: true,
    title: 'Proobot Worker - Historial',
    dockBorders: true,
  });

  // Tabla de historial
  const table = blessed.box({
    top: 2,
    left: 0,
    width: '100%',
    height: '60%',
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: colors.border,
      },
    },
    label: ' {bold} Últimos 20 Trabajos {/bold} ',
    scrollable: true,
    keys: true,
    vi: true,
    mouse: true,
  });

  screen.append(table);
  updateHistoryTable(table, screen);

  // Estadísticas de disco
  const diskStats = blessed.box({
    top: '62%',
    left: 0,
    width: '100%',
    height: 5,
    tags: true,
    style: {
      fg: colors.text,
    },
  });

  screen.append(diskStats);
  updateDiskStats(diskStats, screen);

  // Botones de acción
  const buttonBar = blessed.box({
    bottom: 2,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    style: {
      bg: colors.footer,
      fg: colors.text,
    },
  });

  screen.append(buttonBar);
  buttonBar.setContent('  ↑↓Navegar  Enter:Ver detalles  R:Reintentar último fallido  L:Limpiar evidencias  Esc:Volver');
  screen.render();

  // Manejar teclas
  screen.key(['escape', 'C-c'], () => {
    screen.destroy();
    historyScreen = null;
    parentScreen.render();
  });

  screen.key('l', () => {
    const evidencePath = path.join(process.cwd(), './evidence');
    if (fs.existsSync(evidencePath)) {
      fs.rmSync(evidencePath, { recursive: true, force: true });
      fs.mkdirSync(evidencePath, { recursive: true });
    }
    addLogToDashboard('info', 'Evidencias limpiadas correctamente');
    showNotification(screen, 'Evidencias limpiadas correctamente', 'success');
    updateDiskStats(diskStats, screen);
  });

  screen.key('r', () => {
    const lastFailed = jobHistory.find(j => j.status === 'failed');
    if (lastFailed) {
      addLogToDashboard('info', `Reintentando trabajo fallido #${lastFailed.id}...`);
      showNotification(screen, `Reintentando trabajo #${lastFailed.id}...`, 'info');
      // Aquí se podría implementar la lógica de reintento
    } else {
      showNotification(screen, 'No hay trabajos fallidos para reintentar', 'warning');
    }
  });

  screen.key('enter', () => {
    // Mostrar detalles del trabajo seleccionado
    showNotification(screen, 'Detalles del trabajo (próximamente)', 'info');
  });

  historyScreen = screen;
  return screen;
}

function updateHistoryTable(table: blessed.Widgets.BoxElement, screen: blessed.Widgets.Screen): void {
  if (jobHistory.length === 0) {
    table.setContent('  {gray-fg}No hay trabajos en el historial{/gray-fg}');
  } else {
    let content = '  {bold}ID       Trámite    Estado       Hora        Folio/Error{/bold}\n';
    content += '  ' + '─'.repeat(70) + '\n';

    const recentJobs = jobHistory.slice(0, 20);
    for (const job of recentJobs) {
      const statusIcon = job.status === 'completed' ? '{green-fg}✅{/green-fg}' :
                        job.status === 'failed' ? '{red-fg}❌{/red-fg}' :
                        '{gray-fg}{/gray-fg}';
      const time = job.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const detail = job.folioId || job.error || '-';

      content += `  ${statusIcon} ${job.id.padEnd(8)} ${job.tramiteId.padEnd(10)} ${job.status.padEnd(12)} ${time.padEnd(11)} ${detail}\n`;
    }

    table.setContent(content);
  }
  screen.render();
}

function updateDiskStats(panel: blessed.Widgets.BoxElement, screen: blessed.Widgets.Screen): void {
  const evidencePath = path.join(process.cwd(), './evidence');
  let usedSpace = 0;

  if (fs.existsSync(evidencePath)) {
    const getSize = (dir: string): number => {
      let size = 0;
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            size += getSize(filePath);
          } else {
            size += stats.size;
          }
        }
      } catch {
        // Ignore errors
      }
      return size;
    };
    usedSpace = getSize(evidencePath);
  }

  const usedMB = (usedSpace / (1024 * 1024)).toFixed(1);
  const totalGB = 50; // Asumir 50GB disponibles
  const usedPercent = Math.min((usedSpace / (totalGB * 1024 * 1024 * 1024)) * 100, 100);

  const progressBar = createProgressBar(usedPercent);
  const color = usedPercent > 80 ? 'red-fg' : usedPercent > 50 ? 'yellow-fg' : 'green-fg';

  panel.setContent(
    `  {bold}Espacio en disco para evidencias:{/bold}  {${color}}${usedMB} MB{/ ${color}} / ${totalGB} GB\n` +
    `  ${progressBar} ${usedPercent.toFixed(1)}% usado`
  );
  screen.render();
}

function createProgressBar(percent: number): string {
  const width = 40;
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

function loadJobHistory(): JobHistoryEntry[] {
  // En una implementación real, esto vendría de una base de datos local o archivo
  // Por ahora, retornamos un array vacío que se llenará con los eventos
  return [];
}

export function addJobToHistory(job: JobHistoryEntry): void {
  jobHistory.unshift(job);
  if (jobHistory.length > 100) {
    jobHistory = jobHistory.slice(0, 100);
  }
  // Actualizar la tabla si está visible
  if (historyScreen) {
    const table = historyScreen.children[0] as blessed.Widgets.BoxElement;
    if (table) {
      updateHistoryTable(table, historyScreen);
    }
  }
}

function showNotification(screen: blessed.Widgets.Screen, message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
  const colorMap = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
  };

  const iconMap = {
    success: '✅',
    error: '',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const notif = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: 5,
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colorMap[type] },
      fg: colors.text,
      bg: colors.background,
    },
    content: `  ${iconMap[type]} ${message}`,
  });

  screen.append(notif);
  screen.render();

  setTimeout(() => {
    screen.remove(notif);
    screen.render();
  }, 3000);
}

export function getHistoryScreen(): blessed.Widgets.Screen | null {
  return historyScreen;
}
