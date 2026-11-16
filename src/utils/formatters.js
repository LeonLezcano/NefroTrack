/**
 * formatters.js — Formateadores para registros médicos y de planta en Nefrología
 * AiAppFactory Standard
 */

export class Formatters {
  /**
   * Formatea peso en kilogramos (kg)
   * @param {number} val
   * @param {number} decimals
   * @returns {string}
   */
  static formatKg(val, decimals = 1) {
    const num = Number(val) || 0;
    return `${num.toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })} kg`;
  }

  /**
   * Formatea volumen en mililitros (mL)
   * @param {number} val
   * @returns {string}
   */
  static formatMl(val) {
    const num = Math.round(Number(val) || 0);
    return `${num.toLocaleString('es-AR')} mL`;
  }

  /**
   * Formatea porcentaje de FFV (Residual Fiber Volume)
   * @param {number} val
   * @returns {string}
   */
  static formatFfv(val) {
    const num = Number(val) || 0;
    return `${num.toFixed(1)}%`;
  }

  /**
   * Formatea conductividad de agua tratada en microSiemens por cm (µS/cm)
   * @param {number} val
   * @returns {string}
   */
  static formatConductivity(val) {
    const num = Number(val) || 0;
    return `${num.toFixed(1)} µS/cm`;
  }

  /**
   * Formatea concentración de cloraminas en mg/L (ppm)
   * @param {number} val
   * @returns {string}
   */
  static formatChloramines(val) {
    const num = Number(val) || 0;
    return `${num.toFixed(2)} mg/L`;
  }

  /**
   * Formatea presión arterial (Sistólica/Diastólica en mmHg)
   * @param {number} systolic
   * @param {number} diastolic
   * @returns {string}
   */
  static formatBloodPressure(systolic, diastolic) {
    const s = Math.round(Number(systolic) || 0);
    const d = Math.round(Number(diastolic) || 0);
    return `${s}/${d} mmHg`;
  }

  /**
   * Formatea tasa de ultrafiltración horaria (mL/kg/h)
   * @param {number} val
   * @returns {string}
   */
  static formatUfRate(val) {
    const num = Number(val) || 0;
    return `${num.toFixed(1)} mL/kg/h`;
  }

  /**
   * Formatea moneda argentina (ARS)
   * @param {number} val
   * @returns {string}
   */
  static formatCurrencyARS(val) {
    const num = Number(val) || 0;
    return num.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    });
  }

  /**
   * Formatea fecha y hora local argentina
   * @param {Date|string|number} date
   * @returns {string}
   */
  static formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatea duración en minutos a "Xh Ym"
   * @param {number} minutes
   * @returns {string}
   */
  static formatMinutes(minutes) {
    const total = Math.max(0, Math.floor(Number(minutes) || 0));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h === 0) return `${m} min`;
    return `${h}h ${m}m`;
  }
}

export const formatKg = Formatters.formatKg;
export const formatMl = Formatters.formatMl;
export const formatFfv = Formatters.formatFfv;
export const formatConductivity = Formatters.formatConductivity;
export const formatChloramines = Formatters.formatChloramines;
export const formatBloodPressure = Formatters.formatBloodPressure;
export const formatUfRate = Formatters.formatUfRate;
export const formatARS = Formatters.formatCurrencyARS;
export const formatDateTime = Formatters.formatDateTime;
export const formatMinutes = Formatters.formatMinutes;
