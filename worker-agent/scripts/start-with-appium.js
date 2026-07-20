const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log(' Iniciando Proobot Worker...');

// Verificar si Appium está corriendo
function isAppiumRunning() {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'netstat' : 'lsof';
    const args = isWindows ? ['-ano'] : ['-i', ':4723'];
    
    const proc = spawn(cmd, args, { shell: isWindows });
    let output = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.on('close', () => {
      resolve(output.includes('4723'));
    });
    
    proc.on('error', () => {
      resolve(false);
    });
  });
}

// Buscar un ejecutable en el PATH y devolver la ruta completa
function findInPath(exe) {
  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'where' : 'which';
    const result = execSync(`${cmd} ${exe}`, { encoding: 'utf8', timeout: 5000 });
    const lines = result.trim().split('\n');
    return lines[0].trim();
  } catch {
    return null;
  }
}

// Iniciar Appium en segundo plano
function startAppium() {
  return new Promise((resolve) => {
    console.log('📱 Iniciando Appium Server en segundo plano...');
    
    const isWindows = process.platform === 'win32';
    const localAppium = path.join(process.cwd(), 'node_modules', '.bin', isWindows ? 'appium.cmd' : 'appium');
    
    // Intentar varias rutas para encontrar appium
    let cmd = null;
    let args = [];
    
    if (fs.existsSync(localAppium)) {
      cmd = localAppium;
    } else {
      // Buscar appium en el PATH global (npm install -g appium)
      const globalAppium = findInPath(isWindows ? 'appium.cmd' : 'appium');
      if (globalAppium) {
        cmd = globalAppium;
      } else {
        // Fallback a npx.cmd (Windows) o npx (Unix)
        cmd = findInPath(isWindows ? 'npx.cmd' : 'npx') || 'npx';
        args = ['appium'];
      }
    }
    
    const appium = spawn(cmd, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    });
    
    appium.unref();
    
    console.log('✅ Appium iniciado en puerto 4723');
    
    // Esperar un momento para que Appium arranque
    setTimeout(() => resolve(true), 3000);
  });
}

// Iniciar el worker
function startWorker() {
  return new Promise((resolve) => {
    console.log('🤖 Iniciando Worker Agent...');
    
    const worker = spawn('node', ['dist/index.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    worker.on('error', (err) => {
      console.error('❌ Error al iniciar el worker:', err.message);
      resolve();
    });
    
    worker.on('exit', (code) => {
      resolve();
    });
  });
}

// Función principal
async function main() {
  try {
    // Verificar si dist existe
    if (!fs.existsSync(path.join(process.cwd(), 'dist', 'index.js'))) {
      console.log('⚠️  Código no compilado. Compilando...');
      execSync('npm run build', { stdio: 'inherit', shell: process.platform === 'win32' });
    }
    
    // Verificar si Appium está corriendo
    const appiumRunning = await isAppiumRunning();
    
    if (!appiumRunning) {
      await startAppium();
    } else {
      console.log('✅ Appium ya está corriendo en puerto 4723');
    }
    
    // Iniciar el worker
    await startWorker();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
