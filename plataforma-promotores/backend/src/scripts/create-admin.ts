import { prisma } from '../config/database.prisma';
import bcrypt from 'bcryptjs';
import readline from 'readline';

interface AdminData {
  nombre: string;
  correo: string;
  contrasena: string;
}

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function createAdmin() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          CREAR USUARIO ADMINISTRADOR                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Recopilar datos
    const nombre = await question('Nombre completo: ');
    const correo = await question('Correo electrónico: ');
    const contrasena = await question('Contraseña: ');

    // Validaciones básicas
    if (!nombre || !correo || !contrasena) {
      console.error('\n❌ Error: Todos los campos son obligatorios\n');
      process.exit(1);
    }

    if (contrasena.length < 6) {
      console.error('\n❌ Error: La contraseña debe tener al menos 6 caracteres\n');
      process.exit(1);
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (existingUser) {
      console.error(`\n❌ Error: Ya existe un usuario con el correo ${correo}\n`);
      process.exit(1);
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Crear usuario admin
    const admin = await prisma.usuario.create({
      data: {
        nombre,
        correo,
        contrasena: hashedPassword,
        rol: 'ADMIN',
      },
    });

    console.log('\n✅ Usuario administrador creado exitosamente:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ID:        ${admin.id}`);
    console.log(`   Nombre:     ${admin.nombre}`);
    console.log(`   Correo:     ${admin.correo}`);
    console.log(`   Rol:        ${admin.rol}`);
    console.log(`   Creado:     ${admin.fechaCreacion}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔐 Puedes iniciar sesión con estas credenciales.\n');
  } catch (error) {
    console.error('\n❌ Error al crear usuario administrador:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Crear usuario admin o promotor
async function createUser() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          CREAR USUARIO                                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const tipo = (await question('Tipo de usuario (ADMIN/PROMOTOR): ')).toUpperCase();

  if (tipo !== 'ADMIN' && tipo !== 'PROMOTOR') {
    console.error('\n❌ Error: Tipo debe ser ADMIN o PROMOTOR\n');
    process.exit(1);
  }

  try {
    // Recopilar datos
    const nombre = await question('Nombre completo: ');
    const correo = await question('Correo electrónico: ');
    const contrasena = await question('Contraseña: ');

    // Validaciones básicas
    if (!nombre || !correo || !contrasena) {
      console.error('\n❌ Error: Todos los campos son obligatorios\n');
      process.exit(1);
    }

    if (contrasena.length < 6) {
      console.error('\n❌ Error: La contraseña debe tener al menos 6 caracteres\n');
      process.exit(1);
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (existingUser) {
      console.error(`\n❌ Error: Ya existe un usuario con el correo ${correo}\n`);
      process.exit(1);
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        correo,
        contrasena: hashedPassword,
        rol: tipo as 'ADMIN' | 'PROMOTOR',
      },
    });

    console.log('\n✅ Usuario creado exitosamente:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ID:        ${usuario.id}`);
    console.log(`   Nombre:     ${usuario.nombre}`);
    console.log(`   Correo:     ${usuario.correo}`);
    console.log(`   Rol:        ${usuario.rol}`);
    console.log(`   Creado:     ${usuario.fechaCreacion}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔐 Puedes iniciar sesión con estas credenciales.\n');
  } catch (error) {
    console.error('\n❌ Error al crear usuario:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
if (process.argv[2] === '--admin') {
  createAdmin();
} else {
  createUser();
}
