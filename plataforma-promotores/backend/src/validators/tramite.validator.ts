import { CrearTramiteRequest } from '../types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TramiteValidator {
  // DN: Exactly 10 digits
  static validateDN(dn: string): void {
    const dnRegex = /^\d{10}$/;
    if (!dnRegex.test(dn)) {
      throw new ValidationError('El DN debe contener exactamente 10 dígitos numéricos');
    }
  }

  // CURP: 18 characters, specific format
  static validateCURP(curp: string): void {
    // CURP format: 4 letters, 6 digits, H/M, 6 letters/digits, homoclave
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
    if (!curpRegex.test(curp.toUpperCase())) {
      throw new ValidationError(
        'El CURP no tiene un formato válido. Debe tener 18 caracteres con el formato correcto'
      );
    }
  }

  // Phone: 10 digits
  static validateTelefono(telefono: string): void {
    const telRegex = /^\d{10}$/;
    if (!telRegex.test(telefono)) {
      throw new ValidationError('El teléfono debe contener exactamente 10 dígitos numéricos');
    }
  }

  // Email: valid format
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('El email no tiene un formato válido');
    }
  }

  // Birth date: dd/mm/yyyy format and valid date
  static validateFechaNacimiento(fecha: string): void {
    const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!fechaRegex.test(fecha)) {
      throw new ValidationError('La fecha de nacimiento debe tener el formato dd/mm/yyyy');
    }

    // Check if it's a valid date
    const parts = fecha.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (month < 1 || month > 12) {
      throw new ValidationError('El mes de la fecha de nacimiento debe estar entre 01 y 12');
    }

    if (day < 1 || day > 31) {
      throw new ValidationError('El día de la fecha de nacimiento debe estar entre 01 y 31');
    }

    const date = new Date(year, month - 1, day);
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      throw new ValidationError('La fecha de nacimiento no es válida');
    }

    // Check if date is not in the future
    const today = new Date();
    if (date > today) {
      throw new ValidationError('La fecha de nacimiento no puede ser en el futuro');
    }

    // Check if date is reasonable (not too old)
    const minDate = new Date(1900, 0, 1);
    if (date < minDate) {
      throw new ValidationError('La fecha de nacimiento no puede ser anterior a 1900');
    }
  }

  // NIP: Exactly 4 digits
  static validateNIP(nip: string): void {
    const nipRegex = /^\d{4}$/;
    if (!nipRegex.test(nip)) {
      throw new ValidationError('El NIP debe contener exactamente 4 dígitos numéricos');
    }
  }

  // ICC: 19-20 digits (SIM card ICCID) - Remove trailing 'F' if present
  static validateICC(icc: string): string {
    // Remove 'F' or 'f' from the end if present
    let cleanedICC = icc.trim().toUpperCase();
    if (cleanedICC.endsWith('F')) {
      cleanedICC = cleanedICC.slice(0, -1);
    }

    const iccRegex = /^\d{19,20}$/;
    if (!iccRegex.test(cleanedICC)) {
      throw new ValidationError('El ICC debe contener entre 19 y 20 dígitos numéricos (se puede omitir la F final)');
    }

    return cleanedICC;
  }

  // FVC Fecha: Valid date format and reasonable date
  static validateFVCFecha(fecha: string): void {
    const fechaRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!fechaRegex.test(fecha)) {
      throw new ValidationError('La fecha FVC debe tener el formato dd/mm/yyyy');
    }

    // Check if it's a valid date
    const parts = fecha.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (month < 1 || month > 12) {
      throw new ValidationError('El mes de la fecha FVC debe estar entre 01 y 12');
    }

    if (day < 1 || day > 31) {
      throw new ValidationError('El día de la fecha FVC debe estar entre 01 y 31');
    }

    const date = new Date(year, month - 1, day);
    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      throw new ValidationError('La fecha FVC no es válida');
    }

    // Check if date is in the future (must be at least today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month - 1, day);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      throw new ValidationError('La fecha FVC debe ser hoy o una fecha futura');
    }
  }

  // Validate complete tramite data
  static validateTramite(data: CrearTramiteRequest): void {
    // Required fields - Búsqueda Porta
    this.validateDN(data.dn);
    const cleanedICC = this.validateICC(data.icc); // ICC es obligatorio

    // Required fields - Sección Línea
    this.validateNIP(data.nip);
    this.validateFVCFecha(data.fvcFecha);

    // Required fields - Datos Personales
    if (!data.nombre || data.nombre.trim().length < 2) {
      throw new ValidationError('El nombre es obligatorio y debe tener al menos 2 caracteres');
    }

    if (!data.apellidoPaterno || data.apellidoPaterno.trim().length < 2) {
      throw new ValidationError('El apellido paterno es obligatorio y debe tener al menos 2 caracteres');
    }

    // Apellido materno opcional (si está vacío, el backend pondrá 'R' por defecto)
    if (data.apellidoMaterno && data.apellidoMaterno.trim().length > 0) {
      // Allow 'R' as special case (default value when no maternal surname)
      if (data.apellidoMaterno.trim() !== 'R' && data.apellidoMaterno.trim().length < 2) {
        throw new ValidationError('El apellido materno debe tener al menos 2 caracteres');
      }
    }
    // Si está vacío, se permitirá (el backend pondrá 'R' automáticamente)

    this.validateCURP(data.curp);
    this.validateTelefono(data.telefono);
    this.validateFechaNacimiento(data.fechaNacimiento); // Ahora es obligatorio

    if (!data.genero || (data.genero !== 'Masculino' && data.genero !== 'Femenino')) {
      throw new ValidationError('El género es obligatorio y debe ser "Masculino" o "Femenino"');
    }

    // Optional fields - Datos Personales
    if (data.nombreSegundo && data.nombreSegundo.trim().length < 2) {
      throw new ValidationError('El segundo nombre debe tener al menos 2 caracteres');
    }

    if (data.telefono2) {
      this.validateTelefono(data.telefono2);
    }

    if (data.email) {
      this.validateEmail(data.email);
    }
  }

  // Validate partial tramite data (for updates/corrections)
  static validatePartial(data: Partial<CrearTramiteRequest>): void {
    // Only validate fields that are present

    if (data.dn !== undefined) {
      this.validateDN(data.dn);
    }

    if (data.icc !== undefined) {
      this.validateICC(data.icc);
    }

    if (data.nip !== undefined) {
      this.validateNIP(data.nip);
    }

    if (data.fvcFecha !== undefined) {
      this.validateFVCFecha(data.fvcFecha);
    }

    if (data.nombre !== undefined) {
      if (data.nombre.trim().length < 2) {
        throw new ValidationError('El nombre debe tener al menos 2 caracteres');
      }
    }

    if (data.apellidoPaterno !== undefined) {
      if (data.apellidoPaterno.trim().length < 2) {
        throw new ValidationError('El apellido paterno debe tener al menos 2 caracteres');
      }
    }

    if (data.apellidoMaterno !== undefined && data.apellidoMaterno.trim().length > 0) {
      // Allow 'R' as special case (default value when no maternal surname)
      if (data.apellidoMaterno.trim() !== 'R' && data.apellidoMaterno.trim().length < 2) {
        throw new ValidationError('El apellido materno debe tener al menos 2 caracteres');
      }
    }

    if (data.curp !== undefined) {
      this.validateCURP(data.curp);
    }

    if (data.telefono !== undefined) {
      this.validateTelefono(data.telefono);
    }

    if (data.telefono2 !== undefined) {
      this.validateTelefono(data.telefono2);
    }

    if (data.fechaNacimiento !== undefined) {
      this.validateFechaNacimiento(data.fechaNacimiento);
    }

    if (data.genero !== undefined) {
      if (data.genero !== 'Masculino' && data.genero !== 'Femenino') {
        throw new ValidationError('El género debe ser "Masculino" o "Femenino"');
      }
    }

    if (data.nombreSegundo !== undefined && data.nombreSegundo.trim().length < 2) {
      throw new ValidationError('El segundo nombre debe tener al menos 2 caracteres');
    }

    if (data.email !== undefined && data.email.trim().length > 0) {
      this.validateEmail(data.email);
    }
  }

  // Sanitize and normalize data
  static sanitizeTramite(data: CrearTramiteRequest): CrearTramiteRequest {
    // Clean ICC (remove trailing F)
    const cleanedICC = this.validateICC(data.icc);

    return {
      dn: data.dn.trim(),
      icc: cleanedICC, // ICC cleaned and validated
      fvcFecha: data.fvcFecha.trim(),
      nip: data.nip.trim(),
      nombre: data.nombre.trim().toUpperCase(),
      nombreSegundo: data.nombreSegundo ? data.nombreSegundo.trim().toUpperCase() : undefined,
      apellidoPaterno: data.apellidoPaterno.trim().toUpperCase(),
      apellidoMaterno: data.apellidoMaterno ? data.apellidoMaterno.trim().toUpperCase() : undefined,
      curp: data.curp.trim().toUpperCase(),
      telefono: data.telefono.trim(),
      telefono2: data.telefono2 ? data.telefono2.trim() : undefined,
      genero: data.genero as 'Masculino' | 'Femenino',
      email: data.email ? data.email.trim().toLowerCase() : undefined,
      fechaNacimiento: data.fechaNacimiento.trim(),
    };
  }
}
