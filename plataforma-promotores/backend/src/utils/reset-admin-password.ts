import fs from 'fs';
import path from 'path';
import { PasswordUtil } from '../utils/password.util';

const DB_PATH = path.join(__dirname, '../../src/data/database.json');

interface Database {
  usuarios: any[];
}

async function resetAdminPassword() {
  console.log('🔄 Reseteando contraseña del admin...\n');

  // Leer base de datos
  const db: Database = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  // Buscar admin
  const adminIndex = db.usuarios.findIndex((u: any) => u.rol === 'admin');

  if (adminIndex === -1) {
    console.log('❌ No se encontró usuario admin');
    return;
  }

  const admin = db.usuarios[adminIndex];

  console.log(`📧 Admin encontrado: ${admin.correo}`);
  console.log(`👤 Nombre: ${admin.nombre}`);

  // Generar nueva contraseña hasheada
  const hashedPassword = await PasswordUtil.hash('admin123');

  // Actualizar contraseña
  db.usuarios[adminIndex].contrasena = hashedPassword;

  // Guardar
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

  console.log('\n✅ Contraseña reseteada exitosamente');
  console.log('\n🔑 Nuevas credenciales:');
  console.log('   Usuario: admin@govi.mx');
  console.log('   Contraseña: admin123');
}

resetAdminPassword();
