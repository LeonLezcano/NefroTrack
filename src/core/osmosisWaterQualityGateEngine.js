/**
 * osmosisWaterQualityGateEngine.js — Gate Matutino Bloqueante de Calidad de Agua de Ósmosis
 * AiAppFactory Standard (Engine #307 / #115)
 * Estándar Farmacopea Argentina, AAMI/ISO 23500 y Res. Ministerio de Salud
 */

import { CryptoSeal } from '../utils/cryptoSeal.js';

export const WATER_QUALITY_THRESHOLDS = {
  MAX_CHLORAMINES_PPM: 0.10, // Límite estricto absoluto: Cloraminas >= 0.1 mg/L causan hemólisis fatal
  MAX_FREE_CHLORINE_PPM: 0.50, // Cloro libre máximo
  MAX_PERMEATE_CONDUCTIVITY_US: 15.0, // Conductividad máxima óptima en agua permeada de ósmosis (µS/cm)
  ABSOLUTE_MAX_CONDUCTIVITY_US: 25.0, // Límite de corte crítico de conductividad
  MAX_TOTAL_HARDNESS_PPM: 0, // Dureza total tras ablandador iónico (debe ser 0 ppm CaCO3)
  MIN_LOOP_PRESSURE_BAR: 2.0, // Presión mínima del anillo de distribución a sillones
  MAX_LOOP_PRESSURE_BAR: 4.5, // Presión máxima del anillo
  MIN_WATER_TEMP_C: 15.0,
  MAX_WATER_TEMP_C: 25.0
};

export const WATER_GATE_STATUS = {
  GATE_APPROVED_OPEN: 'GATE_APPROVED_OPEN', // Todos los parámetros dentro de norma. Sala habilitada.
  GATE_LOCKED_CHLORAMINES_HIGH: 'GATE_LOCKED_CHLORAMINES_HIGH', // Bloqueo crítico por cloraminas
  GATE_LOCKED_CONDUCTIVITY_HIGH: 'GATE_LOCKED_CONDUCTIVITY_HIGH', // Bloqueo crítico por conductividad
  GATE_LOCKED_HARDNESS_FAIL: 'GATE_LOCKED_HARDNESS_FAIL', // Falla en ablandador iónico
  GATE_WARNING_PRESSURE: 'GATE_WARNING_PRESSURE' // Alerta por presión anormal de anillo
};

export class OsmosisWaterQualityGateEngine {
  /**
   * Evalúa los parámetros físico-químicos del agua tratada para diálisis
   * @param {object} params
   * @param {number} params.chloraminesPpm - Concentración de cloraminas totales (mg/L o ppm)
   * @param {number} [params.freeChlorinePpm=0.02] - Concentración de cloro libre
   * @param {number} params.permeateConductivityUs - Conductividad del permeado (µS/cm)
   * @param {number} [params.totalHardnessPpm=0] - Dureza total (ppm)
   * @param {number} [params.loopPressureBar=2.8] - Presión del anillo a máquinas (bar)
   * @param {number} [params.waterTemperatureC=20] - Temperatura del agua (°C)
   * @returns {object}
   */
  static evaluateWaterGate({
    chloraminesPpm,
    freeChlorinePpm = 0.02,
    permeateConductivityUs,
    totalHardnessPpm = 0,
    loopPressureBar = 2.8,
    waterTemperatureC = 20
  }) {
    const chloramines = Number(chloraminesPpm);
    const freeChlorine = Number(freeChlorinePpm);
    const conductivity = Number(permeateConductivityUs);
    const hardness = Number(totalHardnessPpm);
    const pressure = Number(loopPressureBar);
    const temp = Number(waterTemperatureC);

    if (isNaN(chloramines) || isNaN(conductivity)) {
      throw new Error('Parámetros críticos de cloraminas y conductividad requeridos para evaluar ósmosis');
    }

    const isChloraminesCrit = chloramines >= WATER_QUALITY_THRESHOLDS.MAX_CHLORAMINES_PPM;
    const isConductivityCrit = conductivity > WATER_QUALITY_THRESHOLDS.ABSOLUTE_MAX_CONDUCTIVITY_US;
    const isHardnessFail = hardness > WATER_QUALITY_THRESHOLDS.MAX_TOTAL_HARDNESS_PPM;
    const isPressureAbnormal = pressure < WATER_QUALITY_THRESHOLDS.MIN_LOOP_PRESSURE_BAR || pressure > WATER_QUALITY_THRESHOLDS.MAX_LOOP_PRESSURE_BAR;

    let isGateOpen = true;
    let status = WATER_GATE_STATUS.GATE_APPROVED_OPEN;
    let alertLevel = 'GREEN';
    let blockReason = 'Planta de agua tratada conforme. Sala de hemodiálisis habilitada para conectar pacientes.';

    if (isChloraminesCrit) {
      isGateOpen = false;
      status = WATER_GATE_STATUS.GATE_LOCKED_CHLORAMINES_HIGH;
      alertLevel = 'CRITICAL_RED';
      blockReason = `BLOQUEO CRÍTICO DE SALA: Cloraminas medidas en ${chloramines} mg/L (máximo permitido < ${WATER_QUALITY_THRESHOLDS.MAX_CHLORAMINES_PPM} mg/L). Riesgo inminente de hemólisis y metahemoglobinemia. Filtros de carbón activado agotados; PROHIBIDO INICIAR EL TURNO.`;
    } else if (isConductivityCrit) {
      isGateOpen = false;
      status = WATER_GATE_STATUS.GATE_LOCKED_CONDUCTIVITY_HIGH;
      alertLevel = 'CRITICAL_RED';
      blockReason = `BLOQUEO CRÍTICO DE SALA: Conductividad de permeado en ${conductivity} µS/cm (límite absoluto < ${WATER_QUALITY_THRESHOLDS.ABSOLUTE_MAX_CONDUCTIVITY_US} µS/cm). Membrana de ósmosis saturada o fisurada.`;
    } else if (isHardnessFail) {
      isGateOpen = false;
      status = WATER_GATE_STATUS.GATE_LOCKED_HARDNESS_FAIL;
      alertLevel = 'RED';
      blockReason = `BLOQUEO PREVENTIVO: Dureza detectada en ${hardness} ppm (debe ser 0 ppm). Falla de regeneración del ablandador iónico.`;
    } else if (isPressureAbnormal) {
      status = WATER_GATE_STATUS.GATE_WARNING_PRESSURE;
      alertLevel = 'YELLOW';
      blockReason = `ADVERTENCIA: Presión de anillo (${pressure} bar) fuera de rango recomendado (${WATER_QUALITY_THRESHOLDS.MIN_LOOP_PRESSURE_BAR} - ${WATER_QUALITY_THRESHOLDS.MAX_LOOP_PRESSURE_BAR} bar). Monitorear alimentación a monitores.`;
    }

    return {
      chloraminesPpm: chloramines,
      freeChlorinePpm: freeChlorine,
      permeateConductivityUs: conductivity,
      totalHardnessPpm: hardness,
      loopPressureBar: pressure,
      waterTemperatureC: temp,
      isGateOpen,
      status,
      alertLevel,
      blockReason,
      evaluationTimestamp: new Date().toISOString()
    };
  }

  /**
   * Emite el certificado de apertura de turno de planta de agua con sello SHA-256
   * @param {object} gateData
   * @param {string} shiftName - Turno 1 (Mañana 06:00), Turno 2 (Tarde 11:30), etc.
   * @param {string} technicianName - Nombre del técnico de ósmosis / enfermero a cargo
   * @returns {Promise<object>}
   */
  static async certifyWaterGate(gateData, shiftName, technicianName) {
    const timestamp = new Date().toISOString();
    const payload = {
      recordId: `H2O-GATE-${Date.now().toString(36).toUpperCase()}`,
      shiftName: shiftName || 'Turno Mañana (06:00)',
      technicianName: technicianName || 'Técnico de Planta',
      ...gateData,
      certifiedAt: timestamp,
      standard: 'Farmacopea Argentina / AAMI-ISO 23500'
    };

    const cryptoSeal = await CryptoSeal.hashSHA256(payload);

    return {
      ...payload,
      cryptoSeal
    };
  }
}
