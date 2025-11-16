import { describe, it, expect } from "vitest";
import { computeNetInvested, sortCashFlowsByDate } from "./cashflow";
import type { CashFlowEntry } from "../types";

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

