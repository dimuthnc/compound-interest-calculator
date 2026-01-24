import { describe, expect, it } from "vitest";
import {
  parseSummaryFundJson,
  addOrReplaceFund,
  removeFund,
} from "./summarySchema";
import type { SummaryFund } from "../types";

describe("parseSummaryFundJson", () => {
  it("parses a valid fund JSON with all required fields", () => {
    const json = {
      version: 1,
      fundName: "Test Fund",
      cashFlows: [
        { date: "2025-01-01", amount: 1000, direction: "deposit" },
      ],
      valuationDate: "2025-06-01",
      currentValue: 1100,
      history: [
        {
          calculationDateTime: "2025-06-01T12:00:00Z",
          valuationDate: "2025-06-01",
          currentValue: 1100,
          netInvested: 1000,
          irr: 0.25,
          simpleRate: 0.24,
          profit: 100,
        },
      ],
    };

    const result = parseSummaryFundJson(json);
    expect(result).not.toBeInstanceOf(Error);
    if (!(result instanceof Error)) {
      expect(result.fundName).toBe("Test Fund");
      expect(result.cashFlows).toHaveLength(1);
      expect(result.history).toHaveLength(1);
      expect(result.history[0].irr).toBe(0.25);
      expect(result.history[0].simpleRate).toBe(0.24);
      expect(result.history[0].isDynamicallyCalculated).toBe(false);
    }
  });

  it("returns error for missing fundName", () => {
    const json = {
      version: 1,
      cashFlows: [],
      history: [{ valuationDate: "2025-01-01", currentValue: 100 }],
    };

    const result = parseSummaryFundJson(json);
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toContain("Fund name is required");
  });

  it("returns error for empty fundName", () => {
    const json = {
      version: 1,
      fundName: "   ",
      cashFlows: [],
      history: [{ valuationDate: "2025-01-01", currentValue: 100 }],
    };

    const result = parseSummaryFundJson(json);
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toContain("Fund name is required");
  });

  it("returns error for empty history array", () => {
    const json = {
      version: 1,
      fundName: "Test Fund",
      cashFlows: [{ date: "2025-01-01", amount: 1000, direction: "deposit" }],
      history: [],
    };

    const result = parseSummaryFundJson(json);
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toContain("cannot be empty");
  });

  it("returns error for invalid version", () => {
    const json = {
      version: 2,
      fundName: "Test Fund",
      cashFlows: [],
      history: [{ valuationDate: "2025-01-01", currentValue: 100 }],
    };

    const result = parseSummaryFundJson(json);
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toContain("Unsupported scenario version");
  });

  it("dynamically calculates metrics when missing from history", () => {
    const json = {
      version: 1,
      fundName: "Test Fund",
      cashFlows: [
        { date: "2025-01-01", amount: 1000, direction: "deposit" },
      ],
      valuationDate: "2025-06-01",
      currentValue: 1100,
      history: [
        {
          calculationDateTime: "2025-06-01T12:00:00Z",
          valuationDate: "2025-06-01",
          currentValue: 1100,
          // netInvested, irr, simpleRate, profit are missing
        },
      ],
    };

    const result = parseSummaryFundJson(json);
    expect(result).not.toBeInstanceOf(Error);
    if (!(result instanceof Error)) {
      expect(result.history[0].netInvested).toBe(1000);
      expect(result.history[0].profit).toBe(100);
      expect(result.history[0].irr).not.toBeNull();
      expect(result.history[0].simpleRate).not.toBeNull();
      expect(result.history[0].isDynamicallyCalculated).toBe(true);
    }
  });

  it("trims whitespace from fundName", () => {
    const json = {
      version: 1,
      fundName: "  My Fund  ",
      cashFlows: [{ date: "2025-01-01", amount: 100, direction: "deposit" }],
      history: [{ valuationDate: "2025-01-01", currentValue: 100 }],
    };

    const result = parseSummaryFundJson(json);
    expect(result).not.toBeInstanceOf(Error);
    if (!(result instanceof Error)) {
      expect(result.fundName).toBe("My Fund");
    }
  });
});

describe("addOrReplaceFund", () => {
  const fund1: SummaryFund = {
    fundName: "Fund A",
    cashFlows: [],
    history: [
      {
        calculationDateTime: "2025-01-01T00:00:00Z",
        valuationDate: "2025-01-01",
        currentValue: 100,
        netInvested: 100,
        irr: 0.05,
        simpleRate: 0.05,
        profit: 0,
      },
    ],
  };

  const fund2: SummaryFund = {
    fundName: "Fund B",
    cashFlows: [],
    history: [
      {
        calculationDateTime: "2025-01-01T00:00:00Z",
        valuationDate: "2025-01-01",
        currentValue: 200,
        netInvested: 200,
        irr: 0.1,
        simpleRate: 0.1,
        profit: 0,
      },
    ],
  };

  it("adds a new fund to empty array", () => {
    const result = addOrReplaceFund([], fund1);
    expect(result).toHaveLength(1);
    expect(result[0].fundName).toBe("Fund A");
  });

  it("adds a new fund with different name", () => {
    const result = addOrReplaceFund([fund1], fund2);
    expect(result).toHaveLength(2);
  });

  it("replaces existing fund with same name", () => {
    const updatedFund1: SummaryFund = {
      ...fund1,
      history: [
        {
          calculationDateTime: "2025-02-01T00:00:00Z",
          valuationDate: "2025-02-01",
          currentValue: 150,
          netInvested: 100,
          irr: 0.5,
          simpleRate: 0.5,
          profit: 50,
        },
      ],
    };

    const result = addOrReplaceFund([fund1, fund2], updatedFund1);
    expect(result).toHaveLength(2);
    expect(result.find((f) => f.fundName === "Fund A")?.history[0].currentValue).toBe(150);
  });

  it("replaces fund case-insensitively", () => {
    const fundWithDifferentCase: SummaryFund = {
      ...fund1,
      fundName: "FUND A",
    };

    const result = addOrReplaceFund([fund1], fundWithDifferentCase);
    expect(result).toHaveLength(1);
    expect(result[0].fundName).toBe("FUND A");
  });
});

describe("removeFund", () => {
  const funds: SummaryFund[] = [
    {
      fundName: "Fund A",
      cashFlows: [],
      history: [
        {
          calculationDateTime: "2025-01-01T00:00:00Z",
          valuationDate: "2025-01-01",
          currentValue: 100,
          netInvested: 100,
          irr: 0.05,
          simpleRate: 0.05,
          profit: 0,
        },
      ],
    },
    {
      fundName: "Fund B",
      cashFlows: [],
      history: [
        {
          calculationDateTime: "2025-01-01T00:00:00Z",
          valuationDate: "2025-01-01",
          currentValue: 200,
          netInvested: 200,
          irr: 0.1,
          simpleRate: 0.1,
          profit: 0,
        },
      ],
    },
  ];

  it("removes fund by exact name", () => {
    const result = removeFund(funds, "Fund A");
    expect(result).toHaveLength(1);
    expect(result[0].fundName).toBe("Fund B");
  });

  it("returns same array if fund not found", () => {
    const result = removeFund(funds, "Fund C");
    expect(result).toHaveLength(2);
  });

  it("does not remove with different case", () => {
    const result = removeFund(funds, "fund a");
    expect(result).toHaveLength(2);
  });
});
