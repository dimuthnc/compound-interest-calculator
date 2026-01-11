import { describe, it, expect } from "vitest";
import { buildExportJson, parseImportedJson } from "./jsonSchema";
import type { CalculatorState, CashFlowEntry, HistoricalSnapshot } from "../types";

const mkCF = (id: string, date: string, amount: number, direction: CashFlowEntry["direction"]): CashFlowEntry => ({
  id,
  date,
  amount,
  direction,
});

const mkSnapshot = (overrides?: Partial<HistoricalSnapshot>): HistoricalSnapshot => ({
  calculationDateTime: overrides?.calculationDateTime ?? new Date("2025-01-02T00:00:00Z").toISOString(),
  valuationDate: overrides?.valuationDate ?? "2025-01-01",
  currentValue: overrides?.currentValue ?? 1234,
  irr: overrides?.irr ?? 0.1,
  simpleRate: overrides?.simpleRate ?? 0.11,
  netInvested: overrides?.netInvested ?? 1100,
  profit: overrides?.profit ?? 134,
});

describe("jsonSchema – buildExportJson", () => {
  it("builds a stable v1 export payload with netInvested in history for historical accuracy", () => {
    const state: CalculatorState = {
      cashFlows: [
        mkCF("a", "2024-01-01", 1000, "deposit"),
        mkCF("b", "2024-06-01", 200, "withdrawal"),
      ],
      valuationDate: "2025-01-01",
      currentValue: 1200,
      history: [mkSnapshot()],
      fundName: "My Fund",
    };

    const exported = buildExportJson(state);

    expect(exported.version).toBe(1);
    // ids should not be included inside cashFlows in export
    expect(exported.cashFlows).toEqual([
      { date: "2024-01-01", amount: 1000, direction: "deposit" },
      { date: "2024-06-01", amount: 200, direction: "withdrawal" },
    ]);
    expect(exported.valuationDate).toBe("2025-01-01");
    expect(exported.currentValue).toBe(1200);
    expect(exported.history.length).toBe(1);
    expect(exported.fundName).toBe("My Fund");

    // Verify that netInvested IS included in exported history (for historical accuracy)
    // but other calculated fields (irr, simpleRate, profit) are NOT included
    const exportedSnapshot = exported.history[0];
    expect(exportedSnapshot).toHaveProperty('calculationDateTime');
    expect(exportedSnapshot).toHaveProperty('valuationDate');
    expect(exportedSnapshot).toHaveProperty('currentValue');
    expect(exportedSnapshot).toHaveProperty('netInvested'); // Now stored for historical accuracy
    expect(exportedSnapshot.netInvested).toBe(1100);
    expect(exportedSnapshot).not.toHaveProperty('irr');
    expect(exportedSnapshot).not.toHaveProperty('simpleRate');
    expect(exportedSnapshot).not.toHaveProperty('profit');
  });
});

describe("jsonSchema – parseImportedJson", () => {
  it("parses a valid export and produces a CalculatorState with generated ids", () => {
    const payload = {
      version: 1,
      cashFlows: [
        { date: "2024-01-01", amount: 1000, direction: "deposit" },
        { date: "2024-06-01", amount: 200, direction: "withdrawal" },
      ],
      valuationDate: "2025-01-01",
      currentValue: 1200,
      history: [mkSnapshot()],
      fundName: "My Fund",
    };

    const result = parseImportedJson(payload);
    expect(result).not.toBeInstanceOf(Error);

    const state = result as CalculatorState;
    expect(state.cashFlows.length).toBe(2);
    expect(state.cashFlows[0].id).toBeTypeOf("string");
    expect(state.cashFlows[0].id).not.toBe("");
    // valuationDate is restored from import (unlike localStorage restore which uses today)
    expect(state.valuationDate).toBe("2025-01-01");
    expect(state.currentValue).toBe(1200);
    expect(state.history.length).toBe(1);
    expect(state.fundName).toBe("My Fund");
  });

  it("rejects non-object root", () => {
    const result = parseImportedJson(null as unknown);
    expect(result).toBeInstanceOf(Error);
  });

  it("rejects unsupported version", () => {
    const result = parseImportedJson({ version: 2, cashFlows: [], valuationDate: null, currentValue: null, history: [] });
    expect(result).toBeInstanceOf(Error);
  });

  it("rejects missing or invalid cashFlows array", () => {
    const base = { version: 1, valuationDate: null, currentValue: null, history: [] };
    const r1 = parseImportedJson({ ...base, cashFlows: undefined });
    const r2 = parseImportedJson({ ...base, cashFlows: {} });
    expect(r1).toBeInstanceOf(Error);
    expect(r2).toBeInstanceOf(Error);
  });

  it("rejects cash flow with invalid fields", () => {
    const base = { version: 1, valuationDate: null, currentValue: null, history: [] };
    const r1 = parseImportedJson({ ...base, cashFlows: [{ amount: 10, direction: "deposit" }] });
    const r2 = parseImportedJson({ ...base, cashFlows: [{ date: "2024-01-01", direction: "deposit" }] });
    const r3 = parseImportedJson({ ...base, cashFlows: [{ date: "2024-01-01", amount: 10, direction: "x" }] });
    expect(r1).toBeInstanceOf(Error);
    expect(r2).toBeInstanceOf(Error);
    expect(r3).toBeInstanceOf(Error);
  });

  it("rejects invalid valuationDate type", () => {
    const payload = { version: 1, cashFlows: [], valuationDate: 123, currentValue: null, history: [] } as unknown;
    const result = parseImportedJson(payload);
    expect(result).toBeInstanceOf(Error);
  });

  it("rejects invalid currentValue type", () => {
    const payload = { version: 1, cashFlows: [], valuationDate: null, currentValue: "x", history: [] } as unknown;
    const result = parseImportedJson(payload);
    expect(result).toBeInstanceOf(Error);
  });

  it("rejects invalid history array or element types", () => {
    const base = { version: 1, cashFlows: [], valuationDate: null, currentValue: null };
    const r1 = parseImportedJson({ ...base, history: {} });
    const r2 = parseImportedJson({ ...base, history: [123] });
    expect(r1).toBeInstanceOf(Error);
    expect(r2).toBeInstanceOf(Error);
  });

  it("handles backward compatibility with old files containing calculated fields in history", () => {
    // Old format with irr, simpleRate, netInvested, and profit in history
    const payloadWithOldFormat = {
      version: 1,
      cashFlows: [
        { date: "2024-01-01", amount: 1000, direction: "deposit" },
      ],
      valuationDate: "2025-01-01",
      currentValue: 1200,
      history: [
        {
          calculationDateTime: "2025-01-02T00:00:00Z",
          valuationDate: "2025-01-01",
          currentValue: 1234,
          irr: 0.1,
          simpleRate: 0.11,
          netInvested: 1100,
          profit: 134,
        }
      ],
      fundName: "My Fund",
    };

    const result = parseImportedJson(payloadWithOldFormat);
    expect(result).not.toBeInstanceOf(Error);

    const state = result as CalculatorState;
    expect(state.history.length).toBe(1);

    // The old calculated fields should be preserved in the imported state
    // (for backward compatibility when reading), but they won't be used
    const snapshot = state.history[0];
    expect(snapshot.calculationDateTime).toBe("2025-01-02T00:00:00Z");
    expect(snapshot.valuationDate).toBe("2025-01-01");
    expect(snapshot.currentValue).toBe(1234);
    // Old fields are preserved but optional
    expect(snapshot.irr).toBe(0.1);
    expect(snapshot.simpleRate).toBe(0.11);
    expect(snapshot.netInvested).toBe(1100);
    expect(snapshot.profit).toBe(134);
  });
});
