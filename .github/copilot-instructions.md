# GitHub Copilot GPT Instructions – Effective Interest Rate Calculator for Funds

These are **project-wide instructions** for GitHub Copilot GPT (agent mode) for this repository.

The goal is to keep the implementation **consistent, predictable, and aligned with the product requirements** for the “Effective Interest Rate Calculator for Funds”.

---

## 1. High-Level Product Overview

This project is a **purely client-side** web application that:

- Lets users define a list of **cash flows** (deposits and withdrawals with dates and amounts).
- Allows the user to input a **current fund value** and **valuation date**.
- Computes and displays:
  - **XIRR-style annualized effective return (IRR)**.
  - **Simple annual interest rate** using a **balance × days** method.
- Lets users **save historical calculation snapshots** (each with calculation timestamp, valuation date, current value, IRR, simple rate, net invested, profit).
- Allows **export** and **import** of scenarios as JSON (cash flows + history).
- Maintains the **latest session** automatically in `localStorage`.
- Is implemented as a **PWA** (installable and offline-capable for core functionality).

There is **no backend**. All logic and persistence are **client-side only**.

---

## 2. Tech Stack & Frameworks

Copilot MUST follow this stack and avoid introducing alternatives unless explicitly asked:

- **Language**: TypeScript
- **Framework**: React (functional components + hooks)
- **Bundler/Tooling**: Vite (preferred) or another modern React setup (but Vite is the default assumption)
- **Styling**: Tailwind CSS
- **Charting**: Chart.js via `react-chartjs-2`
- **Date Library**: `date-fns` (or similar lightweight date lib, but default to `date-fns`)
- **State Management**: React `useState` / `useReducer` (no Redux, Zustand, MobX, etc., unless explicitly requested)
- **Storage**:
  - `localStorage` for **autosave** of the last session
  - Manual **JSON download/upload** for persistent scenarios
- **PWA**:
  - Web app manifest
  - Service worker for caching static assets

Do NOT add any backend code, Node/Express APIs, or database integration unless the user explicitly changes the requirements.

---

## 3. Architecture & Project Structure

Use this approximate structure (names can vary slightly, but the concepts should remain):

```txt
src/
  domain/
    irr.ts            // IRR/XIRR algorithm (pure TS)
    simpleRate.ts     // Simple interest (balance × days)
    cashflow.ts       // Cash flow utilities (sorting, balances, net invested)
    jsonSchema.ts     // Export/import helpers & validation
    summarySchema.ts  // Summary page validation & metric enrichment
  types/
    index.ts          // Shared TS interfaces/types
  hooks/
    useCalculator.ts  // Encapsulate CalculatorState + actions (optional, but recommended)
  components/
    layout/
      Layout.tsx
    cashflow/
      CashFlowTable.tsx
      CashFlowRow.tsx
    current/
      CurrentValueForm.tsx
    results/
      ResultsPanel.tsx
    history/
      HistoryTable.tsx
      HistoryChart.tsx
    io/
      ImportExportPanel.tsx
    summary/
      SummaryPage.tsx           // Multi-fund comparison page
      RateComparisonChart.tsx   // IRR/Simple Rate comparison chart
    common/
      Button.tsx
      Input.tsx
      DateInput.tsx
      Tooltip.tsx
  pwa/
    serviceWorkerRegistration.ts
    // manifest.webmanifest typically resides in public/ or root
  App.tsx
  main.tsx            // React Router setup with / and /summary routes
  index.css          // Tailwind base/styles
```

**Key principles for Copilot:**

- Keep all **math/finance logic** in `src/domain` as **pure functions**.
- Keep **React components** as thin and declarative as possible, consuming domain functions.
- Use **TypeScript types** from `src/types` across the app.
- Ensure **separation of concerns**:
  - `domain/` knows nothing about React, DOM, localStorage, or browser APIs.
  - Components know as little as possible about low-level math details.

---

## 4. Core Types & Data Models

Define these types in `src/types/index.ts` (or equivalent):

```ts
export type Direction = "deposit" | "withdrawal";

export interface CashFlowEntry {
  id: string;          // unique client-side ID
  date: string;        // ISO date string, "YYYY-MM-DD"
  amount: number;      // > 0
  direction: Direction;
}

export interface HistoricalSnapshot {
  calculationDateTime: string;  // ISO datetime, e.g. "2025-11-16T10:15:30Z"
  valuationDate: string;        // ISO date used for this calculation
  currentValue: number;         // fund value used at valuationDate
  irr: number | null;           // e.g. 0.1397 (13.97%), null if not computable
  simpleRate: number | null;    // e.g. 0.1486, null if not computable
  netInvested: number;          // sum of deposits - sum of withdrawals
  profit: number;               // currentValue - netInvested
}

export interface CalculatorState {
  cashFlows: CashFlowEntry[];
  valuationDate: string | null; // ISO date, null means "not set" (UI defaults to today)
  currentValue: number | null;
  history: HistoricalSnapshot[];
}

export interface ExportedScenarioJson {
  version: number;              // e.g. 1
  cashFlows: {
    date: string;
    amount: number;
    direction: Direction;
  }[];
  valuationDate: string | null;
  currentValue: number | null;
  history: HistoricalSnapshot[];
}
```

**Copilot must:**
- Reuse these types instead of redefining shapes ad-hoc.
- Keep `ExportedScenarioJson` stable so export/import round-trips cleanly.

---

## 5. Domain Logic (Financial Calculations)

All financial logic should live under `src/domain/` as pure functions.

### 5.1 IRR / XIRR (`domain/irr.ts`)

- Implement as a function like:

  ```ts
  import { CashFlowEntry } from "../types";

  export interface IrrCashFlow {
    date: Date;
    amount: number;  // signed: negative for deposits, positive for withdrawals/currentValue
  }

  export function computeIrr(cashFlows: IrrCashFlow[]): number | null {
    // ...
  }
  ```

- Use:
  - Base date = earliest cash flow date.
  - Time exponent: `t_i / 365` where `t_i` is the day difference vs base date.
- Equation:

  \[
  f(R) = \sum CF_i \cdot (1 + R)^{-t_i / 365} = 0
  \]

- Algorithm:
  - Prefer Newton–Raphson with a fallback to bisection.
  - Reasonable bounds: `[-0.9999, 10]` (−99.99% to +1000% annual).
  - Tolerance: `1e-7` or similar.
  - Max iterations: ~50–100.
- Handle edge cases:
  - All cash flows same sign ⇒ return `null` (IRR undefined).
  - No solution in bounds ⇒ `null`.

### 5.2 Simple Annual Rate (`domain/simpleRate.ts`)

- Implement as a function like:

  ```ts
  import { CashFlowEntry } from "../types";

  export interface SimpleRateInput {
    cashFlows: CashFlowEntry[];
    valuationDate: Date;
    currentValue: number;
  }

  export function computeSimpleRate(input: SimpleRateInput): number | null {
    // ...
  }
  ```

- Logic:

  1. Sort events by date (cash flows + valuation date).
  2. Maintain running invested balance `B_j` after each event:
     - Deposit ⇒ increase balance.
     - Withdrawal ⇒ decrease balance.
  3. For each period between `D_j` and `D_{j+1}`:
     - Duration `d_j = days(D_j, D_{j+1})` (using `date-fns`).
     - Accumulate `sum(B_j * d_j)`.
  4. Net invested capital = sum of deposits − sum of withdrawals.
  5. Profit = `currentValue - netInvested`.
  6. If `sum(B_j * d_j) <= 0`, return `null`.
  7. Simple annual rate:

     \[
     X = \frac{\text{Profit} \cdot 365}{\sum B_j \cdot d_j}
     \]

### 5.3 Cash Flow Utilities (`domain/cashflow.ts`)

- Expose helpers such as:
  - `sortCashFlowsByDate`
  - `computeNetInvested`
  - `mapCashFlowsToIrrFormat`
  - `getEventsWithBalances` (for simple rate calculations)

### 5.4 JSON Schema Helpers (`domain/jsonSchema.ts`)

- Functions like:
  - `buildExportJson(state: CalculatorState): ExportedScenarioJson`
  - `parseImportedJson(raw: unknown): CalculatorState | ImportError`

Keep everything **pure** and **synchronous**. No side-effects.

---

## 6. LocalStorage & Autosave

Implement autosave in a small utility or inside `useCalculator`:

- Use a constant key, e.g. `"effective-interest-calculator-state-v1"`.
- On state change, debounce (300–500ms) then:
  - `JSON.stringify` a subset of `CalculatorState` compatible with `ExportedScenarioJson`.
  - Write to `localStorage`.
- On app startup:
  - Attempt to read and parse.
  - If valid, hydrate state.
  - If invalid, start from clean default.

Copilot must **gracefully handle** lack of localStorage (SSR or restricted environments):
- Wrap access in `try/catch`.
- Feature-detect availability when needed.

---

## 7. Components & Responsibilities

Copilot should follow these roles when scaffolding and filling components.

### 7.1 `App.tsx`

- Initialize `CalculatorState` (possibly via `useCalculator` hook).
- On mount, attempt to hydrate state from localStorage.
- Pass state and action callbacks to child components:
  - `CashFlowTable`
  - `CurrentValueForm`
  - `ResultsPanel`
  - `HistoryTable`
  - `HistoryChart`
  - `ImportExportPanel`

### 7.2 `CashFlowTable` / `CashFlowRow`

- Displays editable table of cash flows.
- Each row:
  - Date input (HTML date + Tailwind styling + `date-fns` parsing)
  - Number input for amount
  - Select for direction (“Deposit”, “Withdrawal”)
  - Delete button/icon
- Emits callbacks:
  - `onAddCashFlow`
  - `onUpdateCashFlow(id, patch)`
  - `onDeleteCashFlow(id)`

### 7.3 `CurrentValueForm`

- Inputs:
  - `valuationDate` (date input, default to today if null)
  - `currentValue` (number input)
- Emits callbacks:
  - `onValuationDateChange`
  - `onCurrentValueChange`

### 7.4 `ResultsPanel`

- Props:
  - `netInvested`
  - `profit`
  - `irr` (number | null)
  - `simpleRate` (number | null)
- Responsibilities:
  - Show formatted values (e.g. percentages with 2 decimals).
  - Show “N/A” with short explanation when null.
  - Include tooltips or short explanatory copy for IRR vs simple rate.

### 7.5 `HistoryTable`

- Props:
  - `history: HistoricalSnapshot[]`
- Renders a list/table of snapshots:
  - Calculation datetime (formatted)
  - Valuation date
  - Current value
  - IRR (%)
  - Simple rate (%)
  - Profit

### 7.6 `HistoryChart` (Chart.js)

- Props:
  - `history: HistoricalSnapshot[]`
- Behaviour:
  - If `history.length < 2`, show placeholder (“Add more snapshots to see a trend line”).
  - Otherwise:
    - Build dataset for IRR over time (x-axis = calculation datetime or valuationDate, y-axis = percentage).
    - Optionally include simple rate as a second series.
  - Use Tailwind for container styling; Chart.js handles drawing.

### 7.7 `ImportExportPanel`

- Buttons:
  - “Import JSON”
    - `<input type="file" accept="application/json" />` or a hidden input triggered by a button.
    - Read file via FileReader, parse JSON, validate, then call `onImportScenario` callback.
  - “Export JSON”
    - Build `ExportedScenarioJson` from current state.
    - Trigger download (`Blob` + `URL.createObjectURL` + fake `<a>` click).
- Must handle errors gracefully and display a friendly message.

### 7.8 `Layout` & Common Components

- `Layout`:
  - Header with app title and maybe a small subtitle.
  - Responsive layout using Tailwind (stacked on mobile, multi-column on desktop).
- `common/Button`, `common/Input`, etc.:
  - Small, reusable components with Tailwind classes applied.

---

## 8. Styling & Tailwind Conventions

- Use Tailwind utility classes (no CSS-in-JS).
- Keep the design **clean and minimal**:
  - Spacing: `p-4`, `p-6`, `gap-4`, etc.
  - Cards: `rounded-xl`, `shadow`, `border`, `bg-white` (or Tailwind defaults).
  - Typography: `text-lg` for titles, `text-sm`/`text-base` for body.
- Ensure responsive layouts using breakpoints (`sm:`, `md:`, `lg:`).
- Prefer semantic HTML where possible (`<section>`, `<header>`, `<main>`, `<table>`).

---

## 9. PWA Requirements

Copilot should scaffold PWA support when requested:

- Web app manifest (`manifest.webmanifest`):
  - Name, short_name, icons, theme_color, background_color, display = "standalone".
- Service worker:
  - Register via `serviceWorkerRegistration.ts` or similar.
  - Cache static assets using a simple strategy (e.g., `workbox` or manual `caches.open()`).
- Ensure the app remains usable offline for:
  - Viewing/editing cash flows
  - Viewing history
  - Running calculations

No need for advanced offline sync; simple static caching is sufficient for v1.

---

## 10. Behavior Guidelines for Copilot

When generating code or responding to prompts in this repo, Copilot should:

1. **Respect the architecture**:
   - Keep domain logic pure and in `src/domain`.
   - Keep React components presentational where possible.
2. **Respect the tech stack**:
   - Use React + TypeScript + Tailwind + Chart.js + date-fns.
   - Do not introduce other major frameworks or state libs without being explicitly asked.
3. **Prefer explicit types**:
   - Avoid `any` unless absolutely necessary.
   - Define and reuse proper types/interfaces from `src/types`.
4. **Keep things small and composable**:
   - Break large components into smaller ones.
   - Write small utilities for repeated logic.
5. **Handle edge cases**:
   - Empty cash flows.
   - Same-sign cash flows for IRR.
   - Malformed JSON on import.
   - localStorage unavailability.
6. **Maintain round-trip safety**:
   - Ensure export → import yields equivalent state.
7. **Comment wisely**:
   - Add short comments where logic is non-obvious (especially for IRR/simple rate math).
8. **Keep UX friendly**:
   - Use clear labels, placeholder texts, and simple validation messages.
   - Avoid overwhelming the user with low-level details by default.

---

## 11. Non-Goals & Things to Avoid

Copilot **must NOT**:

- Add backend endpoints, servers, or databases.
- Add authentication, user accounts, or third-party auth flows.
- Integrate with external financial APIs unless explicitly instructed.
- Store user data anywhere other than localStorage and exported JSON files.
- Over-engineer with complex state management libraries.

---

## 12. Example User Story Flow (for Context)

1. User opens the app:
   - State is restored from localStorage if available.

2. User adds several **cash flows** (dates, amounts, deposit/withdrawal).

3. User enters **valuation date** and **current value**.

4. App auto-calculates and displays:
   - Net invested capital
   - Profit
   - IRR (or N/A)
   - Simple annual rate (or N/A)

5. User clicks **“Calculate & Save Snapshot”**:
   - A new historical snapshot is recorded.
   - History table updates.
   - Chart updates if there are ≥ 2 snapshots.

6. User clicks **“Export JSON”**:
   - A JSON file downloads with cash flows + history.

7. Later, user returns, or on another device:
   - User clicks **“Import JSON”**, selects file.
   - Scenario and history are restored.

Copilot should always keep this user flow in mind when generating code.

---

End of Copilot instructions.
