import blessed from 'blessed';
import { colors } from '../utils/colors';

export function createStatusBar(screen: blessed.Widgets.Screen): blessed.Widgets.BoxElement {
  const statusBar = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    style: {
      bg: colors.header,
      fg: colors.text,
    },
  });

  screen.append(statusBar);
  return statusBar;
}

export function updateStatusBar(
  statusBar: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  workerName: string,
  isOnline: boolean,
  backendConnected: boolean,
  currentJobId: string | null
): void {
  const statusIcon = isOnline ? '{green-fg}ONLINE{/green-fg}' : '{red-fg}OFFLINE{/red-fg}';
  const backendIcon = backendConnected ? '{green-fg}Conectado{/green-fg}' : '{red-fg}Desconectado{/red-fg}';
  const jobText = currentJobId ? `Trabajo: #${currentJobId}` : 'Esperando trabajo...';

  statusBar.setContent(
    `  {bold}PROOBOT WORKER - ${workerName}{/bold}          ${statusIcon}  Backend: ${backendIcon}  ${jobText}          {yellow-fg}[F1]Ayuda{/yellow-fg}`
  );
  screen.render();
}
