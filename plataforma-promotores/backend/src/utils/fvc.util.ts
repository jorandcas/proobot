/**
 * FVC Date Calculator
 * Calcula las fechas FVC disponibles según las reglas de negocio:
 * - Si es antes de las 5 PM: siguientes 5 días hábiles (sin contar domingos ni días feriados)
 * - Si es después de las 5 PM: 5 días hábiles comenzando 48 horas hábiles después (sin contar domingos ni días feriados)
 * - Días feriados: 1 ene, 2 feb, 16 mar, 1 may, 16 sep, 16 nov, 25 dic
 */

export interface FVCDateOption {
  fecha: string; // DD/MM/YYYY
  indice: number; // 1-5 para compatibilidad con el bot
  label: string; // Formato legible
}

export class FVCUtil {
  /**
   * Días feriados (mes: 0-11, día: 1-31)
   */
  private static DIAS_FERIADOS = [
    { mes: 0, dia: 1 },   // 1 de enero
    { mes: 1, dia: 2 },   // 2 de febrero
    { mes: 2, dia: 16 },  // 16 de marzo
    { mes: 4, dia: 1 },   // 1 de mayo
    { mes: 8, dia: 16 },  // 16 de septiembre
    { mes: 10, dia: 16 }, // 16 de noviembre
    { mes: 11, dia: 25 }, // 25 de diciembre
  ];

  /**
   * Verifica si una fecha es día hábil (no domingo ni feriado)
   */
  private static esDiaHabil(fecha: Date): boolean {
    // Domingo (día 0 de la semana)
    if (fecha.getDay() === 0) {
      return false;
    }

    // Verificar si es día feriado
    const mes = fecha.getMonth();
    const dia = fecha.getDate();
    const esFeriado = this.DIAS_FERIADOS.some(f => f.mes === mes && f.dia === dia);

    return !esFeriado;
  }

  /**
   * Calcula las horas hábiles restantes del día actual
   * Si el día actual no es hábil, retorna 0
   */
  private static getHorasHabilesRestantesHoy(fecha: Date): number {
    if (!this.esDiaHabil(fecha)) {
      return 0;
    }

    // Si no es día hábil, retornar 0
    if (fecha.getDay() === 0) {
      return 0;
    }

    // Calcular horas hasta medianoche
    const horasPasadas = fecha.getHours() + fecha.getMinutes() / 60;
    return Math.max(0, 24 - horasPasadas);
  }

  /**
   * Agrega horas hábiles a una fecha
   * Solo cuenta horas de días hábiles (lunes-sábado no feriados)
   */
  private static agregarHorasHabiles(fecha: Date, horasAgregar: number): Date {
    let segundosRestantes = horasAgregar * 3600; // Convertir a segundos
    let fechaActual = new Date(fecha);

    while (segundosRestantes > 0) {
      // Saltar días no hábiles (domingos y feriados)
      while (!this.esDiaHabil(fechaActual)) {
        fechaActual.setHours(0, 0, 0, 0);
        fechaActual.setDate(fechaActual.getDate() + 1);
      }

      // Calcular segundos restantes hasta medianoche del día actual
      const segundosEnDia =
        (24 - fechaActual.getHours()) * 3600 -
        fechaActual.getMinutes() * 60 -
        fechaActual.getSeconds();

      // Determinar cuántos segundos usar (no exceder el día)
      const segundosUsar = Math.min(segundosRestantes, segundosEnDia);

      // Crear nueva fecha con el tiempo avanzado
      const nuevoTiempo = fechaActual.getTime() + (segundosUsar * 1000);
      fechaActual = new Date(nuevoTiempo);

      segundosRestantes -= segundosUsar;
    }

    return fechaActual;
  }

  /**
   * Obtiene las fechas FVC disponibles basándose en la fecha y hora actual
   */
  static getFVCFechasDisponibles(): FVCDateOption[] {
    const now = new Date();
    const hour = now.getHours();

    // Determinar si es antes o después de las 5 PM
    const esDespuesDe5PM = hour >= 17;

    // Calcular fecha de inicio
    let fechaInicio: Date;

    if (esDespuesDe5PM) {
      // Después de las 5 PM: comenzar 48 horas hábiles después
      // Contamos solo horas de días hábiles (excluyendo domingos y feriados)
      fechaInicio = this.agregarHorasHabiles(now, 48);
    } else {
      // Antes de las 5 PM: comenzar mañana (si es hábil)
      fechaInicio = new Date(now);
      fechaInicio.setDate(fechaInicio.getDate() + 1);
      fechaInicio.setHours(0, 0, 0, 0);

      // Si mañana no es día hábil, buscar el siguiente día hábil
      while (!this.esDiaHabil(fechaInicio)) {
        fechaInicio.setDate(fechaInicio.getDate() + 1);
      }
    }

    // Obtener 5 días hábiles (sin contar domingos ni días feriados)
    const fechas: FVCDateOption[] = [];
    let fechaActual = new Date(fechaInicio);
    fechaActual.setHours(0, 0, 0, 0);
    let indice = 1;

    while (fechas.length < 5) {
      // Solo agregar días hábiles
      if (this.esDiaHabil(fechaActual)) {
        fechas.push({
          fecha: this.formatDate(fechaActual),
          indice: indice,
          label: this.formatDateLabel(fechaActual),
        });
        indice++;
      }

      // Avanzar al siguiente día
      fechaActual = new Date(fechaActual);
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return fechas;
  }

  /**
   * Convierte una fecha al formato DD/MM/YYYY
   */
  static formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Formatea la fecha para mostrar al usuario
   */
  static formatDateLabel(date: Date): string {
    const dias = [
      'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
    ];
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const diaSemana = dias[date.getDay()];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const año = date.getFullYear();

    return `${diaSemana} ${dia} de ${mes} de ${año}`;
  }

  /**
   * Calcula el índice basado en la fecha seleccionada
   * Devuelve el índice (1-5) correspondiente a la fecha dentro de las opciones disponibles
   */
  static getIndiceFromFecha(fechaSeleccionada: string): number {
    const opciones = this.getFVCFechasDisponibles();
    const opcion = opciones.find(op => op.fecha === fechaSeleccionada);

    if (!opcion) {
      throw new Error('La fecha seleccionada no está entre las opciones disponibles');
    }

    return opcion.indice;
  }
}
