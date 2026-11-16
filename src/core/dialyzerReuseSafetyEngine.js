/**
 * dialyzerReuseSafetyEngine.js — Centinela de Trazabilidad y Reuso de Filtros Capilares
 * AiAppFactory Standard (Engine #130 / #121)
 * Cumplimiento Normativo INCUCAI / Ministerio de Salud de la Nación
 */

import { CryptoSeal } from '../utils/cryptoSeal.js';

export const REUSE_NORMATIVE_LIMITS = {
  MIN_FFV_PERCENT: 80.0, // Límite estricto: Menos del 80% del volumen inicial exige descarte inmediato
  MAX_REUSES_DEFAULT: 12, // Límite reglamentario típico en centros de diálisis argentinos
  MIN_BASELINE_ML: 60, // Volumen inicial mínimo de un dializador de adultos (mL)
  MAX_BASELINE_ML: 160 // Volumen inicial máximo típico (ej. 1.8m2 a 2.1m2 superficie)
};

export const DIALYZER_STATUS = {
  AUTHORIZED_READY: 'AUTHORIZED_READY', // FFV >= 80%, reusos < max, esterilizado y neutralizado
  REJECTED_LOW_FFV: 'REJECTED_LOW_FFV', // FFV < 80% (Capilar coagulado/obstruido)
  REJECTED_MAX_REUSES: 'REJECTED_MAX_REUSES', // Superó el tope de reprocesamientos
  REJECTED_CHEMICAL_RESIDUAL: 'REJECTED_CHEMICAL_RESIDUAL', // Tira reactiva positiva a ácido peracético
  DISCARDED: 'DISCARDED'
};

export class DialyzerReuseSafetyEngine {
  /**
   * Evalúa la aptitud de reuso de un filtro dializador capilar
   * @param {object} params
   * @param {string} params.dialyzerId - Código de barra o QR unívoco del filtro
   * @param {string} params.dialyzerPatientId - DNI o ID del paciente asignado al filtro
   * @param {string} params.targetPatientId - DNI o ID del paciente que va a ser conectado
   * @param {number} params.baselineVolumeMl - Volumen residual inicial calibrado (priming volume)
   * @param {number} params.measuredVolumeMl - Volumen residual medido tras reprocesamiento
   * @param {number} params.currentReuses - Cantidad de reusos realizados previo a la sesión
   * @param {number} [params.maxReuses=12] - Límite máximo de reusos admitido por el centro
   * @param {boolean} [params.peraceticTestNegative=true] - Tira reactiva de control de neutralización negativa
   * @returns {object}
   */
  static evaluateDialyzerClearance({
    dialyzerId,
    dialyzerPatientId,
    targetPatientId,
    baselineVolumeMl,
    measuredVolumeMl,
    currentReuses = 0,
    maxReuses = REUSE_NORMATIVE_LIMITS.MAX_REUSES_DEFAULT,
    peraceticTestNegative = true
  }) {
    if (!dialyzerId) {
      throw new Error('Identificador de dializador requerido');
    }

    // 1. Invariante Inquebrantable de Seguridad Biológica: Correspondencia Paciente-Filtro
    const isPatientMatch = Boolean(
      dialyzerPatientId &&
      targetPatientId &&
      String(dialyzerPatientId).trim().toUpperCase() === String(targetPatientId).trim().toUpperCase()
    );

    if (!isPatientMatch) {
      return {
        dialyzerId,
        isAuthorized: false,
        status: 'BLOCKED_PATIENT_MISMATCH',
        alertLevel: 'CRITICAL_RED',
        reason: `BLOQUEO BIOLÓGICO GRAVE: El filtro ${dialyzerId} pertenece al paciente ${dialyzerPatientId} y se intentó asignar al paciente ${targetPatientId}. Riesgo severo de contaminación cruzada.`
      };
    }

    const baseline = Number(baselineVolumeMl);
    const measured = Number(measuredVolumeMl);
    const reuses = Math.max(0, Number(currentReuses) || 0);
    const maxAllowed = Math.max(1, Number(maxReuses) || REUSE_NORMATIVE_LIMITS.MAX_REUSES_DEFAULT);

    if (!baseline || baseline <= 0 || isNaN(baseline) || isNaN(measured) || measured < 0) {
      throw new Error('Parámetros volumétricos de calibración y medición inválidos');
    }

    // 2. Cálculo de Fiber Bundle Volume (FFV / Priming Volume %)
    const ffvPercent = (measured / baseline) * 100;
    const roundedFfv = Number(ffvPercent.toFixed(1));

    // 3. Validación de límite de reusos
    const isOverMaxReuses = reuses >= maxAllowed;

    // 4. Validación de volumen residual (Criterio >= 80%)
    const isFfvCompliant = roundedFfv >= REUSE_NORMATIVE_LIMITS.MIN_FFV_PERCENT;

    // 5. Validación de ausencia de esterilizante residual (ácido peracético)
    const isChemicalSafe = Boolean(peraceticTestNegative);

    let status = DIALYZER_STATUS.AUTHORIZED_READY;
    let alertLevel = 'GREEN';
    let isAuthorized = true;
    let reason = 'Dializador conforme: volumen de fibras >= 80%, reusos dentro de límite y prueba química neutralizada.';

    if (!isChemicalSafe) {
      status = DIALYZER_STATUS.REJECTED_CHEMICAL_RESIDUAL;
      alertLevel = 'RED';
      isAuthorized = false;
      reason = 'RECHAZO QUÍMICO: Presencia de ácido peracético residual detectada en tira reactiva. Requiere enjuague exhaustivo antes de conexión.';
    } else if (isOverMaxReuses) {
      status = DIALYZER_STATUS.REJECTED_MAX_REUSES;
      alertLevel = 'RED';
      isAuthorized = false;
      reason = `DESCARTE OBLIGATORIO: El filtro alcanzó el límite de ${maxAllowed} reusos normativos. Proceder a baja y reposición de capilar nuevo.`;
    } else if (!isFfvCompliant) {
      status = DIALYZER_STATUS.REJECTED_LOW_FFV;
      alertLevel = 'RED';
      isAuthorized = false;
      reason = `DESCARTE OBLIGATORIO: El volumen residual (${roundedFfv}%) es menor al 80% del volumen inicial (${baseline} mL). Capilar con fibras coaguladas; no garantiza depuración dialítica adecuada.`;
    }

    return {
      dialyzerId,
      patientId: targetPatientId,
      baselineVolumeMl: baseline,
      measuredVolumeMl: measured,
      ffvPercent: roundedFfv,
      minRequiredFfvPercent: REUSE_NORMATIVE_LIMITS.MIN_FFV_PERCENT,
      currentReuses: reuses,
      nextReuseNumber: reuses + 1,
      maxAllowedReuses: maxAllowed,
      isFfvCompliant,
      isOverMaxReuses,
      isChemicalSafe,
      isAuthorized,
      status,
      alertLevel,
      reason,
      mustDiscard: !isAuthorized && (status === DIALYZER_STATUS.REJECTED_LOW_FFV || status === DIALYZER_STATUS.REJECTED_MAX_REUSES)
    };
  }

  /**
   * Genera el registro oficial sellado con hash SHA-256 de reprocesamiento o descarte
   * @param {object} evalData
   * @param {string} operatorName
   * @returns {Promise<object>}
   */
  static async createReprocessingCertificate(evalData, operatorName) {
    const timestamp = new Date().toISOString();
    const payload = {
      certificateId: `REUSE-${evalData.dialyzerId}-${Date.now().toString(36).toUpperCase()}`,
      dialyzerId: evalData.dialyzerId,
      patientId: evalData.patientId,
      ffvPercent: evalData.ffvPercent,
      currentReuses: evalData.currentReuses,
      status: evalData.status,
      isAuthorized: evalData.isAuthorized,
      operatorName: operatorName || 'Técnico de Reprocesamiento',
      timestamp,
      normative: 'INCUCAI / Res. Min. Salud 810/2000'
    };

    const cryptoSeal = await CryptoSeal.hashSHA256(payload);

    return {
      ...payload,
      cryptoSeal
    };
  }
}
