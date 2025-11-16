// ...existing imports...
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

