# Effective Interest Rate Calculator for Funds

A purely client-side, browser-based calculator for **money-weighted returns** on fund/ETF investments with **irregular cash flows**.

The app lets you:

- Model deposits and withdrawals as dated **cash flows**.
- Enter a **current fund value** and **valuation date**.
- Compute:
  - **Annualized effective return (IRR / XIRR-style)**.
  - **Simple annual interest rate** using a **balance × days** method.
- Save **historical calculation snapshots** and track performance over time.
- **Export** and **import** scenarios as JSON.
- Automatically **resume your last session** via `localStorage`.
- Install and use it as a **Progressive Web App (PWA)**, including offline capability for core features.

> There is **no backend**. All logic and storage are client-side only.

---

## Table of Contents

- [Features](#features)
- [Live Demo](#live-demo)
- [Motivation](#motivation)
- [How It Works](#how-it-works)
  - [Cash Flows](#cash-flows)
  - [Current Value / Valuation Date](#current-value--valuation-date)
  - [Annualized Effective Return (IRR / XIRR-style)](#annualized-effective-return-irr--xirr-style)
  - [Simple Annual Interest Rate (Balance × Days)](#simple-annual-interest-rate-balance--days)
  - [Historical Snapshots & Charts](#historical-snapshots--charts)
  - [JSON Export / Import](#json-export--import)
  - [Autosave via localStorage](#autosave-via-localstorage)
- [Getting Started (Local Development)](#getting-started-local-development)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Running Tests](#running-tests)
  - [Building for Production](#building-for-production)
- [User Guide](#user-guide)
  - [1. Add Cash Flows](#1-add-cash-flows)
  - [2. Enter Current Value](#2-enter-current-value)
  - [3. View Results](#3-view-results)
  - [4. Save a Historical Snapshot](#4-save-a-historical-snapshot)
  - [5. View History & Trend Chart](#5-view-history--trend-chart)
  - [6. Export Scenario as JSON](#6-export-scenario-as-json)
  - [7. Import Scenario from JSON](#7-import-scenario-from-json)
  - [8. Clear All Data](#8-clear-all-data)
- [Data Model](#data-model)
  - [CashFlowEntry](#cashflowentry)
  - [HistoricalSnapshot](#historicalsnapshot)
  - [CalculatorState](#calculatorstate)
  - [ExportedScenarioJson](#exportedscenariojson)
- [Architecture & Tech Stack](#architecture--tech-stack)
  - [Front-End Architecture](#front-end-architecture)
  - [Directory Structure](#directory-structure)
  - [Domain Layer](#domain-layer)
- [Validation & Edge Cases](#validation--edge-cases)
- [PWA Behavior](#pwa-behavior)
- [Privacy & Security](#privacy--security)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- **Irregular Cash Flows**
  - Model deposits and withdrawals with arbitrary dates and amounts.
  - Rows are automatically ordered by date for correct calculations.

- **Two Return Metrics**
  - **IRR / XIRR-style effective annualized return** (money-weighted, compounded).
  - **Simple annual interest rate** using the **balance × days** approach.

- **Historical Tracking**
  - Capture **snapshots** with:
    - Calculation datetime
    - Valuation date
    - Current value
    - IRR
    - Simple rate
    - Net invested capital
    - Profit
  - View snapshots in a **history table** and as a **line chart** over time.

- **Offline-First PWA**
  - Installable on supporting browsers.
  - Core functionality works offline once the app is cached/installed.

- **Session Persistence**
  - Automatic autosave and restore via `localStorage`.
  - Manual JSON **export/import** for long-term tracking and cross-device use.

- **No Backend / No Login**
  - All calculations and data are handled in the browser.
  - No external API calls for your financial data.

---

## Live Demo

> TODO: Add link once deployed (e.g. GitHub Pages, Netlify, Vercel).

For example:

```text
https://dimuthnc.github.io/compound-interest-calculator/
```

---

## Motivation

Many investors make **recurring contributions** and occasional withdrawals into index funds, ETFs, or mutual funds. Broker-provided performance numbers may:

- Obscure the actual **money-weighted return** you personally achieved.
- Hide key assumptions about compounding and timing.
- Offer limited transparency for **what-if analysis**.

This project provides a **transparent, inspectable** and **client-side** calculator that:

- Makes assumptions explicit.
- Encodes the core math in simple, well-structured TypeScript functions.
- Allows exporting the underlying data and results as JSON.

For full product requirements and design details, see:

- [effective-interest-calculator-prd-v3-architecture.md](./effective-interest-calculator-prd-v3-architecture.md)

---

## How It Works

### Cash Flows

Each **cash flow** is a single transaction with:

- `date` – calendar date (`YYYY-MM-DD`).
- `amount` – strictly positive number.
- `direction` – `"deposit"` or `"withdrawal"`.

For calculations:

- **Deposits** are cash **outflows** from the user:
  - Treated as **negative** cash flows in IRR.
- **Withdrawals** are cash **inflows**:
  - Treated as **positive** cash flows.

The UI:

- Starts with an **empty** cash flow table.
- Lets you add, edit, and delete rows.
- Automatically sorts entries by date (ascending).

### Current Value / Valuation Date

You provide:

- **Valuation date** – typically “today”.
- **Current value** – the current fund value at the valuation date.

For the IRR/XIRR calculation, the current value is treated as the **final positive cash flow** at the valuation date.

For the simple-interest calculation, the valuation date is the **end of the last period**.

### Annualized Effective Return (IRR / XIRR-style)

The IRR is the **annualized, compounded rate** \(R\) that satisfies:

\[
\sum_{i=1}^{N} \frac{CF_i}{(1 + R)^{t_i / 365}} = 0
\]

Where:

- \(CF_i\) – signed cash flow amount (negative for deposits, positive for withdrawals / current value).
- \(t_i\) – days between cash flow date and the base date (usually the earliest cash flow).
- 365 days/year is assumed (future versions may support other day-count conventions).

Implementation details:

- A pure TypeScript function in `src/domain/irr.ts`.
- Numerical root-finding:
  - Newton–Raphson where possible.
  - Fallback to bisection on a bounded interval (e.g. \([-0.9999, 10]\)).
- Returns:
  - A decimal, e.g. `0.1397` (13.97%), or
  - `null` when no valid IRR exists (e.g. all cash flows same sign, no root in range).

### Simple Annual Interest Rate (Balance × Days)

The **simple annual rate** \(X\) assumes:

- A **constant annual rate** (no compounding).
- Between each event (cash flow or valuation date), the invested balance is constant.
- Total interest is proportional to **balance × days**.

Steps:

1. Sort all events by date:
   - All cash flows.
   - Valuation date.

2. Maintain a running **invested balance** \(B_j\) after each event:
   - Deposit → increase balance.
   - Withdrawal → decrease balance.

3. For each period between events \(D_j\) and \(D_{j+1}\):
   - \(B_j\) – balance after event \(j\).
   - \(d_j\) – number of days between dates (using `date-fns`).

4. Compute:
   - **Net invested capital** = sum of deposits − sum of withdrawals.
   - **Profit** = current value − net invested capital.
   - **Denominator** = \(\sum_j B_j \cdot d_j\).

5. If denominator > 0:

\[
X = \frac{\text{Profit} \cdot 365}{\sum_j B_j \cdot d_j}
\]

If not, the simple rate is reported as `N/A`.

Implementation lives in `src/domain/simpleRate.ts` as a pure function.

### Historical Snapshots & Charts

Clicking **“Calculate & Save Snapshot”**:

- Validates inputs.
- Computes IRR and simple rate for the current scenario.
- Creates a `HistoricalSnapshot` entry containing:
  - Calculation datetime.
  - Valuation date.
  - Current value.
  - IRR.
  - Simple rate.
  - Net invested capital.
  - Profit.

The **History section** shows:

- A table of all snapshots.
- A **Chart.js** line chart when there are at least two snapshots:
  - X-axis: time (calculation datetime or valuation date).
  - Y-axis: rates (IRR and optionally simple rate).

### JSON Export / Import

You can:

- **Export JSON** – Downloads a JSON file representing the current scenario and history:
  - Cash flows.
  - Valuation date.
  - Current value.
  - Historical snapshots.
  - Version metadata.

- **Import JSON** – Loads a scenario from a previously exported file:
  - Replaces the current in-memory state (cash flows, valuation date, current value, history).
  - Updates localStorage accordingly.

JSON round-trips (export → import) should reconstruct the same scenario.

### Autosave via localStorage

- The app persists the latest session in `localStorage` using a fixed key (e.g. `"effective-interest-calculator-state-v1"`).
- State is written on changes with debouncing to avoid excessive writes.
- On load, the app attempts to:
  - Read and parse saved state from localStorage.
  - Restore the UI if valid; otherwise start from a clean, empty scenario.

If localStorage is unavailable or throws (e.g. quota exceeded), the app falls back gracefully without crashing.

---

## Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended).
- [pnpm](https://pnpm.io/), [npm](https://www.npmjs.com/), or [yarn](https://yarnpkg.com/) for dependency management.

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/dimuthnc/compound-interest-calculator.git
cd compound-interest-calculator
npm install
# or: pnpm install / yarn install
```

### Development Server

Start the Vite development server:

```bash
npm run dev
```

Then open the printed URL in your browser (typically `http://localhost:5173`).

### Running Tests

If tests are configured via Vitest:

```bash
npm test
# or
npm run test
```

### Building for Production

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## User Guide

### 1. Add Cash Flows

- Open the app.
- In the **Cash Flow** section, click **“Add Cash Flow”**.
- For each row:
  - Select a **date**.
  - Enter an **amount** (positive number).
  - Choose **Deposit** or **Withdrawal**.
- Add as many rows as needed. The table automatically sorts by date.

### 2. Enter Current Value

In the **Current Value** section:

- Set the **Valuation Date** (defaults to today).
- Enter the **Current Value** (must be > 0).

A summary line will show:

- **Net invested capital**.
- **Total profit** (current value − net invested).

### 3. View Results

The **Results** panel displays:

- **IRR / XIRR-style effective annual return**
  - If the cash flow pattern does not yield a valid IRR, shows “N/A” with an explanation.
- **Simple annual rate (balance × days)**
  - If the denominator is invalid (e.g. zero), shows “N/A”.

Values are formatted as percentages with 2–4 decimal places.

### 4. Save a Historical Snapshot

Once inputs are valid:

- Click **“Calculate & Save Snapshot”**.
- The app:
  - Validates the scenario.
  - Recomputes IRR and simple rate if needed.
  - Appends a new snapshot to the history list.
  - Persists the updated state to localStorage.

### 5. View History & Trend Chart

In the **History** section:

- A table lists all snapshots with:
  - Calculation datetime.
  - Valuation date.
  - Current value.
  - IRR (%).
  - Simple rate (%).
  - Profit.

- If there are at least two snapshots:
  - A Chart.js line chart shows IRR over time (and optionally simple rate).
- If fewer than two snapshots exist:
  - A placeholder message explains that more snapshots are required to draw a trend line.

### 6. Export Scenario as JSON

In the **Import/Export** section:

- Click **“Export JSON”**.
- The browser will download a JSON file containing:
  - All cash flows.
  - Valuation date and current value.
  - Historical snapshots.
  - Version metadata.

You can store these files wherever you like (e.g. cloud storage) and share them between devices.

### 7. Import Scenario from JSON

To restore a previously exported scenario:

- Click **“Import JSON”**.
- Select a JSON file exported from this app (or matching the expected schema).
- On success:
  - The app replaces its current in-memory state with the imported scenario.
  - LocalStorage is updated.
- On failure (malformed JSON or incompatible schema):
  - The app keeps the current state unchanged.
  - A clear error message is shown.

### 8. Clear All Data

Use **“Clear All”** to:

- Remove all cash flows.
- Clear valuation date, current value, and results.
- Clear all historical snapshots.
- Reset the `localStorage` state for this app.

---

## Data Model

The core types are defined in `src/types/index.ts`.

### CashFlowEntry

```ts
export type Direction = "deposit" | "withdrawal";

export interface CashFlowEntry {
  id: string;      // unique client-side ID
  date: string;    // ISO date string, "YYYY-MM-DD"
  amount: number;  // > 0
  direction: Direction;
}
```

### HistoricalSnapshot

```ts
export interface HistoricalSnapshot {
  calculationDateTime: string;  // ISO datetime, e.g. "2025-11-16T10:15:30Z"
  valuationDate: string;        // ISO date used for this calculation
  currentValue: number;         // fund value used at valuationDate
  irr: number | null;           // 0.1397 (13.97%), null if not computable
  simpleRate: number | null;    // 0.1486 (14.86%), null if not computable
  netInvested: number;          // sum of deposits - sum of withdrawals
  profit: number;               // currentValue - netInvested
}
```

### CalculatorState

```ts
export interface CalculatorState {
  cashFlows: CashFlowEntry[];
  valuationDate: string | null; // ISO date, null means "not set" (UI may default to today)
  currentValue: number | null;
  history: HistoricalSnapshot[];
}
```

### ExportedScenarioJson

```ts
export interface ExportedScenarioJson {
  version: number;  // e.g. 1
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

The **import/export** helpers in `src/domain/jsonSchema.ts` make sure this format is stable and forward-compatible.

---

## Architecture & Tech Stack

### Front-End Architecture

- **Language**: TypeScript
- **Framework**: React (functional components + hooks)
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Charting**: Chart.js via `react-chartjs-2`
- **Date library**: `date-fns`
- **State Management**: `useState` / `useReducer`
- **Persistence**:
  - `localStorage` for last session.
  - JSON download/upload for long-term storage.

There is **no backend**: no APIs, no databases, no authentication.

### Directory Structure

From the PRD (target structure):

```txt
src/
  domain/
    irr.ts            // IRR/XIRR algorithm (pure TS)
    simpleRate.ts     // Simple rate (balance × days)
    cashflow.ts       // Cash flow utilities
    jsonSchema.ts     // Export/import helpers & validation
  types/
    index.ts          // Shared TS interfaces/types
  hooks/
    useCalculator.ts  // Encapsulate CalculatorState + actions
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
    common/
      Button.tsx
      Input.tsx
      DateInput.tsx
      Tooltip.tsx
  pwa/
    serviceWorkerRegistration.ts
  App.tsx
  main.tsx
  index.css
```

> In early versions, not all files may exist yet. The PRD and [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) guide the intended architecture.

### Domain Layer

All financial logic lives in `src/domain` as **pure functions**:

- `computeIrr(...)` in `irr.ts`.
- `computeSimpleRate(...)` in `simpleRate.ts`.
- Utilities for:
  - Sorting cash flows.
  - Computing net invested capital.
  - Building events and balances for simple rate.
- JSON import/export helpers in `jsonSchema.ts`.

These functions:

- Do not import React or browser APIs.
- Are synchronous and deterministic.
- Are unit-testable in isolation.

React components consume these functions to display and format results.

---

## Validation & Edge Cases

The app handles a variety of edge cases:

- **No cash flows**
  - Shows a friendly message prompting the user to add at least one deposit.

- **Single deposit + current value**
  - Both IRR and simple rate should be computable.

- **All cash flows same sign**
  - IRR is undefined; reported as “N/A” with an explanation.

- **Missing or invalid current value / valuation date**
  - Calculations are blocked until required fields are valid.

- **Valuation date before the latest cash flow**
  - The app may warn or highlight this soft inconsistency.

- **Very small amounts or durations**
  - Numerical safeguards to avoid divide-by-zero or floating-point overflow.

- **Malformed JSON on import**
  - Does not modify current state.
  - Shows a clear error message.

- **LocalStorage errors**
  - Caught and handled gracefully.
  - App continues to work without autosave if necessary.

---

## PWA Behavior

The app is designed as a **Progressive Web App**:

- Exposes a web app manifest with:
  - Name, short name.
  - Icons.
  - Theme and background colors.
  - `display: "standalone"`.

- Registers a **service worker** (via `pwa/serviceWorkerRegistration.ts` or equivalent) that:
  - Caches static assets (JS, CSS, HTML, icons).
  - Enables offline access for core functionality once the app is installed or cached.

This enables:

- Installing the app to your home screen (mobile) or as a standalone window (desktop).
- Using the calculator offline after the first load.

---

## Privacy & Security

- The app uses **no backend**.
- All data stays on your device:
  - In-memory state within the browser tab.
  - `localStorage` (autosave).
  - JSON files that you explicitly export.
- No financial data is sent to third-party services by default.
- If analytics or logging are added in the future, they must:
  - Be aggregated and anonymized.
  - Avoid storing exact amounts, dates, or identifiable scenarios.

---

## Roadmap

Planned or potential future enhancements (from the PRD):

- Multiple scenarios/tabs and side-by-side comparisons.
- Configurable **day-count conventions** (Actual/365, Actual/Actual, 30/360, etc.).
- Labels and categories for cash flows (e.g. “Monthly DCA”, “Dividend”).
- Dark mode / theming via Tailwind.
- CSV export in addition to JSON.
- Merging histories from multiple JSON files.
- Optional cloud sync (would require a backend, out of scope for v1).

---

## License

> TODO: Add a license.


---

For details on how to contribute and the branching model, see
[Git Branching & Contribution Workflow](CONTRIBUTING.md).


If you have suggestions, bug reports, or feature ideas, feel free to open an issue or a pull request.
