import blessed from 'blessed';
import { createDashboardScreen, getDashboard } from './screens/dashboard-screen';
import { createConfigScreen, getConfigScreen } from './screens/config-screen';
import { createHistoryScreen, getHistoryScreen } from './screens/history-screen';
import { ScreenType } from './types';
import { workerEvents } from '../events/worker-events';
import { addJobToHistory } from './screens/history-screen';

let currentScreen: ScreenType = 'dashboard';
let dashboardScreen: blessed.Widgets.Screen | null = null;
let configScreenInstance: blessed.Widgets.Screen | null = null;
let historyScreenInstance: blessed.Widgets.Screen | null = null;

export function startTUI(): void {
  // Crear pantalla principal (dashboard)
  dashboardScreen = createDashboardScreen();

  // Escuchar eventos para actualizar historial
  workerEvents.on('job:completed', (data) => {
    addJobToHistory({
      id: data.jobId,
      tramiteId: '',
      status: 'completed',
      timestamp: new Date(),
      folioId: data.folioId,
    });
  });

  workerEvents.on('job:failed', (data) => {
    addJobToHistory({
      id: data.jobId,
      tramiteId: '',
      status: 'failed',
      timestamp: new Date(),
      error: data.error,
    });
  });

  // Manejar navegación entre pantallas
  if (dashboardScreen) {
    dashboardScreen.key('right', () => {
      switchToScreen('config');
    });

    dashboardScreen.key('left', () => {
      switchToScreen('history');
    });
  }

  console.log('TUI iniciada correctamente');
}

function switchToScreen(screenType: ScreenType): void {
  // Destruir pantalla actual si existe
  if (currentScreen === 'dashboard' && dashboardScreen) {
    // No destruir el dashboard, solo ocultar
  }

  switch (screenType) {
    case 'config':
      if (!configScreenInstance) {
        configScreenInstance = createConfigScreen(dashboardScreen!);
        configScreenInstance.key('escape', () => {
          configScreenInstance?.destroy();
          configScreenInstance = null;
          currentScreen = 'dashboard';
          dashboardScreen?.render();
        });
      }
      break;

    case 'history':
      if (!historyScreenInstance) {
        historyScreenInstance = createHistoryScreen(dashboardScreen!);
        historyScreenInstance.key('escape', () => {
          historyScreenInstance?.destroy();
          historyScreenInstance = null;
          currentScreen = 'dashboard';
          dashboardScreen?.render();
        });
      }
      break;

    case 'dashboard':
      // Volver al dashboard
      if (configScreenInstance) {
        configScreenInstance.destroy();
        configScreenInstance = null;
      }
      if (historyScreenInstance) {
        historyScreenInstance.destroy();
        historyScreenInstance = null;
      }
      break;
  }

  currentScreen = screenType;
}

export function getCurrentScreen(): ScreenType {
  return currentScreen;
}

export function refreshCurrentScreen(): void {
  switch (currentScreen) {
    case 'dashboard':
      dashboardScreen?.render();
      break;
    case 'config':
      configScreenInstance?.render();
      break;
    case 'history':
      historyScreenInstance?.render();
      break;
  }
}
