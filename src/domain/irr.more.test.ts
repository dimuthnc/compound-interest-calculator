import { describe, it, expect } from "vitest";
import { computeIrr, mapCashFlowsToIrrFormat, type IrrCashFlow } from "./irr";
import type { CashFlowEntry } from "../types";

function npvAtRate(flows: IrrCashFlow[], r: number): number {
  const sorted = [...flows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const base = sorted[0].date;
  const msPerDay = 1000 * 60 * 60 * 24;
  return sorted.reduce((sum, f) => {
    const t = (f.date.getTime() - base.getTime()) / msPerDay;
    return sum + f.amount * Math.pow(1 + r, -t / 365);
  }, 0);
}

describe("computeIrr – additional scenarios", () => {
  it("handles multiple deposits and withdrawals (unsorted inputs)", () => {
    const cashFlows: CashFlowEntry[] = [
      { id: "d2", date: "2024-06-01", amount: 500, direction: "deposit" },
      { id: "w1", date: "2024-09-01", amount: 200, direction: "withdrawal" },
      { id: "d1", date: "2024-01-01", amount: 1000, direction: "deposit" },
    ];

    const irrFlows = mapCashFlowsToIrrFormat(cashFlows, {
      date: new Date("2025-01-01"),
      value: 1500,
    });

    const r = computeIrr(irrFlows);
    expect(r).not.toBeNull();

    // Root condition: NPV should be ~ 0 at the found rate.
    const npv = npvAtRate(irrFlows, r!);
    expect(Math.abs(npv)).toBeLessThan(1e-4);

    // Also within a plausible annualized band for this scenario.
    expect(r!).toBeGreaterThan(0);
    expect(r!).toBeLessThan(0.3);
  });

  it("returns a negative IRR for a one-year loss", () => {
    const cashFlows: CashFlowEntry[] = [
      { id: "1", date: "2024-01-01", amount: 1000, direction: "deposit" },
    ];
    const irrFlows = mapCashFlowsToIrrFormat(cashFlows, {
      date: new Date("2025-01-01"),
      value: 800,
    });

    const r = computeIrr(irrFlows);
    expect(r).not.toBeNull();
    expect(r!).toBeLessThan(0);
    expect(r!).toBeGreaterThan(-0.5);
  });

  it("produces a large annualized IRR for a small 1-day gain", () => {
    const cashFlows: CashFlowEntry[] = [
      { id: "1", date: "2024-01-01", amount: 1000, direction: "deposit" },
    ];
    const irrFlows = mapCashFlowsToIrrFormat(cashFlows, {
      date: new Date("2024-01-02"),
      value: 1001,
    });

    const r = computeIrr(irrFlows);
    expect(r).not.toBeNull();
    // Roughly ~44% annualized. Keep a wide but meaningful band.
    expect(r!).toBeGreaterThan(0.1);
    expect(r!).toBeLessThan(2);
  });

  it("returns null when flows are all same sign even with zeros", () => {
    const flows: IrrCashFlow[] = [
      { date: new Date("2024-01-01"), amount: -1000 },
      { date: new Date("2024-06-01"), amount: 0 },
    ];
    const r = computeIrr(flows);
    expect(r).toBeNull();
  });
});

