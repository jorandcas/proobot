import blessed from 'blessed';
import { colors } from '../utils/colors';
import { DeviceInfo } from '../types';
import { AdbHelper } from '../utils/adb-helper';

export function createDevicePanel(screen: blessed.Widgets.Screen): blessed.Widgets.BoxElement {
  const panel = blessed.box({
    top: 3,
    left: 0,
    width: '100%',
    height: 8,
    tags: true,
    border: {
      type: 'line',
    },
    style: {
      border: {
        fg: colors.border,
      },
    },
    label: ' {bold} Dispositivos Conectados {/bold} ',
  });

  screen.append(panel);
  return panel;
}

export async function updateDevicePanel(
  panel: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen
): Promise<DeviceInfo[]> {
  try {
    const devices = await AdbHelper.listDevices();

    if (devices.length === 0) {
      panel.setContent(
        '  {red-fg}️ No se detectaron dispositivos Android{/red-fg}\n' +
        '  Conecta un dispositivo por USB y presiona {yellow-fg}F5{/yellow-fg} para reconectar'
      );
    } else {
      let content = '';
      for (let i = 0; i < devices.length; i++) {
        const device = devices[i];
        const statusIcon = device.status === 'connected' ? '{green-fg}🟢{/green-fg}' :
                          device.status === 'unauthorized' ? '{yellow-fg}🟡{/yellow-fg}' :
                          '{red-fg}🔴{/red-fg}';
        const batteryText = device.battery ? `${device.battery}%` : 'N/A';
        content += `  [${i + 1}] ${statusIcon} ${device.name} (${device.id})  Batería: ${batteryText}\n`;
      }
      panel.setContent(content.trim());
    }

    screen.render();
    return devices;
  } catch (error) {
    panel.setContent(`  {red-fg}Error al listar dispositivos: ${error}{/red-fg}`);
    screen.render();
    return [];
  }
}
