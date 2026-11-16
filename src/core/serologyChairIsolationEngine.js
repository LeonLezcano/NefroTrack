/**
 * serologyChairIsolationEngine.js — Matriz de Aislamiento Serológico y Asignación de Sillones
 * AiAppFactory Standard (Engine #295)
 * Prevención Estricta de Infecciones Cruzadas en Diálisis (Res. 810/2000 Ministerio de Salud)
 */

export const SEROLOGY_TYPES = {
  SERONEGATIVE: 'SERONEGATIVE', // Serología negativa (HBsAg-, HCV-, HIV-) -> Sala General / Blanca
  HBSAG_POSITIVE: 'HBSAG_POSITIVE', // Antígeno de Superficie Hepatitis B Positivo -> Aislamiento Estricto
  HCV_REACTIVE: 'HCV_REACTIVE', // Hepatitis C Reactivo -> Cohorte o Sala Amarilla
  HIV_REACTIVE: 'HIV_REACTIVE', // HIV Reactivo -> Área Designada / Precauciones Universales
  PENDING_UNKNOWN: 'PENDING_UNKNOWN' // Serología sin resultado confirmado
};

export const ROOM_SECTORS = {
  GENERAL_WHITE: 'GENERAL_WHITE', // Sala Blanca / General para seronegativos
  ISOLATION_HBV: 'ISOLATION_HBV', // Sala de aislamiento exclusivo HBsAg+ con monitor dedicado
  COHORT_HCV: 'COHORT_HCV' // Sector o sala de cohorte Hepatitis C
};

export class SerologyChairIsolationEngine {
  /**
   * Valida la asignación de un paciente a un sillón o sala según su estatus serológico
   * @param {object} params
   * @param {string} params.patientId - Identificador del paciente
   * @param {string} params.patientName - Nombre del paciente
   * @param {string} params.serologyType - Tipo serológico del paciente (SERONEGATIVE, HBSAG_POSITIVE, etc.)
   * @param {string} params.assignedRoomSector - Sector de sala asignado (GENERAL_WHITE, ISOLATION_HBV, COHORT_HCV)
   * @param {string} params.chairNumber - Número de sillón / máquina
   * @param {Date|string} [params.lastSerologyDate] - Fecha del último panel serológico (trimestral obligatorio)
   * @returns {object}
   */
  static validateChairAssignment({
    patientId,
    patientName,
    serologyType = SEROLOGY_TYPES.SERONEGATIVE,
    assignedRoomSector = ROOM_SECTORS.GENERAL_WHITE,
    chairNumber,
    lastSerologyDate
  }) {
    if (!patientId || !chairNumber) {
      throw new Error('Paciente y número de sillón son requeridos para validar asignación');
    }

    // 1. Verificación de vigencia serológica trimestral (máximo 90 días por norma INCUCAI)
    let isSerologyExpired = false;
    let daysSinceLastTest = 0;
    if (lastSerologyDate) {
      const testTime = new Date(lastSerologyDate).getTime();
      const diffMs = Date.now() - testTime;
      daysSinceLastTest = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (daysSinceLastTest > 90) {
        isSerologyExpired = true;
      }
    }

    // 2. Matriz de validación biológica
    let isPermitted = true;
    let violationLevel = 'NONE';
    let message = 'Asignación de sillón biológicamente compatible.';

    if (serologyType === SEROLOGY_TYPES.HBSAG_POSITIVE) {
      // Paciente Hepatitis B+ DEBE estar en aislamiento estricto
      if (assignedRoomSector !== ROOM_SECTORS.ISOLATION_HBV) {
        isPermitted = false;
        violationLevel = 'CRITICAL';
        message = `VIOLACIÓN BIOLÓGICA CRÍTICA: El paciente ${patientName || patientId} es HBsAg Positivo (Hepatitis B) y NO puede dializarse en ${assignedRoomSector}. Exige sala de aislamiento exclusiva según Res. 810/2000.`;
      }
    } else if (serologyType === SEROLOGY_TYPES.HCV_REACTIVE) {
      // Paciente Hepatitis C reactivo no debe mezclarse con seronegativos en sala blanca
      if (assignedRoomSector === ROOM_SECTORS.GENERAL_WHITE) {
        isPermitted = false;
        violationLevel = 'HIGH';
        message = `VIOLACIÓN DE AISLAMIENTO: El paciente ${patientName || patientId} presenta serología reactiva para Hepatitis C. Debe asignarse al sector de cohorte ${ROOM_SECTORS.COHORT_HCV} para evitar infecciones intrahospitalarias.`;
      }
    } else if (serologyType === SEROLOGY_TYPES.SERONEGATIVE) {
      // Paciente seronegativo NO debe ubicarse en sala de aislamiento HBV
      if (assignedRoomSector === ROOM_SECTORS.ISOLATION_HBV) {
        isPermitted = false;
        violationLevel = 'CRITICAL';
        message = `RIESGO DE INFECCIÓN GRAVE: Se asignó al paciente SERONEGATIVO ${patientName || patientId} a la sala de aislamiento de Hepatitis B (${ROOM_SECTORS.ISOLATION_HBV}). Riesgo inminente de contagio viral.`;
      }
    }

    return {
      patientId,
      patientName,
      serologyType,
      assignedRoomSector,
      chairNumber,
      isPermitted,
      violationLevel,
      message,
      isSerologyExpired,
      daysSinceLastTest,
      requiresQuarterlyUpdate: isSerologyExpired
    };
  }
}
