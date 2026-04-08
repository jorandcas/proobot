import fs from 'fs';

const dbPath = './src/data/database.json';

try {
  console.log('🔍 Leyendo database.json...\n');

  const data = fs.readFileSync(dbPath, 'utf-8');
  const db = JSON.parse(data);

  console.log(`📊 Total de trámites en JSON: ${db.tramites?.length || 0}`);

  // Buscar trámites de Veronica
  const veronicaTramites = db.tramites?.filter((t: any) =>
    t.icc === '8952034000164445565' ||
    t.nombre?.includes('VERONICA') ||
    t.apellidoPaterno?.includes('CUEVA')
  ) || [];

  console.log(`\n⚠️  Trámites de Veronica encontrados: ${veronicaTramites.length}\n`);

  if (veronicaTramites.length > 0) {
    veronicaTramites.forEach((t: any, i: number) => {
      console.log(`${i + 1}. ${t.nombre} ${t.apellidoPaterno}`);
      console.log(`   ID: ${t.id}`);
      console.log(`   DN: ${t.dn}`);
      console.log(`   ICC: ${t.icc}`);
      console.log(`   Estado: ${t.estado}`);
      console.log('');
    });

    // Eliminar trámites de Veronica
    const nuevosTramites = db.tramites.filter((t: any) =>
      t.icc !== '8952034000164445565' &&
      !t.nombre?.includes('VERONICA') &&
      !t.apellidoPaterno?.includes('CUEVA')
    );

    db.tramites = nuevosTramites;

    // Guardar cambios
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    console.log(`✅ Trámites eliminados. NUEVO total: ${db.tramites?.length || 0}\n`);
  } else {
    console.log('✅ No se encontraron trámites de Veronica en JSON\n');
  }

} catch (error) {
  console.error('❌ Error:', error);
}
