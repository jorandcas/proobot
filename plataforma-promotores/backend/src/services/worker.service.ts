import { WorkerStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import { prisma } from '../config/database.prisma';

/**
 * Datos para registrar un nuevo worker
 */
export interface RegisterWorkerData {
  name: string;
  location: string;
  deviceId?: string;
  ip?: string;
}

/**
 * Respuesta de registro de worker
 */
export interface WorkerRegistrationResponse {
  worker: {
    id: string;
    name: string;
    location: string;
    status: string;
    apiKey: string;
    createdAt: Date;
  };
  message: string;
}

/**
 * Registrar un nuevo worker
 */
export async function registerWorker(data: RegisterWorkerData): Promise<WorkerRegistrationResponse> {
  try {
    // Generar API key única para el worker
    const apiKey = `worker_${nanoid(32)}`;

    // Verificar si el dispositivo ya existe y está asignado a otro worker
    if (data.deviceId) {
      const existingWorker = await prisma.worker.findFirst({
        where: {
          deviceId: data.deviceId,
          status: { not: 'OFFLINE' },
        },
      });

      if (existingWorker) {
        throw new Error(
          `Device ${data.deviceId} is already assigned to worker ${existingWorker.name}`
        );
      }
    }

    // Crear el worker
    const worker = await prisma.worker.create({
      data: {
        name: data.name,
        location: data.location,
        deviceId: data.deviceId,
        ip: data.ip,
        apiKey,
        status: 'ONLINE',
        lastHeartbeat: new Date(),
      },
    });

    console.log(`✅ Worker registered: ${worker.name} (${worker.id}) at ${worker.location}`);

    return {
      worker: {
        id: worker.id,
        name: worker.name,
        location: worker.location,
        status: worker.status,
        apiKey: worker.apiKey!,
        createdAt: worker.createdAt,
      },
      message: 'Worker registered successfully',
    };
  } catch (error) {
    console.error('Error registering worker:', error);
    throw error;
  }
}

/**
 * Actualizar heartbeat de un worker
 */
export async function updateHeartbeat(workerId: string, ip?: string) {
  try {
    const worker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        lastHeartbeat: new Date(),
        ip: ip || undefined,
      },
    });

    // Si el worker estaba OFFLINE o ERROR, cambiarlo a ONLINE
    if (worker.status === 'OFFLINE' || worker.status === 'ERROR') {
      await prisma.worker.update({
        where: { id: workerId },
        data: { status: 'ONLINE' },
      });
    }

    return worker;
  } catch (error) {
    console.error(`Error updating heartbeat for worker ${workerId}:`, error);
    throw error;
  }
}

/**
 * Obtener todos los workers
 */
export async function getWorkers(status?: WorkerStatus) {
  try {
    const where = status ? { status } : {};

    const workers = await prisma.worker.findMany({
      where,
      include: {
        device: true,
        jobs: {
          where: {
            status: { in: ['PROCESSING', 'ASSIGNED'] },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastHeartbeat: 'desc' },
    });

    return workers;
  } catch (error) {
    console.error('Error getting workers:', error);
    throw error;
  }
}

/**
 * Obtener un worker por ID
 */
export async function getWorkerById(workerId: string) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        device: true,
        jobs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    return worker;
  } catch (error) {
    console.error(`Error getting worker ${workerId}:`, error);
    throw error;
  }
}

/**
 * Obtener worker por API key
 */
export async function getWorkerByApiKey(apiKey: string) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { apiKey },
      include: {
        device: true,
      },
    });

    if (!worker) {
      throw new Error('Invalid API key');
    }

    return worker;
  } catch (error) {
    console.error('Error getting worker by API key:', error);
    throw error;
  }
}

/**
 * Desconectar/marcar worker como offline
 */
export async function disconnectWorker(workerId: string) {
  try {
    const worker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        status: 'OFFLINE',
        updatedAt: new Date(),
      },
    });

    // Cancelar trabajos en procesamiento de este worker
    const { failJob } = await import('./queue.service');
    const processingJobs = await prisma.job.findMany({
      where: {
        workerId,
        status: 'PROCESSING',
      },
    });

    for (const job of processingJobs) {
      await failJob(job.id, 'Worker disconnected');
    }

    console.log(`👋 Worker ${workerId} disconnected`);

    return worker;
  } catch (error) {
    console.error(`Error disconnecting worker ${workerId}:`, error);
    throw error;
  }
}

/**
 * Marcar worker como ERROR
 */
export async function markWorkerError(workerId: string, errorMessage: string) {
  try {
    const worker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        status: 'ERROR',
        updatedAt: new Date(),
      },
    });

    // Fail trabajos en procesamiento
    const { failJob } = await import('./queue.service');
    const processingJobs = await prisma.job.findMany({
      where: {
        workerId,
        status: 'PROCESSING',
      },
    });

    for (const job of processingJobs) {
      await failJob(job.id, `Worker error: ${errorMessage}`);
    }

    console.log(`⚠️  Worker ${workerId} marked as ERROR: ${errorMessage}`);

    return worker;
  } catch (error) {
    console.error(`Error marking worker ${workerId} as ERROR:`, error);
    throw error;
  }
}

/**
 * Verificar y marcar workers offline (cron job)
 */
export async function checkOfflineWorkers(timeoutMs = 120000) {
  // 2 minutos por defecto
  try {
    const timeout = new Date(Date.now() - timeoutMs);

    const offlineWorkers = await prisma.worker.findMany({
      where: {
        status: { in: ['ONLINE', 'BUSY'] },
        lastHeartbeat: { lte: timeout },
      },
    });

    for (const worker of offlineWorkers) {
      console.log(`⚠️  Worker ${worker.name} (${worker.id}) is offline (last heartbeat: ${worker.lastHeartbeat})`);

      await prisma.worker.update({
        where: { id: worker.id },
        data: { status: 'OFFLINE' },
      });

      // Fail trabajos en procesamiento
      const { failJob } = await import('./queue.service');
      const processingJobs = await prisma.job.findMany({
        where: {
          workerId: worker.id,
          status: 'PROCESSING',
        },
      });

      for (const job of processingJobs) {
        await failJob(job.id, 'Worker went offline');
      }
    }

    return offlineWorkers.length;
  } catch (error) {
    console.error('Error checking offline workers:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de workers
 */
export async function getWorkerStats() {
  try {
    const [total, online, busy, offline, error] = await Promise.all([
      prisma.worker.count(),
      prisma.worker.count({ where: { status: 'ONLINE' } }),
      prisma.worker.count({ where: { status: 'BUSY' } }),
      prisma.worker.count({ where: { status: 'OFFLINE' } }),
      prisma.worker.count({ where: { status: 'ERROR' } }),
    ]);

    return {
      total,
      online,
      busy,
      offline,
      error,
      available: online, // Workers disponibles para tomar trabajos
    };
  } catch (error) {
    console.error('Error getting worker stats:', error);
    throw error;
  }
}

/**
 * Eliminar un worker
 */
export async function deleteWorker(workerId: string) {
  try {
    // Verificar que no tenga trabajos activos
    const activeJobs = await prisma.job.count({
      where: {
        workerId,
        status: { in: ['ASSIGNED', 'PROCESSING'] },
      },
    });

    if (activeJobs > 0) {
      throw new Error(`Cannot delete worker with ${activeJobs} active jobs`);
    }

    await prisma.worker.delete({
      where: { id: workerId },
    });

    console.log(`🗑️  Worker ${workerId} deleted`);

    return { message: 'Worker deleted successfully' };
  } catch (error) {
    console.error(`Error deleting worker ${workerId}:`, error);
    throw error;
  }
}

/**
 * Actualizar información de un worker
 */
export async function updateWorker(workerId: string, data: Partial<RegisterWorkerData>) {
  try {
    const worker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.location && { location: data.location }),
        ...(data.deviceId !== undefined && { deviceId: data.deviceId }),
        updatedAt: new Date(),
      },
    });

    console.log(`✏️  Worker ${workerId} updated`);

    return worker;
  } catch (error) {
    console.error(`Error updating worker ${workerId}:`, error);
    throw error;
  }
}
