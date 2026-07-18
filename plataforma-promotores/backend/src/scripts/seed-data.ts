import { prisma } from '../config/database.prisma';

async function seedData() {
  console.log('🌱 Iniciando seed de datos...');

  try {
    // Limpiar datos existentes
    console.log('🗑️ Limpiando datos existentes...');
    await prisma.botLog.deleteMany();
    await prisma.tramite.deleteMany();
    await prisma.campana.deleteMany();

    // Crear campañas de los últimos 6 meses
    console.log('📅 Creando campañas...');
    const today = new Date();
    const campaigns = [];

    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1, 6, 0, 0);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1, 5, 59, 59);

      const campaign = await prisma.campana.create({
        data: {
          nombre: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          fecha: date,
          fechaInicio: startDate,
          fechaFin: endDate,
          activa: i === 0, // Solo la actual está activa
        },
      });
      campaigns.push(campaign);
      console.log(`  ✅ Campaña creada: ${campaign.nombre}`);
    }

    // Crear trámites de ejemplo
    console.log('📝 Creando trámites de ejemplo...');
    const estados = ['PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR', 'CANCELADO'];
    const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Miguel', 'Sofía'];
    const apellidos = ['García', 'López', 'Martínez', 'Rodríguez', 'González', 'Pérez', 'Sánchez', 'Romero'];

    let totalCount = 0;
    const trámitesPorMes = 50;

    for (const campaign of campaigns) {
      const campaignDate = new Date(campaign.fecha);
      const month = campaignDate.getMonth();
      const year = campaignDate.getFullYear();

      for (let i = 0; i < trámitesPorMes; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const hour = Math.floor(Math.random() * 10) + 8; // 8-18 horas
        const fechaCreacion = new Date(year, month, day, hour, Math.floor(Math.random() * 60));

        // Distribución de estados: más completados y pendientes
        const estadoRand = Math.random();
        let estado = 'COMPLETADO';
        if (estadoRand < 0.2) estado = 'PENDIENTE';
        else if (estadoRand < 0.3) estado = 'PROCESANDO';
        else if (estadoRand < 0.85) estado = 'COMPLETADO';
        else if (estadoRand < 0.95) estado = 'ERROR';
        else estado = 'CANCELADO';

        const tramite = await prisma.tramite.create({
          data: {
            idCampana: campaign.id,
            idPromotor: '50a6980d-b3cd-4634-b7b6-4c8855ca884e', // ID del admin
            fechaCreacion,
            estado: estado as any,
            dn: String(Math.floor(Math.random() * 9000000000) + 1000000000),
            rfc: generarRFC(),
            icc: generarICC(),
            nip: String(Math.floor(Math.random() * 9000) + 1000),
            fvcIndice: Math.floor(Math.random() * 5) + 1,
            fvcFecha: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
            nombre: nombres[Math.floor(Math.random() * nombres.length)],
            nombreSegundo: Math.random() > 0.5 ? nombres[Math.floor(Math.random() * nombres.length)] : null,
            apellidoPaterno: apellidos[Math.floor(Math.random() * apellidos.length)],
            apellidoMaterno: apellidos[Math.floor(Math.random() * apellidos.length)],
            curp: generarCURP(),
            telefono: String(Math.floor(Math.random() * 9000000000) + 1000000000),
            genero: Math.random() > 0.5 ? 'M' : 'F',
            email: `cliente${totalCount}@email.com`,
            fechaNacimiento: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${Math.floor(Math.random() * 40) + 1960}`,
            resultado: estado === 'COMPLETADO' ? 'Portabilidad exitosa' : estado === 'ERROR' ? 'Error en validación' : null,
            mensajeCorreccion: estado === 'ERROR' ? 'El DN no corresponde al cliente' : null,
          },
        });
        totalCount++;
        if (totalCount % 10 === 0) {
          console.log(`  📊 ${totalCount} trámites creados...`);
        }
      }
    }

    console.log(`\n✅ Seed completado exitosamente!`);
    console.log(`📊 Resumen:`);
    console.log(`  - ${campaigns.length} campañas creadas`);
    console.log(`  - ${totalCount} trámites creados`);
    console.log(`  - ${trámitesPorMes} trámites por mes`);

    // Estadísticas finales
    const stats = await prisma.tramite.groupBy({
      by: ['estado'],
      _count: true,
    });

    console.log(`\n📈 Estadísticas por estado:`);
    stats.forEach(stat => {
      console.log(`  - ${stat.estado}: ${stat._count}`);
    });

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function generarRFC(): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const rfc = 'ABCD' + // 4 letras aleatorias (apellidos)
    String(Math.floor(Math.random() * 90) + 10).padStart(2, '0') +
    new Date().getFullYear().toString().slice(-2) +
    String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') +
    String(Math.floor(Math.random() * 28) + 1).padStart(2, '0') +
    'XXX'; // Homoclave
  return rfc;
}

function generarICC(): string {
  return '8951' + String(Math.floor(Math.random() * 1000000000000)).padStart(13, '0');
}

function generarCURP(): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let curp = '';
  for (let i = 0; i < 4; i++) {
    curp += letras[Math.floor(Math.random() * letras.length)];
  }
  curp += String(Math.floor(Math.random() * 90) + 10).padStart(2, '0');
  curp += new Date().getFullYear().toString().slice(-2);
  curp += String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  curp += String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  curp += 'H'; // H o M
  curp += 'MS'; // Estado (ejemplo)
  for (let i = 0; i < 3; i++) {
    curp += letras[Math.floor(Math.random() * letras.length)];
  }
  return curp;
}

// Ejecutar el seed
seedData()
  .then(() => {
    console.log('\n🎉 Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
