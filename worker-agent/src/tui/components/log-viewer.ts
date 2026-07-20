import blessed from 'blessed';
import { colors } from '../utils/colors';
import { LogEntry } from '../types';

const MAX_LOGS = 200;

export function createLogViewer(screen: blessed.Widgets.Screen): blessed.Widgets.Log {
  const logViewer = blessed.log({
    top: 16,
    left: 0,
    width: '100%',
    bottom: 3,
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: colors.border,
      },
    },
    label: ' {bold} Logs en Vivo {/bold} ',
    scrollable: true,
    scrollbar: {
      ch: '│',
      style: {
        fg: colors.border,
      },
    },
    keys: true,
    vi: true,
    mouse: true,
  });

  screen.append(logViewer);
  return logViewer;
}

export function addLogEntry(
  logViewer: blessed.Widgets.Log,
  screen: blessed.Widgets.Screen,
  entry: LogEntry
): void {
  const time = entry.timestamp.toLocaleTimeString('es-MX', { hour12: false });
  const levelColors: Record<string, string> = {
    info: 'green-fg',
    warn: 'yellow-fg',
    error: 'red-fg',
    debug: 'gray-fg',
  };

  const color = levelColors[entry.level.toLowerCase()] || 'white-fg';
  const levelIcon = entry.level === 'info' ? '' :
                    entry.level === 'warn' ? '⚠ ' :
                    entry.level === 'error' ? '❌ ' : '🔍 ';

  logViewer.add(`{${color}}[${time}] ${levelIcon}${entry.message}{/${color}}`);

  const lines = logViewer.content.split('\n');
  if (lines.length > MAX_LOGS) {
    logViewer.setContent(lines.slice(lines.length - MAX_LOGS).join('\n'));
  }

  screen.render();
}

export function clearLogs(logViewer: blessed.Widgets.Log, screen: blessed.Widgets.Screen): void {
  logViewer.setContent('');
  screen.render();
}
