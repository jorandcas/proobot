import blessed from 'blessed';
import { colors } from '../utils/colors';

export function createFooter(screen: blessed.Widgets.Screen): blessed.Widgets.BoxElement {
  const footer = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    tags: true,
    style: {
      bg: colors.footer,
      fg: colors.text,
    },
  });

  screen.append(footer);
  updateFooter(footer, screen, 'dashboard');
  return footer;
}

export function updateFooter(
  footer: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  currentScreen: string
): void {
  const termWidth = screen.cols;
  let shortcuts = '';

  switch (currentScreen) {
    case 'dashboard':
      shortcuts = '←→Pantallas  F5:Reiniciar  R:Reconectar  Q:Salir';
      break;
    case 'config':
      shortcuts = 'Enter:Editar  Tab:Navegar  S:Guardar  Esc:Volver';
      break;
    case 'history':
      shortcuts = '↑↓Navegar  Enter:Detalles  R:Reintentar  Esc:Volver';
      break;
  }

  // Truncar si es necesario
  if (shortcuts.length > termWidth - 4) {
    shortcuts = shortcuts.substring(0, termWidth - 7) + '...';
  }

  footer.setContent(`  ${shortcuts}`);
  screen.render();
}
