import { describe, it, expect } from "vitest";
import { computeSimpleRate } from "./simpleRate";
import type { CashFlowEntry } from "../types";

const cf = (
  id: string,
  date: string,
  amount: number,
  direction: CashFlowEntry["direction"],
): CashFlowEntry => ({ id, date, amount, direction });

describe("computeSimpleRate – additional scenarios", () => {
  it("handles two deposits over the year and computes expected simple rate", () => {
    // Deposits: 1000 on 2024-01-01, then +1000 on 2024-04-01. Valuation at 2025-01-01 with 2200.
    const cashFlows: CashFlowEntry[] = [
      cf("d1", "2024-01-01", 1000, "deposit"),
      cf("d2", "2024-04-01", 1000, "deposit"),
    ];

    const rate = computeSimpleRate({
      cashFlows,
      valuationDate: new Date("2025-01-01"),
      currentValue: 2200,
    });

    expect(rate).not.toBeNull();

    // Manual expected using balance×days:
    // From 2024-01-01 to 2024-04-01: 91 days at 1000.
    // From 2024-04-01 to 2025-01-01: 275 days at 2000.
    // sumWeighted = 1000*91 + 2000*275 = 641000
    // netInvested = 2000, profit = 200
    // simpleRate = 200*365/641000 ≈ 0.11386
    expect(rate!).toBeGreaterThan(0.11);
    expect(rate!).toBeLessThan(0.12);
  });

  it("returns null when valuation date is before the first cash flow (no positive days)", () => {
    const cashFlows: CashFlowEntry[] = [cf("d1", "2024-01-10", 1000, "deposit")];
    const rate = computeSimpleRate({
      cashFlows,
      valuationDate: new Date("2024-01-01"),
      currentValue: 1000,
    });
    expect(rate).toBeNull();
  });

  it("returns null when weighted balance×days is non-positive due to over-withdrawal", () => {
    const cashFlows: CashFlowEntry[] = [
      cf("d1", "2024-01-01", 1000, "deposit"),
      cf("w1", "2024-02-01", 1200, "withdrawal"), // balance becomes negative
    ];
    const rate = computeSimpleRate({
      cashFlows,
      valuationDate: new Date("2024-06-01"),
      currentValue: 0,
    });
    expect(rate).toBeNull();
  });
});

