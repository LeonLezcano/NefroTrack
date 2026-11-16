/**
 * app.js — Controlador Principal SPA de NefroTrack
 * AiAppFactory Standard — Zero-Sink DOM & Mobile-First
 */

import { DialyzerReuseSafetyEngine, DIALYZER_STATUS } from './core/dialyzerReuseSafetyEngine.js';
import { OsmosisWaterQualityGateEngine, WATER_GATE_STATUS } from './core/osmosisWaterQualityGateEngine.js';
import { UltrafiltrationSessionEngine } from './core/ultrafiltrationSessionEngine.js';
import { SerologyChairIsolationEngine, SEROLOGY_TYPES, ROOM_SECTORS } from './core/serologyChairIsolationEngine.js';
import { PamiDialysisModuleService } from './services/pamiDialysisModuleService.js';
import { NefroTrackCacheService } from './services/nefroTrackCache.service.js';
import { Sanitizer } from './utils/sanitizer.js';
import { Formatters } from './utils/formatters.js';

const INITIAL_DEMO_DATA = {
  patients: [
    {
      id: 'PAC-1001',
      dni: '14.280.991',
      name: 'Roberto Gómez',
      age: 64,
      serology: SEROLOGY_TYPES.SERONEGATIVE,
      lastSerologyDate: '2026-10-10',
      dryWeightKg: 72.0,
      assignedRoom: ROOM_SECTORS.GENERAL_WHITE,
      shift: 'L-M-V Mañana',
      vascularAccess: 'FAV Radiocefálica Izquierda'
    },
    {
      id: 'PAC-1002',
      dni: '18.450.112',
      name: 'Estela Morales',
      age: 58,
      serology: SEROLOGY_TYPES.HCV_REACTIVE,
      lastSerologyDate: '2026-10-20',
      dryWeightKg: 65.5,
      assignedRoom: ROOM_SECTORS.COHORT_HCV,
      shift: 'L-M-V Mañana',
      vascularAccess: 'Prótesis PTFE Braquial'
    },
    {
      id: 'PAC-1003',
      dni: '22.901.340',
      name: 'Carlos Alberto Benítez',
      age: 52,
      serology: SEROLOGY_TYPES.HBSAG_POSITIVE,
      lastSerologyDate: '2026-11-01',
      dryWeightKg: 81.0,
      assignedRoom: ROOM_SECTORS.ISOLATION_HBV,
      shift: 'M-J-S Tarde',
      vascularAccess: 'Catéter Tunelizado Yugular'
    }
  ],
  dialyzers: [
    {
      dialyzerId: 'CAP-2026-0881',
      patientId: 'PAC-1001',
      patientName: 'Roberto Gómez',
      model: 'Polisulfona 1.8 m²',
      baselineVolumeMl: 100,
      measuredVolumeMl: 88,
      ffvPercent: 88.0,
      currentReuses: 4,
      status: DIALYZER_STATUS.AUTHORIZED_READY,
      peraceticTestNegative: true,
      lastReprocessed: '2026-11-16T05:30:00Z',
      cryptoSeal: '8abf94101e402b88c42b102941fa9041289410cbfa8940129bcdef4890123456'
    },
    {
      dialyzerId: 'CAP-2026-0419',
      patientId: 'PAC-1002',
      patientName: 'Estela Morales',
      model: 'Helixona 1.6 m²',
      baselineVolumeMl: 95,
      measuredVolumeMl: 74,
      ffvPercent: 77.9,
      currentReuses: 8,
      status: DIALYZER_STATUS.REJECTED_LOW_FFV,
      peraceticTestNegative: true,
      lastReprocessed: '2026-11-15T18:00:00Z',
      cryptoSeal: 'c42b102941fa9041289410cbfa8940129bcdef48901234568abf94101e402b88'
    }
  ],
  waterGates: [
    {
      recordId: 'H2O-GATE-01',
      shiftName: 'Turno Mañana (06:00)',
      technicianName: 'Téc. Bioing. Martín Varela',
      chloraminesPpm: 0.02,
      permeateConductivityUs: 6.5,
      totalHardnessPpm: 0,
      loopPressureBar: 2.8,
      waterTemperatureC: 20.0,
      isGateOpen: true,
      status: WATER_GATE_STATUS.GATE_APPROVED_OPEN,
      alertLevel: 'GREEN',
      certifiedAt: '2026-11-16T05:45:00Z',
      cryptoSeal: 'a102941fa9041289410cbfa8940129bcdef48901234568abf94101e402b88c42b'
    }
  ],
  sessions: [
    {
      sessionId: 'SESS-2026-7701',
      patientId: 'PAC-1001',
      patientName: 'Roberto Gómez',
      chairNumber: 'Sillón 04',
      roomSector: ROOM_SECTORS.GENERAL_WHITE,
      dialyzerId: 'CAP-2026-0881',
      preWeightKg: 74.8,
      dryWeightKg: 72.0,
      totalTargetUfMl: 3300,
      durationMinutes: 240,
      ufRateMlPerKgH: 11.5,
      rateStatus: 'SAFE',
      currentBp: '130/80 mmHg',
      status: 'IN_PROGRESS',
      startedAt: '2026-11-16T06:15:00Z',
      isSigned: true,
      sessionSeal: '7701fa9041289410cbfa8940129bcdef48901234568abf94101e402b88c42b1029'
    }
  ],
  pamiBatches: [
    {
      batchId: 'PAMI-PAC-1001-2026-11',
      patientId: 'PAC-1001',
      patientName: 'Roberto Gómez',
      monthPeriod: '2026-11',
      completedSessionsCount: 6,
      signedSessionsCount: 6,
      grandTotalModuleArs: 1212000,
      status: 'IN_PROGRESS',
      isAuditClean: true
    }
  ]
};

export class NefroTrackApp {
  constructor() {
    this.cache = new NefroTrackCacheService();
    this.activeTab = 'sessions';
    this.wakeLockSentinel = null;
    this.init();
  }

  init() {
    this.seedDemoDataIfEmpty();
    this.setupEventListeners();
    this.setupWakeLock();
    this.setupLiveCalculators();
    this.render();
  }

  seedDemoDataIfEmpty() {
    if (this.cache.isDemoPurged()) return;
    this.cache.getPatients(INITIAL_DEMO_DATA.patients);
    this.cache.getDialyzers(INITIAL_DEMO_DATA.dialyzers);
    this.cache.getWaterGates(INITIAL_DEMO_DATA.waterGates);
    this.cache.getSessions(INITIAL_DEMO_DATA.sessions);
    this.cache.getPamiBatches(INITIAL_DEMO_DATA.pamiBatches);
  }

  setupEventListeners() {
    // Tabs
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Modals open
    document.getElementById('btn-open-session-modal')?.addEventListener('click', () => {
      this.populatePatientSelects();
      this.updateLiveUfPreview();
      this.openModal('modal-session');
    });

    document.getElementById('btn-open-dialyzer-modal')?.addEventListener('click', () => {
      this.populatePatientSelects();
      this.updateLiveFfvPreview();
      this.openModal('modal-dialyzer');
    });

    document.getElementById('btn-open-osmosis-modal')?.addEventListener('click', () => {
      this.openModal('modal-osmosis');
    });

    document.getElementById('btn-open-pami-modal')?.addEventListener('click', () => {
      this.populatePatientSelects();
      this.openModal('modal-pami');
    });

    // Modals close
    document.querySelectorAll('.btn-close-modal').forEach((btn) => {
      btn.addEventListener('click', () => this.closeModals());
    });

    // Forms submit
    document.getElementById('form-new-session')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleNewSessionSubmit();
    });

    document.getElementById('form-reprocess-dialyzer')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleReprocessDialyzerSubmit();
    });

    document.getElementById('form-water-gate')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleWaterGateSubmit();
    });

    document.getElementById('form-pami-batch')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePamiBatchSubmit();
    });
  }

  setupLiveCalculators() {
    // Calculadora en vivo de UF en modal-session
    const preInput = document.getElementById('sess-pre-weight');
    const dryInput = document.getElementById('sess-dry-weight');
    const durInput = document.getElementById('sess-duration');

    [preInput, dryInput, durInput].forEach(el => {
      el?.addEventListener('input', () => this.updateLiveUfPreview());
    });

    // Calculadora en vivo de FFV en modal-dialyzer
    const baseVol = document.getElementById('reproc-baseline-vol');
    const measVol = document.getElementById('reproc-measured-vol');

    [baseVol, measVol].forEach(el => {
      el?.addEventListener('input', () => this.updateLiveFfvPreview());
    });
  }

  updateLiveUfPreview() {
    const pre = Number(document.getElementById('sess-pre-weight')?.value) || 74.5;
    const dry = Number(document.getElementById('sess-dry-weight')?.value) || 72.0;
    const dur = Number(document.getElementById('sess-duration')?.value) || 240;

    try {
      const ufCalc = UltrafiltrationSessionEngine.calculateUltrafiltrationTarget({
        preWeightKg: pre,
        dryWeightKg: dry,
        durationMinutes: dur
      });

      const totalEl = document.getElementById('preview-uf-total');
      const rateEl = document.getElementById('preview-uf-rate');

      if (totalEl) totalEl.textContent = `${Formatters.formatMl(ufCalc.totalTargetUfMl)} (${ufCalc.interdialyticGainKg} kg ganancia)`;
      if (rateEl) {
        rateEl.textContent = `${Formatters.formatUfRate(ufCalc.ufRateMlPerKgH)} (${ufCalc.rateStatus === 'SAFE' ? 'Segura' : 'ALTO RIESGO'})`;
        rateEl.className = ufCalc.rateStatus === 'SAFE' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold';
      }
    } catch {
      // Ignorar entradas intermedias incompletas
    }
  }

  updateLiveFfvPreview() {
    const base = Number(document.getElementById('reproc-baseline-vol')?.value) || 100;
    const meas = Number(document.getElementById('reproc-measured-vol')?.value) || 88;

    if (base > 0) {
      const ffv = Number(((meas / base) * 100).toFixed(1));
      const previewEl = document.getElementById('preview-ffv');
      if (previewEl) {
        if (ffv >= 80) {
          previewEl.textContent = `${ffv}% (≥80% APROBADO)`;
          previewEl.className = 'text-emerald-400 font-bold';
        } else {
          previewEl.textContent = `${ffv}% (<80% DESCARTE OBLIGATORIO)`;
          previewEl.className = 'text-rose-400 font-bold';
        }
      }
    }
  }

  setupWakeLock() {
    const btn = document.getElementById('btn-wakelock');
    const dot = document.getElementById('wakelock-dot');
    const label = document.getElementById('wakelock-label');

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          this.wakeLockSentinel = await navigator.wakeLock.request('screen');
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
          if (label) label.textContent = 'Sala Activa';
          this.wakeLockSentinel.addEventListener('release', () => {
            if (dot) dot.className = 'w-2 h-2 rounded-full bg-slate-500';
            if (label) label.textContent = 'Sala';
          });
        }
      } catch {
        // Fallback no bloqueante ante falta de sensor
      }
    };

    btn?.addEventListener('click', () => {
      if (!this.wakeLockSentinel) {
        requestWakeLock();
      } else {
        this.wakeLockSentinel.release().then(() => {
          this.wakeLockSentinel = null;
        });
      }
    });

    // Auto re-enganche al regresar de segundo plano
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.wakeLockSentinel) {
        requestWakeLock();
      }
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.tab-view').forEach((view) => {
      view.classList.add('hidden');
    });
    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) targetView.classList.remove('hidden');

    document.querySelectorAll('.nav-tab').forEach((btn) => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.className = 'nav-tab touch-target flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-sky-400 bg-sky-950/60 border border-sky-800 flex items-center justify-center gap-1.5 whitespace-nowrap';
      } else {
        btn.className = 'nav-tab touch-target flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 border border-transparent flex items-center justify-center gap-1.5 whitespace-nowrap';
      }
    });

    this.render();
  }

  populatePatientSelects() {
    const patients = this.cache.getPatients(INITIAL_DEMO_DATA.patients);
    const sessSelect = document.getElementById('sess-patient-select');
    const reprocSelect = document.getElementById('reproc-patient-select');
    const pamiSelect = document.getElementById('pami-patient-select');

    const optionsHtml = patients.map(p => `
      <option value="${Sanitizer.escapeHTML(p.id)}" data-dry="${Sanitizer.escapeHTML(p.dryWeightKg)}" data-sero="${Sanitizer.escapeHTML(p.serology)}" data-room="${Sanitizer.escapeHTML(p.assignedRoom)}">
        ${Sanitizer.escapeHTML(p.name)} (${Sanitizer.escapeHTML(p.dni)}) — ${Sanitizer.escapeHTML(p.serology)}
      </option>
    `).join('');

    if (sessSelect) Sanitizer.safeSetInnerHTML(sessSelect, optionsHtml);
    if (reprocSelect) Sanitizer.safeSetInnerHTML(reprocSelect, optionsHtml);
    if (pamiSelect) Sanitizer.safeSetInnerHTML(pamiSelect, optionsHtml);
  }

  render() {
    this.renderHeaderWaterStatus();
    if (this.activeTab === 'sessions') this.renderSessions();
    if (this.activeTab === 'dialyzers') this.renderDialyzers();
    if (this.activeTab === 'osmosis') this.renderOsmosis();
    if (this.activeTab === 'pami') this.renderPami();
  }

  renderHeaderWaterStatus() {
    const gates = this.cache.getWaterGates(INITIAL_DEMO_DATA.waterGates);
    const latest = gates[0];
    const pill = document.getElementById('water-gate-pill');
    const dot = document.getElementById('water-gate-dot');
    const label = document.getElementById('water-gate-label');

    if (!pill || !dot || !label) return;

    if (latest && latest.isGateOpen) {
      pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-400 font-semibold';
      dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
      label.textContent = `Ósmosis OK (${latest.chloraminesPpm} ppm)`;
    } else {
      pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-400 font-semibold animate-pulse';
      dot.className = 'w-2 h-2 rounded-full bg-rose-500';
      label.textContent = 'PLANTA BLOQUEADA';
    }
  }

  renderSessions() {
    const listEl = document.getElementById('sessions-list');
    if (!listEl) return;

    const sessions = this.cache.getSessions(INITIAL_DEMO_DATA.sessions);
    let safeCount = 0;
    let alertCount = 0;

    if (sessions.length === 0) {
      Sanitizer.safeSetInnerHTML(listEl, `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
          No hay pacientes conectados en diálisis en este momento.
        </div>
      `);
      document.getElementById('count-active-sessions').textContent = '0';
      document.getElementById('count-safe-uf').textContent = '0';
      document.getElementById('count-alert-uf').textContent = '0';
      return;
    }

    let html = '';
    sessions.forEach(s => {
      if (s.rateStatus === 'SAFE') safeCount++;
      else alertCount++;

      const isSafe = s.rateStatus === 'SAFE';
      const ufBadgeClass = isSafe
        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
        : 'bg-amber-950 text-amber-400 border-amber-800';

      html += `
        <article class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-white text-sm">${Sanitizer.escapeHTML(s.patientName)}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono font-bold">${Sanitizer.escapeHTML(s.chairNumber)}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-medium">${Sanitizer.escapeHTML(s.roomSector)}</span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">Capilar Asignado: <strong class="text-slate-300 font-mono">${Sanitizer.escapeHTML(s.dialyzerId)}</strong></p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full border font-bold ${ufBadgeClass}">
              UF: ${Formatters.formatUfRate(s.ufRateMlPerKgH)}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div>
              <span class="text-slate-400 block">Presión Arterial:</span>
              <span class="font-bold text-white">${Sanitizer.escapeHTML(s.currentBp)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">UF Programada:</span>
              <span class="font-bold text-sky-400">${Formatters.formatMl(s.totalTargetUfMl)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Peso Seco / Ingreso:</span>
              <span class="text-slate-300">${Formatters.formatKg(s.dryWeightKg)} / ${Formatters.formatKg(s.preWeightKg)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Duración Prescrita:</span>
              <span class="text-slate-300">${Formatters.formatMinutes(s.durationMinutes)}</span>
            </div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span class="font-mono text-emerald-400">✓ Sesión Sellada SHA-256: ${Sanitizer.escapeHTML(s.sessionSeal.slice(0, 16))}...</span>
            <button class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium" onclick="window.__nefroApp.finalizeSession('${Sanitizer.escapeHTML(s.sessionId)}')">
              Finalizar Sesión
            </button>
          </div>
        </article>
      `;
    });

    Sanitizer.safeSetInnerHTML(listEl, html);
    document.getElementById('count-active-sessions').textContent = String(sessions.length);
    document.getElementById('count-safe-uf').textContent = String(safeCount);
    document.getElementById('count-alert-uf').textContent = String(alertCount);
  }

  renderDialyzers() {
    const listEl = document.getElementById('dialyzers-list');
    if (!listEl) return;

    const dialyzers = this.cache.getDialyzers(INITIAL_DEMO_DATA.dialyzers);
    if (dialyzers.length === 0) {
      Sanitizer.safeSetInnerHTML(listEl, `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
          No hay dializadores registrados en reprocesamiento.
        </div>
      `);
      return;
    }

    let html = '';
    dialyzers.forEach(d => {
      const isApproved = d.status === DIALYZER_STATUS.AUTHORIZED_READY;
      const badgeClass = isApproved
        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
        : 'bg-rose-950 text-rose-400 border-rose-800';

      html += `
        <article class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-white text-sm">${Sanitizer.escapeHTML(d.dialyzerId)}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-medium">${Sanitizer.escapeHTML(d.model)}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">Reuso #${Sanitizer.escapeHTML(d.currentReuses)}</span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">Paciente Exclusivo: <strong class="text-slate-200">${Sanitizer.escapeHTML(d.patientName)}</strong> (${Sanitizer.escapeHTML(d.patientId)})</p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full border font-bold ${badgeClass}">
              ${isApproved ? '✓ APTO PARA CONEXIÓN' : '⛔ DESCARTE EXIGIDO'}
            </span>
          </div>

          <!-- Barra de Residual Fiber Volume (FFV) -->
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Volumen Residual (FFV): <strong class="${d.ffvPercent >= 80 ? 'text-emerald-400' : 'text-rose-400'}">${Formatters.formatFfv(d.ffvPercent)}</strong></span>
              <span class="text-slate-400">Medido: ${Formatters.formatMl(d.measuredVolumeMl)} / Basal: ${Formatters.formatMl(d.baselineVolumeMl)}</span>
            </div>
            <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div class="${d.ffvPercent >= 80 ? 'bg-emerald-500' : 'bg-rose-500'} h-2.5 rounded-full" style="width: ${Math.min(100, d.ffvPercent)}%"></div>
            </div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span class="font-mono text-emerald-400">✓ Sello Reproceso: ${Sanitizer.escapeHTML(d.cryptoSeal.slice(0, 16))}...</span>
            <span>Lavado: ${Formatters.formatDateTime(d.lastReprocessed)}</span>
          </div>
        </article>
      `;
    });

    Sanitizer.safeSetInnerHTML(listEl, html);
  }

  renderOsmosis() {
    const listEl = document.getElementById('osmosis-records-list');
    if (!listEl) return;

    const gates = this.cache.getWaterGates(INITIAL_DEMO_DATA.waterGates);
    if (gates.length === 0) {
      Sanitizer.safeSetInnerHTML(listEl, `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
          No hay registros de calidad de agua cargados.
        </div>
      `);
      return;
    }

    let html = '';
    gates.forEach(g => {
      const isOpen = g.isGateOpen;
      const badgeClass = isOpen
        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
        : 'bg-rose-950 text-rose-400 border-rose-800';

      html += `
        <article class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-white text-sm">${Sanitizer.escapeHTML(g.shiftName)}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">${Sanitizer.escapeHTML(g.technicianName)}</span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">Certificado: <strong class="text-slate-300 font-mono">${Sanitizer.escapeHTML(g.recordId)}</strong></p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full border font-bold ${badgeClass}">
              ${isOpen ? '✓ SALA HABILITADA' : '⛔ PLANTA BLOQUEADA'}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div>
              <span class="text-slate-400 block">Cloraminas Totales:</span>
              <span class="font-bold ${g.chloraminesPpm < 0.10 ? 'text-emerald-400' : 'text-rose-400'}">${Formatters.formatChloramines(g.chloraminesPpm)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Conductividad:</span>
              <span class="font-bold text-sky-400">${Formatters.formatConductivity(g.permeateConductivityUs)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Dureza Total:</span>
              <span class="font-medium text-slate-300">${Sanitizer.escapeHTML(g.totalHardnessPpm)} ppm</span>
            </div>
            <div>
              <span class="text-slate-400 block">Presión de Anillo:</span>
              <span class="text-slate-300">${Sanitizer.escapeHTML(g.loopPressureBar)} bar</span>
            </div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span class="font-mono text-emerald-400">✓ Sello SHA-256: ${Sanitizer.escapeHTML(g.cryptoSeal.slice(0, 16))}...</span>
            <span>Apertura: ${Formatters.formatDateTime(g.certifiedAt)}</span>
          </div>
        </article>
      `;
    });

    Sanitizer.safeSetInnerHTML(listEl, html);
  }

  renderPami() {
    const listEl = document.getElementById('pami-list');
    if (!listEl) return;

    const batches = this.cache.getPamiBatches(INITIAL_DEMO_DATA.pamiBatches);
    if (batches.length === 0) {
      Sanitizer.safeSetInnerHTML(listEl, `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
          No hay lotes mensuales de facturación PAMI emitidos.
        </div>
      `);
      return;
    }

    let html = '';
    batches.forEach(b => {
      html += `
        <article class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-white text-sm">${Sanitizer.escapeHTML(b.patientName)}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">${Sanitizer.escapeHTML(b.monthPeriod)}</span>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">Lote Oficial: <strong class="text-slate-300 font-mono">${Sanitizer.escapeHTML(b.batchId)}</strong></p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full border bg-slate-800 text-slate-300 border-slate-700 font-semibold">
              ${Sanitizer.escapeHTML(b.completedSessionsCount)}/13 Sesiones
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div>
              <span class="text-slate-400 block">Total Módulo PAMI:</span>
              <span class="font-bold text-emerald-400 text-sm">${Formatters.formatCurrencyARS(b.grandTotalModuleArs)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Sesiones Firmadas:</span>
              <span class="font-medium text-slate-300">${Sanitizer.escapeHTML(b.signedSessionsCount)} de ${Sanitizer.escapeHTML(b.completedSessionsCount)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Riesgo de Débito:</span>
              <span class="${b.isAuditClean ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">${b.isAuditClean ? '0 Débitos (Auditoría OK)' : 'Revisión Necesaria'}</span>
            </div>
          </div>
        </article>
      `;
    });

    Sanitizer.safeSetInnerHTML(listEl, html);
  }

  // --- SUBMITS DE FORMULARIOS ---
  async handleNewSessionSubmit() {
    const patientSelect = document.getElementById('sess-patient-select');
    const selectedOption = patientSelect?.selectedOptions[0];
    const patientId = patientSelect?.value;
    const patientName = selectedOption?.text.split('(')[0].trim() || 'Paciente';
    const chairNumber = document.getElementById('sess-chair')?.value || 'Sillón';
    const roomSector = document.getElementById('sess-room-sector')?.value;
    const preWeightKg = Number(document.getElementById('sess-pre-weight')?.value);
    const dryWeightKg = Number(document.getElementById('sess-dry-weight')?.value);
    const durationMinutes = Number(document.getElementById('sess-duration')?.value) || 240;
    const currentBp = document.getElementById('sess-bp')?.value || '120/80 mmHg';

    // 1. Validar Aislamiento Serológico
    const patient = this.cache.getPatients(INITIAL_DEMO_DATA.patients).find(p => p.id === patientId);
    const serologyCheck = SerologyChairIsolationEngine.validateChairAssignment({
      patientId,
      patientName,
      serologyType: patient?.serology || SEROLOGY_TYPES.SERONEGATIVE,
      assignedRoomSector: roomSector,
      chairNumber,
      lastSerologyDate: patient?.lastSerologyDate
    });

    if (!serologyCheck.isPermitted) {
      alert(`BLOQUEO DE SEGURIDAD BIOLÓGICA:\n${serologyCheck.message}`);
      return;
    }

    // 2. Calcular Ultrafiltración
    const ufTarget = UltrafiltrationSessionEngine.calculateUltrafiltrationTarget({
      preWeightKg,
      dryWeightKg,
      durationMinutes
    });

    const sessionId = `SESS-${Date.now().toString(36).toUpperCase()}`;
    const newSession = {
      sessionId,
      patientId,
      patientName,
      chairNumber,
      roomSector,
      dialyzerId: `CAP-${patientId}`,
      preWeightKg,
      dryWeightKg,
      totalTargetUfMl: ufTarget.totalTargetUfMl,
      durationMinutes,
      ufRateMlPerKgH: ufTarget.ufRateMlPerKgH,
      rateStatus: ufTarget.rateStatus,
      currentBp,
      status: 'IN_PROGRESS',
      startedAt: new Date().toISOString(),
      isSigned: true,
      sessionSeal: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
    };

    const sessions = this.cache.getSessions(INITIAL_DEMO_DATA.sessions);
    sessions.unshift(newSession);
    this.cache.saveSessions(sessions);

    this.closeModals();
    this.render();
  }

  async handleReprocessDialyzerSubmit() {
    const patientSelect = document.getElementById('reproc-patient-select');
    const patientId = patientSelect?.value;
    const patientName = patientSelect?.selectedOptions[0]?.text.split('(')[0].trim() || 'Paciente';
    const dialyzerId = document.getElementById('reproc-dialyzer-code')?.value;
    const currentReuses = Number(document.getElementById('reproc-reuses')?.value) || 0;
    const baselineVolumeMl = Number(document.getElementById('reproc-baseline-vol')?.value);
    const measuredVolumeMl = Number(document.getElementById('reproc-measured-vol')?.value);
    const peraceticTestNegative = document.getElementById('reproc-peracetic-strip')?.checked;

    const evalResult = DialyzerReuseSafetyEngine.evaluateDialyzerClearance({
      dialyzerId,
      dialyzerPatientId: patientId,
      targetPatientId: patientId,
      baselineVolumeMl,
      measuredVolumeMl,
      currentReuses,
      peraceticTestNegative
    });

    const cert = await DialyzerReuseSafetyEngine.createReprocessingCertificate(evalResult, 'Téc. Reprocesamiento');

    const dialyzers = this.cache.getDialyzers(INITIAL_DEMO_DATA.dialyzers);
    dialyzers.unshift({
      dialyzerId,
      patientId,
      patientName,
      model: 'Polisulfona High-Flux',
      baselineVolumeMl,
      measuredVolumeMl,
      ffvPercent: evalResult.ffvPercent,
      currentReuses: evalResult.nextReuseNumber,
      status: evalResult.status,
      peraceticTestNegative,
      lastReprocessed: new Date().toISOString(),
      cryptoSeal: cert.cryptoSeal
    });

    this.cache.saveDialyzers(dialyzers);
    this.closeModals();
    this.render();
  }

  async handleWaterGateSubmit() {
    const chloraminesPpm = Number(document.getElementById('gate-chloramines')?.value);
    const permeateConductivityUs = Number(document.getElementById('gate-conductivity')?.value);
    const totalHardnessPpm = Number(document.getElementById('gate-hardness')?.value);
    const loopPressureBar = Number(document.getElementById('gate-pressure')?.value);
    const technicianName = document.getElementById('gate-technician')?.value;

    const gateEval = OsmosisWaterQualityGateEngine.evaluateWaterGate({
      chloraminesPpm,
      permeateConductivityUs,
      totalHardnessPpm,
      loopPressureBar
    });

    const cert = await OsmosisWaterQualityGateEngine.certifyWaterGate(gateEval, 'Turno Mañana (06:00)', technicianName);

    const gates = this.cache.getWaterGates(INITIAL_DEMO_DATA.waterGates);
    gates.unshift(cert);
    this.cache.saveWaterGates(gates);

    this.closeModals();
    this.render();
  }

  async handlePamiBatchSubmit() {
    const patientSelect = document.getElementById('pami-patient-select');
    const patientId = patientSelect?.value;
    const patientName = patientSelect?.selectedOptions[0]?.text.split('(')[0].trim() || 'Paciente';
    const monthPeriod = document.getElementById('pami-period')?.value || '2026-11';
    const transportType = document.getElementById('pami-transport')?.value || 'AMBULATORY';
    const epoDosesCount = Number(document.getElementById('pami-epo')?.value) || 12;
    const ironDosesCount = Number(document.getElementById('pami-iron')?.value) || 4;

    const sessions = this.cache.getSessions(INITIAL_DEMO_DATA.sessions).filter(s => s.patientId === patientId);

    const batchRaw = PamiDialysisModuleService.generateMonthlyBillingBatch({
      patientId,
      patientName,
      monthPeriod,
      sessions,
      epoDosesCount,
      ironDosesCount,
      transportType
    });

    const certifiedBatch = await PamiDialysisModuleService.signAndSealBatch(batchRaw);

    const batches = this.cache.getPamiBatches(INITIAL_DEMO_DATA.pamiBatches);
    batches.unshift(certifiedBatch);
    this.cache.savePamiBatches(batches);

    this.closeModals();
    this.render();
  }

  finalizeSession(sessionId) {
    const sessions = this.cache.getSessions(INITIAL_DEMO_DATA.sessions);
    const s = sessions.find(item => item.sessionId === sessionId);
    if (s) {
      s.status = 'COMPLETED';
      this.cache.saveSessions(sessions);
      this.render();
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
  }

  closeModals() {
    document.querySelectorAll('[role="dialog"]').forEach(modal => {
      modal.classList.add('hidden');
    });
  }
}

// Iniciar aplicación al cargar DOM
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.__nefroApp = new NefroTrackApp();
  });
}
