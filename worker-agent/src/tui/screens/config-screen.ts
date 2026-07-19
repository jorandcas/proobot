import blessed from 'blessed';
import fs from 'fs';
import path from 'path';
import { colors } from '../utils/colors';
import { ConfigData } from '../types';
import { workerEvents } from '../../events/worker-events';
import config from '../../config/env';
import { AdbHelper } from '../utils/adb-helper';
import { addLogToDashboard } from './dashboard-screen';

let configScreen: blessed.Widgets.Screen | null = null;
let configData: ConfigData;

export function createConfigScreen(parentScreen: blessed.Widgets.Screen): blessed.Widgets.Screen {
  configData = loadConfig();

  const screen = blessed.screen({
    smartCSR: true,
    fullUnicode: true,
    title: 'Proobot Worker - Configuración',
    dockBorders: true,
  });

  const form = blessed.form({
    top: 2,
    left: 0,
    width: '100%',
    height: '90%',
    keys: true,
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: colors.border,
      },
    },
    label: ' {bold} Configuración del Worker {/bold} ',
  });

  screen.append(form);

  // Campos del formulario
  const fields = createFormFields(form, screen);

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
  updateButtonBar(buttonBar, screen);

  // Manejar teclas
  screen.key(['escape', 'C-c'], () => {
    screen.destroy();
    configScreen = null;
    parentScreen.render();
  });

  screen.key('s', () => {
    saveConfig(configData);
    addLogToDashboard('info', 'Configuración guardada correctamente');
    showNotification(screen, 'Configuración guardada correctamente', 'success');
  });

  screen.key('f5', async () => {
    addLogToDashboard('info', 'Reconectando dispositivos ADB...');
    const success = await AdbHelper.restartAdb();
    addLogToDashboard(success ? 'info' : 'error', success ? 'ADB reiniciado' : 'Error al reiniciar ADB');
    showNotification(screen, success ? 'ADB reiniciado correctamente' : 'Error al reiniciar ADB', success ? 'success' : 'error');
  });

  screen.render();
  configScreen = screen;
  return screen;
}

function createFormFields(form: blessed.Widgets.FormElement, screen: blessed.Widgets.Screen) {
  const startY = 2;
  const labelWidth = 25;
  const fieldWidth = 50;
  let currentY = startY;

  // Nombre del Worker
  const lblNombre = blessed.text({
    top: currentY,
    left: 2,
    width: labelWidth,
    content: 'Nombre del Worker:',
    tags: true,
  });
  form.append(lblNombre);

  const txtNombre = blessed.textbox({
    top: currentY,
    left: labelWidth + 3,
    width: fieldWidth,
    height: 1,
    content: configData.workerName,
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: colors.border } },
    inputOnFocus: true,
  });
  form.append(txtNombre);
  txtNombre.on('submit', (val: string) => { configData.workerName = val; });
  currentY += 3;

  // Ubicación
  const lblUbicacion = blessed.text({
    top: currentY,
    left: 2,
    width: labelWidth,
    content: 'Ubicación:',
    tags: true,
  });
  form.append(lblUbicacion);

  const txtUbicacion = blessed.textbox({
    top: currentY,
    left: labelWidth + 3,
    width: fieldWidth,
    height: 1,
    content: configData.workerLocation,
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: colors.border } },
    inputOnFocus: true,
  });
  form.append(txtUbicacion);
  txtUbicacion.on('submit', (val: string) => { configData.workerLocation = val; });
  currentY += 3;

  // URL del Backend
  const lblUrl = blessed.text({
    top: currentY,
    left: 2,
    width: labelWidth,
    content: 'URL del Backend:',
    tags: true,
  });
  form.append(lblUrl);

  const txtUrl = blessed.textbox({
    top: currentY,
    left: labelWidth + 3,
    width: fieldWidth,
    height: 1,
    content: configData.apiUrl,
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: colors.border } },
    inputOnFocus: true,
  });
  form.append(txtUrl);
  txtUrl.on('submit', (val: string) => { configData.apiUrl = val; });
  currentY += 3;

  // Intervalos
  const lblPoll = blessed.text({
    top: currentY,
    left: 2,
    width: labelWidth,
    content: 'Intervalo Polling (s):',
    tags: true,
  });
  form.append(lblPoll);

  const txtPoll = blessed.textbox({
    top: currentY,
    left: labelWidth + 3,
    width: 10,
    height: 1,
    content: String(configData.pollInterval / 1000),
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: colors.border } },
    inputOnFocus: true,
  });
  form.append(txtPoll);
  txtPoll.on('submit', (val: string) => { configData.pollInterval = parseInt(val) * 1000; });
  currentY += 3;

  const lblHeartbeat = blessed.text({
    top: currentY,
    left: 2,
    width: labelWidth,
    content: 'Intervalo Heartbeat (s):',
    tags: true,
  });
  form.append(lblHeartbeat);

  const txtHeartbeat = blessed.textbox({
    top: currentY,
    left: labelWidth + 3,
    width: 10,
    height: 1,
    content: String(configData.heartbeatInterval / 1000),
    tags: true,
    border: { type: 'line' },
    style: { border: { fg: colors.border } },
    inputOnFocus: true,
  });
  form.append(txtHeartbeat);
  txtHeartbeat.on('submit', (val: string) => { configData.heartbeatInterval = parseInt(val) * 1000; });
  currentY += 3;

  // Opciones (checkboxes)
  const lblOpciones = blessed.text({
    top: currentY,
    left: 2,
    content: '{bold}Opciones:{/bold}',
    tags: true,
  });
  form.append(lblOpciones);
  currentY += 2;

  const chkScreenshots = blessed.checkbox({
    top: currentY,
    left: 4,
    content: 'Capturar screenshots',
    checked: configData.screenshotsEnabled,
    tags: true,
  });
  form.append(chkScreenshots);
  chkScreenshots.on('check', () => { configData.screenshotsEnabled = true; });
  chkScreenshots.on('uncheck', () => { configData.screenshotsEnabled = false; });
  currentY += 1;

  const chkEvidence = blessed.checkbox({
    top: currentY,
    left: 4,
    content: 'Subir evidencias al backend',
    checked: configData.evidenceUploadEnabled,
    tags: true,
  });
  form.append(chkEvidence);
  chkEvidence.on('check', () => { configData.evidenceUploadEnabled = true; });
  chkEvidence.on('uncheck', () => { configData.evidenceUploadEnabled = false; });
  currentY += 1;

  const chkVideo = blessed.checkbox({
    top: currentY,
    left: 4,
    content: 'Grabar video',
    checked: configData.videoRecording,
    tags: true,
  });
  form.append(chkVideo);
  chkVideo.on('check', () => { configData.videoRecording = true; });
  chkVideo.on('uncheck', () => { configData.videoRecording = false; });
  currentY += 1;

  const chkKiosk = blessed.checkbox({
    top: currentY,
    left: 4,
    content: 'Modo Kiosko (auto-reinicio)',
    checked: configData.kioskMode,
    tags: true,
  });
  form.append(chkKiosk);
  chkKiosk.on('check', () => { configData.kioskMode = true; });
  chkKiosk.on('uncheck', () => { configData.kioskMode = false; });
  currentY += 3;

  // Acciones
  const lblAcciones = blessed.text({
    top: currentY,
    left: 2,
    content: '{bold}Acciones:{/bold}',
    tags: true,
  });
  form.append(lblAcciones);
  currentY += 2;

  const btnReconnect = blessed.button({
    top: currentY,
    left: 4,
    content: ' Reconectar Dispositivo ',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.primary },
      focus: { border: { fg: colors.success } },
    },
  });
  form.append(btnReconnect);
  btnReconnect.on('press', async () => {
    addLogToDashboard('info', 'Reconectando dispositivos ADB...');
    const success = await AdbHelper.restartAdb();
    addLogToDashboard(success ? 'info' : 'error', success ? 'ADB reiniciado' : 'Error al reiniciar ADB');
    showNotification(screen, success ? 'ADB reiniciado correctamente' : 'Error al reiniciar ADB', success ? 'success' : 'error');
  });
  currentY += 2;

  const btnClean = blessed.button({
    top: currentY,
    left: 4,
    content: ' Limpiar Evidencias ',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.warning },
      focus: { border: { fg: colors.success } },
    },
  });
  form.append(btnClean);
  btnClean.on('press', () => {
    const evidencePath = path.join(process.cwd(), './evidence');
    if (fs.existsSync(evidencePath)) {
      fs.rmSync(evidencePath, { recursive: true, force: true });
      fs.mkdirSync(evidencePath, { recursive: true });
    }
    addLogToDashboard('info', 'Evidencias limpiadas correctamente');
    showNotification(screen, 'Evidencias limpiadas correctamente', 'success');
  });
  currentY += 2;

  const btnReregister = blessed.button({
    top: currentY,
    left: 4,
    content: ' Re-registrar Worker ',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: colors.error },
      focus: { border: { fg: colors.success } },
    },
  });
  form.append(btnReregister);
  btnReregister.on('press', () => {
    // Eliminar API key para forzar re-registro
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf-8');
      content = content.replace(/API_KEY=.*/g, 'API_KEY=""');
      fs.writeFileSync(envPath, content);
    }
    addLogToDashboard('warn', 'Worker re-registrado. Reinicia el worker para aplicar cambios.');
    showNotification(screen, 'Worker re-registrado. Reinicia para aplicar cambios.', 'warning');
  });

  screen.render();
}

function updateButtonBar(buttonBar: blessed.Widgets.BoxElement, screen: blessed.Widgets.Screen): void {
  buttonBar.setContent('  Enter:Editar campo  Tab:Navegar  S:Guardar  Esc:Volver al dashboard  F5:Reconectar ADB');
  screen.render();
}

function loadConfig(): ConfigData {
  return {
    workerName: config.workerName,
    workerLocation: config.workerLocation,
    apiUrl: config.apiUrl,
    pollInterval: config.pollInterval,
    heartbeatInterval: config.heartbeatInterval,
    botTimeout: config.botTimeout,
    screenshotsEnabled: config.screenshotsEnabled,
    evidenceUploadEnabled: config.evidenceUploadEnabled,
    videoRecording: config.videoRecording,
    kioskMode: process.env.KIOSK_MODE === 'true',
    logLevel: config.logLevel,
  };
}

function saveConfig(data: ConfigData): void {
  const envPath = path.join(process.cwd(), '.env');
  let content = '';

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
  }

  // Actualizar o agregar variables
  const updates: Record<string, string> = {
    WORKER_NAME: data.workerName,
    WORKER_LOCATION: data.workerLocation,
    API_URL: data.apiUrl,
    POLL_INTERVAL: String(data.pollInterval),
    HEARTBEAT_INTERVAL: String(data.heartbeatInterval),
    BOT_TIMEOUT: String(data.botTimeout),
    SCREENSHOTS_ENABLED: String(data.screenshotsEnabled),
    EVIDENCE_UPLOAD_ENABLED: String(data.evidenceUploadEnabled),
    VIDEO_RECORDING: String(data.videoRecording),
    KIOSK_MODE: String(data.kioskMode),
    LOG_LEVEL: data.logLevel,
  };

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}="${value}"`);
    } else {
      content += `\n${key}="${value}"`;
    }
  }

  fs.writeFileSync(envPath, content.trim());
  workerEvents.emit('config:changed', 'all', data);
}

function showNotification(screen: blessed.Widgets.Screen, message: string, type: 'success' | 'error' | 'warning'): void {
  const colorMap = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
  };

  const iconMap = {
    success: '✅',
    error: '',
    warning: '⚠️',
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

export function getConfigScreen(): blessed.Widgets.Screen | null {
  return configScreen;
}
