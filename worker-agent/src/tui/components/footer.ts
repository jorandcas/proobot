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
  let shortcuts = '';

  switch (currentScreen) {
    case 'dashboard':
      shortcuts = '←→Cambiar pantalla  F5:Reiniciar worker  R:Reconectar dispositivo  Q:Salir';
      break;
    case 'config':
      shortcuts = 'Enter:Editar  Tab:Navegar  S:Guardar  Esc:Volver al dashboard';
      break;
    case 'history':
      shortcuts = '↑↓Navegar  Enter:Ver detalles  R:Reintentar  Esc:Volver al dashboard';
      break;
  }

  footer.setContent(`  ${shortcuts}`);
  screen.render();
}
