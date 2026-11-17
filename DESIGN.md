# NefroTrack Design System (`DESIGN.md`)

## 1. Product Identity & Surface Mode

- **Product:** NefroTrack (Hemodiálisis Crónica, Reuso de Capilares FFV $\ge$ 80%, Gate de Planta de Ósmosis Inversa y Módulos PAMI / INCUCAI).
- **Surface Mode:** `Operate` (real-time clinical nursing station and bioengineering console).
- **Usage Scene & Theme Rationale:** Hemodialysis centers operate early-morning (06:00) and evening shifts in dimly lit clinical rooms while staff monitor 4-hour treatments on bedside tablets and nursing-station screens. NefroTrack uses a **single fixed dark-canvas theme** (`#020617` / `#0f172a`) to prevent screen glare during continuous shifts while keeping critical safety gates (`rose`, `amber`, `emerald`) unmistakable. The unused `darkMode: 'class'` configuration was removed; `@media print` explicitly switches to high-contrast white paper and dark slate ink for clinical records.

```text
Dial: ENERGY 2 (Calm Clinical Precision) / RHYTHM 2 (Structured Operational Density) / MOTION 1 (Restrained & Reduced-Motion Safe)
```

---

## 2. Color Tokens (1 Brand + 3 Semantic + Neutrals)

| Role | Token / Utility | Hex | Contrast on Surface | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas** | `slate-950` | `#020617` | Base | App background, inputs |
| **Surface** | `slate-900` | `#0f172a` | Base | Header, nav shell, cards, modals |
| **Border / Hairline** | `slate-800` / `slate-700` | `#1e293b` / `#334155` | Subtle structural edge | Dividers, flat card borders, inputs |
| **Text Primary** | `slate-100` / `white` | `#f1f5f9` / `#ffffff` | > 15:1 on `slate-900` | Headings, clinical values |
| **Text Secondary** | `slate-300` / `slate-400` | `#cbd5e1` / `#94a3b8` | 11.5:1 / 6.7:1 on `slate-900` | Labels, metadata, helper text (minimum `slate-400`, never `slate-500` on `slate-900`) |
| **Primary Brand** | `dialysis-700` (`sky-700`) / `sky-400` | `#0369a1` / `#38bdf8` | 5.9:1 (`#fff` on `#0369a1`), 8.9:1 (`#38bdf8` on `slate-900`) | Primary CTAs, active tab, focus rings (`sky-400`) |
| **Status: Safe / Open** | `emerald-700` / `emerald-400` | `#047857` / `#34d399` | 5.4:1 (`#fff` on `#047857`), 9.5:1 (`#34d399` on `slate-900`) | Safe UF rate, FFV $\ge$ 80%, open water gate |
| **Status: Warning / Billing** | `amber-700` / `amber-400` | `#b45309` / `#fbbf24` | 5.0:1 (`#fff` on `#b45309`), 10.7:1 (`#fbbf24` on `slate-900`) | High UF warning, PAMI billing actions & periods |
| **Status: Critical / Blocked** | `rose-700` / `rose-400` | `#be123c` / `#fb7185` | 6.5:1 (`#fb7185` on `slate-900`) | Biological mismatch, FFV < 80% discard, water gate lockout |

- **Prohibited Colors:** Gratuitous `purple`, `pink`, `indigo`, or glowing `shadow-*-950` halos are banned.

---

## 3. Typography Scale & Hierarchy

- **Font Stacks:**
  - **UI Sans:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` (fast, zero network font dependency, Offline-First safe).
  - **Numeric Telemetry:** `font-variant-numeric: tabular-nums` (`tabular-nums`) on all clinical measurements (mL, kg, mL/kg/h, $\mu$S/cm, mg/L, %) and ARS amounts.
  - **Monospace:** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` strictly for serial IDs, capilar QR codes, and SHA-256 digests.
- **Scale Steps:**
  - `h1` (App Identity): `text-xl sm:text-2xl font-bold tracking-tight` (20px–24px)
  - `h2` (Section Heading): `text-lg font-bold tracking-tight` (18px)
  - `h3` (Modal Heading): `text-base font-bold` (16px)
  - `body` / Card primary title: `text-sm` (14px)
  - `caption / form label / metadata`: `text-xs` (12px minimum — `text-[10px]` is prohibited).

---

## 4. Layout Rhythm, Restraint & Accessibility

- **Single Sticky Top Shell:** `<header>` and `<nav role="tablist">` live inside one unified sticky container (zero hardcoded `top-[61px]` offsets, zero `backdrop-blur` on `<nav>`).
- **Flat Card Architecture:** No nested bordered sub-cards inside `<article>` cards or modals; separate metric rows with `border-t border-slate-800 pt-3` hairlines.
- **Purposeful Badges:** At most one status badge per card header; secondary attributes (chair, sector, model, reuse #, period) render as muted inline metadata separated by `·`.
- **Responsive Mobile-First:** Viewport permits user pinch-zoom (`width=device-width, initial-scale=1.0`); headers and action rows use `flex-wrap` and `min-w-0`; modal grids collapse via `grid-cols-1 sm:grid-cols-2`; all interactive buttons enforce `.touch-target` ($\ge 44\times44\text{px}$).
- **Keyboard & States:** Global `Escape` closes active dialogs; `:focus-visible` uses high-contrast `2px` `#38bdf8` ring; all inputs bind `<label for="...">`; async actions show loading states and inline `role="alert"` error banners (zero `window.alert()` / `confirm()`).
- **Motion:** Zero infinite `animate-pulse` loops; `@media (prefers-reduced-motion: reduce)` disables all transitions and animations.
