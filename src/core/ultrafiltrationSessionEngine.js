/**
 * ultrafiltrationSessionEngine.js — Cálculo de Ultrafiltración, Tasa Segura y Adecuación Kt/V
 * AiAppFactory Standard (Engine #134 / #309)
 * Guías KDOQI, INCUCAI y Sociedad Argentina de Nefrología (SAN)
 */

export const CLINICAL_THRESHOLDS = {
  MAX_SAFE_UF_RATE_ML_KG_H: 13.0, // Tasa máxima segura de UF para prevenir hipoperfusión miocárdica e hipotensión
  CRITICAL_UF_RATE_ML_KG_H: 15.0, // Tasa crítica de alto riesgo
  MIN_SESSION_DURATION_HOURS: 3.5, // Duración mínima estándar de sesión crónica
  DEFAULT_SESSION_DURATION_HOURS: 4.0, // 240 minutos
  TARGET_KTV_ADEQUACY: 1.20 // Kt/V mínimo de adecuación dialítica KDOQI
};

export class UltrafiltrationSessionEngine {
  /**
   * Calcula el objetivo de ultrafiltración total y valida la tasa horaria de seguridad
   * @param {object} params
   * @param {number} params.preWeightKg - Peso del paciente al ingresar (kg)
   * @param {number} params.dryWeightKg - Peso seco prescrito por el nefrólogo (kg)
   * @param {number} [params.durationMinutes=240] - Duración programada de la sesión en minutos (4h)
   * @param {number} [params.fluidIntakeMl=200] - Ingesta estimada de líquidos / colación durante la diálisis (mL)
   * @param {number} [params.rinseWashbackMl=300] - Volumen de infusión por cebado/lavado final de líneas (mL)
   * @returns {object}
   */
  static calculateUltrafiltrationTarget({
    preWeightKg,
    dryWeightKg,
    durationMinutes = 240,
    fluidIntakeMl = 200,
    rinseWashbackMl = 300
  }) {
    const pre = Number(preWeightKg);
    const dry = Number(dryWeightKg);
    const durationMin = Math.max(60, Number(durationMinutes) || 240);
    const durationHours = durationMin / 60;
    const intake = Math.max(0, Number(fluidIntakeMl) || 0);
    const washback = Math.max(0, Number(rinseWashbackMl) || 0);

    if (isNaN(pre) || isNaN(dry) || pre <= 0 || dry <= 0) {
      throw new Error('Peso pre-diálisis y peso seco deben ser valores numéricos positivos');
    }

    // Ganancia interdiálisis (kg)
    const interdialyticGainKg = Number((pre - dry).toFixed(2));

    // Si el paciente llegó por debajo o igual al peso seco
    let netFluidToRemoveMl = Math.max(0, Math.round(interdialyticGainKg * 1000));
    const totalTargetUfMl = netFluidToRemoveMl + intake + washback;

    // Tasa de Ultrafiltración: mL / (kg de peso seco * horas de diálisis)
    const ufRateMlPerKgH = Number(((totalTargetUfMl / dry) / durationHours).toFixed(1));

    const isExceedingSafeRate = ufRateMlPerKgH > CLINICAL_THRESHOLDS.MAX_SAFE_UF_RATE_ML_KG_H;
    const isCriticalRate = ufRateMlPerKgH > CLINICAL_THRESHOLDS.CRITICAL_UF_RATE_ML_KG_H;

    let rateStatus = 'SAFE';
    let alertLevel = 'GREEN';
    let clinicalRecommendation = 'Tasa de ultrafiltración dentro del rango hemodinámico seguro.';

    if (isCriticalRate) {
      rateStatus = 'CRITICAL_HIGH';
      alertLevel = 'RED';
      clinicalRecommendation = `ALERTA CRÍTICA: Tasa de UF (${ufRateMlPerKgH} mL/kg/h) muy superior al límite de 13 mL/kg/h. Alto riesgo de hipotensión intradiálisis severa, calambres y atontamiento miocárdico. Extender tiempo de sesión a ${(durationHours + 0.5).toFixed(1)}h o reevaluar peso seco.`;
    } else if (isExceedingSafeRate) {
      rateStatus = 'WARNING_HIGH';
      alertLevel = 'YELLOW';
      clinicalRecommendation = `PRECAUCIÓN: Tasa de UF (${ufRateMlPerKgH} mL/kg/h) supera el umbral recomendado de 13 mL/kg/h. Monitorear presión arterial cada 30 minutos.`;
    }

    return {
      preWeightKg: pre,
      dryWeightKg: dry,
      interdialyticGainKg,
      durationMinutes: durationMin,
      durationHours: Number(durationHours.toFixed(2)),
      fluidIntakeMl: intake,
      rinseWashbackMl: washback,
      totalTargetUfMl,
      ufRateMlPerKgH,
      maxSafeRate: CLINICAL_THRESHOLDS.MAX_SAFE_UF_RATE_ML_KG_H,
      rateStatus,
      alertLevel,
      clinicalRecommendation
    };
  }

  /**
   * Estima la dosis de adecuación dialítica Kt/V según la fórmula de Daugirdas de 2ª generación
   * @param {object} params
   * @param {number} params.preBunMgDl - Urea pre-diálisis en mg/dL
   * @param {number} params.postBunMgDl - Urea post-diálisis en mg/dL
   * @param {number} params.durationHours - Horas de diálisis efectivas
   * @param {number} params.ufLiters - Ultrafiltración total extraída en litros
   * @param {number} params.postWeightKg - Peso post-diálisis en kg
   * @returns {object}
   */
  static estimateDaugirdasKtV({
    preBunMgDl,
    postBunMgDl,
    durationHours = 4,
    ufLiters,
    postWeightKg
  }) {
    const preBun = Number(preBunMgDl);
    const postBun = Number(postBunMgDl);
    const t = Number(durationHours) || 4;
    const uf = Number(ufLiters) || 2.5;
    const w = Number(postWeightKg) || 70;

    if (!preBun || !postBun || preBun <= postBun || preBun <= 0 || postBun <= 0) {
      throw new Error('Valores de urea pre y post diálisis inválidos para cálculo de Kt/V');
    }

    const R = postBun / preBun;
    // Fórmula Daugirdas II: Kt/V = -ln(R - 0.008 * t) + (4 - 3.5 * R) * (UF / W)
    const lnPart = -Math.log(Math.max(0.01, R - 0.008 * t));
    const ufPart = (4 - 3.5 * R) * (uf / w);
    const ktv = Number((lnPart + ufPart).toFixed(2));

    const isAdequate = ktv >= CLINICAL_THRESHOLDS.TARGET_KTV_ADEQUACY;

    return {
      preBunMgDl: preBun,
      postBunMgDl: postBun,
      ureaReductionRatioPercent: Number(((1 - R) * 100).toFixed(1)),
      ktv,
      targetKtv: CLINICAL_THRESHOLDS.TARGET_KTV_ADEQUACY,
      isAdequate,
      status: isAdequate ? 'ADEQUATE' : 'UNDERDIALYZED',
      verdict: isAdequate
        ? `Adecuación dialítica óptima (Kt/V = ${ktv} >= 1.2). Cumple estándar KDOQI e INCUCAI.`
        : `Dosis de diálisis insuficiente (Kt/V = ${ktv} < 1.2). Sugerir aumento de flujo sanguíneo (Qb) o superficie de capilar.`
    };
  }
}
