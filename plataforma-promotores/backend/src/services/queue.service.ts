import Bull, { Job as BullJob } from 'bull';
import redis from '../config/redis.config';
import { prisma } from '../config/database.prisma';

// Tipos de datos para los jobs
export interface PortabilityJobData {
  tramiteId: string;
  jobId?: string;
  priority?: number;
  maxRetries?: number;
}

// Cola de trabajos de portabilidad
export const portabilityQueue = new Bull<PortabilityJobData>('portability-jobs', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 segundos
    },
    removeOnComplete: {
      age: 24 * 3600, // Mantener por 24 horas
      count: 1000, // Máximo 1000 jobs completados
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Mantener fallidos por 7 días
      count: 500, // Máximo 500 jobs fallidos
    },
  },
});

// Event handlers de la cola
portabilityQueue.on('completed', (job: BullJob<PortabilityJobData>, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

portabilityQueue.on('failed', (job: BullJob<PortabilityJobData>, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

portabilityQueue.on('stalled', (job: BullJob<PortabilityJobData>) => {
  console.warn(`⚠️  Job ${job.id} stalled`);
});

/**
 * Agregar un nuevo trabajo a la cola
 */
export async function addJobToQueue(data: PortabilityJobData) {
  try {
    // Verificar que el trámite existe
    const tramite = await prisma.tramite.findUnique({
      where: { id: data.tramiteId },
    });

    if (!tramite) {
      throw new Error(`Trámite ${data.tramiteId} not found`);
    }

    // Crear registro en base de datos
    const job = await prisma.job.create({
      data: {
        tramiteId: data.tramiteId,
        status: 'WAITING',
        priority: data.priority || 0,
        maxRetries: data.maxRetries || 3,
      },
      include: {
        tramite: true,
      },
    });

    // Agregar a la cola de Bull
    const bullJob = await portabilityQueue.add(
      'process-portability',
      {
        tramiteId: data.tramiteId,
        jobId: job.id,
      },
      {
        jobId: job.id, // Usar el mismo ID que en BD
        priority: data.priority || 0,
        attempts: data.maxRetries || 3,
      }
    );

    console.log(`📋 Job ${job.id} added to queue for tramite ${data.tramiteId}`);

    return job;
  } catch (error) {
    console.error('Error adding job to queue:', error);
    throw error;
  }
}

/**
 * Agregar múltiples trabajos a la cola
 */
export async function addBulkJobsToQueue(tramitesIds: string[]) {
  const jobs = await Promise.allSettled(
    tramitesIds.map((id) => addJobToQueue({ tramiteId: id }))
  );

  const successful = jobs.filter((j) => j.status === 'fulfilled').length;
  const failed = jobs.filter((j) => j.status === 'rejected').length;

  console.log(`📦 Bulk add: ${successful} successful, ${failed} failed`);

  return { successful, failed };
}

/**
 * Obtener siguiente trabajo pendiente para un worker
 */
export async function getNextPendingJob(workerId?: string) {
  try {
    const job = await prisma.job.findFirst({
      where: {
        status: 'WAITING',
        // Opcional: filtrar por prioridad
        retryCount: {
          lt: prisma.job.fields.maxRetries,
        },
      },
      include: {
        tramite: true,
      },
      orderBy: [
        { priority: 'desc' }, // Mayor prioridad primero
        { createdAt: 'asc' }, // Antigüedad como segundo criterio
      ],
    });

    if (!job) {
      return null;
    }

    // Si se proporciona workerId, asignar el trabajo
    if (workerId) {
      return await assignJobToWorker(job.id, workerId);
    }

    return job;
  } catch (error) {
    console.error('Error getting next pending job:', error);
    throw error;
  }
}

/**
 * Asignar un trabajo a un worker
 */
export async function assignJobToWorker(jobId: string, workerId: string) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'ASSIGNED',
        workerId,
        assignedAt: new Date(),
      },
      include: {
        tramite: true,
        worker: true,
      },
    });

    // Actualizar estado del worker a BUSY
    await prisma.worker.update({
      where: { id: workerId },
      data: { status: 'BUSY' },
    });

    console.log(`👷 Job ${jobId} assigned to worker ${workerId}`);

    return job;
  } catch (error) {
    console.error('Error assigning job to worker:', error);
    throw error;
  }
}

/**
 * Marcar trabajo como iniciado (en procesamiento)
 */
export async function startJob(jobId: string) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    // Actualizar estado del trámite
    await prisma.tramite.update({
      where: { id: job.tramiteId },
      data: { estado: 'PROCESANDO' },
    });

    console.log(`▶️  Job ${jobId} started processing`);

    return job;
  } catch (error) {
    console.error('Error starting job:', error);
    throw error;
  }
}

/**
 * Completar un trabajo exitosamente
 */
export async function completeJob(jobId: string, folioId: string, workerLogs?: string[]) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        folioId,
      },
      include: {
        worker: true,
      },
    });

    // Actualizar estado del trámite
    await prisma.tramite.update({
      where: { id: job.tramiteId },
      data: {
        estado: 'COMPLETADO',
        resultado: `Portabilidad completada. FolioID: ${folioId}`,
        fechaProcesamiento: new Date(),
      },
    });

    // Actualizar BotLog y liberar dispositivo
    await updateBotLogAndDevice(job.tramiteId, 'EXITOSO', workerLogs);

    // Actualizar estado del worker a ONLINE
    if (job.workerId) {
      await prisma.worker.update({
        where: { id: job.workerId },
        data: { status: 'ONLINE' },
      });
    }

    console.log(`✅ Job ${jobId} completed with FolioID: ${folioId}`);

    return job;
  } catch (error) {
    console.error('Error completing job:', error);
    throw error;
  }
}

/**
 * Marcar trabajo como fallido
 */
export async function failJob(jobId: string, errorMessage: string, workerLogs?: string[]) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    let updateData: any = {
      errorMessage,
      completedAt: new Date(),
    };

    // Si aún tenemos reintentos, volver a WAITING
    if (job.retryCount < job.maxRetries) {
      updateData.status = 'WAITING';
      updateData.retryCount = { increment: 1 };
      updateData.workerId = null; // Desasignar worker
      updateData.assignedAt = null;
    } else {
      // Máximo de reintentos alcanzado
      updateData.status = 'FAILED';
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        worker: true,
      },
    });

    // Actualizar estado del trámite si no hay más reintentos
    if (updatedJob.status === 'FAILED') {
      await prisma.tramite.update({
        where: { id: updatedJob.tramiteId },
        data: {
          estado: 'ERROR',
          resultado: `Error: ${errorMessage}`,
        },
      });
    }

    // Actualizar BotLog y liberar dispositivo
    await updateBotLogAndDevice(job.tramiteId, 'FALLIDO', workerLogs, errorMessage);

    // Actualizar estado del worker
    if (updatedJob.workerId) {
      await prisma.worker.update({
        where: { id: updatedJob.workerId },
        data: { status: 'ONLINE' },
      });
    }

    console.log(
      `❌ Job ${jobId} failed: ${errorMessage} (${updatedJob.retryCount}/${updatedJob.maxRetries} retries)`
    );

    return updatedJob;
  } catch (error) {
    console.error('Error failing job:', error);
    throw error;
  }
}

/**
 * Cancelar un trabajo
 */
export async function cancelJob(jobId: string) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
      include: {
        worker: true,
      },
    });

    // Actualizar estado del trámite
    await prisma.tramite.update({
      where: { id: job.tramiteId },
      data: { estado: 'CANCELADO' },
    });

    // Actualizar estado del worker
    if (job.workerId) {
      await prisma.worker.update({
        where: { id: job.workerId },
        data: { status: 'ONLINE' },
      });
    }

    // Remover de la cola de Bull
    const bullJob = await portabilityQueue.getJob(jobId);
    if (bullJob) {
      await bullJob.remove();
    }

    console.log(`🚫 Job ${jobId} cancelled`);

    return job;
  } catch (error) {
    console.error('Error cancelling job:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de la cola
 */
export async function getQueueStats() {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      prisma.job.count({ where: { status: 'WAITING' } }),
      prisma.job.count({ where: { status: 'PROCESSING' } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    throw error;
  }
}

/**
 * Limpiar trabajos completados antiguos
 */
export async function cleanOldJobs(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 días por defecto
  try {
    const cutoffDate = new Date(Date.now() - maxAge);

    const deleted = await prisma.job.deleteMany({
      where: {
        status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
        completedAt: { lte: cutoffDate },
      },
    });

    console.log(`🧹 Cleaned ${deleted.count} old jobs`);

    return deleted.count;
  } catch (error) {
    console.error('Error cleaning old jobs:', error);
    throw error;
  }
}

/**
 * Actualizar BotLog y liberar dispositivo asociado a un trámite
 */
async function updateBotLogAndDevice(
  tramiteId: string,
  estado: 'EXITOSO' | 'FALLIDO',
  workerLogs?: string[],
  errorMessage?: string
) {
  try {
    const botLog = await prisma.botLog.findFirst({
      where: { idTramite: tramiteId },
      orderBy: { fechaInicio: 'desc' },
    });

    if (!botLog) {
      console.warn(`⚠️  No se encontró BotLog para trámite ${tramiteId}`);
      return;
    }

    const updateData: any = {
      estado,
      fechaFin: new Date(),
    };

    if (workerLogs && workerLogs.length > 0) {
      updateData.logs = [...(botLog.logs || []), ...workerLogs.map(
        log => `[${new Date().toISOString()}] [WORKER] ${log}`
      )];
    }

    if (errorMessage) {
      updateData.error = errorMessage;
    }

    await prisma.botLog.update({
      where: { id: botLog.id },
      data: updateData,
    });

    // Liberar dispositivo
    await prisma.device.update({
      where: { id: botLog.idDevice },
      data: { status: 'AVAILABLE' },
    });
  } catch (error) {
    console.error(`Error updating BotLog/Device for tramite ${tramiteId}:`, error);
  }
}

export default portabilityQueue;
