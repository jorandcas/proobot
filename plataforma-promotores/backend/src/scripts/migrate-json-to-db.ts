import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Cargar variables de entorno
dotenv.config();

// Crear cliente Prisma directamente para el script
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }) as any;

interface JsonData {
  usuarios?: any[];
  campanas?: any[];
  tramites?: any[];
  logs?: any[];
}

// Funciones de normalización
const normalizeRol = (rol: string): string => {
  const rolMap: Record<string, string> = {
    'admin': 'ADMIN',
    'promotor': 'PROMOTOR',
    'ADMIN': 'ADMIN',
    'PROMOTOR': 'PROMOTOR',
  };
  return rolMap[rol] || 'PROMOTOR';
};

const normalizeEstado = (estado: string): string => {
  const estadoMap: Record<string, string> = {
    'pendiente': 'PENDIENTE',
    'procesando': 'PROCESANDO',
    'completado': 'COMPLETADO',
    'error': 'ERROR',
    'cancelado': 'CANCELADO',
    'PENDIENTE': 'PENDIENTE',
    'PROCESANDO': 'PROCESANDO',
    'COMPLETADO': 'COMPLETADO',
    'ERROR': 'ERROR',
    'CANCELADO': 'CANCELADO',
  };
  return estadoMap[estado] || 'PENDIENTE';
};

const normalizeGenero = (genero: string): string | null => {
  if (!genero) return null;
  const g = genero.toLowerCase();
  if (g.includes('masculino') || g === 'm') return 'M';
  if (g.includes('femenino') || g === 'f') return 'F';
  return null;
};

async function migrateFromJSON() {
  console.log('🔄 Iniciando migración desde JSON a PostgreSQL...');

  try {
    // Leer el archivo JSON
    const jsonPath = path.join(__dirname, '../data/database.json');
    console.log(`📂 Leyendo archivo: ${jsonPath}`);

    const fileContent = await fs.readFile(jsonPath, 'utf-8');
    const jsonData: JsonData = JSON.parse(fileContent);

    console.log(`\n📋 Contenido del JSON:`);
    console.log(`  - Usuarios: ${jsonData.usuarios?.length || 0}`);
    console.log(`  - Campañas: ${jsonData.campanas?.length || 0}`);
    console.log(`  - Trámites: ${jsonData.tramites?.length || 0}`);
    console.log(`  - Logs: ${jsonData.logs?.length || 0}`);

    // Migrar usuarios
    if (jsonData.usuarios && jsonData.usuarios.length > 0) {
      console.log(`\n👤 Migrando ${jsonData.usuarios.length} usuarios...`);
      for (const usuario of jsonData.usuarios) {
        try {
          await prisma.usuario.upsert({
            where: { correo: usuario.correo },
            update: {},
            create: {
              id: usuario.id,
              correo: usuario.correo,
              contrasena: usuario.contrasena,
              rol: normalizeRol(usuario.rol) as any,
              nombre: usuario.nombre,
              fechaCreacion: new Date(usuario.fechaCreacion),
              tokenVersion: 0,
            },
          });
          console.log(`  ✅ ${usuario.correo} (${usuario.rol} → ${normalizeRol(usuario.rol)})`);
        } catch (error: any) {
          console.log(`  ⚠️  Usuario ${usuario.correo} ya existe`);
        }
      }
    }

    // Migrar campañas
    if (jsonData.campanas && jsonData.campanas.length > 0) {
      console.log(`\n📅 Migrando ${jsonData.campanas.length} campañas...`);
      for (const campana of jsonData.campanas) {
        try {
          await prisma.campana.upsert({
            where: { id: campana.id },
            update: {},
            create: {
              id: campana.id,
              nombre: campana.nombre,
              fecha: new Date(campana.fecha),
              fechaInicio: new Date(campana.fechaInicio),
              fechaFin: new Date(campana.fechaFin),
              activa: campana.activa ?? true,
            },
          });
          console.log(`  ✅ ${campana.nombre}`);
        } catch (error: any) {
          console.log(`  ⚠️  Campaña ${campana.nombre} ya existe`);
        }
      }
    }

    // Migrar trámites
    if (jsonData.tramites && jsonData.tramites.length > 0) {
      console.log(`\n📝 Migrando ${jsonData.tramites.length} trámites...`);
      let count = 0;
      let errors = 0;

      for (const tramite of jsonData.tramites) {
        try {
          const estadoNormalizado = normalizeEstado(tramite.estado || 'PENDIENTE');

          await prisma.tramite.create({
            data: {
              id: tramite.id,
              idCampana: tramite.idCampana,
              idPromotor: tramite.idPromotor,
              fechaCreacion: new Date(tramite.fechaCreacion),
              estado: estadoNormalizado as any,
              fechaProcesamiento: tramite.fechaProcesamiento ? new Date(tramite.fechaProcesamiento) : null,
              dn: tramite.dn || null,
              rfc: tramite.rfc || null,
              icc: tramite.icc || null,
              nip: tramite.nip || null,
              fvcIndice: tramite.fvcIndice ? parseInt(tramite.fvcIndice) : null,
              fvcFecha: tramite.fvcFecha || null,
              nombre: tramite.nombre || null,
              nombreSegundo: tramite.nombreSegundo || null,
              apellidoPaterno: tramite.apellidoPaterno || null,
              apellidoMaterno: tramite.apellidoMaterno || null,
              curp: tramite.curp || null,
              telefono: tramite.telefono ? String(tramite.telefono) : null,
              genero: normalizeGenero(tramite.genero),
              email: tramite.email || null,
              fechaNacimiento: tramite.fechaNacimiento || null,
              resultado: tramite.resultado || null,
              mensajeCorreccion: tramite.mensajeCorreccion || null,
            },
          });
          count++;
          if (count % 20 === 0) {
            console.log(`  📊 ${count} trámites migrados...`);
          }
        } catch (error: any) {
          errors++;
          if (errors <= 5) {
            console.log(`  ⚠️  Error en trámite ${tramite.id?.substring(0, 8)}...: ${error.message?.substring(0, 60)}`);
          }
        }
      }
      console.log(`  ✅ ${count} trámites migrados exitosamente (${errors} errores)`);
    }

    // Verificación final
    console.log('\n📊 Verificación de migración:');
    const usuariosCount = await prisma.usuario.count();
    const campanasCount = await prisma.campana.count();
    const tramitesCount = await prisma.tramite.count();

    console.log(`  - Usuarios: ${usuariosCount}`);
    console.log(`  - Campañas: ${campanasCount}`);
    console.log(`  - Trámites: ${tramitesCount}`);

    // Mostrar algunos trámites
    const primerosTramites = await prisma.tramite.findMany({
      take: 5,
      orderBy: { fechaCreacion: 'desc' },
    });
    console.log(`\n📝 Últimos trámites migrados:`);
    primerosTramites.forEach((t: any) => {
      console.log(`  - ${t.nombre} ${t.apellidoPaterno} - ${t.estado} - ${new Date(t.fechaCreacion).toLocaleDateString('es-ES')}`);
    });

    console.log('\n✅ Migración completada exitosamente!');
    console.log('💡 Ahora puedes iniciar sesión y ver tus datos antiguos');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Ejecutar la migración
migrateFromJSON()
  .then(() => {
    console.log('\n🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
