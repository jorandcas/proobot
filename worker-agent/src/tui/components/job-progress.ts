import blessed from 'blessed';
import { colors } from '../utils/colors';

export function createJobProgress(screen: blessed.Widgets.Screen): blessed.Widgets.BoxElement {
  const panel = blessed.box({
    top: 11,
    left: 0,
    width: '100%',
    height: 5,
    tags: true,
    style: {
      fg: colors.text,
    },
  });

  screen.append(panel);
  return panel;
}

export function updateJobProgress(
  panel: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  job: {
    id: string | null;
    tramiteId: string | null;
    progress: number;
    message: string;
  } | null
): void {
  if (!job || !job.id) {
    panel.setContent('  {bold}Trabajo Actual:{/bold}  {gray-fg}Esperando trabajo...{/gray-fg}');
  } else {
    const progressBar = createProgressBar(job.progress);
    panel.setContent(
      `  {bold}Trabajo Actual:{/bold}  #${job.id} - Trámite ${job.tramiteId}\n` +
      `  ${progressBar} ${job.progress}% - ${job.message}`
    );
  }
  screen.render();
}

function createProgressBar(progress: number): string {
  const width = 30;
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;

  const color = progress === 100 ? 'green-fg' :
               progress > 50 ? 'blue-fg' : 'yellow-fg';

  return `{${color}}${'█'.repeat(filled)}{/${color}}${'░'.repeat(empty)}`;
}
