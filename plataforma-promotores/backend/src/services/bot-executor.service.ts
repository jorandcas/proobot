import { botLogModel } from '../models/botLog.model';
import { devicePoolService } from './device-pool.service';
import { addJobToQueue } from './queue.service';
import { Tramite } from '../types';

interface BotExecutionResult {
  success: boolean;
  error?: string;
  logs?: string[];
  jobId?: string;
}

export class BotExecutorService {
  async executeTramite(tramite: Tramite): Promise<BotExecutionResult> {
    const device = await devicePoolService.getAvailableDevice();

    if (!device) {
      return {
        success: false,
        error: 'No hay dispositivos disponibles',
      };
    }

    await devicePoolService.markDeviceBusy(device.id);

    const botLog = await botLogModel.create({
      idTramite: tramite.id,
      idDevice: device.id,
    });

    try {
      await botLogModel.addLog(botLog.id, `Iniciando procesamiento del trámite ${tramite.id}`);
      await botLogModel.addLog(botLog.id, `DN: ${tramite.dn}, Cliente: ${tramite.nombre} ${tramite.apellidoPaterno}`);
      await botLogModel.addLog(botLog.id, `Device: ${device.name} (${device.udid})`);
      await botLogModel.addLog(botLog.id, `Agregando trabajo a la cola de procesamiento...`);

      const job = await addJobToQueue({
        tramiteId: tramite.id,
      });

      await botLogModel.addLog(botLog.id, `Trabajo creado en cola (ID: ${job.id}). El worker agent lo recogerá automáticamente.`);

      return {
        success: true,
        jobId: job.id,
        logs: (await botLogModel.findById(botLog.id))?.logs || [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      await botLogModel.markAsFailed(botLog.id, errorMessage);
      await devicePoolService.markDeviceAvailable(device.id);

      return {
        success: false,
        error: errorMessage,
        logs: (await botLogModel.findById(botLog.id))?.logs || [],
      };
    }
  }

  async executeBatch(
    tramites: Tramite[],
    onProgress?: (current: number, total: number, tramite: Tramite, botLogs?: string[]) => void
  ): Promise<{
    success: number;
    errors: number;
    results: Array<{ tramiteId: string; success: boolean; error?: string; botLogId?: string; jobId?: string }>;
  }> {
    const results = [];
    let success = 0;
    let errors = 0;

    for (let i = 0; i < tramites.length; i++) {
      const tramite = tramites[i];
      const result = await this.executeTramite(tramite);

      const botLogs = await botLogModel.getByTramiteId(tramite.id);
      const botLogId = botLogs.length > 0 ? botLogs[0].id : undefined;
      const logMessages = botLogs.length > 0 ? botLogs[0].logs : [];

      results.push({
        tramiteId: tramite.id,
        success: result.success,
        error: result.error,
        botLogId,
        jobId: result.jobId,
      });

      if (result.success) {
        success++;
      } else {
        errors++;
      }

      if (onProgress) {
        onProgress(i + 1, tramites.length, tramite, logMessages);
      }
    }

    return {
      success,
      errors,
      results,
    };
  }

}

export const botExecutorService = new BotExecutorService();
