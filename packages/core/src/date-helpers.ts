import { log } from "@poc-login/config";

/**
 * Calcula la fecha FVC dinámicamente según la hora actual
 * - Antes de las 5 PM (17:00): día siguiente
 * - Después de las 5 PM: dentro de 48 horas (2 días después)
 * @returns Fecha en formato DD/MM/YYYY
 */
export function calculateFVCDate(): string {
    const now = new Date();
    const hour = now.getHours();

    // Determinar los días a sumar según la hora
    let daysToAdd: number;
    if (hour < 17) {
        // Antes de las 5 PM: día siguiente (+1)
        daysToAdd = 1;
        log.info(`Hora actual: ${hour}:00 - Antes de las 17:00, usando día siguiente (+1)`);
    } else {
        // Después de las 5 PM: 48 horas (+2 días)
        daysToAdd = 2;
        log.info(`Hora actual: ${hour}:00 - Después de las 17:00, usando 48 horas (+2 días)`);
    }

    // Calcular la fecha futura
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + daysToAdd);

    // Formatear como DD/MM/YYYY
    const day = String(futureDate.getDate()).padStart(2, '0');
    const month = String(futureDate.getMonth() + 1).padStart(2, '0'); // Meses son 0-indexados
    const year = futureDate.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;
    log.success(`✓ Fecha FVC calculada: ${formattedDate} (${daysToAdd} días a partir de hoy)`);

    return formattedDate;
}
