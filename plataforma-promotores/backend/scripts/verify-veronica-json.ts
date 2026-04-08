import fs from 'fs';

const dbPath = './src/data/database.json';

try {
  console.log('🔍 Verificando trámites de Veronica en database.json...\n');

  const data = fs.readFileSync(dbPath, 'utf-8');
  const db = JSON.parse(data);

  // Buscar TODOS los trámites con el ICC de Veronica
  const veronicaTramites = db.tramites?.filter((t: any) =>
    t.icc === '8952034000164445565'
  ) || [];

  console.log(`📊 Total de trámites en JSON: ${db.tramites?.length || 0}`);
  console.log(`⚠️  Trámites con ICC de Veronica: ${veronicaTramites.length}\n`);

  if (veronicaTramites.length > 0) {
    veronicaTramites.forEach((t: any, i: number) => {
      console.log(`${i + 1}. ${t.nombre} ${t.apellidoPaterno}`);
      console.log(`   ID: ${t.id}`);
      console.log(`   DN: ${t.dn}`);
      console.log(`   ICC: ${t.icc}`);
      console.log(`   Estado: ${t.estado}\n`);
    });

    // OPCIÓN 1: Eliminar completamente
    console.log('🗑️  ELIMINANDO trámites con ese ICC...\n');
    db.tramites = db.tramites.filter((t: any) => t.icc !== '8952034000164445565');

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    console.log(`✅ Trámites eliminados. Nuevo total: ${db.tramites?.length || 0}`);

    // Verificar que ya no existan
    const verificacion = db.tramites?.filter((t: any) => t.icc === '8952034000164445565') || [];
    console.log(`✅ Verificación: ${verificacion.length} trámites con ese ICC quedaron\n`);

  } else {
    console.log('✅ No hay trámites con ese ICC en database.json\n');
  }

} catch (error) {
  console.error('❌ Error:', error);
}
