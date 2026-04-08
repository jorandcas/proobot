import express from 'express';
import cors from 'cors';
import config from './config/env';
import { campanaModel } from './models/campana.model';
import { startWorkerMonitor } from './jobs/workerMonitor.job';

// Import routes
import authRoutes from './routes/auth.routes';
import campanasRoutes from './routes/campanas.routes';
import tramitesRoutes from './routes/tramites.routes';
import dashboardRoutes from './routes/dashboard.routes';
import botRoutes from './routes/bot.routes';
import workersRoutes from './routes/workers.routes';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Permitir todos los orígenes en desarrollo
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging mejorado con debugging móvil
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const referer = req.headers.referer || req.headers.referrer || 'direct';

  // Log detallado para debugging
  console.log('\n' + '='.repeat(60));
  console.log(`📅 [${timestamp}] PETICIÓN RECIBIDA`);
  console.log('='.repeat(60));
  console.log(`🔗 ${req.method} ${req.path}`);
  console.log(`📱 Cliente IP: ${clientIP}`);
  console.log(`🌐 User-Agent: ${userAgent}`);

  // Detectar si es un dispositivo móvil
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  if (isMobile) {
    console.log(`📱 DISPOSITIVO MÓVIL DETECTADO`);
  }

  // Log de headers importantes
  if (req.headers.authorization) {
    console.log(`🔑 Auth: ${req.headers.authorization.substring(0, 20)}...`);
  }
  if (referer && referer !== 'direct') {
    console.log(`🔗 Referer: ${referer}`);
  }

  // Log del body si existe (solo para POST/PUT)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = { ...req.body };
    // Ocultar campos sensibles
    if (sanitizedBody.contrasena) sanitizedBody.contrasena = '***';
    if (sanitizedBody.password) sanitizedBody.password = '***';
    console.log(`📦 Body:`, JSON.stringify(sanitizedBody, null, 2));
  }

  console.log('='.repeat(60) + '\n');

  // Capturar la respuesta para logging
  const originalSend = res.send;
  res.send = function(this: any, data: any) {
    console.log(`✅ Respuesta: ${res.statusCode} ${req.method} ${req.path}`);
    if (res.statusCode >= 400) {
      console.log(`⚠️ Error response:`, data.toString().substring(0, 200));
    }
    return originalSend.call(this, data);
  } as any;

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/campanas', campanasRoutes);
app.use('/api/tramites', tramitesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/workers', workersRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
});

// Start server - Escuchar en 0.0.0.0 para aceptar conexiones externas
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces de red
const server = app.listen(config.port, HOST, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 SERVIDOR INICIADO');
  console.log('='.repeat(60));
  console.log(`📝 Ambiente: ${config.nodeEnv}`);
  console.log(`🔗 Puerto: ${config.port}`);
  console.log(`🌐 Local: http://localhost:${config.port}`);
  console.log(`🌐 Red: http://0.0.0.0:${config.port}`);

  // Instrucciones para acceso móvil
  console.log('\n📱 ACCESO DESDISPOSITIVOS MÓVILES:');
  console.log('1. Conecta tu móvil a la misma red WiFi');
  console.log('2. Obtén la IP de tu computadora:');
  console.log('   - Windows: ipconfig');
  console.log('   - Linux/Mac: ifconfig o ip addr');
  console.log('3. En tu móvil, usa: http://<TU_IP>:5173');
  console.log('4. El frontend debe tener VITE_API_URL=http://<TU_IP>:3001');
  console.log('='.repeat(60) + '\n');
});

// Iniciar monitor de workers
startWorkerMonitor();

// Manejo graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Closing server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received. Closing server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
