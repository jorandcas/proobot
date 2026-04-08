import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../src/data/database.json');

interface Tramite {
  id: string;
  estado: string;
  dn: string;
  resultado?: string | null;
  botLogId?: string | null;
}

interface Database {
  tramites: Tramite[];
}

// Cambiar el último trámite en error a pendiente
function changeLastErrorToPending() {
  const db: Database = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  // Encontrar el último trámite en error
  const errorTramites = db.tramites.filter((t: Tramite) => t.estado === 'error');

  if (errorTramites.length === 0) {
    console.log('❌ No hay trámites en estado error');
    return;
  }

  // Ordenar por fecha de creación (más reciente primero)
  errorTramites.sort((a: any, b: any) =>
    new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
  );

  const latestError = errorTramites[0];
  const tramite = db.tramites.find((t: Tramite) => t.id === latestError.id);

  if (tramite) {
    console.log(`📝 Cambiando trámite DN: ${tramite.dn}`);
    console.log(`   Estado anterior: ${tramite.estado}`);
    tramite.estado = 'pendiente';
    tramite.resultado = null;
    tramite.botLogId = null;
    console.log(`   Estado nuevo: ${tramite.estado}`);

    // Guardar cambios
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log('✅ Trámite cambiado a pendiente');
  } else {
    console.log('❌ No se encontró el trámite');
  }
}

changeLastErrorToPending();
