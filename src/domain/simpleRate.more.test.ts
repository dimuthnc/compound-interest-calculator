import { describe, it, expect } from "vitest";
import { computeSimpleRate } from "./simpleRate";
import type { CashFlowEntry } from "../types";

describe("computeSimpleRate (additional scenarios)", () => {
  it("computes the correct rate for multiple deposits over time", () => {
    const cashFlows: CashFlowEntry[] = [
      { id: "1", date: "2025-01-01", amount: 1000, direction: "deposit" },
      { id: "2", date: "2025-02-01", amount: 500, direction: "deposit" },
    ];
    const valuationDate = new Date("2025-03-01");
    const currentValue = 1600;

    const rate = computeSimpleRate({ cashFlows, valuationDate, currentValue });
    // Profit = 1600 - 1500 = 100
    // Weighted Capital = (1000 * 31 days) + (1500 * 28 days) = 31000 + 42000 = 73000
    // Rate = (100 * 365) / 73000 = 0.5
    expect(rate).toBeCloseTo(0.5);
  });

  it("computes the correct rate for a deposit followed by a withdrawal", () => {
    const cashFlows: CashFlowEntry[] = [
      { id: "1", date: "2025-01-01", amount: 2000, direction: "deposit" },
      { id: "2", date: "2025-02-15", amount: 500, direction: "withdrawal" },
    ];
    const valuationDate = new Date("2025-04-01");
    const currentValue = 1550;

    const rate = computeSimpleRate({ cashFlows, valuationDate, currentValue });
    // Profit = 1550 - (2000 - 500) = 50
    // Weighted Capital = (2000 * 45 days) + (1500 * 45 days) = 90000 + 67500 = 157500
    // Rate = (50 * 365) / 157500 = 0.11587...
    expect(rate).toBeCloseTo(0.11587);
  });

  it("returns null if no time has elapsed for the investment", () => {
    const cashFlows: CashFlowEntry[] = [
      { id: "1", date: "2025-01-01", amount: 1000, direction: "deposit" },
    ];
    const valuationDate = new Date("2025-01-01");
    const currentValue = 1010;

    const rate = computeSimpleRate({ cashFlows, valuationDate, currentValue });
    // Weighted capital is 0 because no days have passed.
    expect(rate).toBeNull();
  });

  it("handles cash flows on the same day correctly", () => {
    const cashFlows: CashFlowEntry[] = [
      { id: "1", date: "2025-01-01", amount: 1000, direction: "deposit" },
      { id: "2", date: "2025-01-01", amount: 200, direction: "withdrawal" },
    ];
    const valuationDate = new Date("2025-01-31");
    const currentValue = 850;

    const rate = computeSimpleRate({ cashFlows, valuationDate, currentValue });
    // Net invested = 800. Profit = 50.
    // The balance of 800 is held for 30 days.
    // Weighted Capital = 800 * 30 = 24000
    // Rate = (50 * 365) / 24000 = 0.760416...
    expect(rate).toBeCloseTo(0.760417);
  });
});

