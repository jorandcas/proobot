const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log(' Iniciando Proobot Worker...');

// Verificar si Appium está corriendo
function isAppiumRunning() {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'netstat' : 'lsof';
    const args = isWindows ? ['-ano'] : ['-i', ':4723'];
    
    const proc = spawn(cmd, args);
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

// Iniciar Appium en segundo plano
function startAppium() {
  return new Promise((resolve) => {
    console.log('📱 Iniciando Appium Server en segundo plano...');
    
    const isWindows = process.platform === 'win32';
    const appiumPath = path.join(process.cwd(), 'node_modules', '.bin', isWindows ? 'appium.cmd' : 'appium');
    
    // Si no existe en node_modules, usar npx
    const cmd = fs.existsSync(appiumPath) ? appiumPath : 'npx';
    const args = fs.existsSync(appiumPath) ? [] : ['appium'];
    
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
  console.log('🤖 Iniciando Worker Agent...');
  
  const worker = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  worker.on('error', (err) => {
    console.error('❌ Error al iniciar el worker:', err.message);
    process.exit(1);
  });
  
  worker.on('exit', (code) => {
    process.exit(code);
  });
}

// Función principal
async function main() {
  try {
    // Verificar si dist existe
    if (!fs.existsSync(path.join(process.cwd(), 'dist', 'index.js'))) {
      console.log('⚠️  Código no compilado. Compilando...');
      const { execSync } = require('child_process');
      execSync('npm run build', { stdio: 'inherit' });
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
