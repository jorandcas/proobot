import { TramiteValidator, ValidationError } from '../validators/tramite.validator';
import { CrearTramiteRequest } from '../types';

console.log('🧪 Probando validaciones de trámite...\n');

// Casos de prueba
const testCases = [
  {
    nombre: 'Trámite VÁLIDO completo',
    data: {
      dn: '5569268684',
      icc: '8952034000164434858',
      fvcFecha: '15/03/2026',
      nip: '1234',
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      curp: 'PEGJ800101HDFXXX01',
      telefono: '7771234567',
      genero: 'Masculino',
      fechaNacimiento: '01/01/1980',
    } as CrearTramiteRequest,
    shouldPass: true,
  },
  {
    nombre: 'Apellido materno VACÍO (debe pasar, pondrá R)',
    data: {
      dn: '5569268684',
      icc: '8952034000164434858',
      fvcFecha: '15/03/2026',
      nip: '1234',
      nombre: 'María',
      apellidoPaterno: 'López',
      apellidoMaterno: '', // Vacío
      curp: 'LOEM750101MDFXXX01',
      telefono: '7771234567',
      genero: 'Femenino',
      fechaNacimiento: '01/01/1975',
    } as CrearTramiteRequest,
    shouldPass: true,
  },
  {
    nombre: 'DN inválido (menos de 10 dígitos)',
    data: {
      dn: '123456789', // 9 dígitos
      icc: '8952034000164434858',
      fvcFecha: '15/03/2026',
      nip: '1234',
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      curp: 'PEGJ800101HDFXXX01',
      telefono: '7771234567',
      genero: 'Masculino',
      fechaNacimiento: '01/01/1980',
    } as CrearTramiteRequest,
    shouldPass: false,
  },
  {
    nombre: 'NIP inválido (no es numérico)',
    data: {
      dn: '5569268684',
      icc: '8952034000164434858',
      fvcFecha: '15/03/2026',
      nip: 'ABCD', // No numérico
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      curp: 'PEGJ800101HDFXXX01',
      telefono: '7771234567',
      genero: 'Masculino',
      fechaNacimiento: '01/01/1980',
    } as CrearTramiteRequest,
    shouldPass: false,
  },
  {
    nombre: 'CURP inválido (formato incorrecto)',
    data: {
      dn: '5569268684',
      icc: '8952034000164434858',
      fvcFecha: '15/03/2026',
      nip: '1234',
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      curp: 'CURP_INVALIDA', // Formato incorrecto
      telefono: '7771234567',
      genero: 'Masculino',
      fechaNacimiento: '01/01/1980',
    } as CrearTramiteRequest,
    shouldPass: false,
  },
  {
    nombre: 'Teléfono inválido (menos de 10 dígitos)',
    data: {
      dn: '5569268684',
      icc: '8952034000164434858',
      fvcFecha: '15/03/2026',
      nip: '1234',
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      curp: 'PEGJ800101HDFXXX01',
      telefono: '777123456', // 9 dígitos
      genero: 'Masculino',
      fechaNacimiento: '01/01/1980',
    } as CrearTramiteRequest,
    shouldPass: false,
  },
  {
    nombre: 'Fecha FVC inválida (fecha pasada)',
    data: {
      dn: '5569268684',
      icc: '8952034000164434858',
      fvcFecha: '01/01/2020', // Fecha pasada
      nip: '1234',
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      curp: 'PEGJ800101HDFXXX01',
      telefono: '7771234567',
      genero: 'Masculino',
      fechaNacimiento: '01/01/1980',
    } as CrearTramiteRequest,
    shouldPass: false,
  },
  {
    nombre: 'Género inválido',
    data: {
      dn: '5569268684',
      icc: '8952034000164434858',
      fvcFecha: '15/03/2026',
      nip: '1234',
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      curp: 'PEGJ800101HDFXXX01',
      telefono: '7771234567',
      genero: 'Otro' as any, // Género inválido
      fechaNacimiento: '01/01/1980',
    } as CrearTramiteRequest,
    shouldPass: false,
  },
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    TramiteValidator.validateTramite(testCase.data);

    if (testCase.shouldPass) {
      console.log(`✅ Test ${index + 1}: ${testCase.nombre}`);
      console.log(`   Resultado: PASS (como se esperaba)\n`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: ${testCase.nombre}`);
      console.log(`   Resultado: PASS (pero se esperaba FAIL)\n`);
      failed++;
    }
  } catch (error) {
    if (testCase.shouldPass) {
      console.log(`❌ Test ${index + 1}: ${testCase.nombre}`);
      console.log(`   Error: ${(error as Error).message}`);
      console.log(`   Resultado: FAIL (pero se esperaba PASS)\n`);
      failed++;
    } else {
      console.log(`✅ Test ${index + 1}: ${testCase.nombre}`);
      console.log(`   Error capturado: ${(error as Error).message}`);
      console.log(`   Resultado: FAIL (como se esperaba)\n`);
      passed++;
    }
  }
});

console.log('='.repeat(60));
console.log(`📊 Resumen:`);
console.log(`   ✅ Pasados: ${passed}/${testCases.length}`);
console.log(`   ❌ Fallidos: ${failed}/${testCases.length}`);
console.log('='.repeat(60));

if (failed === 0) {
  console.log('\n🎉 ¡Todas las validaciones funcionan correctamente!');
} else {
  console.log('\n⚠️ Algunas validaciones necesitan revisión');
}
