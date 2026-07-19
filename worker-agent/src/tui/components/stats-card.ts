import blessed from 'blessed';
import { colors } from '../utils/colors';

export function createStatsPanel(screen: blessed.Widgets.Screen): blessed.Widgets.BoxElement {
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

export function updateStatsPanel(
  panel: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  stats: {
    completed: number;
    failed: number;
    successRate: number;
  }
): void {
  const successColor = stats.successRate >= 80 ? 'green-fg' :
                      stats.successRate >= 50 ? 'yellow-fg' : 'red-fg';

  panel.setContent(
    `  {bold} Resumen del Día:{/bold}  {green-fg}✅ ${stats.completed} completados{/green-fg}  {red-fg}❌ ${stats.failed} errores{/red-fg}  {${successColor}}📊 ${stats.successRate}% éxito{/${successColor}}`
  );
  screen.render();
}
