# Effective Interest Rate Calculator for Funds – Product Requirements Document (PRD)

## 1. Overview

### 1.1 Product Name
**Effective Interest Rate Calculator for Funds** (working title)

### 1.2 Description
A simple, browser-based **Progressive Web Application (PWA)** that helps individual investors calculate:
- **Money-weighted annualized effective return (IRR/XIRR)**, and
- **Annualized simple interest rate**

for investments in funds/ETFs with **irregular cash flows** (deposits and withdrawals on different dates).

The app:

- Runs entirely in the browser using **React + TypeScript**.
- Uses **Tailwind CSS** for styling and layout.
- Uses **Chart.js** (via a React wrapper) for historical rate charts.
- Uses a lightweight **date library** (e.g., `date-fns`) for date calculations.
- Supports **PWA features** (installable, offline-capable for core functionality).
- Uses **localStorage** to automatically restore the **last session**.
- Does **not** require login or server-side data storage. Persistence is via:
  - **Automatic localStorage** for the latest session, and
  - **Manual JSON export/import** for long-term tracking across devices or time.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Allow users to model their investment history as a series of **dated cash flows** (deposits and withdrawals).
- Allow users to input a **current fund value** on a given “valuation date” (typically today).
- Compute and display:
  - **XIRR-style annualized effective rate** (compounded, money-weighted return).
  - **Simple annual interest rate** using a “balance × days” approach.
- Provide a **clear, understandable UI** with inline explanations/tooltips for both rate types.
- Work well on desktop and mobile browsers without installation and be **installable as a PWA**.
- Allow users to **export** their cash-flow dataset and **historical calculation results** to a JSON file.
- Allow users to **import** a previously saved JSON file, restoring cash flows and historical calculations, and then **append new calculation snapshots** over time.
- Visualize **historical rates** (if more than one snapshot exists) in a **line chart over time**.
- Automatically **autosave** the current scenario and history in `localStorage` so users can resume where they left off.

### 2.2 Non-Goals
- No user authentication or server-side persistence (all storage is client-side: localStorage + JSON export/import).
- No direct integration with brokerages, banks, or external APIs.
- No tax calculations or accounting reports.
- No portfolio-level aggregation across multiple funds (this is fund- or scenario-specific per page/session).
- No real-time push updates or multi-user collaboration for v1.

---

## 3. Target Users & Use Cases

### 3.1 Target Users
- Individual investors who regularly invest in **index funds, ETFs, or mutual funds**.
- Users who make **periodic deposits and occasional withdrawals** and want to understand their realized annual return.
- Developers, quants, or finance enthusiasts who want a transparent and verifiable calculator.

### 3.2 Key Use Cases
1. **Quick Return Check**
   - User enters a handful of deposit/withdrawal events and the current fund value.
   - App calculates IRR and simple annual rate.

2. **What-If Scenarios**
   - User modifies dates or amounts to understand sensitivity of returns to timing.

3. **Comparing Funds or Strategies**
   - User uses the app separately for different funds/strategies and notes the resulting rates.

4. **Documentation & Demo**
   - App serves as a simple, transparent example for how IRR and simple interest are computed for irregular cashflows.

5. **Longitudinal Tracking via JSON**
   - User exports a JSON file capturing cash flows and current calculation snapshot.
   - At a later date, user imports the same JSON, updates current value, and clicks a button to compute and **append a new historical rate entry**.
   - Over time, user builds a timeline of historical IRR and simple rates for the same fund and can track performance visually in a line chart.

6. **Resume Last Session via LocalStorage**
   - User closes the tab with unsaved data.
   - On returning to the app, the last scenario (cash flows, valuation date, current value, history) is automatically restored from localStorage.

---

## 4. Key Concepts & Definitions

### 4.1 Cash Flow
A single transaction consisting of:
- **Date** (calendar date)
- **Amount** (numeric)
- **Direction** (Deposit or Withdrawal)

For calculations:
- **Deposits** = cash **outflows** from the user’s perspective ⇒ negative sign in IRR formula.
- **Withdrawals** and the **current value** = cash **inflows** ⇒ positive sign.

### 4.2 Current Value / Valuation Date
- A single **current value** representing what the fund is worth on the **valuation date** (usually today).
- This is treated as a **final positive cash flow** at the valuation date for IRR/XIRR.
- For the simple-interest calculation, the last period ends at the valuation date.

### 4.3 IRR / XIRR (Annualized Effective Rate)
- The **annualized, compounded rate** \( R \) that solves:

  \[
  \sum_{i=1}^{N} \frac{CF_i}{(1 + R)^{t_i / 365}} = 0
  \]

  Where:
  - \( CF_i \) = cash flow amount (signed: negative for deposits, positive for withdrawals/current value).
  - \( t_i \) = days between cash flow date and a chosen base date (e.g., date of first cash flow).
  - 365 is used as denominator; can be later configurable (365 vs Actual/Actual).

### 4.4 Simple Annual Interest Rate (Balance × Days Method)
Conceptual model:
- Assume a **constant simple annual rate X** (no compounding).
- Between each pair of consecutive events (cash flow or valuation date), the **invested balance** is constant.
- Interest over each period is proportional to **balance × days**.

Let the periods be:
- From \( D_1 \) to \( D_2 \): balance \( B_1 \), duration \( d_1 \) days  
- From \( D_2 \) to \( D_3 \): balance \( B_2 \), duration \( d_2 \) days  
- …  
- From \( D_{k} \) to valuation date \( D_{k+1} \): balance \( B_k \), duration \( d_k \) days  

Total interest earned (by definition) is:
\[
\text{Profit} = \text{Current Value} - \text{Net Invested Capital}
\]

Assuming a simple annual rate \( X \) and using 365 days/year:
\[
\text{Profit} = X \cdot \frac{1}{365} \sum_{j=1}^{k} B_j \cdot d_j
\]

Therefore:
\[
X = \frac{\text{Profit} \cdot 365}{\sum_{j=1}^{k} B_j \cdot d_j}
\]

This is the **simple annual interest rate**.

### 4.5 Historical Calculation Snapshot
A **historical calculation snapshot** is a record of:
- When the calculation was made (calculation date/time).
- The valuation date used.
- The current value used.
- The resulting IRR/XIRR and simple rate.
- Optional derived values such as net invested capital and profit.

A single JSON file (and the in-memory state) can contain **multiple historical snapshots** for the same cash-flow set.

---

## 5. User Experience (UX) & UI Requirements

### 5.1 Page Layout

**Top Section**
- **Title**: “Effective Interest Rate Calculator for Funds”
- Short subtitle/description explaining purpose.
- Optional info icon / “How it works” link opening a small modal.

**Cash Flow Table Section**
- **Empty by default**, with a prominent “Add Cash Flow” button.
- Each row (cash flow entry) includes:
  - Date picker input
  - Amount input (numeric, supports decimals)
  - Direction selector (Deposit / Withdrawal)
  - Delete row button (trash icon)
- Rows are ordered by date (ascending). If the user enters out-of-order dates, rows should auto-sort.

**Current Value Section**
- Inputs:
  - Valuation Date (default to today, editable)
  - Current Value (positive numeric)
- Summary line showing **Net Invested Capital** and **Total Profit** once inputs are valid.

**Results Section (Current Calculation)**
- Outputs:
  - **IRR / XIRR**
    - Display as percentage with 2–4 decimal places.
    - Label: “Annualized Effective Return (XIRR-style)”.
    - If calculation fails (e.g., no solution), show an error message or “N/A” with explanation.
  - **Simple Annual Rate**
    - Display as percentage with 2–4 decimal places.
    - Label: “Simple Annual Rate (Balance × Days)”.
- Supporting text or info icon for each result explaining the method briefly.
- A dedicated **“Calculate & Save Snapshot”** button that:
  - Validates the current inputs.
  - Calculates IRR and simple rate (if not already in sync).
  - Appends a new historical snapshot (with calculation date/time) to the in-memory history list.

**History Section**
- **Historical Snapshot Table or List**:
  - Columns/fields (example):
    - Calculation date/time
    - Valuation date
    - Current value
    - IRR (%)
    - Simple rate (%)
    - Profit (optional)
  - Display all historical snapshots loaded from the current JSON session (both imported and newly calculated).
- **Line Chart** (Chart.js):
  - If more than one historical snapshot exists:
    - Render a line chart with **time on the x-axis** and **rate(s) on the y-axis**.
    - At minimum, plot IRR as a line.
    - Optionally, plot simple annual rate as a second line with a legend.
  - If only one or zero snapshots exist, show placeholder text: “Add more snapshots over time to see a trend line.”

**Import/Export Section**
- **Export Button**: “Export JSON”
  - Downloads a JSON file containing:
    - Cash flows
    - Current valuation date and current value
    - Historical calculation snapshots
    - Optional meta/version fields
- **Import Button**: “Import JSON”
  - File picker for a JSON file conforming to the app’s schema.
  - On successful import:
    - Replace in-memory cash flows, valuation date, current value, and history with imported data.
    - Recalculate current view if necessary.
  - On failure (invalid JSON or wrong schema):
    - Show a clear error message.

**PWA Install & Offline Indicator (Optional UX Enhancements)**
- Browser-native install prompt (via manifest and service worker).
- Optional indicator if the app is **offline** (e.g., small badge in the header).

**Error & Validation Messages**
- Clear, inline validation for invalid or missing inputs:
  - At least one deposit and one positive current value are required to compute rates.
  - Dates must be valid and not empty.
  - Amounts must be > 0.
- Non-blocking inline messages (e.g., below the table or near the inputs).

### 5.2 Interactions

- **Add Row**: Appends a new empty row with default date = today, direction = Deposit, empty amount.
- **Delete Row**: Removes the selected row after a small confirmation (optional, or undo-style).
- **Auto-Calculate**: Recalculate IRR and simple rate on any relevant change (debounced) for the current snapshot view.
- **Calculate & Save Snapshot**:
  - User must provide current value and valuation date.
  - On click, validate and compute rates, then append a new history entry.
- **Reset**: A “Clear All” button that removes all rows, clears current value & results, and clears history (in-memory and localStorage).
- **Export JSON**: Trigger browser download of the current scenario and history as a JSON file.
- **Import JSON**: Load scenario and history from file, replacing current in-memory data and updating localStorage.
- **Autosave**:
  - On any state change, persist the current `CalculatorState` (or exported schema subset) to localStorage with throttling/debouncing.
  - On initial load, attempt to restore state from localStorage if present.

### 5.3 Accessibility

- All inputs and buttons must be keyboard accessible and screen-reader friendly.
- Provide descriptive labels and ARIA attributes for icons/tooltips.
- Ensure sufficient color contrast.

### 5.4 Responsive Design

- Layout should adapt from desktop to mobile:
  - On small screens, the cash-flow table may appear as stacked card-like rows instead of a strict grid.
  - Inputs should remain readable and easily tappable.
- History table and chart should be scrollable horizontally if needed on small screens.

---

## 6. Functional Requirements

### 6.1 Cash Flow Management

1. **View Cash Flows**
   - The user can view all entered cash flows in a table or list format.

2. **Create Cash Flow**
   - The user can add a new cash flow with fields:
     - Date (required)
     - Amount (required, > 0)
     - Direction (Deposit/Withdrawal, required)

3. **Update Cash Flow**
   - The user can edit any existing cash flow directly in the table.

4. **Delete Cash Flow**
   - The user can delete any cash flow row.

5. **Sorting**
   - Cash flows must be sorted by ascending date for calculation and display.

6. **Validation**
   - The system should prevent calculations if required fields are missing or invalid.
   - Show user-friendly error messages.

### 6.2 Current Value & Valuation Date

1. **Input Current Value**
   - User can input a positive numeric current value.

2. **Select Valuation Date**
   - Default: today.
   - User can change this date.

3. **Validation**
   - Current value must be > 0 for calculations.
   - Valuation date must be a valid date and must be **on or after** the latest cash flow date (soft validation; warn if earlier).

### 6.3 Calculation Logic

#### 6.3.1 Preprocessing

- Convert all dates to a consistent format and compute day differences using a **UTC-normalized** approach to avoid timezone issues (via a date library such as `date-fns`).  
- Define:
  - **Base date** for IRR time exponents = earliest cash flow date.
  - List of cash flows for IRR including the final current value.

##### Sign Conventions
- Deposit:
  - From user perspective: an investment into the fund ⇒ **negative CF**.
- Withdrawal:
  - Cash coming back to user ⇒ **positive CF**.
- Current Value:
  - Final value at valuation date ⇒ **positive CF**.

#### 6.3.2 IRR/XIRR Computation

1. **Equation**
   \[
   f(R) = \sum_{i=1}^{N} CF_i \cdot (1 + R)^{-t_i / 365} = 0
   \]

2. **Method**
   - Implement as a **pure TypeScript function** in the `domain` layer (no React dependencies).
   - Use a numerical root-finding method such as **Newton–Raphson** or **bisection**.
   - Typical approach:
     - Initial guess: 0.1 (10%) or based on simple rate.
     - Iterative update until:
       - |f(R)| < tolerance (e.g., 1e-7), or
       - Max iterations reached (e.g., 100).

3. **Bounds & Fallback**
   - If Newton–Raphson fails or diverges, fallback to a **bracketing/bisection** method on a reasonable range, e.g. [-0.9999, 10] (−99.99% to +1000%).
   - If no root found within range/iterations:
     - Display IRR as “N/A” with a message: “No valid IRR found. Check cash flow pattern.”

4. **Edge Cases to Handle**
   - All cash flows are same sign ⇒ IRR undefined.
   - Very small net profits or short duration ⇒ IRR close to 0; ensure numerical stability.
   - Single deposit and a final current value ⇒ IRR reduces to a standard annualized return.

#### 6.3.3 Simple Annual Rate Calculation

1. **Determine Periods**
   - Sort all events by date: cash flows plus the valuation date.
   - Maintain a running balance \( B_j \) after each event:
     - Start from 0.
     - For each cash flow:
       - If Deposit: increase invested capital by amount.
       - If Withdrawal: reduce invested capital by amount.
   - For each period between event \( j \) and \( j+1 \):
     - Balance \( B_j \) = invested capital **just after** event \( j \).
     - Duration \( d_j \) = days between dates \( D_j \) and \( D_{j+1} \) (via date library).

2. **Profit Calculation**
   \[
   \text{Profit} = \text{Current Value} - \text{Net Invested Capital}
   \]

   Where Net Invested Capital can be interpreted as:
   - Sum of deposits − sum of withdrawals (excluding current value).

3. **Simple Rate Formula**
   - If \( \sum B_j \cdot d_j > 0 \):
     \[
     X = \frac{\text{Profit} \cdot 365}{\sum_{j} B_j \cdot d_j}
     \]
   - If denominator is 0 or negative (degenerate case):
     - Show rate as “N/A” with explanation.

4. **Sign & Interpretation**
   - If Profit < 0 ⇒ X will be negative ⇒ negative simple annual rate.
   - Display with percentage formatting.

### 6.4 Display & Formatting

- **Percentages**:
  - Default: 2 decimal places (configurable).
  - Example: 13.97%.
- **Numbers**:
  - Thousands separators and decimal point aligned with locale or a fixed format.
- **Error States**:
  - Clear messages such as:
    - “Please add at least one cash flow and a current value to calculate returns.”
    - “IRR could not be computed; cash flows may all be the same sign.”

### 6.5 Export / Import & Historical Tracking

1. **Export JSON**
   - When the user clicks “Export JSON”:
     - Validate that current in-memory state is structurally sound (even if not fully calculable).
     - Trigger a client-side download of a JSON file with a defined schema (see Data Model).
   - JSON file must contain:
     - Cash flows (list).
     - Current valuation date (if set).
     - Current value (if set).
     - Historical snapshots (list; may be empty).
     - Version metadata.

2. **Import JSON**
   - When the user clicks “Import JSON” and selects a file:
     - Attempt to parse JSON.
     - Validate that required fields and types exist.
     - On success, overwrite the current in-memory state (cash flows, valuation date, current value, history) with imported data and update localStorage.
     - On failure, do not modify current state and show an error message.

3. **Historical Snapshot Management**
   - When the user clicks “Calculate & Save Snapshot”:
     - Validate required inputs (at least one deposit, current value > 0, valid dates).
     - Compute IRR and simple rate.
     - Create a snapshot object including:
       - Calculation datetime (ISO string; may include time-of-day).
       - Valuation date.
       - Current value.
       - IRR (numeric, e.g. 0.1397).
       - Simple rate (numeric).
       - Net invested capital.
       - Profit.
     - Append snapshot to the in-memory history list and persist updated state in localStorage.
   - Snapshots must be ordered by **calculation datetime** for history display and charting.

4. **History Display & Chart (Chart.js)**
   - Table/list view shows all snapshots with key fields.
   - Line chart:
     - x-axis: calculation datetime (or valuation date; choose consistently).
     - y-axis: rate values.
     - Plot at least IRR; optionally simple rate as a separate line.
   - If fewer than 2 snapshots exist, the line chart section shows placeholder text.

5. **JSON Round-Trip Stability**
   - Export followed by import of the same file without modification must reconstruct identical in-memory state (up to ordering and local ID generation details that are internal).

### 6.6 LocalStorage Autosave

1. **Storage Key**
   - Use a single, fixed key (e.g., `"effective-interest-calculator-state-v1"`).

2. **Write Policy**
   - On any significant change in `CalculatorState` (cash flows, valuation date, current value, history):
     - Serialize to JSON and write to localStorage.
     - Use debouncing (e.g., 300–500 ms) to avoid excessive writes.

3. **Read Policy**
   - On app startup:
     - Attempt to read from localStorage.
     - If valid, hydrate the UI with the saved state.
     - If invalid or absent, start with an empty state.

4. **Clear Policy**
   - “Clear All” should:
     - Reset in-memory state.
     - Clear the localStorage key.

---

## 7. Non-Functional Requirements

### 7.1 Performance
- Calculations must complete within **100 ms** for up to:
  - 200 cash flow entries.
  - 500 historical snapshots.
- UI updates should feel instantaneous for typical usage (≤ 50 entries, ≤ 50 snapshots).
- LocalStorage writes must be debounced to avoid blocking the main thread.

### 7.2 Reliability
- All calculations run entirely in the browser (no network dependency for core functionality).
- PWA should allow core usage (view/edit cash flows, calculations, view history) even when offline, provided the app is already installed or cached.
- Graceful handling of invalid inputs and malformed JSON without crashes.

### 7.3 Security & Privacy
- No user authentication or backend persistence.
- No transmission of user-entered financial data to external services by default.
- Exported JSON is stored only on the user’s device (via download); imported JSON is only read client-side.
- LocalStorage data is stored only in the user’s browser and can be cleared by the user.
- If analytics are added, they must be **aggregated and anonymized**, not capturing exact amounts or dates.

### 7.4 Compatibility
- Support latest versions of:
  - Chrome
  - Firefox
  - Safari
  - Edge
- Responsive design for desktop and mobile.

### 7.5 PWA
- Provide a **web app manifest** with:
  - Name, short name, icons.
  - Display mode: `standalone`.
  - Theme color and background color.
- Register a **service worker** to:
  - Cache static assets (JS bundle, CSS, icons, HTML).
  - Optionally cache last-used JSON state (though primary state is localStorage).
- App should be installable on compatible devices and pass basic PWA audits (e.g., Lighthouse) for v1 scope.

---

## 8. Technical Architecture & Stack

### 8.1 Tech Stack

- **Language**: TypeScript
- **Framework**: React (functional components + hooks)
- **Bundler/Tooling**: Vite (or similar modern bundler)
- **Styling**: Tailwind CSS
- **Charting**: Chart.js (via React wrapper such as `react-chartjs-2`)
- **Date Library**: A lightweight library like `date-fns` for date parsing and differences
- **State Management**: React `useState` / `useReducer` with context (if needed) – no external state library for v1
- **Storage**: localStorage (for last session autosave) + JSON file export/import
- **PWA**: Service worker + manifest configured via Vite plugin or custom setup

### 8.2 Project Structure (Suggested)

```txt
src/
  domain/
    irr.ts            // IRR/XIRR algorithm (pure TS)
    simpleRate.ts     // Simple rate (balance × days)
    cashflow.ts       // Cash flow utilities (sorting, balances, net invested)
    jsonSchema.ts     // Export/import helpers & validation
  types/
    index.ts          // Shared TS interfaces/types
  hooks/
    useCalculator.ts  // Encapsulate CalculatorState + actions (optional)
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
    manifest.webmanifest (or in public/)
  App.tsx
  main.tsx
  index.css          // Tailwind base/styles
```

### 8.3 Component Responsibilities

- `App.tsx`
  - Owns the main `CalculatorState` (or delegates to `useCalculator` hook).
  - Handles initialization from localStorage and JSON import.
  - Passes state and callbacks down to child components.

- `CashFlowTable` / `CashFlowRow`
  - Displays and edits the list of cash flows.
  - Emits add/update/delete events.

- `CurrentValueForm`
  - Manages valuation date and current value inputs.

- `ResultsPanel`
  - Receives derived values (net invested, profit, IRR, simple rate).
  - Displays them with appropriate formatting and tooltips.

- `HistoryTable`
  - Receives the list of `HistoricalSnapshot` and renders a table/list.

- `HistoryChart`
  - Receives the list of `HistoricalSnapshot` and builds Chart.js datasets for IRR/simpleRate over time.

- `ImportExportPanel`
  - Provides UI for Import JSON / Export JSON.
  - Handles file selection and triggering export download.

- `Layout`
  - Provides page-level layout, header, and responsive structure.

- `useCalculator` (optional hook)
  - Encapsulates state and logic:
    - `CalculatorState`
    - Actions: addFlow, updateFlow, deleteFlow, setValuationDate, setCurrentValue, saveSnapshot, importScenario, clearAll
    - Triggers recomputation of derived values using domain functions.

### 8.4 Domain Layer

- All financial logic lives in `/domain` as **pure functions**:
  - No React imports, no DOM access, no localStorage.
  - Fully unit-testable.
- Example:
  - `computeIrr(cashFlowsWithDates): number | null`
  - `computeSimpleRate(cashFlowsWithDates, valuationDate, currentValue): number | null`
  - `computeNetInvested(cashFlows): number`
  - `buildExportJson(state: CalculatorState): ExportedScenarioJson`
  - `parseImportedJson(json: unknown): CalculatorState | ImportError`

---

## 9. Data Model (Front-End & JSON Schema)

### 9.1 Cash Flow Entry

```ts
type Direction = "deposit" | "withdrawal";

interface CashFlowEntry {
  id: string;          // unique client-side ID (not persisted in JSON, or reconstructed on import)
  date: string;        // ISO 8601 date, e.g. "2025-11-16"
  amount: number;      // > 0
  direction: Direction;
}
```

> Note: In the JSON file, IDs may be omitted or represented differently; they can be regenerated on import based on array index.

### 9.2 Calculator State (In-Memory)

```ts
interface CalculatorState {
  cashFlows: CashFlowEntry[];
  valuationDate: string | null; // ISO date, defaults to today in UI if null
  currentValue: number | null;
  history: HistoricalSnapshot[];
}
```

### 9.3 Historical Snapshot

```ts
interface HistoricalSnapshot {
  calculationDateTime: string;  // ISO 8601 datetime, e.g. "2025-11-16T10:15:30Z"
  valuationDate: string;        // ISO date used for this calculation
  currentValue: number;         // fund value used at valuationDate
  irr: number | null;           // e.g. 0.1397 (13.97%), or null if not computable
  simpleRate: number | null;    // e.g. 0.1486 (14.86%), or null if not computable
  netInvested: number;          // sum of deposits - sum of withdrawals at calculation time
  profit: number;               // currentValue - netInvested
}
```

### 9.4 JSON Export Format

```ts
interface ExportedScenarioJson {
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

- The UI must be able to:
  - Export the current state in this format.
  - Import this format, ignoring unknown additional fields (for forward compatibility).

### 9.5 Derived Values (Internal)

- Sorted cashFlows by date
- Net invested capital
- Profit
- IRR result (value + status)
- Simple rate result (value + status)
- History series for charting (e.g., arrays of [date, irr] and [date, simpleRate]).

---

## 10. Edge Cases & Validation Rules

1. **No Cash Flows**
   - Show friendly message: “Add at least one deposit to start.”

2. **Single Cash Flow**
   - Deposit + current value: both IRR and simple rate should be computable.

3. **All Deposits, No Current Value**
   - No calculations; prompt user to enter current value.

4. **All Withdrawals or All Same Sign Cash Flows**
   - IRR cannot be computed; show “N/A” with explanation.

5. **Valuation Date Before Some Flows**
   - Warn the user; optionally disallow or highlight inconsistency.

6. **Zero or Negative Current Value**
   - Disallow or treat as invalid; show error message.

7. **Very Small Durations or Amounts**
   - Watch out for numerical instability; clamp extremely small denominators in simple rate.

8. **Malformed JSON on Import**
   - Catch parsing errors and schema mismatches.
   - Do not modify current state on error.
   - Show a clear error message: e.g., “Could not import JSON. Please check that the file was exported from this calculator or matches the expected format.”

9. **Mismatched Version Field**
   - If `version` is missing or higher than supported:
     - Attempt a best-effort import if possible.
     - Otherwise show a clear message that this file is from an unsupported version.

10. **Empty History**
    - History table shows “No historical snapshots yet.”
    - Chart shows placeholder text.

11. **LocalStorage Errors**
    - If localStorage is unavailable or throws (e.g., quota exceeded), fall back gracefully without crashing.
    - Show a non-blocking warning that autosave may not be available.

---

## 11. Analytics & Observability (Optional)

If analytics is in scope (optional):

- Events to track (aggregated, no raw amounts/dates):
  - Page load
  - “Add Cash Flow” clicked
  - “Clear All” clicked
  - “Calculate & Save Snapshot” clicked
  - “Export JSON” clicked
  - “Import JSON” success/failure
  - Successful calculation event (with anonymized metadata: number of cash flows, number of snapshots, range of years, success/failure of IRR).

- Error logging for:
  - IRR convergence failures
  - Unexpected NaN/Infinity in calculations
  - JSON import errors
  - LocalStorage errors

---

## 12. Future Enhancements (Out of Scope for v1)

- Multiple scenario tabs and comparing results on-screen.
- Support for different **day-count conventions** (Actual/365, Actual/Actual, 30/360, etc.).
- Support for **multi-currency** with FX assumptions (only conceptual, not real-time rates).
- Ability to label cash flows (e.g., “Monthly DCA”, “Lump Sum”, “Dividend”).
- Theme toggling (light/dark mode) using Tailwind.
- Export to CSV in addition to JSON.
- Ability to merge histories from multiple JSON files for the same fund.
- Sync to cloud storage providers or user accounts (would require backend).

---

## 13. Acceptance Criteria for v1

1. User can add, edit, and delete cash flow entries with date, amount, and direction.
2. User can enter a valuation date and current value.
3. With valid inputs, the app displays:
   - Net invested capital
   - Profit
   - IRR/XIRR (or “N/A” with reason)
   - Simple annual rate (or “N/A” with reason)
4. Calculations update automatically when inputs change.
5. User can click “Calculate & Save Snapshot” to append a historical entry, which appears in the history list.
6. User can export the current scenario (cash flows, valuation date, current value, history) as a JSON file.
7. User can import a previously exported JSON file, restoring cash flows, current values, and history.
8. If two or more historical snapshots exist, a Chart.js line chart is rendered showing at least IRR over time (and optionally simple rate).
9. The app automatically restores the last session from localStorage if available.
10. “Clear All” resets state and clears the localStorage entry.
11. The app works in the latest major browsers on both desktop and mobile.
12. Core functionality (view/edit cash flows, calculations, view history table) remains available offline once the PWA is installed or cached.
13. No user data is sent to a backend or third-party service by default; all persistence is via localStorage and user-managed JSON files.
