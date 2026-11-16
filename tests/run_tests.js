/**
 * NefroTrack Automated Test Suite — 5 Layers & 54 Tests
 * AiAppFactory Testing-First Standard (INCUCAI / PAMI / Res. 810/2000)
 */

import {
  DialyzerReuseSafetyEngine,
  REUSE_NORMATIVE_LIMITS,
  DIALYZER_STATUS
} from '../src/core/dialyzerReuseSafetyEngine.js';

import {
  OsmosisWaterQualityGateEngine,
  WATER_QUALITY_THRESHOLDS,
  WATER_GATE_STATUS
} from '../src/core/osmosisWaterQualityGateEngine.js';

import {
  UltrafiltrationSessionEngine,
  CLINICAL_THRESHOLDS
} from '../src/core/ultrafiltrationSessionEngine.js';

import {
  SerologyChairIsolationEngine,
  SEROLOGY_TYPES,
  ROOM_SECTORS
} from '../src/core/serologyChairIsolationEngine.js';

import {
  PamiDialysisModuleService,
  PAMI_TARIFFS
} from '../src/services/pamiDialysisModuleService.js';

import { NefroTrackCacheService } from '../src/services/nefroTrackCache.service.js';
import { Sanitizer } from '../src/utils/sanitizer.js';
import { CryptoSeal } from '../src/utils/cryptoSeal.js';
import {
  formatKg,
  formatMl,
  formatFfv,
  formatConductivity,
  formatChloramines,
  formatBloodPressure,
  formatUfRate,
  formatARS,
  formatDateTime,
  formatMinutes
} from '../src/utils/formatters.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function test(description, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    process.stdout.write(`  [PASS] ${description}\n`);
  } catch (err) {
    failedTests++;
    failures.push({ description, error: err });
    process.stdout.write(`  [FAIL] ${description} -> ${err.message}\n`);
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message} Expected [${expected}], got [${actual}]`);
  }
}

function assertCloseTo(actual, expected, delta = 0.05, message = '') {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(`${message} Expected [${actual}] to be close to [${expected}] within [${delta}]`);
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('   NEFROTRACK — 5-LAYER AUTOMATED TEST SUITE');
  console.log('   INCUCAI / PAMI / Res. 810/2000 Hemodialysis Standard');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // LAYER 1: UNIT & CHAOTIC FUZZING (26 Tests)
  // ----------------------------------------------------
  console.log('--- CAPA 1: Unitarias & Fuzzing Caótico ---');

  await test('L1-01: DialyzerReuse - Discrepancia de paciente genera BLOQUEO BIOLÓGICO GRAVE', () => {
    const res = DialyzerReuseSafetyEngine.evaluateDialyzerClearance({
      dialyzerId: 'CAP-001',
      dialyzerPatientId: 'PAC-1001',
      targetPatientId: 'PAC-1002', // Cruce de paciente!
      baselineVolumeMl: 100,
      measuredVolumeMl: 90
    });
    assertEqual(res.isAuthorized, false);
    assertEqual(res.status, 'BLOCKED_PATIENT_MISMATCH');
    assertEqual(res.alertLevel, 'CRITICAL_RED');
    assert(res.reason.includes('BLOQUEO BIOLÓGICO GRAVE'));
  });

  await test('L1-02: DialyzerReuse - FFV >= 80% con reusos dentro de límite autoriza conexión', () => {
    const res = DialyzerReuseSafetyEngine.evaluateDialyzerClearance({
      dialyzerId: 'CAP-002',
      dialyzerPatientId: 'PAC-1001',
      targetPatientId: 'PAC-1001',
      baselineVolumeMl: 100,
      measuredVolumeMl: 88, // 88%
      currentReuses: 4,
      maxReuses: 12
    });
    assertEqual(res.isAuthorized, true);
    assertEqual(res.status, DIALYZER_STATUS.AUTHORIZED_READY);
    assertEqual(res.ffvPercent, 88.0);
    assertEqual(res.isFfvCompliant, true);
    assertEqual(res.mustDiscard, false);
  });

  await test('L1-03: DialyzerReuse - FFV < 80% marca capilar coagulado y exige DESCARTE OBLIGATORIO', () => {
    const res = DialyzerReuseSafetyEngine.evaluateDialyzerClearance({
      dialyzerId: 'CAP-003',
      dialyzerPatientId: 'PAC-1001',
      targetPatientId: 'PAC-1001',
      baselineVolumeMl: 100,
      measuredVolumeMl: 78, // 78% < 80%
      currentReuses: 5
    });
    assertEqual(res.isAuthorized, false);
    assertEqual(res.status, DIALYZER_STATUS.REJECTED_LOW_FFV);
    assertEqual(res.isFfvCompliant, false);
    assertEqual(res.mustDiscard, true);
  });

  await test('L1-04: DialyzerReuse - Reusos que igualan o superan el máximo exigen descarte', () => {
    const res = DialyzerReuseSafetyEngine.evaluateDialyzerClearance({
      dialyzerId: 'CAP-004',
      dialyzerPatientId: 'PAC-1001',
      targetPatientId: 'PAC-1001',
      baselineVolumeMl: 100,
      measuredVolumeMl: 85,
      currentReuses: 12, // 12 >= 12
      maxReuses: 12
    });
    assertEqual(res.isAuthorized, false);
    assertEqual(res.status, DIALYZER_STATUS.REJECTED_MAX_REUSES);
    assertEqual(res.isOverMaxReuses, true);
    assertEqual(res.mustDiscard, true);
  });

  await test('L1-05: DialyzerReuse - Tira reactiva de ácido peracético positiva rechaza conexión', () => {
    const res = DialyzerReuseSafetyEngine.evaluateDialyzerClearance({
      dialyzerId: 'CAP-005',
      dialyzerPatientId: 'PAC-1001',
      targetPatientId: 'PAC-1001',
      baselineVolumeMl: 100,
      measuredVolumeMl: 90,
      peraceticTestNegative: false // Positiva a desinfectante residual!
    });
    assertEqual(res.isAuthorized, false);
    assertEqual(res.status, DIALYZER_STATUS.REJECTED_CHEMICAL_RESIDUAL);
  });

  await test('L1-06: DialyzerReuse [Fuzzing] - Manejo robusto ante volumen basal 0 o negativo', () => {
    let errCaught = false;
    try {
      DialyzerReuseSafetyEngine.evaluateDialyzerClearance({
        dialyzerId: 'CAP-ERR',
        dialyzerPatientId: 'P1',
        targetPatientId: 'P1',
        baselineVolumeMl: 0,
        measuredVolumeMl: 50
      });
    } catch (e) {
      errCaught = true;
      assert(e.message.includes('inválidos'));
    }
    assert(errCaught, 'Debe arrojar excepción ante volumen basal 0');
  });

  await test('L1-07: DialyzerReuse - createReprocessingCertificate genera certificado con SHA-256', async () => {
    const evalData = DialyzerReuseSafetyEngine.evaluateDialyzerClearance({
      dialyzerId: 'CAP-007',
      dialyzerPatientId: 'PAC-1001',
      targetPatientId: 'PAC-1001',
      baselineVolumeMl: 100,
      measuredVolumeMl: 88,
      currentReuses: 3
    });
    const cert = await DialyzerReuseSafetyEngine.createReprocessingCertificate(evalData, 'Téc. González');
    assertEqual(cert.dialyzerId, 'CAP-007');
    assert(cert.cryptoSeal.length === 64);
    assert(cert.normative.includes('INCUCAI'));
  });

  await test('L1-08: OsmosisGate - Parámetros óptimos abren la sala (GATE_APPROVED_OPEN)', () => {
    const res = OsmosisWaterQualityGateEngine.evaluateWaterGate({
      chloraminesPpm: 0.02,
      permeateConductivityUs: 6.5,
      totalHardnessPpm: 0,
      loopPressureBar: 2.8
    });
    assertEqual(res.isGateOpen, true);
    assertEqual(res.status, WATER_GATE_STATUS.GATE_APPROVED_OPEN);
    assertEqual(res.alertLevel, 'GREEN');
  });

  await test('L1-09: OsmosisGate - Cloraminas >= 0.10 mg/L bloquea críticamente la sala', () => {
    const res = OsmosisWaterQualityGateEngine.evaluateWaterGate({
      chloraminesPpm: 0.12, // Tóxico!
      permeateConductivityUs: 8.0
    });
    assertEqual(res.isGateOpen, false);
    assertEqual(res.status, WATER_GATE_STATUS.GATE_LOCKED_CHLORAMINES_HIGH);
    assertEqual(res.alertLevel, 'CRITICAL_RED');
    assert(res.blockReason.includes('BLOQUEO CRÍTICO DE SALA'));
  });

  await test('L1-10: OsmosisGate - Conductividad de permeado > 25 µS/cm bloquea sala por falla de membrana', () => {
    const res = OsmosisWaterQualityGateEngine.evaluateWaterGate({
      chloraminesPpm: 0.02,
      permeateConductivityUs: 32.0 // Saturada
    });
    assertEqual(res.isGateOpen, false);
    assertEqual(res.status, WATER_GATE_STATUS.GATE_LOCKED_CONDUCTIVITY_HIGH);
    assertEqual(res.alertLevel, 'CRITICAL_RED');
  });

  await test('L1-11: OsmosisGate - Dureza > 0 ppm bloquea por saturación de ablandador iónico', () => {
    const res = OsmosisWaterQualityGateEngine.evaluateWaterGate({
      chloraminesPpm: 0.02,
      permeateConductivityUs: 8.0,
      totalHardnessPpm: 5 // Debe ser 0
    });
    assertEqual(res.isGateOpen, false);
    assertEqual(res.status, WATER_GATE_STATUS.GATE_LOCKED_HARDNESS_FAIL);
  });

  await test('L1-12: OsmosisGate - Presión de anillo fuera de rango genera advertencia sin bloqueo', () => {
    const res = OsmosisWaterQualityGateEngine.evaluateWaterGate({
      chloraminesPpm: 0.02,
      permeateConductivityUs: 8.0,
      loopPressureBar: 1.5 // < 2.0 bar
    });
    assertEqual(res.isGateOpen, true);
    assertEqual(res.status, WATER_GATE_STATUS.GATE_WARNING_PRESSURE);
    assertEqual(res.alertLevel, 'YELLOW');
  });

  await test('L1-13: OsmosisGate [Fuzzing] - Parámetros no numéricos disparan error explicativo', () => {
    let errorCaught = false;
    try {
      OsmosisWaterQualityGateEngine.evaluateWaterGate({ chloraminesPpm: NaN, permeateConductivityUs: 'invalido' });
    } catch {
      errorCaught = true;
    }
    assert(errorCaught);
  });

  await test('L1-14: OsmosisGate - certifyWaterGate emite certificado sellado de apertura de turno', async () => {
    const gateEval = OsmosisWaterQualityGateEngine.evaluateWaterGate({
      chloraminesPpm: 0.02,
      permeateConductivityUs: 7.2
    });
    const cert = await OsmosisWaterQualityGateEngine.certifyWaterGate(gateEval, 'Turno 1', 'Téc. Bioing. Varela');
    assertEqual(cert.shiftName, 'Turno 1');
    assert(cert.cryptoSeal.length === 64);
  });

  await test('L1-15: Ultrafiltration - Cálculo de objetivo de UF total en mL con ingesta y lavado', () => {
    // Paciente ingresa con 75.0 kg, peso seco 72.0 kg. Ganancia = 3.0 kg (3000 mL).
    // Ingesta = 200 mL, lavado = 300 mL. Total UF = 3000 + 200 + 300 = 3500 mL.
    const res = UltrafiltrationSessionEngine.calculateUltrafiltrationTarget({
      preWeightKg: 75.0,
      dryWeightKg: 72.0,
      durationMinutes: 240,
      fluidIntakeMl: 200,
      rinseWashbackMl: 300
    });
    assertEqual(res.interdialyticGainKg, 3.0);
    assertEqual(res.totalTargetUfMl, 3500);
  });

  await test('L1-16: Ultrafiltration - Tasa de ultrafiltración segura (<= 13 mL/kg/h) devuelve SAFE', () => {
    // 72 kg seco, 4 horas, 3000 mL UF -> (3000 / 72) / 4 = 10.4 mL/kg/h (Segura)
    const res = UltrafiltrationSessionEngine.calculateUltrafiltrationTarget({
      preWeightKg: 74.5,
      dryWeightKg: 72.0,
      durationMinutes: 240
    });
    assertCloseTo(res.ufRateMlPerKgH, 10.4, 0.2);
    assertEqual(res.rateStatus, 'SAFE');
    assertEqual(res.alertLevel, 'GREEN');
  });

  await test('L1-17: Ultrafiltration - Tasa de UF entre 13 y 15 mL/kg/h emite advertencia hemodinámica', () => {
    // 60 kg seco, 4 horas, 3400 mL UF -> (3400 / 60) / 4 = 14.16 mL/kg/h
    const res = UltrafiltrationSessionEngine.calculateUltrafiltrationTarget({
      preWeightKg: 62.9,
      dryWeightKg: 60.0,
      durationMinutes: 240
    });
    assertEqual(res.rateStatus, 'WARNING_HIGH');
    assertEqual(res.alertLevel, 'YELLOW');
  });

  await test('L1-18: Ultrafiltration - Tasa de UF > 15 mL/kg/h emite alerta crítica de hipotensión', () => {
    // 55 kg seco, 4 horas, 3600 mL UF -> (3600 / 55) / 4 = 16.36 mL/kg/h
    const res = UltrafiltrationSessionEngine.calculateUltrafiltrationTarget({
      preWeightKg: 58.1,
      dryWeightKg: 55.0,
      durationMinutes: 240
    });
    assertEqual(res.rateStatus, 'CRITICAL_HIGH');
    assertEqual(res.alertLevel, 'RED');
  });

  await test('L1-19: Ultrafiltration - Ganancia nula o negativa no produce UF negativa', () => {
    const res = UltrafiltrationSessionEngine.calculateUltrafiltrationTarget({
      preWeightKg: 70.0,
      dryWeightKg: 71.0, // Llegó por debajo del peso seco
      fluidIntakeMl: 100,
      rinseWashbackMl: 200
    });
    assertEqual(res.totalTargetUfMl, 300); // Solo ingesta + lavado
  });

  await test('L1-20: Ultrafiltration - Adecuación Daugirdas Kt/V >= 1.20 dictamina ADEQUATE', () => {
    // BUN pre = 140, post = 42 (R = 0.30), 4 horas, 2.5L UF, 70 kg
    const res = UltrafiltrationSessionEngine.estimateDaugirdasKtV({
      preBunMgDl: 140,
      postBunMgDl: 42,
      durationHours: 4,
      ufLiters: 2.5,
      postWeightKg: 70
    });
    assert(res.ktv >= 1.20);
    assertEqual(res.status, 'ADEQUATE');
    assertEqual(res.isAdequate, true);
  });

  await test('L1-21: Ultrafiltration - Adecuación Daugirdas Kt/V < 1.20 dictamina UNDERDIALYZED', () => {
    // BUN pre = 120, post = 65 (R = 0.54)
    const res = UltrafiltrationSessionEngine.estimateDaugirdasKtV({
      preBunMgDl: 120,
      postBunMgDl: 65,
      durationHours: 3.5,
      ufLiters: 1.8,
      postWeightKg: 85
    });
    assert(res.ktv < 1.20);
    assertEqual(res.status, 'UNDERDIALYZED');
    assertEqual(res.isAdequate, false);
  });

  await test('L1-22: Ultrafiltration [Fuzzing] - Valores de urea invertidos arrojan error', () => {
    let err = false;
    try {
      UltrafiltrationSessionEngine.estimateDaugirdasKtV({
        preBunMgDl: 30,
        postBunMgDl: 80 // Imposible fisiológicamente
      });
    } catch {
      err = true;
    }
    assert(err);
  });

  await test('L1-23: SerologyChair - Paciente HBsAg+ asignado a Sala Blanca es BLOQUEADO (CRITICAL)', () => {
    const res = SerologyChairIsolationEngine.validateChairAssignment({
      patientId: 'PAC-HBV',
      patientName: 'Juan Carlos',
      serologyType: SEROLOGY_TYPES.HBSAG_POSITIVE,
      assignedRoomSector: ROOM_SECTORS.GENERAL_WHITE, // Prohibido!
      chairNumber: 'Sillón 02'
    });
    assertEqual(res.isPermitted, false);
    assertEqual(res.violationLevel, 'CRITICAL');
  });

  await test('L1-24: SerologyChair - Paciente HBsAg+ en Sala de Aislamiento Exclusivo es APROBADO', () => {
    const res = SerologyChairIsolationEngine.validateChairAssignment({
      patientId: 'PAC-HBV',
      patientName: 'Juan Carlos',
      serologyType: SEROLOGY_TYPES.HBSAG_POSITIVE,
      assignedRoomSector: ROOM_SECTORS.ISOLATION_HBV,
      chairNumber: 'Sillón Aislado 01'
    });
    assertEqual(res.isPermitted, true);
    assertEqual(res.violationLevel, 'NONE');
  });

  await test('L1-25: SerologyChair - Paciente Seronegativo en Sala HBV es BLOQUEADO (CRITICAL)', () => {
    const res = SerologyChairIsolationEngine.validateChairAssignment({
      patientId: 'PAC-NEG',
      patientName: 'Marta Pérez',
      serologyType: SEROLOGY_TYPES.SERONEGATIVE,
      assignedRoomSector: ROOM_SECTORS.ISOLATION_HBV,
      chairNumber: 'Sillón Aislado 01'
    });
    assertEqual(res.isPermitted, false);
    assertEqual(res.violationLevel, 'CRITICAL');
  });

  await test('L1-26: SerologyChair - Serología mayor a 90 días marca alerta trimestral', () => {
    const date100DaysAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const res = SerologyChairIsolationEngine.validateChairAssignment({
      patientId: 'PAC-EXP',
      patientName: 'Luis',
      serologyType: SEROLOGY_TYPES.SERONEGATIVE,
      assignedRoomSector: ROOM_SECTORS.GENERAL_WHITE,
      chairNumber: 'Sillón 03',
      lastSerologyDate: date100DaysAgo
    });
    assertEqual(res.isSerologyExpired, true);
    assertEqual(res.requiresQuarterlyUpdate, true);
  });

  // ----------------------------------------------------
  // LAYER 2: INTEGRATION & OFFLINE PERSISTENCE (10 Tests)
  // ----------------------------------------------------
  console.log('\n--- CAPA 2: Integración & Persistencia Offline-First ---');

  await test('L2-01: PamiModule - Consolida 13 sesiones mensuales con tarifa PAMI', () => {
    const dummySessions = Array.from({ length: 13 }, (_, i) => ({
      sessionId: `S-${i}`,
      status: 'COMPLETED',
      isSigned: true,
      sessionSeal: 'mockSeal123'
    }));
    const batch = PamiDialysisModuleService.generateMonthlyBillingBatch({
      patientId: 'PAMI-001',
      patientName: 'Ana Ruiz',
      monthPeriod: '2026-11',
      sessions: dummySessions,
      epoDosesCount: 0,
      ironDosesCount: 0,
      transportType: 'NONE'
    });
    assertEqual(batch.completedSessionsCount, 13);
    assertEqual(batch.signedSessionsCount, 13);
    assertEqual(batch.baseSessionsTotalArs, 13 * PAMI_TARIFFS.SESSION_UNIT_ARS);
    assertEqual(batch.isAuditClean, true);
  });

  await test('L2-02: PamiModule - Suma dosis de Eritropoyetina (EPO) y Hierro IV', () => {
    const batch = PamiDialysisModuleService.generateMonthlyBillingBatch({
      patientId: 'PAMI-002',
      monthPeriod: '2026-11',
      sessions: [],
      epoDosesCount: 12,
      ironDosesCount: 4,
      transportType: 'NONE'
    });
    assertEqual(batch.medications.epoTotalArs, 12 * PAMI_TARIFFS.EPO_4000_UNIT_ARS);
    assertEqual(batch.medications.ironTotalArs, 4 * PAMI_TARIFFS.IRON_100MG_UNIT_ARS);
  });

  await test('L2-03: PamiModule - Asigna subsidio de traslado según modalidad (Silla de Ruedas)', () => {
    const batch = PamiDialysisModuleService.generateMonthlyBillingBatch({
      patientId: 'PAMI-003',
      monthPeriod: '2026-11',
      sessions: [],
      transportType: 'WHEELCHAIR'
    });
    assertEqual(batch.transport.transportTotalArs, PAMI_TARIFFS.TRANSPORT_WHEELCHAIR_MONTH_ARS);
  });

  await test('L2-04: PamiModule - Detecta riesgo de débito ante sesiones sin firma digital', () => {
    const sessions = [
      { sessionId: 'S-1', status: 'COMPLETED', isSigned: true, sessionSeal: 'seal' },
      { sessionId: 'S-2', status: 'COMPLETED', isSigned: false } // Falta firma
    ];
    const batch = PamiDialysisModuleService.generateMonthlyBillingBatch({
      patientId: 'PAMI-004',
      monthPeriod: '2026-11',
      sessions
    });
    assertEqual(batch.isAuditClean, false);
    assert(batch.debitRiskFlags.some(f => f.code === 'DEBIT_RISK_UNSIGNED_SESSIONS'));
  });

  await test('L2-05: PamiModule - Detecta riesgo de débito por serología vencida', () => {
    const batch = PamiDialysisModuleService.generateMonthlyBillingBatch({
      patientId: 'PAMI-005',
      monthPeriod: '2026-11',
      sessions: [],
      serologyUpToDate: false
    });
    assertEqual(batch.isAuditClean, false);
    assert(batch.debitRiskFlags.some(f => f.code === 'DEBIT_RISK_EXPIRED_SEROLOGY'));
  });

  await test('L2-06: PamiModule - signAndSealBatch certifica con sello SHA-256', async () => {
    const batch = PamiDialysisModuleService.generateMonthlyBillingBatch({
      patientId: 'PAMI-006',
      monthPeriod: '2026-11'
    });
    const certified = await PamiDialysisModuleService.signAndSealBatch(batch);
    assertEqual(certified.isCertified, true);
    assert(certified.batchCryptoSeal.length === 64);
  });

  await test('L2-07: CacheService - getPatients y savePatients persisten pacientes', () => {
    const cache = new NefroTrackCacheService();
    cache.savePatients([{ id: 'P-10', name: 'Laura' }]);
    const loaded = cache.getPatients();
    assertEqual(loaded.length, 1);
    assertEqual(loaded[0].name, 'Laura');
  });

  await test('L2-08: CacheService - Outbox FIFO encola eventos y flushOutbox los procesa', () => {
    const cache = new NefroTrackCacheService();
    cache.flushOutbox();
    cache.pushOutbox({ type: 'SYNC_SESSION', data: { id: 'S-99' } });
    assertEqual(cache.getOutbox().length, 1);
    const flushed = cache.flushOutbox();
    assertEqual(flushed.length, 1);
    assertEqual(cache.getOutbox().length, 0);
  });

  await test('L2-09: CacheService - Invariante Anti-Siembras fantasma tras purga', () => {
    const cache = new NefroTrackCacheService();
    cache.setDemoPurged(true);
    assertEqual(cache.isDemoPurged(), true);
    const items = cache.getItems('nefrotrack_unexisting_key', [{ id: 'DEMO' }]);
    assertEqual(items.length, 0);
  });

  await test('L2-10: CacheService - Fallback a memoria ante almacenamiento no disponible', () => {
    const cache = new NefroTrackCacheService(null);
    cache.saveDialyzers([{ dialyzerId: 'CAP-MEM' }]);
    const d = cache.getDialyzers();
    assertEqual(d.length, 1);
    assertEqual(d[0].dialyzerId, 'CAP-MEM');
  });

  // ----------------------------------------------------
  // LAYER 3: COMPONENTES & SEGURIDAD DOM (6 Tests)
  // ----------------------------------------------------
  console.log('\n--- CAPA 3: Componentes & Neutralización de Sinks DOM ---');

  await test('L3-01: Sanitizer - escapeHTML neutraliza etiquetas script y caracteres peligrosos', () => {
    const raw = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
    const escaped = Sanitizer.escapeHTML(raw);
    assert(!escaped.includes('<script>'));
    assert(escaped.includes('&lt;script&gt;'));
  });

  await test('L3-02: Sanitizer - sanitizeURL bloquea esquemas ejecutables', () => {
    assertEqual(Sanitizer.sanitizeURL('javascript:alert(1)'), '#blocked-dangerous-scheme');
    assertEqual(Sanitizer.sanitizeURL('data:text/html;base64,PHNjcmlwdD4='), '#blocked-dangerous-scheme');
    assertEqual(Sanitizer.sanitizeURL('https://incucai.gob.ar/protocolo.pdf'), 'https://incucai.gob.ar/protocolo.pdf');
  });

  await test('L3-03: Sanitizer - sanitizeNumber retorna números finitos o fallback', () => {
    assertEqual(Sanitizer.sanitizeNumber(88.5), 88.5);
    assertEqual(Sanitizer.sanitizeNumber('72.4'), 72.4);
    assertEqual(Sanitizer.sanitizeNumber(NaN, 0), 0);
  });

  await test('L3-04: Sanitizer - safeSetInnerHTML opera sin arrojar excepciones', () => {
    let captured = '';
    const mockEl = {
      replaceChildren: (node) => { captured = node; },
      textContent: ''
    };
    Sanitizer.safeSetInnerHTML(mockEl, 'Hemodiálisis Conforme');
    assert(mockEl.textContent.includes('Hemodiálisis') || captured !== '');
  });

  await test('L3-05: Formatters - formatKg, formatMl, formatFfv y formatBloodPressure', () => {
    assert(formatKg(72.5).includes('72') && formatKg(72.5).includes('kg'));
    assert(formatMl(3000).includes('3.000') || formatMl(3000).includes('3000'));
    assertEqual(formatFfv(88.4), '88.4%');
    assertEqual(formatBloodPressure(120, 80), '120/80 mmHg');
  });

  await test('L3-06: Formatters - formatConductivity, formatChloramines y formatUfRate', () => {
    assert(formatConductivity(6.5).includes('6.5') && formatConductivity(6.5).includes('µS/cm'));
    assert(formatChloramines(0.02).includes('0.02') && formatChloramines(0.02).includes('mg/L'));
    assert(formatUfRate(10.4).includes('10.4') && formatUfRate(10.4).includes('mL/kg/h'));
  });

  // ----------------------------------------------------
  // LAYER 4: SECURITY & AUDITING RULES (6 Tests)
  // ----------------------------------------------------
  console.log('\n--- CAPA 4: Seguridad Cualitativa & Auditoría de Reglas ---');

  await test('L4-01: firebase.json - CSP Cualitativa sin unsafe-eval, sin * y sin http://', () => {
    const firebaseJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'firebase.json'), 'utf8'));
    const allHeaders = firebaseJson.hosting.headers.flatMap(h => h.headers);
    const csp = allHeaders.find(h => h.key === 'Content-Security-Policy');
    assert(csp, 'Content-Security-Policy debe existir');
    const val = csp.value;
    assert(!val.includes("'unsafe-eval'"));
    assert(!val.includes('script-src *'));
    assert(!val.includes('http://'));
  });

  await test('L4-02: firebase.json - Cabeceras requeridas presentes (DENY, nosniff, HSTS)', () => {
    const firebaseJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'firebase.json'), 'utf8'));
    const allHeaders = firebaseJson.hosting.headers.flatMap(h => h.headers);
    assertEqual(allHeaders.find(h => h.key === 'X-Frame-Options').value, 'DENY');
    assertEqual(allHeaders.find(h => h.key === 'X-Content-Type-Options').value, 'nosniff');
    assert(allHeaders.find(h => h.key === 'Strict-Transport-Security').value.includes('max-age=31536000'));
  });

  await test('L4-03: firestore.rules - Blindaje Zero-Trust sin allow read, write: if true;', () => {
    const rules = fs.readFileSync(path.join(ROOT_DIR, 'firestore.rules'), 'utf8');
    assert(!rules.includes('allow read, write: if true;'));
    assert(!rules.includes('allow write: if true;'));
    assert(rules.includes('isAuthenticated()'));
    assert(rules.includes('patients') && rules.includes('dialyzers') && rules.includes('waterQualityGates') && rules.includes('dialysisSessions'));
  });

  await test('L4-04: Secret Scanner - Cero claves o secretos privados en código fuente', () => {
    const srcDir = path.join(ROOT_DIR, 'src');
    const files = fs.readdirSync(srcDir, { recursive: true });
    for (const file of files) {
      const fullPath = path.join(srcDir, file);
      if (fs.statSync(fullPath).isFile() && (file.endsWith('.js') || file.endsWith('.html'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert(!content.includes('sk-ant-'), `Secreto en ${file}`);
        assert(!content.includes('ghp_'), `Token en ${file}`);
        assert(!content.includes('AIzaSy'), `Clave Firebase en ${file}`);
      }
    }
  });

  await test('L4-05: package.json - Scripts test, test:security y version:bump configurados', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
    assert(pkg.scripts.test);
    assert(pkg.scripts['test:security'] || pkg.scripts['security:full']);
    assert(pkg.scripts['version:bump']);
    assertEqual(pkg.version, '1.0.00');
  });

  await test('L4-06: version.json - Alineación con estándar semántico vX.Y.ZZ', () => {
    const ver = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'version.json'), 'utf8'));
    assertEqual(ver.version, 'v1.0.00');
    assert(ver.appName === 'NefroTrack');
  });

  // ----------------------------------------------------
  // LAYER 5: E2E COMPLETE LIFECYCLE WORKFLOW (6 Tests)
  // ----------------------------------------------------
  console.log('\n--- CAPA 5: Flujo Integral E2E de Ciclo de Vida ---');

  await test('L5-01: Ciclo E2E - Paso 1: Habilitación matutina de Ósmosis Inversa (Gate Abierto)', async () => {
    const gateEval = OsmosisWaterQualityGateEngine.evaluateWaterGate({
      chloraminesPpm: 0.02,
      permeateConductivityUs: 6.5,
      totalHardnessPpm: 0,
      loopPressureBar: 2.8
    });
    assertEqual(gateEval.isGateOpen, true);
    assertEqual(gateEval.status, WATER_GATE_STATUS.GATE_APPROVED_OPEN);

    const certifiedGate = await OsmosisWaterQualityGateEngine.certifyWaterGate(
      gateEval,
      'Turno Mañana (06:00)',
      'Téc. Bioing. Martín Varela'
    );
    assert(certifiedGate.cryptoSeal.length === 64);
  });

  await test('L5-02: Ciclo E2E - Paso 2: Ingreso de Paciente y Verificación de Aislamiento Serológico', () => {
    const check = SerologyChairIsolationEngine.validateChairAssignment({
      patientId: 'PAC-1001',
      patientName: 'Roberto Gómez',
      serologyType: SEROLOGY_TYPES.SERONEGATIVE,
      assignedRoomSector: ROOM_SECTORS.GENERAL_WHITE,
      chairNumber: 'Sillón 04',
      lastSerologyDate: '2026-10-10'
    });
    assertEqual(check.isPermitted, true);
    assertEqual(check.requiresQuarterlyUpdate, false);
  });

  await test('L5-03: Ciclo E2E - Paso 3: Escaneo QR de Filtro Capilar y Certificación de FFV >= 80%', async () => {
    const dialyzerEval = DialyzerReuseSafetyEngine.evaluateDialyzerClearance({
      dialyzerId: 'CAP-2026-0881',
      dialyzerPatientId: 'PAC-1001',
      targetPatientId: 'PAC-1001',
      baselineVolumeMl: 100,
      measuredVolumeMl: 88,
      currentReuses: 4,
      maxReuses: 12,
      peraceticTestNegative: true
    });
    assertEqual(dialyzerEval.isAuthorized, true);
    assertEqual(dialyzerEval.ffvPercent, 88.0);

    const cert = await DialyzerReuseSafetyEngine.createReprocessingCertificate(dialyzerEval, 'Téc. Reprocesamiento');
    assert(cert.cryptoSeal.length === 64);
  });

  await test('L5-04: Ciclo E2E - Paso 4: Programación de Sesión con Tasa de UF Segura', () => {
    // Paciente pesa 74.8 kg, peso seco 72.0 kg. Ganancia 2.8 kg -> 2800 mL neto + 200 + 300 = 3300 mL UF
    const ufTarget = UltrafiltrationSessionEngine.calculateUltrafiltrationTarget({
      preWeightKg: 74.8,
      dryWeightKg: 72.0,
      durationMinutes: 240,
      fluidIntakeMl: 200,
      rinseWashbackMl: 300
    });
    assertEqual(ufTarget.totalTargetUfMl, 3300);
    assertCloseTo(ufTarget.ufRateMlPerKgH, 11.5, 0.2);
    assertEqual(ufTarget.rateStatus, 'SAFE');
  });

  await test('L5-05: Ciclo E2E - Paso 5: Monitoreo Intradiálisis y Evaluación de Adecuación Kt/V', () => {
    const ktvEval = UltrafiltrationSessionEngine.estimateDaugirdasKtV({
      preBunMgDl: 135,
      postBunMgDl: 41,
      durationHours: 4,
      ufLiters: 3.3,
      postWeightKg: 72.0
    });
    assert(ktvEval.ktv >= 1.20);
    assertEqual(ktvEval.status, 'ADEQUATE');
  });

  await test('L5-06: Ciclo E2E - Paso 6: Cierre de Sesión y Consolidación de Lote PAMI con Cero Débitos', async () => {
    const completedSession = {
      sessionId: 'SESS-2026-7701',
      status: 'COMPLETED',
      isSigned: true,
      sessionSeal: 'validCryptoSeal7701abcdef1234567890abcdef1234567890abcdef1234567890'
    };
    const batchRaw = PamiDialysisModuleService.generateMonthlyBillingBatch({
      patientId: 'PAC-1001',
      patientName: 'Roberto Gómez',
      monthPeriod: '2026-11',
      sessions: [completedSession],
      epoDosesCount: 12,
      ironDosesCount: 4,
      transportType: 'AMBULATORY',
      latestKtv: 1.38,
      serologyUpToDate: true
    });
    assertEqual(batchRaw.isAuditClean, true);
    assertEqual(batchRaw.debitRiskFlags.length, 0);

    const certifiedBatch = await PamiDialysisModuleService.signAndSealBatch(batchRaw);
    assertEqual(certifiedBatch.isCertified, true);
    assert(certifiedBatch.batchCryptoSeal.length === 64);
  });

  console.log('\n======================================================');
  console.log(`   RESUMEN: ${totalTests} ejecutados | ${passedTests} aprobados | ${failedTests} fallados`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    console.error('ERRORES DETECTADOS:');
    failures.forEach(f => console.error(`  - ${f.description}: ${f.error.message}`));
    process.exit(1);
  } else {
    console.log('✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE (100% PASS)\n');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Error fatal ejecutando pruebas:', err);
  process.exit(1);
});
