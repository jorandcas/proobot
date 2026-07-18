import { usuarioModel } from '../models/usuario.model';
import { PasswordUtil } from '../utils/password.util';
import config from '../config/env';

async function initDatabase() {
  console.log('Inicializando base de datos...');

  // Check if admin exists
  const existingAdmin = await usuarioModel.findByEmail(config.adminEmail);

  if (existingAdmin) {
    console.log('✓ El usuario administrador ya existe');
    console.log(`  Email: ${config.adminEmail}`);
    console.log(`  Nombre: ${existingAdmin.nombre}`);
  } else {
    // Create admin user
    const hashedPassword = await PasswordUtil.hash(config.adminPassword);
    const admin = await usuarioModel.create({
      correo: config.adminEmail,
      contrasena: hashedPassword,
      rol: 'admin',
      nombre: config.adminName,
    });

    console.log('✓ Usuario administrador creado');
    console.log(`  Email: ${config.adminEmail}`);
    console.log(`  Contraseña: ${config.adminPassword}`);
    console.log(`  Nombre: ${admin.nombre}`);
  }

  console.log('\nBase de datos inicializada exitosamente');
  console.log('\nPuedes iniciar el servidor con: npm run dev');
}

initDatabase().catch(console.error);
