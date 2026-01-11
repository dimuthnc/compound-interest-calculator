import { describe, it, expect } from "vitest";
import { computeNetInvested, sortCashFlowsByDate, computeSnapshotMetrics } from "./cashflow";
import type { CashFlowEntry, HistoricalSnapshot } from "../types";

const makeEntry = (overrides: Partial<CashFlowEntry>): CashFlowEntry => ({
  id: overrides.id ?? "id",
  date: overrides.date ?? "2024-01-01",
  amount: overrides.amount ?? 0,
  direction: overrides.direction ?? "deposit",
});

describe("sortCashFlowsByDate", () => {
  it("sorts cash flows chronologically without mutating the original array", () => {
    const original: CashFlowEntry[] = [
      makeEntry({ id: "b", date: "2024-03-01" }),
      makeEntry({ id: "a", date: "2024-01-01" }),
      makeEntry({ id: "c", date: "2023-12-31" }),
    ];

    const copyBefore = [...original];
    const sorted = sortCashFlowsByDate(original);

    expect(sorted.map((e) => e.id)).toEqual(["c", "a", "b"]);
    // Original remains unchanged
    expect(original).toEqual(copyBefore);
  });
});

describe("computeNetInvested", () => {
  it("computes deposits minus withdrawals", () => {
    const flows: CashFlowEntry[] = [
      makeEntry({ id: "1", date: "2024-01-01", amount: 1000, direction: "deposit" }),
      makeEntry({ id: "2", date: "2024-02-01", amount: 200, direction: "withdrawal" }),
      makeEntry({ id: "3", date: "2024-03-01", amount: 300, direction: "deposit" }),
    ];

    const net = computeNetInvested(flows);
    // 1000 + 300 - 200 = 1100
    expect(net).toBe(1100);
  });

  it("returns 0 for an empty list", () => {
    const net = computeNetInvested([]);
    expect(net).toBe(0);
  });
});

describe("computeSnapshotMetrics", () => {
  it("computes all metrics dynamically from snapshot and cash flows", () => {
    const cashFlows: CashFlowEntry[] = [
      makeEntry({ id: "1", date: "2024-01-01", amount: 1000, direction: "deposit" }),
      makeEntry({ id: "2", date: "2024-06-01", amount: 500, direction: "deposit" }),
      makeEntry({ id: "3", date: "2024-09-01", amount: 200, direction: "withdrawal" }),
    ];

    const snapshot: Pick<HistoricalSnapshot, 'valuationDate' | 'currentValue'> = {
      valuationDate: "2024-12-31",
      currentValue: 1500,
    };

    const metrics = computeSnapshotMetrics(snapshot, cashFlows);

    // Net invested: 1000 + 500 - 200 = 1300
    expect(metrics.netInvested).toBe(1300);

    // Profit: 1500 - 1300 = 200
    expect(metrics.profit).toBe(200);

    // IRR and simple rate should be computed (non-null for valid inputs)
    expect(metrics.irr).not.toBeNull();
    expect(metrics.simpleRate).not.toBeNull();

    // IRR should be a reasonable positive number for this profitable scenario
    expect(metrics.irr).toBeGreaterThan(0);
    expect(metrics.simpleRate).toBeGreaterThan(0);
  });

  it("returns null for IRR and simpleRate when no cash flows exist", () => {
    const snapshot: Pick<HistoricalSnapshot, 'valuationDate' | 'currentValue'> = {
      valuationDate: "2024-12-31",
      currentValue: 1500,
    };

    const metrics = computeSnapshotMetrics(snapshot, []);

    expect(metrics.netInvested).toBe(0);
    expect(metrics.profit).toBe(1500);
    expect(metrics.irr).toBeNull();
    expect(metrics.simpleRate).toBeNull();
  });

  it("handles negative profit scenarios", () => {
    const cashFlows: CashFlowEntry[] = [
      makeEntry({ id: "1", date: "2024-01-01", amount: 1000, direction: "deposit" }),
    ];

    const snapshot: Pick<HistoricalSnapshot, 'valuationDate' | 'currentValue'> = {
      valuationDate: "2024-12-31",
      currentValue: 800,
    };

    const metrics = computeSnapshotMetrics(snapshot, cashFlows);

    expect(metrics.netInvested).toBe(1000);
    expect(metrics.profit).toBe(-200); // Lost money
    expect(metrics.irr).not.toBeNull();
    expect(metrics.irr).toBeLessThan(0); // Negative return
  });

  it("uses stored netInvested when available (backward compatibility)", () => {
    const cashFlows: CashFlowEntry[] = [
      makeEntry({ id: "1", date: "2024-01-01", amount: 1000, direction: "deposit" }),
      makeEntry({ id: "2", date: "2024-06-01", amount: 500, direction: "deposit" }),
    ];

    // Snapshot with stored netInvested (different from what would be calculated)
    const snapshotWithStored: Pick<HistoricalSnapshot, 'valuationDate' | 'currentValue' | 'netInvested'> = {
      valuationDate: "2024-12-31",
      currentValue: 1800,
      netInvested: 800, // Stored value, different from current cashflows (1000+500=1500)
    };

    const metrics = computeSnapshotMetrics(snapshotWithStored, cashFlows);

    // Should use stored netInvested, not calculated
    expect(metrics.netInvested).toBe(800);
    expect(metrics.profit).toBe(1000); // 1800 - 800 = 1000
    expect(metrics.hasStoredNetInvested).toBe(true);
  });

  it("calculates netInvested dynamically when not stored (backward compatibility for old data)", () => {
    const cashFlows: CashFlowEntry[] = [
      makeEntry({ id: "1", date: "2024-01-01", amount: 1000, direction: "deposit" }),
      makeEntry({ id: "2", date: "2024-06-01", amount: 500, direction: "deposit" }),
    ];

    // Snapshot without stored netInvested (old data format)
    const snapshotWithoutStored: Pick<HistoricalSnapshot, 'valuationDate' | 'currentValue' | 'netInvested'> = {
      valuationDate: "2024-12-31",
      currentValue: 1800,
      netInvested: undefined, // Not stored
    };

    const metrics = computeSnapshotMetrics(snapshotWithoutStored, cashFlows);

    // Should calculate netInvested from current cashflows
    expect(metrics.netInvested).toBe(1500); // 1000 + 500 = 1500
    expect(metrics.profit).toBe(300); // 1800 - 1500 = 300
    expect(metrics.hasStoredNetInvested).toBe(false);
  });
});
