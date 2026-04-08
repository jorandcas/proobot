/**
 * FVC Date Calculator
 * Calcula las fechas FVC disponibles según las reglas de negocio:
 * - Si es antes de las 5 PM: siguientes 5 días hábiles (sin contar domingos ni días feriados)
 * - Si es después de las 5 PM: 5 días hábiles comenzando 48 horas hábiles después (sin contar domingos ni días feriados)
 * - Días feriados: 1 ene, 2 feb, 16 mar, 1 may, 16 sep, 16 nov, 25 dic
 */
export interface FVCDateOption {
    fecha: string;
    indice: number;
    label: string;
}
export declare class FVCUtil {
    /**
     * Días feriados (mes: 0-11, día: 1-31)
     */
    private static DIAS_FERIADOS;
    /**
     * Verifica si una fecha es día hábil (no domingo ni feriado)
     */
    private static esDiaHabil;
    /**
     * Calcula las horas hábiles restantes del día actual
     * Si el día actual no es hábil, retorna 0
     */
    private static getHorasHabilesRestantesHoy;
    /**
     * Agrega horas hábiles a una fecha
     * Solo cuenta horas de días hábiles (lunes-sábado no feriados)
     */
    private static agregarHorasHabiles;
    /**
     * Obtiene las fechas FVC disponibles basándose en la fecha y hora actual
     */
    static getFVCFechasDisponibles(): FVCDateOption[];
    /**
     * Convierte una fecha al formato DD/MM/YYYY
     */
    static formatDate(date: Date): string;
    /**
     * Formatea la fecha para mostrar al usuario
     */
    static formatDateLabel(date: Date): string;
    /**
     * Calcula el índice basado en la fecha seleccionada
     * Devuelve el índice (1-5) correspondiente a la fecha dentro de las opciones disponibles
     */
    static getIndiceFromFecha(fechaSeleccionada: string): number;
}
//# sourceMappingURL=fvc.util.d.ts.map