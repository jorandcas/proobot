import { Request, Response } from 'express';
import {
  registerWorker,
  updateHeartbeat,
  getWorkers,
  getWorkerById,
  disconnectWorker,
  getWorkerStats,
  deleteWorker,
  updateWorker,
} from '../services/worker.service';
import {
  getNextPendingJob,
  startJob,
  completeJob,
  failJob,
  assignJobToWorker,
  getQueueStats,
} from '../services/queue.service';
import { createEvidence, addScreenshot, updateEvidenceMetadata } from '../services/evidence.service';

/**
 * Registrar un nuevo worker
 * POST /api/workers/register
 */
export async function registerWorkerHandler(req: Request, res: Response) {
  try {
    const { name, location, deviceId, ip } = req.body;

    // Validar datos requeridos
    if (!name || !location) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: name, location',
      });
    }

    // Obtener IP del request
    const workerIp = ip || req.ip || req.socket.remoteAddress;

    const result = await registerWorker({
      name,
      location,
      deviceId,
      ip: workerIp,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error in registerWorker:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Actualizar heartbeat del worker
 * PUT /api/workers/:id/heartbeat
 */
export async function heartbeatHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const ip = req.ip || req.socket.remoteAddress;

    const worker = await updateHeartbeat(id, ip);

    res.json({
      message: 'Heartbeat updated',
      worker: {
        id: worker.id,
        name: worker.name,
        status: worker.status,
        lastHeartbeat: worker.lastHeartbeat,
      },
    });
  } catch (error) {
    console.error('Error in heartbeatHandler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Obtener todos los workers (admin)
 * GET /api/workers
 */
export async function getWorkersHandler(req: Request, res: Response) {
  try {
    const { status } = req.query;

    const workers = await getWorkers(status as any);

    res.json({ workers });
  } catch (error) {
    console.error('Error in getWorkersHandler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Obtener un worker por ID (admin)
 * GET /api/workers/:id
 */
export async function getWorkerHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const worker = await getWorkerById(id);

    res.json({ worker });
  } catch (error) {
    console.error('Error in getWorkerHandler:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Obtener estadísticas de workers (admin)
 * GET /api/workers/stats
 */
export async function getWorkersStatsHandler(req: Request, res: Response) {
  try {
    const stats = await getWorkerStats();

    res.json({ stats });
  } catch (error) {
    console.error('Error in getWorkersStatsHandler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Desconectar worker (admin)
 * DELETE /api/workers/:id
 */
export async function deleteWorkerHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await deleteWorker(id);

    res.json(result);
  } catch (error) {
    console.error('Error in deleteWorkerHandler:', error);

    if (error instanceof Error && error.message.includes('Cannot delete worker')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Actualizar información del worker (admin)
 * PATCH /api/workers/:id
 */
export async function updateWorkerHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, location, deviceId } = req.body;

    const worker = await updateWorker(id, { name, location, deviceId });

    res.json({ worker });
  } catch (error) {
    console.error('Error in updateWorkerHandler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Obtener próximo trabajo pendiente (worker)
 * GET /api/workers/jobs/pending
 */
export async function getPendingJobHandler(req: Request, res: Response) {
  try {
    if (!req.worker) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Worker not authenticated',
      });
    }

    // Obtener y asignar próximo trabajo
    const job = await getNextPendingJob(req.worker.id);

    if (!job) {
      return res.status(204).send(); // No Content - No hay trabajos pendientes
    }

    res.json({
      job: {
        id: job.id,
        tramiteId: job.tramiteId,
        tramite: {
          dn: job.tramite.dn,
          rfc: job.tramite.rfc,
          requestId: job.tramite.requestId,
          icc: job.tramite.icc,
          nip: job.tramite.nip,
          fvcIndice: job.tramite.fvcIndice,
          fvcFecha: job.tramite.fvcFecha,
        },
        priority: job.priority,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
        assignedAt: job.assignedAt,
      },
    });
  } catch (error) {
    console.error('Error in getPendingJobHandler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Marcar trabajo como iniciado (worker)
 * POST /api/workers/jobs/:id/start
 */
export async function startJobHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar que el trabajo esté asignado a este worker
    const job = await startJob(id);

    res.json({
      message: 'Job started',
      job: {
        id: job.id,
        status: job.status,
        startedAt: job.startedAt,
      },
    });
  } catch (error) {
    console.error('Error in startJobHandler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Marcar trabajo como completado (worker)
 * POST /api/workers/jobs/:id/complete
 */
export async function completeJobHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { folioId, logs, screenshots, metadata } = req.body;

    if (!folioId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: folioId',
      });
    }

    // Completar el trabajo
    const job = await completeJob(id, folioId, logs);

    // Crear evidencia si se proporcionó
    if (logs || screenshots || metadata) {
      await createEvidence({
        jobId: id,
        logs,
        screenshots,
        metadata,
      });
    }

    res.json({
      message: 'Job completed',
      job: {
        id: job.id,
        status: job.status,
        folioId: job.folioId,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    console.error('Error in completeJobHandler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Marcar trabajo como fallido (worker)
 * POST /api/workers/jobs/:id/fail
 */
export async function failJobHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { error: errorMessage, logs, screenshots } = req.body;

    if (!errorMessage) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required field: error',
      });
    }

    // Marcar como fallido
    const job = await failJob(id, errorMessage, logs);

    // Crear evidencia si se proporcionó
    if (logs || screenshots) {
      await createEvidence({
        jobId: id,
        logs,
        screenshots,
        metadata: {
          failed: true,
          errorMessage,
        },
      });
    }

    res.json({
      message: 'Job failed',
      job: {
        id: job.id,
        status: job.status,
        errorMessage: job.errorMessage,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
      },
    });
  } catch (error) {
    console.error('Error in failJobHandler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Subir screenshot de un trabajo (worker)
 * POST /api/workers/jobs/:id/screenshots
 */
export async function uploadScreenshotHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No file uploaded',
      });
    }

    // Guardar archivo
    const { saveUploadedFile } = await import('../services/evidence.service');
    const savedFile = await saveUploadedFile(id, req.file, 'screenshot');

    // Agregar a evidencia
    await addScreenshot(id, savedFile.path);

    res.json({
      message: 'Screenshot uploaded',
      screenshot: {
        url: savedFile.url,
        path: savedFile.path,
      },
    });
  } catch (error) {
    console.error('Error in uploadScreenshotHandler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Obtener estadísticas de colas (admin)
 * GET /api/workers/queue/stats
 */
export async function getQueueStatsHandler(req: Request, res: Response) {
  try {
    const stats = await getQueueStats();

    res.json({ stats });
  } catch (error) {
    console.error('Error in getQueueStatsHandler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Health check del worker
 * GET /api/workers/health
 */
export async function healthCheckHandler(req: Request, res: Response) {
  try {
    if (!req.worker) {
      return res.json({
        status: 'ok',
        authenticated: false,
      });
    }

    res.json({
      status: 'ok',
      authenticated: true,
      worker: {
        id: req.worker.id,
        name: req.worker.name,
        status: req.worker.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
