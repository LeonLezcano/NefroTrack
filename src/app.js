/**
 * app.js - Controlador Principal SPA de NefroTrack
 * AiAppFactory Standard - Zero-Sink DOM & Mobile-First
 */

import { DialyzerReuseSafetyEngine, DIALYZER_STATUS } from './core/dialyzerReuseSafetyEngine.js';
import { OsmosisWaterQualityGateEngine, WATER_GATE_STATUS } from './core/osmosisWaterQualityGateEngine.js';
import { UltrafiltrationSessionEngine } from './core/ultrafiltrationSessionEngine.js';
import { SerologyChairIsolationEngine, SEROLOGY_TYPES, ROOM_SECTORS } from './core/serologyChairIsolationEngine.js';
import { PamiDialysisModuleService } from './services/pamiDialysisModuleService.js';
import { NefroTrackCacheService } from './services/nefroTrackCache.service.js';
import { CryptoSeal } from './utils/cryptoSeal.js';
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
      vascularAccess: 'FAV Radiocefálica Izquierda',
      isDemo: true
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
      vascularAccess: 'Prótesis PTFE Braquial',
      isDemo: true
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
      vascularAccess: 'Catéter Tunelizado Yugular',
      isDemo: true
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
      cryptoSeal: '8abf94101e402b88c42b102941fa9041289410cbfa8940129bcdef4890123456',
      isDemo: true
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
      cryptoSeal: 'c42b102941fa9041289410cbfa8940129bcdef48901234568abf94101e402b88',
      isDemo: true
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
      cryptoSeal: 'a102941fa9041289410cbfa8940129bcdef48901234568abf94101e402b88c42b',
      isDemo: true
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
      sessionSeal: '7701fa9041289410cbfa8940129bcdef48901234568abf94101e402b88c42b1029',
      isDemo: true
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
      isAuditClean: true,
      isDemo: true
    }
  ]
};

const TAB_ACTIVE_CLASSES = 'nav-tab touch-target flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-sky-300 bg-sky-950 border border-sky-700 flex items-center justify-center gap-1.5 whitespace-nowrap transition';
const TAB_INACTIVE_CLASSES = 'nav-tab touch-target flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent flex items-center justify-center gap-1.5 whitespace-nowrap transition';

export class NefroTrackApp {
  constructor() {
    this.cache = new NefroTrackCacheService();
    this.activeTab = 'sessions';
    this.wakeLockSentinel = null;
    this.lastFocusedTrigger = null;
    this.init();
  }

  init() {
    this.seedDemoDataIfEmpty();
    this.setupEventListeners();
    this.setupWakeLock();
    this.setupNetworkStatus();
    this.setupLiveCalculators();
    this.surfaceCacheWarnings();
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

  surfaceCacheWarnings() {
    const warnings = this.cache.getCorruptionWarnings();
    if (warnings.length > 0) {
      this.showFeedbackBanner(warnings[0], 'error');
      this.cache.clearCorruptionWarnings();
    }
  }

  hasActiveDemoData() {
    if (this.cache.isDemoPurged()) return false;
    const collections = [
      this.cache.getPatients(),
      this.cache.getDialyzers(),
      this.cache.getWaterGates(),
      this.cache.getSessions(),
      this.cache.getPamiBatches()
    ];
    return collections.some((items) => items.some((item) => Boolean(item?.isDemo)));
  }

  updateDemoBanner() {
    const banner = document.getElementById('demo-data-banner');
    const confirmBox = document.getElementById('demo-purge-confirm');
    const purgeBtn = document.getElementById('btn-purge-demo');
    if (!banner) return;

    if (this.hasActiveDemoData()) {
      banner.classList.remove('hidden');
      if (confirmBox) confirmBox.classList.add('hidden');
      if (purgeBtn) purgeBtn.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  showFeedbackBanner(message, tone = 'info') {
    const banner = document.getElementById('app-feedback-banner');
    const textEl = document.getElementById('app-feedback-text');
    if (!banner || !textEl) return;

    const toneClasses = {
      info: 'bg-sky-950 border-sky-700 text-sky-200',
      success: 'bg-emerald-950 border-emerald-700 text-emerald-200',
      error: 'bg-rose-950 border-rose-700 text-rose-200'
    };

    banner.setAttribute('role', tone === 'error' ? 'alert' : 'status');
    banner.className = `rounded-xl border p-3 text-xs flex flex-wrap items-center justify-between gap-2 no-print ${toneClasses[tone] || toneClasses.info}`;
    textEl.textContent = String(message);
    banner.classList.remove('hidden');
  }

  hideFeedbackBanner() {
    const banner = document.getElementById('app-feedback-banner');
    if (banner) banner.classList.add('hidden');
  }

  showModalError(errorElementId, message) {
    const el = document.getElementById(errorElementId);
    if (!el) return;
    el.textContent = String(message);
    el.classList.remove('hidden');
  }

  clearModalErrors() {
    document.querySelectorAll('[role="alert"][id$="-form-error"]').forEach((el) => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  }

  setButtonLoading(buttonId, isLoading, loadingText = 'Sellando SHA-256...') {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    if (isLoading) {
      if (!btn.dataset.originalLabel) {
        btn.dataset.originalLabel = btn.textContent.trim();
      }
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.classList.add('opacity-70', 'cursor-not-allowed');
      btn.textContent = loadingText;
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.classList.remove('opacity-70', 'cursor-not-allowed');
      if (btn.dataset.originalLabel) {
        btn.textContent = btn.dataset.originalLabel;
      }
    }
  }

  setupEventListeners() {
    // Tabs click + ArrowLeft / ArrowRight keyboard navigation
    const tabs = Array.from(document.querySelectorAll('.nav-tab'));
    tabs.forEach((btn, idx) => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const delta = e.key === 'ArrowRight' ? 1 : -1;
          const nextTab = tabs[(idx + delta + tabs.length) % tabs.length];
          nextTab?.focus();
          const tabName = nextTab?.getAttribute('data-tab');
          if (tabName) this.switchTab(tabName);
        }
      });
    });

    // Global feedback banner dismiss
    document.getElementById('btn-dismiss-feedback')?.addEventListener('click', () => {
      this.hideFeedbackBanner();
    });

    // Demo data purge inline 2-step confirmation
    document.getElementById('btn-purge-demo')?.addEventListener('click', () => {
      document.getElementById('btn-purge-demo')?.classList.add('hidden');
      document.getElementById('demo-purge-confirm')?.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-purge')?.addEventListener('click', () => {
      document.getElementById('demo-purge-confirm')?.classList.add('hidden');
      document.getElementById('btn-purge-demo')?.classList.remove('hidden');
    });

    document.getElementById('btn-confirm-purge')?.addEventListener('click', () => {
      this.cache.purgeAllData();
      this.render();
      this.showFeedbackBanner('Datos de demostración purgados correctamente. La aplicación está lista para registros reales.', 'success');
    });

    // Delegated click listener for session finalization
    document.getElementById('sessions-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="finalize-session"]');
      if (!btn) return;
      const sessionId = btn.getAttribute('data-session-id');
      if (sessionId) {
        this.finalizeSession(sessionId);
      }
    });

    // Modals open
    document.getElementById('btn-open-patient-modal')?.addEventListener('click', (e) => {
      const dateInput = document.getElementById('pat-serology-date');
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
      }
      this.openModal('modal-patient', e.currentTarget);
    });

    document.getElementById('btn-open-session-modal')?.addEventListener('click', (e) => {
      this.populatePatientSelects();
      this.updateLiveUfPreview();
      this.openModal('modal-session', e.currentTarget);
    });

    document.getElementById('btn-open-dialyzer-modal')?.addEventListener('click', (e) => {
      this.populatePatientSelects();
      this.updateLiveFfvPreview();
      this.openModal('modal-dialyzer', e.currentTarget);
    });

    document.getElementById('btn-open-osmosis-modal')?.addEventListener('click', (e) => {
      this.openModal('modal-osmosis', e.currentTarget);
    });

    document.getElementById('btn-open-pami-modal')?.addEventListener('click', (e) => {
      this.populatePatientSelects();
      this.openModal('modal-pami', e.currentTarget);
    });

    // Modals close via button or backdrop click
    document.querySelectorAll('.btn-close-modal').forEach((btn) => {
      btn.addEventListener('click', () => this.closeModals());
    });

    document.querySelectorAll('[role="dialog"]').forEach((dialog) => {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          this.closeModals();
        }
      });
    });

    // Global Escape key listener to close open modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const hasOpenModal = Array.from(document.querySelectorAll('[role="dialog"]'))
          .some((modal) => !modal.classList.contains('hidden'));
        if (hasOpenModal) {
          e.preventDefault();
          this.closeModals();
        }
      }
    });

    // Forms submit
    document.getElementById('form-new-patient')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleNewPatientSubmit();
    });

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

  setupNetworkStatus() {
    const updateStatus = () => {
      const dot = document.getElementById('network-status-dot');
      const label = document.getElementById('network-status-label');
      if (!dot || !label) return;
      const online = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
      if (online) {
        dot.className = 'w-2 h-2 rounded-full bg-emerald-400 shrink-0';
        label.textContent = 'En línea';
      } else {
        dot.className = 'w-2 h-2 rounded-full bg-amber-500 shrink-0';
        label.textContent = 'Modo Offline';
      }
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
  }

  setupLiveCalculators() {
    const preInput = document.getElementById('sess-pre-weight');
    const dryInput = document.getElementById('sess-dry-weight');
    const durInput = document.getElementById('sess-duration');

    [preInput, dryInput, durInput].forEach((el) => {
      el?.addEventListener('input', () => this.updateLiveUfPreview());
    });

    const baseVol = document.getElementById('reproc-baseline-vol');
    const measVol = document.getElementById('reproc-measured-vol');

    [baseVol, measVol].forEach((el) => {
      el?.addEventListener('input', () => this.updateLiveFfvPreview());
    });
  }

  updateLiveUfPreview() {
    const preRaw = document.getElementById('sess-pre-weight')?.value;
    const dryRaw = document.getElementById('sess-dry-weight')?.value;
    const durRaw = document.getElementById('sess-duration')?.value;
    const pre = Number(preRaw);
    const dry = Number(dryRaw);
    const dur = Number(durRaw) || 240;

    const totalEl = document.getElementById('preview-uf-total');
    const rateEl = document.getElementById('preview-uf-rate');

    if (!Number.isFinite(pre) || !Number.isFinite(dry) || pre <= 0 || dry <= 0) {
      if (totalEl) totalEl.textContent = 'Ingrese pesos válidos (> 0 kg)';
      if (rateEl) {
        rateEl.textContent = 'Sin cálculo disponible';
        rateEl.className = 'text-rose-400 font-bold tabular-nums';
      }
      return;
    }

    try {
      const ufCalc = UltrafiltrationSessionEngine.calculateUltrafiltrationTarget({
        preWeightKg: pre,
        dryWeightKg: dry,
        durationMinutes: dur
      });

      if (totalEl) {
        totalEl.textContent = `${Formatters.formatMl(ufCalc.totalTargetUfMl)} (${ufCalc.interdialyticGainKg} kg ganancia)`;
      }
      if (rateEl) {
        rateEl.textContent = `${Formatters.formatUfRate(ufCalc.ufRateMlPerKgH)} (${ufCalc.rateStatus === 'SAFE' ? 'Segura' : 'ALTO RIESGO'})`;
        rateEl.className = ufCalc.rateStatus === 'SAFE' ? 'text-emerald-400 font-bold tabular-nums' : 'text-amber-400 font-bold tabular-nums';
      }
    } catch (err) {
      if (totalEl) totalEl.textContent = err?.message || 'Error de cálculo UF';
      if (rateEl) {
        rateEl.textContent = 'Revise los parámetros';
        rateEl.className = 'text-rose-400 font-bold tabular-nums';
      }
    }
  }

  updateLiveFfvPreview() {
    const base = Number(document.getElementById('reproc-baseline-vol')?.value);
    const meas = Number(document.getElementById('reproc-measured-vol')?.value);
    const previewEl = document.getElementById('preview-ffv');
    if (!previewEl) return;

    if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(meas) || meas < 0) {
      previewEl.textContent = 'Ingrese volúmenes válidos (Basal > 0 mL)';
      previewEl.className = 'text-rose-400 font-bold tabular-nums';
      return;
    }

    const ffv = Number(((meas / base) * 100).toFixed(1));
    if (ffv >= 80) {
      previewEl.textContent = `${ffv}% (>=80% APROBADO)`;
      previewEl.className = 'text-emerald-400 font-bold tabular-nums';
    } else {
      previewEl.textContent = `${ffv}% (<80% DESCARTE OBLIGATORIO)`;
      previewEl.className = 'text-rose-400 font-bold tabular-nums';
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
          if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400 shrink-0';
          if (label) label.textContent = 'Sala Activa';
          this.wakeLockSentinel.addEventListener('release', () => {
            this.wakeLockSentinel = null;
            if (dot) dot.className = 'w-2 h-2 rounded-full bg-slate-400 shrink-0';
            if (label) label.textContent = 'Sala';
          });
        } else {
          this.showFeedbackBanner('Wake Lock no soportado en este navegador; mantenga el brillo manual en sala.', 'info');
        }
      } catch {
        // Fallback no bloqueante ante rechazo o ausencia de sensor
      }
    };

    btn?.addEventListener('click', () => {
      if (!this.wakeLockSentinel) {
        requestWakeLock();
      } else {
        this.wakeLockSentinel.release().then(() => {
          this.wakeLockSentinel = null;
        }).catch(() => {
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
      const isSelected = btn.getAttribute('data-tab') === tabName;
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      btn.className = isSelected ? TAB_ACTIVE_CLASSES : TAB_INACTIVE_CLASSES;
    });

    this.render();
  }

  populatePatientSelects() {
    const patients = this.cache.getPatients(INITIAL_DEMO_DATA.patients);
    const sessSelect = document.getElementById('sess-patient-select');
    const reprocSelect = document.getElementById('reproc-patient-select');
    const pamiSelect = document.getElementById('pami-patient-select');

    const optionsHtml = patients.length > 0
      ? patients.map((p) => `
          <option value="${Sanitizer.escapeHTML(p.id)}" data-dry="${Sanitizer.escapeHTML(p.dryWeightKg)}" data-sero="${Sanitizer.escapeHTML(p.serology)}" data-room="${Sanitizer.escapeHTML(p.assignedRoom)}">
            ${Sanitizer.escapeHTML(p.name)} (${Sanitizer.escapeHTML(p.dni)}) - ${Sanitizer.escapeHTML(p.serology)}${p.isDemo ? ' [DEMO]' : ''}
          </option>
        `).join('')
      : '<option value="">Sin pacientes registrados - Registre un paciente primero</option>';

    if (sessSelect) Sanitizer.safeSetInnerHTML(sessSelect, optionsHtml);
    if (reprocSelect) Sanitizer.safeSetInnerHTML(reprocSelect, optionsHtml);
    if (pamiSelect) Sanitizer.safeSetInnerHTML(pamiSelect, optionsHtml);
  }

  render() {
    this.updateDemoBanner();
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

    if (!latest) {
      pill.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 font-semibold';
      dot.className = 'w-2 h-2 rounded-full bg-slate-400 shrink-0';
      label.textContent = 'Ósmosis Sin Registro';
      return;
    }

    if (latest.isGateOpen) {
      pill.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-xs text-emerald-300 font-semibold';
      dot.className = 'w-2 h-2 rounded-full bg-emerald-400 shrink-0';
      label.textContent = `Ósmosis OK (${latest.chloraminesPpm} ppm)`;
    } else {
      pill.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950 border border-rose-700 text-xs text-rose-300 font-semibold';
      dot.className = 'w-2 h-2 rounded-full bg-rose-400 shrink-0';
      label.textContent = 'PLANTA BLOQUEADA';
    }
  }

  computeSerologyIsolationSummary(sessions, patients) {
    const activeSessions = sessions.filter((s) => s.status !== 'COMPLETED');
    const el = document.getElementById('count-serology-status');
    if (!el) return;

    if (activeSessions.length === 0) {
      el.textContent = 'Sin activas';
      el.className = 'text-base sm:text-lg font-bold text-slate-300 tabular-nums';
      return;
    }

    let compliantCount = 0;
    let violationCount = 0;
    let expiredCount = 0;

    activeSessions.forEach((s) => {
      const patient = patients.find((p) => p.id === s.patientId);
      const check = SerologyChairIsolationEngine.validateChairAssignment({
        patientId: s.patientId,
        patientName: s.patientName,
        serologyType: patient?.serology || SEROLOGY_TYPES.SERONEGATIVE,
        assignedRoomSector: s.roomSector,
        chairNumber: s.chairNumber,
        lastSerologyDate: patient?.lastSerologyDate
      });
      if (!check.isPermitted) {
        violationCount++;
      } else {
        compliantCount++;
        if (check.isSerologyExpired) expiredCount++;
      }
    });

    if (violationCount > 0) {
      el.textContent = `${violationCount} Conflicto(s)`;
      el.className = 'text-base sm:text-lg font-bold text-rose-400 tabular-nums';
    } else if (expiredCount > 0) {
      el.textContent = `${compliantCount}/${activeSessions.length} (${expiredCount} vencida)`;
      el.className = 'text-base sm:text-lg font-bold text-amber-400 tabular-nums';
    } else {
      el.textContent = `${compliantCount}/${activeSessions.length} Conforme`;
      el.className = 'text-base sm:text-lg font-bold text-emerald-400 tabular-nums';
    }
  }

  renderSessions() {
    const listEl = document.getElementById('sessions-list');
    if (!listEl) return;

    const sessions = this.cache.getSessions(INITIAL_DEMO_DATA.sessions);
    const patients = this.cache.getPatients(INITIAL_DEMO_DATA.patients);
    let safeCount = 0;
    let alertCount = 0;

    if (sessions.length === 0) {
      Sanitizer.safeSetInnerHTML(listEl, `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-300 text-xs space-y-2">
          <p class="font-semibold text-white">Sin sesiones de hemodiálisis registradas.</p>
          <p class="text-slate-400">Registre un paciente o conecte una nueva sesión desde los botones superiores.</p>
        </div>
      `);
      document.getElementById('count-active-sessions').textContent = '0';
      document.getElementById('count-safe-uf').textContent = '0';
      document.getElementById('count-alert-uf').textContent = '0';
      this.computeSerologyIsolationSummary([], patients);
      return;
    }

    let html = '';
    sessions.forEach((s) => {
      if (s.rateStatus === 'SAFE') safeCount++;
      else alertCount++;

      const isCompleted = s.status === 'COMPLETED';
      const isSafe = s.rateStatus === 'SAFE';
      const statusBadgeClass = isCompleted
        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
        : isSafe
          ? 'bg-sky-950 text-sky-300 border-sky-800'
          : 'bg-amber-950 text-amber-300 border-amber-700';

      const statusLabel = isCompleted
        ? 'FINALIZADA'
        : isSafe
          ? `EN CURSO · UF ${Formatters.formatUfRate(s.ufRateMlPerKgH)}`
          : `ALERTA UF · ${Formatters.formatUfRate(s.ufRateMlPerKgH)}`;

      const demoTag = s.isDemo ? ' · [DEMO]' : '';

      const actionHtml = isCompleted
        ? `<span class="text-xs font-medium text-emerald-400">Sesión finalizada${s.completedAt ? ` · ${Sanitizer.escapeHTML(Formatters.formatDateTime(s.completedAt))}` : ''}</span>`
        : `<button type="button" class="touch-target px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold transition" data-action="finalize-session" data-session-id="${Sanitizer.escapeHTML(s.sessionId)}">
             Finalizar Sesión
           </button>`;

      html += `
        <article class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div class="flex flex-wrap items-start justify-between gap-2 min-w-0">
            <div class="min-w-0">
              <h3 class="font-bold text-white text-sm break-words">${Sanitizer.escapeHTML(s.patientName)}${demoTag}</h3>
              <p class="text-xs text-slate-400 mt-0.5 break-words">
                <span class="font-mono text-sky-300">${Sanitizer.escapeHTML(s.chairNumber)}</span> · ${Sanitizer.escapeHTML(s.roomSector)} · Capilar <span class="font-mono text-slate-300">${Sanitizer.escapeHTML(s.dialyzerId)}</span>
              </p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full border font-semibold shrink-0 tabular-nums ${statusBadgeClass}">
              ${Sanitizer.escapeHTML(statusLabel)}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-800 pt-3">
            <div>
              <span class="text-slate-400 block">Presión Arterial</span>
              <span class="font-bold text-white tabular-nums">${Sanitizer.escapeHTML(s.currentBp)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">UF Programada</span>
              <span class="font-bold text-sky-400 tabular-nums">${Formatters.formatMl(s.totalTargetUfMl)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Peso Seco / Ingreso</span>
              <span class="text-slate-200 tabular-nums">${Formatters.formatKg(s.dryWeightKg)} / ${Formatters.formatKg(s.preWeightKg)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Duración Prescrita</span>
              <span class="text-slate-200 tabular-nums">${Formatters.formatMinutes(s.durationMinutes)}</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span class="font-mono text-emerald-400 min-w-0 break-all">SHA-256: ${Sanitizer.escapeHTML(String(s.sessionSeal || '').slice(0, 16))}...</span>
            ${actionHtml}
          </div>
        </article>
      `;
    });

    Sanitizer.safeSetInnerHTML(listEl, html);
    document.getElementById('count-active-sessions').textContent = String(sessions.length);
    document.getElementById('count-safe-uf').textContent = String(safeCount);
    document.getElementById('count-alert-uf').textContent = String(alertCount);
    this.computeSerologyIsolationSummary(sessions, patients);
  }

  renderDialyzers() {
    const listEl = document.getElementById('dialyzers-list');
    if (!listEl) return;

    const dialyzers = this.cache.getDialyzers(INITIAL_DEMO_DATA.dialyzers);
    if (dialyzers.length === 0) {
      Sanitizer.safeSetInnerHTML(listEl, `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-300 text-xs space-y-2">
          <p class="font-semibold text-white">No hay dializadores registrados en reprocesamiento.</p>
          <p class="text-slate-400">Utilice "Reprocesar Capilar" para certificar el volumen residual FFV.</p>
        </div>
      `);
      return;
    }

    let html = '';
    dialyzers.forEach((d) => {
      const isApproved = d.status === DIALYZER_STATUS.AUTHORIZED_READY;
      const badgeClass = isApproved
        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
        : 'bg-rose-950 text-rose-300 border-rose-800';
      const demoTag = d.isDemo ? ' · [DEMO]' : '';
      const barWidth = Math.max(0, Math.min(100, Number(d.ffvPercent) || 0));

      html += `
        <article class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div class="flex flex-wrap items-start justify-between gap-2 min-w-0">
            <div class="min-w-0">
              <h3 class="font-bold text-white text-sm font-mono break-words">${Sanitizer.escapeHTML(d.dialyzerId)}${demoTag}</h3>
              <p class="text-xs text-slate-400 mt-0.5 break-words">
                ${Sanitizer.escapeHTML(d.model)} · Reuso #${Sanitizer.escapeHTML(d.currentReuses)} · Paciente: <strong class="text-slate-200">${Sanitizer.escapeHTML(d.patientName)}</strong> (${Sanitizer.escapeHTML(d.patientId)})
              </p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full border font-semibold shrink-0 ${badgeClass}">
              ${isApproved ? 'APTO PARA CONEXIÓN' : 'DESCARTE EXIGIDO'}
            </span>
          </div>

          <!-- Barra de Residual Fiber Volume (FFV) -->
          <div class="space-y-1.5 border-t border-slate-800 pt-3">
            <div class="flex flex-wrap justify-between gap-2 text-xs">
              <span class="text-slate-400">Volumen Residual (FFV): <strong class="tabular-nums ${d.ffvPercent >= 80 ? 'text-emerald-400' : 'text-rose-400'}">${Formatters.formatFfv(d.ffvPercent)}</strong></span>
              <span class="text-slate-400 tabular-nums">Medido: ${Formatters.formatMl(d.measuredVolumeMl)} / Basal: ${Formatters.formatMl(d.baselineVolumeMl)}</span>
            </div>
            <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div class="${d.ffvPercent >= 80 ? 'bg-emerald-500' : 'bg-rose-500'} h-2.5 rounded-full" data-ffv-bar="true" data-ffv-width="${Sanitizer.escapeHTML(barWidth)}"></div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span class="font-mono text-emerald-400 break-all">Sello Reproceso: ${Sanitizer.escapeHTML(String(d.cryptoSeal || '').slice(0, 16))}...</span>
            <span class="tabular-nums">Lavado: ${Formatters.formatDateTime(d.lastReprocessed)}</span>
          </div>
        </article>
      `;
    });

    Sanitizer.safeSetInnerHTML(listEl, html);
    listEl.querySelectorAll('[data-ffv-bar="true"]').forEach((bar) => {
      const pct = Number(bar.getAttribute('data-ffv-width')) || 0;
      bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    });
  }

  renderOsmosis() {
    const listEl = document.getElementById('osmosis-records-list');
    if (!listEl) return;

    const gates = this.cache.getWaterGates(INITIAL_DEMO_DATA.waterGates);
    if (gates.length === 0) {
      Sanitizer.safeSetInnerHTML(listEl, `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-300 text-xs space-y-2">
          <p class="font-semibold text-white">No hay registros de calidad de agua cargados.</p>
          <p class="text-slate-400">Registre el control matutino de ósmosis inversa antes de habilitar la sala.</p>
        </div>
      `);
      return;
    }

    let html = '';
    gates.forEach((g) => {
      const isOpen = g.isGateOpen;
      const badgeClass = isOpen
        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
        : 'bg-rose-950 text-rose-300 border-rose-800';
      const demoTag = g.isDemo ? ' · [DEMO]' : '';

      html += `
        <article class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div class="flex flex-wrap items-start justify-between gap-2 min-w-0">
            <div class="min-w-0">
              <h3 class="font-bold text-white text-sm break-words">${Sanitizer.escapeHTML(g.shiftName)}${demoTag}</h3>
              <p class="text-xs text-slate-400 mt-0.5 break-words">
                ${Sanitizer.escapeHTML(g.technicianName)} · Certificado <span class="font-mono text-slate-300">${Sanitizer.escapeHTML(g.recordId)}</span>
              </p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full border font-semibold shrink-0 ${badgeClass}">
              ${isOpen ? 'SALA HABILITADA' : 'PLANTA BLOQUEADA'}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-800 pt-3">
            <div>
              <span class="text-slate-400 block">Cloraminas Totales</span>
              <span class="font-bold tabular-nums ${g.chloraminesPpm < 0.10 ? 'text-emerald-400' : 'text-rose-400'}">${Formatters.formatChloramines(g.chloraminesPpm)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Conductividad</span>
              <span class="font-bold text-sky-400 tabular-nums">${Formatters.formatConductivity(g.permeateConductivityUs)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Dureza Total</span>
              <span class="font-medium text-slate-200 tabular-nums">${Sanitizer.escapeHTML(g.totalHardnessPpm)} ppm</span>
            </div>
            <div>
              <span class="text-slate-400 block">Presión de Anillo</span>
              <span class="text-slate-200 tabular-nums">${Sanitizer.escapeHTML(g.loopPressureBar)} bar</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span class="font-mono text-emerald-400 break-all">SHA-256: ${Sanitizer.escapeHTML(String(g.cryptoSeal || '').slice(0, 16))}...</span>
            <span class="tabular-nums">Apertura: ${Formatters.formatDateTime(g.certifiedAt)}</span>
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
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-300 text-xs space-y-2">
          <p class="font-semibold text-white">No hay lotes mensuales de facturación PAMI emitidos.</p>
          <p class="text-slate-400">Genere un lote consolidado para calcular sesiones, medicación y traslados.</p>
        </div>
      `);
      return;
    }

    let html = '';
    batches.forEach((b) => {
      const demoTag = b.isDemo ? ' · [DEMO]' : '';
      const badgeClass = b.isAuditClean
        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
        : 'bg-amber-950 text-amber-300 border-amber-700';

      html += `
        <article class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div class="flex flex-wrap items-start justify-between gap-2 min-w-0">
            <div class="min-w-0">
              <h3 class="font-bold text-white text-sm break-words">${Sanitizer.escapeHTML(b.patientName)}${demoTag}</h3>
              <p class="text-xs text-slate-400 mt-0.5 break-words">
                Periodo <strong class="text-amber-300">${Sanitizer.escapeHTML(b.monthPeriod)}</strong> · Lote <span class="font-mono text-slate-300">${Sanitizer.escapeHTML(b.batchId)}</span>
              </p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full border font-semibold shrink-0 tabular-nums ${badgeClass}">
              ${Sanitizer.escapeHTML(b.completedSessionsCount)}/13 Sesiones
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-t border-slate-800 pt-3">
            <div>
              <span class="text-slate-400 block">Total Módulo PAMI</span>
              <span class="font-bold text-emerald-400 text-sm tabular-nums">${Formatters.formatCurrencyARS(b.grandTotalModuleArs)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Sesiones Firmadas</span>
              <span class="font-medium text-slate-200 tabular-nums">${Sanitizer.escapeHTML(b.signedSessionsCount)} de ${Sanitizer.escapeHTML(b.completedSessionsCount)}</span>
            </div>
            <div>
              <span class="text-slate-400 block">Control Preventivo</span>
              <span class="${b.isAuditClean ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}">${b.isAuditClean ? 'Sin observaciones (0 flags)' : 'Revisión necesaria'}</span>
            </div>
          </div>
        </article>
      `;
    });

    Sanitizer.safeSetInnerHTML(listEl, html);
  }

  // --- SUBMITS DE FORMULARIOS ---
  async handleNewPatientSubmit() {
    this.clearModalErrors();
    this.setButtonLoading('btn-submit-patient', true, 'Guardando...');
    try {
      const name = document.getElementById('pat-name')?.value?.trim();
      const dni = document.getElementById('pat-dni')?.value?.trim();
      const serology = document.getElementById('pat-serology')?.value || SEROLOGY_TYPES.SERONEGATIVE;
      const dryWeightKg = Number(document.getElementById('pat-dry-weight')?.value);
      const lastSerologyDate = document.getElementById('pat-serology-date')?.value || new Date().toISOString().slice(0, 10);
      const vascularAccess = document.getElementById('pat-access')?.value?.trim() || 'FAV';

      if (!name || !dni || !Number.isFinite(dryWeightKg) || dryWeightKg <= 0) {
        this.showModalError('patient-form-error', 'Complete nombre, DNI y un peso seco válido mayor a 0 kg.');
        return;
      }

      const assignedRoom = serology === SEROLOGY_TYPES.HBSAG_POSITIVE
        ? ROOM_SECTORS.ISOLATION_HBV
        : serology === SEROLOGY_TYPES.HCV_REACTIVE
          ? ROOM_SECTORS.COHORT_HCV
          : ROOM_SECTORS.GENERAL_WHITE;

      const patients = this.cache.getPatients(INITIAL_DEMO_DATA.patients);
      const newPatient = {
        id: `PAC-${Date.now().toString(36).toUpperCase()}`,
        dni,
        name,
        serology,
        lastSerologyDate,
        dryWeightKg,
        assignedRoom,
        vascularAccess,
        isDemo: false
      };

      patients.unshift(newPatient);
      this.cache.savePatients(patients);
      this.populatePatientSelects();
      this.closeModals();
      this.render();
      this.showFeedbackBanner(`Paciente ${name} registrado en padrón local.`, 'success');
    } catch (err) {
      this.showModalError('patient-form-error', err?.message || 'No se pudo registrar el paciente.');
    } finally {
      this.setButtonLoading('btn-submit-patient', false);
    }
  }

  async handleNewSessionSubmit() {
    this.clearModalErrors();
    const patientSelect = document.getElementById('sess-patient-select');
    const selectedOption = patientSelect?.selectedOptions[0];
    const patientId = patientSelect?.value;

    if (!patientId) {
      this.showModalError('session-form-error', 'Debe registrar o seleccionar un paciente válido antes de iniciar una sesión.');
      return;
    }

    this.setButtonLoading('btn-submit-session', true, 'Sellando SHA-256...');
    try {
      const patientName = selectedOption?.text.split('(')[0].trim() || 'Paciente';
      const chairNumber = document.getElementById('sess-chair')?.value?.trim() || 'Sillón';
      const roomSector = document.getElementById('sess-room-sector')?.value;
      const preWeightKg = Number(document.getElementById('sess-pre-weight')?.value);
      const dryWeightKg = Number(document.getElementById('sess-dry-weight')?.value);
      const durationMinutes = Number(document.getElementById('sess-duration')?.value) || 240;
      const currentBp = document.getElementById('sess-bp')?.value?.trim() || '120/80 mmHg';

      const patient = this.cache.getPatients(INITIAL_DEMO_DATA.patients).find((p) => p.id === patientId);
      const serologyCheck = SerologyChairIsolationEngine.validateChairAssignment({
        patientId,
        patientName,
        serologyType: patient?.serology || SEROLOGY_TYPES.SERONEGATIVE,
        assignedRoomSector: roomSector,
        chairNumber,
        lastSerologyDate: patient?.lastSerologyDate
      });

      if (!serologyCheck.isPermitted) {
        this.showModalError('session-form-error', `BLOQUEO DE SEGURIDAD BIOLÓGICA: ${serologyCheck.message}`);
        return;
      }

      const ufTarget = UltrafiltrationSessionEngine.calculateUltrafiltrationTarget({
        preWeightKg,
        dryWeightKg,
        durationMinutes
      });

      const sessionId = `SESS-${Date.now().toString(36).toUpperCase()}`;
      const startedAt = new Date().toISOString();
      const sessionPayload = {
        sessionId,
        patientId,
        chairNumber,
        roomSector,
        totalTargetUfMl: ufTarget.totalTargetUfMl,
        ufRateMlPerKgH: ufTarget.ufRateMlPerKgH,
        startedAt
      };
      const sessionSeal = await CryptoSeal.hashSHA256(sessionPayload);

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
        startedAt,
        isSigned: true,
        sessionSeal,
        isDemo: false
      };

      const sessions = this.cache.getSessions(INITIAL_DEMO_DATA.sessions);
      sessions.unshift(newSession);
      this.cache.saveSessions(sessions);

      this.closeModals();
      this.render();
      this.showFeedbackBanner(`Sesión ${sessionId} iniciada y sellada con SHA-256.`, 'success');
    } catch (err) {
      this.showModalError('session-form-error', err?.message || 'Error al iniciar la sesión de hemodiálisis.');
    } finally {
      this.setButtonLoading('btn-submit-session', false);
    }
  }

  async handleReprocessDialyzerSubmit() {
    this.clearModalErrors();
    const patientSelect = document.getElementById('reproc-patient-select');
    const patientId = patientSelect?.value;

    if (!patientId) {
      this.showModalError('dialyzer-form-error', 'Debe registrar o seleccionar un paciente válido para asignar el capilar.');
      return;
    }

    this.setButtonLoading('btn-submit-dialyzer', true, 'Sellando SHA-256...');
    try {
      const patientName = patientSelect?.selectedOptions[0]?.text.split('(')[0].trim() || 'Paciente';
      const dialyzerId = document.getElementById('reproc-dialyzer-code')?.value?.trim();
      const currentReuses = Number(document.getElementById('reproc-reuses')?.value) || 0;
      const baselineVolumeMl = Number(document.getElementById('reproc-baseline-vol')?.value);
      const measuredVolumeMl = Number(document.getElementById('reproc-measured-vol')?.value);
      const peraceticTestNegative = Boolean(document.getElementById('reproc-peracetic-strip')?.checked);

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
        cryptoSeal: cert.cryptoSeal,
        isDemo: false
      });

      this.cache.saveDialyzers(dialyzers);
      this.closeModals();
      this.render();
      this.showFeedbackBanner(`Reprocesamiento de ${dialyzerId} registrado (${evalResult.ffvPercent}% FFV).`, evalResult.isAuthorized ? 'success' : 'error');
    } catch (err) {
      this.showModalError('dialyzer-form-error', err?.message || 'Error al certificar el reprocesamiento.');
    } finally {
      this.setButtonLoading('btn-submit-dialyzer', false);
    }
  }

  async handleWaterGateSubmit() {
    this.clearModalErrors();
    this.setButtonLoading('btn-submit-osmosis', true, 'Sellando SHA-256...');
    try {
      const chloraminesPpm = Number(document.getElementById('gate-chloramines')?.value);
      const permeateConductivityUs = Number(document.getElementById('gate-conductivity')?.value);
      const totalHardnessPpm = Number(document.getElementById('gate-hardness')?.value);
      const loopPressureBar = Number(document.getElementById('gate-pressure')?.value);
      const technicianName = document.getElementById('gate-technician')?.value?.trim();

      if (!technicianName) {
        this.showModalError('osmosis-form-error', 'Ingrese el nombre del técnico responsable.');
        return;
      }

      const gateEval = OsmosisWaterQualityGateEngine.evaluateWaterGate({
        chloraminesPpm,
        permeateConductivityUs,
        totalHardnessPpm,
        loopPressureBar
      });

      const cert = await OsmosisWaterQualityGateEngine.certifyWaterGate(gateEval, 'Turno Mañana (06:00)', technicianName);
      cert.isDemo = false;

      const gates = this.cache.getWaterGates(INITIAL_DEMO_DATA.waterGates);
      gates.unshift(cert);
      this.cache.saveWaterGates(gates);

      this.closeModals();
      this.render();
      this.showFeedbackBanner(cert.blockReason, cert.isGateOpen ? 'success' : 'error');
    } catch (err) {
      this.showModalError('osmosis-form-error', err?.message || 'Error al certificar la planta de agua.');
    } finally {
      this.setButtonLoading('btn-submit-osmosis', false);
    }
  }

  async handlePamiBatchSubmit() {
    this.clearModalErrors();
    const patientSelect = document.getElementById('pami-patient-select');
    const patientId = patientSelect?.value;

    if (!patientId) {
      this.showModalError('pami-form-error', 'Debe registrar o seleccionar un paciente afiliado PAMI.');
      return;
    }

    this.setButtonLoading('btn-submit-pami', true, 'Sellando SHA-256...');
    try {
      const patientName = patientSelect?.selectedOptions[0]?.text.split('(')[0].trim() || 'Paciente';
      const monthPeriod = document.getElementById('pami-period')?.value?.trim() || '2026-11';
      const transportType = document.getElementById('pami-transport')?.value || 'AMBULATORY';
      const epoDosesCount = Number(document.getElementById('pami-epo')?.value) || 0;
      const ironDosesCount = Number(document.getElementById('pami-iron')?.value) || 0;

      const patient = this.cache.getPatients(INITIAL_DEMO_DATA.patients).find((p) => p.id === patientId);
      const serologyUpToDate = patient?.lastSerologyDate
        ? ((Date.now() - new Date(patient.lastSerologyDate).getTime()) / (1000 * 60 * 60 * 24)) <= 90
        : true;

      const sessions = this.cache.getSessions(INITIAL_DEMO_DATA.sessions).filter((s) => s.patientId === patientId);

      const batchRaw = PamiDialysisModuleService.generateMonthlyBillingBatch({
        patientId,
        patientName,
        monthPeriod,
        sessions,
        epoDosesCount,
        ironDosesCount,
        transportType,
        serologyUpToDate
      });

      const certifiedBatch = await PamiDialysisModuleService.signAndSealBatch(batchRaw);
      certifiedBatch.isDemo = false;

      const batches = this.cache.getPamiBatches(INITIAL_DEMO_DATA.pamiBatches);
      batches.unshift(certifiedBatch);
      this.cache.savePamiBatches(batches);

      this.closeModals();
      this.render();
      this.showFeedbackBanner(`Lote ${certifiedBatch.batchId} emitido y sellado con SHA-256.`, 'success');
    } catch (err) {
      this.showModalError('pami-form-error', err?.message || 'Error al consolidar el lote PAMI.');
    } finally {
      this.setButtonLoading('btn-submit-pami', false);
    }
  }

  finalizeSession(sessionId) {
    const sessions = this.cache.getSessions(INITIAL_DEMO_DATA.sessions);
    const s = sessions.find((item) => item.sessionId === sessionId);
    if (s && s.status !== 'COMPLETED') {
      s.status = 'COMPLETED';
      s.completedAt = new Date().toISOString();
      this.cache.saveSessions(sessions);
      this.render();
      this.showFeedbackBanner(`Sesión ${sessionId} finalizada correctamente.`, 'success');
    }
  }

  openModal(modalId, triggerEl = null) {
    this.clearModalErrors();
    this.lastFocusedTrigger = triggerEl || document.activeElement;
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      const firstInput = modal.querySelector('input, select, button:not(.btn-close-modal)');
      firstInput?.focus();
    }
  }

  closeModals() {
    document.querySelectorAll('[role="dialog"]').forEach((modal) => {
      modal.classList.add('hidden');
    });
    this.clearModalErrors();
    if (this.lastFocusedTrigger && typeof this.lastFocusedTrigger.focus === 'function') {
      this.lastFocusedTrigger.focus();
      this.lastFocusedTrigger = null;
    }
  }
}

// Iniciar aplicación al cargar DOM
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.__nefroApp = new NefroTrackApp();
  });
}
