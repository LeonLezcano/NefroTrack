/**
 * pamiDialysisModuleService.js — Liquidación de Módulos Mensuales PAMI & Obras Sociales
 * AiAppFactory Standard (Engine #134 / #245)
 * Cero Débitos en Facturación de Hemodiálisis Crónica
 */

import { CryptoSeal } from '../utils/cryptoSeal.js';

export const PAMI_TARIFFS = {
  SESSION_UNIT_ARS: 145000, // Valor referencial de sesión de hemodiálisis (ARS)
  MONTHLY_SESSIONS_CHRONIC: 13, // 13 sesiones mensuales del esquema trisemanal estándar
  EPO_4000_UNIT_ARS: 18500, // Eritropoyetina 4000 UI
  IRON_100MG_UNIT_ARS: 14200, // Hierro sacarato 100 mg IV
  TRANSPORT_AMBULATORY_MONTH_ARS: 120000,
  TRANSPORT_WHEELCHAIR_MONTH_ARS: 210000,
  TRANSPORT_STRETCHER_MONTH_ARS: 380000
};

export class PamiDialysisModuleService {
  /**
   * Consolida el módulo mensual de hemodiálisis para un paciente
   * @param {object} params
   * @param {string} params.patientId - DNI o Beneficio PAMI
   * @param {string} params.patientName - Nombre y apellido
   * @param {string} params.monthPeriod - Periodo (ej. "2026-11")
   * @param {Array<object>} params.sessions - Lista de sesiones registradas en el mes
   * @param {number} [params.epoDosesCount=12] - Dosis de EPO administradas
   * @param {number} [params.ironDosesCount=4] - Dosis de Hierro IV administradas
   * @param {string} [params.transportType='AMBULATORY'] - AMBULATORY, WHEELCHAIR, STRETCHER, NONE
   * @param {number} [params.latestKtv=1.35] - Último Kt/V registrado
   * @param {boolean} [params.serologyUpToDate=true] - Si la serología trimestral está vigente
   * @returns {object}
   */
  static generateMonthlyBillingBatch({
    patientId,
    patientName,
    monthPeriod,
    sessions = [],
    epoDosesCount = 12,
    ironDosesCount = 4,
    transportType = 'AMBULATORY',
    latestKtv = 1.35,
    serologyUpToDate = true
  }) {
    if (!patientId || !monthPeriod) {
      throw new Error('Identificador de paciente y periodo mensual requeridos');
    }

    const sessionsCount = sessions.length;
    const completedSessionsCount = sessions.filter(s => s.status === 'COMPLETED').length;
    const signedSessionsCount = sessions.filter(s => s.isSigned && s.sessionSeal).length;

    const baseSessionsTotalArs = completedSessionsCount * PAMI_TARIFFS.SESSION_UNIT_ARS;
    const epoTotalArs = (Number(epoDosesCount) || 0) * PAMI_TARIFFS.EPO_4000_UNIT_ARS;
    const ironTotalArs = (Number(ironDosesCount) || 0) * PAMI_TARIFFS.IRON_100MG_UNIT_ARS;

    let transportTotalArs = 0;
    if (transportType === 'AMBULATORY') transportTotalArs = PAMI_TARIFFS.TRANSPORT_AMBULATORY_MONTH_ARS;
    else if (transportType === 'WHEELCHAIR') transportTotalArs = PAMI_TARIFFS.TRANSPORT_WHEELCHAIR_MONTH_ARS;
    else if (transportType === 'STRETCHER') transportTotalArs = PAMI_TARIFFS.TRANSPORT_STRETCHER_MONTH_ARS;

    const grandTotalModuleArs = baseSessionsTotalArs + epoTotalArs + ironTotalArs + transportTotalArs;

    // Auditoría de Riesgo de Débito PAMI
    const debitRiskFlags = [];
    if (signedSessionsCount < completedSessionsCount) {
      debitRiskFlags.push({
        code: 'DEBIT_RISK_UNSIGNED_SESSIONS',
        severity: 'CRITICAL',
        description: `Existen ${completedSessionsCount - signedSessionsCount} sesiones completadas sin firma digital ni sello criptográfico.`
      });
    }
    if (!serologyUpToDate) {
      debitRiskFlags.push({
        code: 'DEBIT_RISK_EXPIRED_SEROLOGY',
        severity: 'HIGH',
        description: 'Serología trimestral vencida o no cargada en el periodo normativo.'
      });
    }
    if (latestKtv < 1.20) {
      debitRiskFlags.push({
        code: 'DEBIT_RISK_LOW_KTV',
        severity: 'MEDIUM',
        description: `Adecuación dialítica (${latestKtv}) inferior a 1.2. Requiere justificación médica en resumen de historia clínica.`
      });
    }

    const isAuditClean = debitRiskFlags.length === 0;

    return {
      batchId: `PAMI-${patientId}-${monthPeriod}`,
      patientId,
      patientName,
      monthPeriod,
      completedSessionsCount,
      signedSessionsCount,
      targetMonthlySessions: PAMI_TARIFFS.MONTHLY_SESSIONS_CHRONIC,
      baseSessionsTotalArs,
      medications: {
        epoDosesCount,
        epoTotalArs,
        ironDosesCount,
        ironTotalArs
      },
      transport: {
        transportType,
        transportTotalArs
      },
      grandTotalModuleArs,
      isAuditClean,
      debitRiskFlags,
      status: isAuditClean ? 'READY_FOR_SUBMISSION' : 'REVIEW_REQUIRED',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Genera el sello oficial del lote de facturación para cierre de mes
   * @param {object} batchData
   * @returns {Promise<object>}
   */
  static async signAndSealBatch(batchData) {
    const payload = {
      batchId: batchData.batchId,
      patientId: batchData.patientId,
      monthPeriod: batchData.monthPeriod,
      grandTotalModuleArs: batchData.grandTotalModuleArs,
      completedSessionsCount: batchData.completedSessionsCount,
      timestamp: new Date().toISOString()
    };

    const batchCryptoSeal = await CryptoSeal.hashSHA256(payload);

    return {
      ...batchData,
      batchCryptoSeal,
      isCertified: true
    };
  }
}
