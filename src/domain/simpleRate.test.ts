import { describe, it, expect } from "vitest";
import { computeSimpleRate } from "./simpleRate";
import type { CashFlowEntry } from "../types";

describe("computeSimpleRate", () => {
  it("computes a simple annual rate for a basic deposit and later value", () => {
    const cashFlows: CashFlowEntry[] = [
      {
        id: "1",
        date: "2024-01-01",
        amount: 1000,
        direction: "deposit",
      },
    ];

    const valuationDate = new Date("2025-01-01");
    const currentValue = 1100; // 10% gain over roughly a year

    const rate = computeSimpleRate({ cashFlows, valuationDate, currentValue });

    expect(rate).not.toBeNull();
    expect(rate!).toBeGreaterThan(0.095);
    expect(rate!).toBeLessThan(0.105);
  });

  it("returns null when weighted balance×days denominator is not positive", () => {
    // No elapsed days between cash flow and valuation => denominator 0.
    const cashFlows: CashFlowEntry[] = [
      {
        id: "1",
        date: "2024-01-01",
        amount: 1000,
        direction: "deposit",
      },
    ];

    const valuationDate = new Date("2024-01-01");
    const currentValue = 1000;

    const rate = computeSimpleRate({ cashFlows, valuationDate, currentValue });
    expect(rate).toBeNull();
  });
});

