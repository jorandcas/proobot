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

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

export function updateStatusBar(
  statusBar: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  workerName: string,
  isOnline: boolean,
  backendConnected: boolean,
  currentJobId: string | null
): void {
  const termWidth = screen.cols;
  const statusIcon = isOnline ? '{green-fg}ONLINE{/green-fg}' : '{red-fg}OFFLINE{/red-fg}';
  const backendIcon = backendConnected ? '{green-fg}Conectado{/green-fg}' : '{red-fg}Desconectado{/red-fg}';
  const jobText = currentJobId ? `Trabajo: #${currentJobId}` : 'Esperando trabajo...';

  // Construir partes y distribuir según el ancho
  const title = `{bold}PROOBOT WORKER - ${workerName}{/bold}`;
  const help = '{yellow-fg}[F1]Ayuda{/yellow-fg}';
  const middle = `${statusIcon}  Backend: ${backendIcon}  ${jobText}`;

  // Si hay espacio suficiente, mostrar todo
  if (termWidth >= 80) {
    statusBar.setContent(`  ${title}          ${middle}          ${help}`);
  } else if (termWidth >= 50) {
    // Terminal mediana: quitar ayuda
    statusBar.setContent(`  ${title}  ${middle}`);
  } else {
    // Terminal pequeña: solo título y estado
    const maxMiddle = Math.max(0, termWidth - title.length - 4);
    statusBar.setContent(`  ${title}  ${truncate(middle.replace(/{[^}]+}/g, ''), maxMiddle)}`);
  }
  screen.render();
}
