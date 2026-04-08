import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Datos para crear evidencia de un job
 */
export interface CreateEvidenceData {
  jobId: string;
  logs?: string[];
  screenshots?: string[];
  videoPath?: string;
  metadata?: any;
}

/**
 * Directorio base para almacenar evidencias
 */
const EVIDENCE_BASE_DIR = process.env.EVIDENCE_PATH || './uploads/evidence';
const EVIDENCE_URL_PREFIX = process.env.EVIDENCE_URL_PREFIX || '/evidence';

/**
 * Crear registro de evidencia para un job
 */
export async function createEvidence(data: CreateEvidenceData) {
  try {
    // Verificar que el job existe
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
    });

    if (!job) {
      throw new Error(`Job ${data.jobId} not found`);
    }

    // Crear directorio para el job si no existe
    const jobDir = path.join(EVIDENCE_BASE_DIR, data.jobId);
    await fs.mkdir(jobDir, { recursive: true });

    // Guardar logs en archivo
    let logsPath = null;
    if (data.logs && data.logs.length > 0) {
      logsPath = path.join(jobDir, 'logs.txt');
      await fs.writeFile(logsPath, data.logs.join('\n'), 'utf-8');
    }

    // Crear registro de evidencia
    const evidence = await prisma.jobEvidence.create({
      data: {
        jobId: data.jobId,
        logsPath: logsPath ? path.relative(EVIDENCE_BASE_DIR, logsPath) : null,
        screenshots: data.screenshots || [],
        videoPath: data.videoPath || null,
        metadata: data.metadata || {},
      },
    });

    console.log(`📸 Evidence created for job ${data.jobId}`);

    return evidence;
  } catch (error) {
    console.error('Error creating evidence:', error);
    throw error;
  }
}

/**
 * Obtener evidencia de un job
 */
export async function getEvidence(jobId: string) {
  try {
    const evidence = await prisma.jobEvidence.findUnique({
      where: { jobId },
      include: {
        job: {
          include: {
            tramite: true,
            worker: true,
          },
        },
      },
    });

    if (!evidence) {
      throw new Error(`Evidence for job ${jobId} not found`);
    }

    return evidence;
  } catch (error) {
    console.error(`Error getting evidence for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Leer logs de un job
 */
export async function getJobLogs(jobId: string) {
  try {
    const evidence = await prisma.jobEvidence.findUnique({
      where: { jobId },
    });

    if (!evidence || !evidence.logsPath) {
      return null;
    }

    const logsFullPath = path.join(EVIDENCE_BASE_DIR, evidence.logsPath);
    const logsContent = await fs.readFile(logsFullPath, 'utf-8');

    return logsContent;
  } catch (error) {
    console.error(`Error reading logs for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Agregar screenshot a la evidencia
 */
export async function addScreenshot(jobId: string, screenshotPath: string) {
  try {
    const evidence = await prisma.jobEvidence.findUnique({
      where: { jobId },
    });

    if (!evidence) {
      // Crear evidencia si no existe
      return await createEvidence({
        jobId,
        screenshots: [screenshotPath],
      });
    }

    // Agregar screenshot al array existente
    const updated = await prisma.jobEvidence.update({
      where: { jobId },
      data: {
        screenshots: [...evidence.screenshots, screenshotPath],
      },
    });

    console.log(`📸 Screenshot added to job ${jobId}`);

    return updated;
  } catch (error) {
    console.error(`Error adding screenshot to job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Actualizar metadata de evidencia
 */
export async function updateEvidenceMetadata(jobId: string, metadata: any) {
  try {
    const evidence = await prisma.jobEvidence.findUnique({
      where: { jobId },
    });

    if (!evidence) {
      throw new Error(`Evidence for job ${jobId} not found`);
    }

    const updated = await prisma.jobEvidence.update({
      where: { jobId },
      data: {
        metadata: {
          ...(evidence.metadata as any),
          ...metadata,
        },
      },
    });

    return updated;
  } catch (error) {
    console.error(`Error updating metadata for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Eliminar evidencia de un job
 */
export async function deleteEvidence(jobId: string) {
  try {
    // Obtener evidencia
    const evidence = await prisma.jobEvidence.findUnique({
      where: { jobId },
    });

    if (!evidence) {
      throw new Error(`Evidence for job ${jobId} not found`);
    }

    // Eliminar archivos del sistema de archivos
    const jobDir = path.join(EVIDENCE_BASE_DIR, jobId);
    try {
      await fs.rm(jobDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Could not delete evidence files for job ${jobId}:`, err);
    }

    // Eliminar registro de base de datos
    await prisma.jobEvidence.delete({
      where: { jobId },
    });

    console.log(`🗑️  Evidence deleted for job ${jobId}`);

    return { message: 'Evidence deleted successfully' };
  } catch (error) {
    console.error(`Error deleting evidence for job ${jobId}:`, error);
    throw error;
  }
}

/**
 * Limpiar evidencias antiguas
 */
export async function cleanOldEvidence(maxAge = 7 * 24 * 60 * 60 * 1000) {
  // 7 días por defecto
  try {
    const cutoffDate = new Date(Date.now() - maxAge);

    // Obtener evidencias antiguas con jobs completados/fallidos
    const oldEvidences = await prisma.jobEvidence.findMany({
      where: {
        job: {
          completedAt: { lte: cutoffDate },
          status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
        },
      },
    });

    let deletedCount = 0;

    for (const evidence of oldEvidences) {
      try {
        const jobDir = path.join(EVIDENCE_BASE_DIR, evidence.jobId);
        await fs.rm(jobDir, { recursive: true, force: true });
        deletedCount++;
      } catch (err) {
        console.warn(`Could not delete evidence files for job ${evidence.jobId}:`, err);
      }
    }

    // Eliminar registros de base de datos
    await prisma.jobEvidence.deleteMany({
      where: {
        job: {
          completedAt: { lte: cutoffDate },
          status: { in: ['COMPLETED', 'FAILED', 'CANCELLED'] },
        },
      },
    });

    console.log(`🧹 Cleaned ${deletedCount} old evidence folders`);

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning old evidence:', error);
    throw error;
  }
}

/**
 * Guardar archivo subido (screenshot, video, etc)
 */
export async function saveUploadedFile(
  jobId: string,
  file: Express.Multer.File,
  fileType: 'screenshot' | 'video'
) {
  try {
    // Crear directorio del job si no existe
    const jobDir = path.join(EVIDENCE_BASE_DIR, jobId);
    await fs.mkdir(jobDir, { recursive: true });

    // Generar nombre único
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${fileType}-${timestamp}${ext}`;
    const filepath = path.join(jobDir, filename);

    // Guardar archivo
    await fs.writeFile(filepath, file.buffer);

    // Retornar ruta relativa y URL
    const relativePath = path.join(jobId, filename);
    const url = `${EVIDENCE_URL_PREFIX}/${relativePath}`;

    console.log(`📁 File saved: ${filepath}`);

    return {
      path: relativePath,
      url,
      type: fileType,
    };
  } catch (error) {
    console.error('Error saving uploaded file:', error);
    throw error;
  }
}
