# 🏥 NefroTrack Argentina — Centros de Hemodiálisis, Reuso de Capilares & Ósmosis Inversa

> **Plataforma Integral para Centros Nefrológicos: Trazabilidad Unívoca de Reuso de Capilares (FFV $\ge$ 80%), Gate Matutino de Planta de Agua Tratada, Aislamiento Serológico y Liquidación de Módulos PAMI / Obras Sociales sin Débitos.**

---

## 🌟 Visión del Producto

Los centros de hemodiálisis crónica en Argentina operan bajo auditorías de máxima rigurosidad técnica y médica impuestas por el **Ministerio de Salud de la Nación, INCUCAI, PAMI y Obras Sociales**.

NefroTrack resuelve los cuatro puntos neurálgicos de seguridad biológica y recupero financiero:
1. **Seguridad Crítica en el Reuso de Filtros Dializadores (Capilares):** Cada filtro es exclusivo de un único paciente. El sistema valida la correspondencia unívoca vía QR, calcula el **Volumen Residual de Fibras (FFV / Priming Volume %)** exigiendo un mínimo estricto $\ge 80\%$, limita los reusos al máximo permitido y verifica la ausencia de esterilizante residual (ácido peracético) antes de autorizar la conexión.
2. **Gate Matutino Bloqueante de Planta de Agua (Ósmosis Inversa):** Evaluación físico-química del anillo de agua pura antes de abrir el turno. Niveles de cloraminas $\ge 0.10\text{ mg/L}$ bloquean automáticamente la sala para prevenir hemólisis fatal.
3. **Matriz de Aislamiento Serológico:** Asignación segura de sillones que previene infecciones cruzadas entre pacientes Seronegativos (Sala Blanca), Hepatitis C Reactivos (Sector Cohorte) y Hepatitis B Antígeno de Superficie Positivos (Aislamiento Estricto Res. 810/2000).
4. **Liquidación de Módulos Mensuales PAMI con Cero Débitos:** Consolidación de 13 sesiones mensuales firmadas con sello SHA-256, administración de Eritropoyetina (EPO), Hierro sacarato IV y vales de traslado médico (Remis, Silla de Ruedas, Camilla).

---

## 🏗️ Arquitectura Técnica y Motores de Negocio

### 1. 🧬 Dialyzer Reuse Safety Engine (`Motor #130 / #121`)
- **Emparejamiento Unívoco QR:** Bloqueo biológico inmediato ante cualquier discrepancia entre el paciente del capilar y el paciente a conectar.
- **Cálculo de Residual Fiber Volume (FFV):** $\text{FFV (\%)} = (\text{Volumen Medido mL} / \text{Volumen Basal mL}) \times 100$. Si $\text{FFV} < 80\%$, emite dictamen de **Descarte Obligatorio por coagulación de fibras**.
- **Control de Ciclos de Reprocesamiento:** Conteo de reusos y bloqueo al alcanzar el tope normativo (12 reusos).
- **Verificación Química:** Validación obligatoria de tira reactiva negativa de ácido peracético.
- **Certificado Criptográfico de Reprocesamiento:** Sellado SHA-256 para auditoría de bioseguridad.

### 2. 💧 Osmosis Water Quality Gate Engine (`Motor #307 / #115`)
- **Gate Bloqueante:** Parámetros de Farmacopea Argentina y AAMI-ISO 23500.
  - Cloraminas totales: estricto $< 0.10\text{ mg/L}$.
  - Conductividad del permeado: óptimo $< 15.0\ \mu\text{S/cm}$ (corte absoluto $25\ \mu\text{S/cm}$).
  - Dureza total: $0\text{ ppm CaCO}_3$ (post-ablandador iónico).
  - Presión del anillo: $2.0 - 4.5\text{ bar}$.
- Si las cloraminas o la conductividad superan el umbral crítico, la sala entra en **Lockout**: prohibido iniciar el turno.

### 3. 💺 Serology Chair Isolation Engine (`Motor #295`)
- **Reglas de Separación:**
  - `SERONEGATIVE` $\to$ Sala Blanca / General.
  - `HCV_REACTIVE` $\to$ Sector de Cohorte Hepatitis C.
  - `HBSAG_POSITIVE` $\to$ Sala de Aislamiento Exclusivo con monitor dedicado.
- **Alerta Trimestral:** Detección automática de pacientes con serología mayor a 90 días para actualización de laboratorio obligatoria.

### 4. ⚖️ Ultrafiltration Session Engine (`Motor #134 / #309`)
- **Cálculo de Ultrafiltración:** $\text{UF Total (mL)} = (\text{Peso Pre} - \text{Peso Seco}) \times 1000 + \text{Ingesta} + \text{Lavado}$.
- **Tasa Segura de UF:** Alerta si supera los $13.0\text{ mL/kg/h}$ para evitar hipotensión intradiálisis y atontamiento miocárdico.
- **Adecuación Daugirdas Kt/V:** Estimación de dosis dialítica de urea de 2ª generación ($\text{Target } Kt/V \ge 1.20$).

### 5. 📑 Pami Dialysis Module Service (`Motor #134 / #245`)
- **Módulo Mensual 13 Sesiones:** Tarifa base por sesión, medicamentos de alto costo (EPO 4000 UI, Hierro IV) y subsidio de traslado.
- **Auditoría Preventiva de Débitos:** Detección de sesiones sin firma digital, serología vencida o Kt/V insuficiente.
- **Sello SHA-256 de Cierre:** Respaldo inmutable para presentación en PAMI.

---

## 🛡️ Blindaje de Seguridad y Cumplimiento

- **Zero-Sink DOM Armor:** Renderizado exclusivo mediante `DOMParser`, `replaceChildren` y sanitización contextual de atributos. Cero asignaciones directas a `innerHTML` o sinks de script injection.
- **CSP Cualitativa Estricta en `firebase.json`:**
  - Sin `'unsafe-eval'`.
  - Sin comodines `*` en `script-src` ni `default-src`.
  - Sin orígenes no cifrados `http://`.
  - Cabeceras `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` y `Referrer-Policy`.
- **Reglas Zero-Trust en `firestore.rules`:** Validación obligatoria de autenticación, aislamiento de historias clínicas por paciente (Ley 26.529 de Derechos del Paciente) y protección de inmutabilidad contra transferencia de autoría (`request.resource.data.createdBy == resource.data.createdBy`).
- **Auditoría AppSec Guardian:** **100/100** (0 Críticas, 0 Altas, 0 Medias, 0 Bajas).

---

## 🧪 Arnés de Pruebas Multi-Capa (57 Tests)

```bash
pnpm test
```

| Capa | Nombre | Cantidad | Descripción |
| :--- | :--- | :---: | :--- |
| **Capa 1** | Unitarias & Fuzzing Caótico | 26 | Bloqueo por cruce de paciente, FFV < 80%, reusos máximos, ácido peracético residual, cloraminas altas, tasa de UF segura y Kt/V Daugirdas. |
| **Capa 2** | Integración & Persistencia | 11 | Liquidación mensual PAMI, EPO/Hierro, traslado, detección de débitos, persistencia offline, advertencia ante JSON corrupto y Outbox FIFO. |
| **Capa 3** | Componentes & DOM Zero-Sink | 6 | Sinks de Sanitizer, escape de etiquetas, filtrado de esquemas maliciosos (`javascript:`, `data:`), formateadores de peso, UF, presión y conductividad. |
| **Capa 4** | Seguridad Cualitativa & Reglas | 8 | Validación estricta de cabeceras en `firebase.json` (`/sw.js` anti-stale, CSP sin `unsafe-inline` ni CDN), reglas de Firestore médicas, CSS local Offline-First, escaneo de secretos y versión semántica `vX.Y.ZZ`. |
| **Capa 5** | Flujo E2E Ciclo de Vida | 6 | Flujo completo: Habilitación matutina de ósmosis $\to$ Validación serológica $\to$ Escaneo QR de capilar (FFV $\ge$ 80%) $\to$ Sesión con UF segura $\to$ Kt/V $\to$ Cierre de Lote PAMI. |

**Total:** 57 tests | 57 aprobados (100% PASS).

---

## 🎨 Remediación UX/UI, Accesibilidad y PWA Offline-First

- **Sistema de Diseño (`DESIGN.md`):** Tema oscuro clínico de bajo deslumbramiento para salas de diálisis con contraste WCAG AA ($\ge 4.5:1$), jerarquía tipográfica descendente y hoja de impresión dedicada (`print.css`).
- **Accesibilidad (a11y) y Teclado:** Soporte de `Escape` para cerrar modales, `role="tablist"`/`role="tab"`/`aria-selected`, `<label for="...">` en todos los controles, `:focus-visible` de alto contraste, áreas táctiles $\ge 44\text{px}$ (`.touch-target`) y `@media (prefers-reduced-motion: reduce)`.
- **Verdad Radical y Telemetría Real:** Datos precargados etiquetados como `[DEMO]` con purga manual en UI (`Limpiar Datos Demo`), estado serológico calculado dinámicamente en sala, conectividad real vía `navigator.onLine` y sellado SHA-256 mediante Web Crypto (`CryptoSeal`).
- **PWA 100% Offline-First:** Tailwind CSS precompilado en `./styles.css` (cero dependencia de CDN en runtime), `manifest.json`, registro externo en `src/sw-register.js` y `sw.js` con estrategia híbrida y cabecera `Cache-Control: no-cache, no-store, must-revalidate` para `/sw.js`.

---

## 📱 Operatividad en Sala y Modo Tablet

- **Screen Wake Lock API:** Modo Sala que mantiene la pantalla encendida en la tablet del puesto de enfermería para monitoreo continuo de signos vitales.
- **Auto Re-enganche:** Escucha `visibilitychange` para recuperar el bloqueo de pantalla automáticamente al regresar a la aplicación.
- **PWA 100% Offline-First:** Funciona de manera ininterrumpida ante caídas de enlace a internet en la clínica.

---

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
pnpm install

# Ejecutar batería de pruebas (5 capas, 54 tests)
pnpm test

# Ejecutar auditor de seguridad
pnpm run test:security

# Incrementar versión semántica
pnpm run version:bump
```

---
*Desarrollado bajo el Estándar de Excelencia AiAppFactory — LeonLezcano.*
