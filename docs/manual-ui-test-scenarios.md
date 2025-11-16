# Manual UI Test Scenarios – Effective Interest Rate Calculator

This document lists a small set of **manual sanity checks** you can run in the browser to
verify the main user flows and catch obvious regressions.

## Scenario 1 – First-time user, no data

1. Open the app in a fresh browser/profile (no existing localStorage state).
2. Observe the **Cash Flows** section:
   - It should show the helper text: _"Add at least one deposit to start."_
   - The table body should be empty, with the guidance explaining how to add the first
     cash flow.
3. Observe the **Current Value & Valuation Date** section:
   - Valuation date input is empty by default (or prefilled if your hook chooses today).
   - The "Current fund value" field is empty.
   - A warning text should indicate that rates cannot be computed until a current value
     is provided.
4. Observe the **Results** section:
   - Net invested capital and profit should both be `0`.
   - IRR and simple rate should be displayed as "N/A" with explanations.
5. The **History** table and chart should show empty-state helper messages, and
   "Calculate & save snapshot" should show a validation error if prerequisites are not
   met.

## Scenario 2 – Single deposit and current value

Goal: sanity-check a basic positive-return case.

1. Add one cash flow:
   - Date: `2024-01-01`.
   - Amount: `1000`.
   - Direction: `Deposit`.
2. Set valuation fields:
   - Valuation date: `2025-01-01`.
   - Current fund value: `1100`.
3. Verify in **Results**:
   - Net invested capital ≈ `1,000`.
   - Profit ≈ `100`.
   - IRR and simple annual rate should both be around **10%** (allowing for slight
     numerical differences).
4. Click **"Calculate & save snapshot"**:
   - A new row should appear in **History** with the expected valuation date, current
     value, net invested, profit, and rates.
   - The **History chart** should show at least one point once a second snapshot is
     added later.

## Scenario 3 – Deposit and withdrawal pattern

Goal: ensure IRR handles mixed-sign cash flows and that the simple rate remains
reasonable.

1. Enter the following cash flows:
   - `2024-01-01` – Deposit `1000`.
   - `2024-06-01` – Deposit `500`.
   - `2024-09-01` – Withdrawal `300`.
2. Set valuation:
   - Valuation date: `2025-01-01`.
   - Current fund value: `1500`.
3. Verify **Results**:
   - Net invested should reflect deposits minus withdrawal (`1000 + 500 - 300 = 1200`).
   - Profit should be `1500 - 1200 = 300`.
   - IRR and simple annual rate should both be **positive** and broadly in the same
     ballpark (not wildly different orders of magnitude).
4. Save a snapshot and confirm the **History** row matches these numbers.

## Scenario 4 – Same-sign cash flows (IRR not defined)

Goal: confirm that IRR gracefully reports N/A when no solution exists.

1. Enter cash flows where all flows move in one direction, for example:
   - `2024-01-01` – Deposit `1000`.
   - `2024-03-01` – Deposit `500`.
2. Set valuation:
   - Valuation date: `2024-12-31`.
   - Current fund value: `1500`.
3. Verify **Results**:
   - Net invested should be `1500`.
   - Profit should be `0`.
   - IRR should show **"N/A"** with the explanation that mixed deposit/withdrawal
     patterns and a current value are required.
   - Simple rate may still be defined but should be close to `0%` in this particular
     case.

## Scenario 5 – Import / Export round-trip

Goal: ensure JSON export and import are stable and compatible with the current schema.

1. Configure a non-trivial scenario:
   - Several deposits and withdrawals across different dates.
   - A valuation date and current fund value.
   - At least two saved snapshots so the **History** table and chart contain data.
2. Click **"Export JSON"** and save the file.
3. Refresh the page or open the app in another browser profile.
4. Use **"Import JSON"** to select the previously exported file.
5. Verify:
   - All cash flows are restored with the correct dates, amounts, and directions.
   - Valuation date and current fund value match the exported scenario.
   - **History** entries (including IRR/simple rate values) match what you had prior to
     export.
   - The **History chart** shows the same trend line as before.

Running these scenarios periodically (e.g., after modifying domain logic or UI layout)
helps catch regressions in both the financial calculations and the user experience.
import { describe, it, expect } from "vitest";
import { computeIrr, mapCashFlowsToIrrFormat } from "./irr";
import type { CashFlowEntry } from "../types";

describe("computeIrr", () => {
  it("computes a reasonable IRR for a single deposit and later positive value", () => {
    const cashFlows: CashFlowEntry[] = [
      {
        id: "1",
        date: "2024-01-01",
        amount: 1000,
        direction: "deposit",
      },
    ];

    const irrFlows = mapCashFlowsToIrrFormat(cashFlows, {
      date: new Date("2025-01-01"),
      value: 1100,
    });

    const irr = computeIrr(irrFlows);
    expect(irr).not.toBeNull();
    // Roughly 10% annualised. Allow for small numerical differences.
    expect(irr!).toBeGreaterThan(0.095);
    expect(irr!).toBeLessThan(0.105);
  });

  it("returns null when all cash flows have the same sign", () => {
    const sameSignFlows = [
      { date: new Date("2024-01-01"), amount: -1000 },
      { date: new Date("2024-06-01"), amount: -500 },
    ];

    const irr = computeIrr(sameSignFlows);
    expect(irr).toBeNull();
  });
});

