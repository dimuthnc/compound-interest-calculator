import type {
  CashFlowEntry,
  SummaryFund,
  SummarySnapshot,
} from "../types";
import { computeSnapshotMetrics, sortCashFlowsByDate } from "./cashflow";

/**
 * Validates that a value is a non-null object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isDirection(value: unknown): value is CashFlowEntry["direction"] {
  return value === "deposit" || value === "withdrawal";
}

/** Lightweight random ID generator for client-side cash flow entries. */
function generateId(): string {
  if (typeof globalThis !== "undefined") {
    const anyGlobal = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
    if (anyGlobal.crypto?.randomUUID) {
      return anyGlobal.crypto.randomUUID();
    }
  }
  return `cf_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

/**
 * Parse and validate an imported JSON file for the summary page.
 *
 * Required fields:
 * - fundName (non-empty string)
 * - cashFlows (array with valid entries)
 * - history (array with valuationDate, currentValue)
 *
 * If history entries are missing irr/simpleRate, they will be calculated dynamically.
 */
export function parseSummaryFundJson(raw: unknown): SummaryFund | Error {
  if (!isObject(raw)) {
    return new Error("Imported data must be an object.");
  }

  const { version, cashFlows, history, fundName } = raw;

  // Validate version
  if (version !== 1) {
    return new Error("Unsupported scenario version. Expected version 1.");
  }

  // Validate fundName - required and non-empty for summary
  if (!isString(fundName) || fundName.trim() === "") {
    return new Error("Fund name is required and cannot be empty.");
  }

  // Validate cashFlows array
  if (!Array.isArray(cashFlows)) {
    return new Error("Invalid or missing cashFlows array in imported data.");
  }

  const parsedCashFlows: CashFlowEntry[] = [];
  for (const [index, cf] of cashFlows.entries()) {
    if (!isObject(cf)) {
      return new Error(`Cash flow at index ${index} is not an object.`);
    }

    const { date, amount, direction } = cf;

    if (!isString(date)) {
      return new Error(`Cash flow at index ${index} has invalid or missing date.`);
    }
    if (!isNumber(amount)) {
      return new Error(`Cash flow at index ${index} has invalid or missing amount.`);
    }
    if (!isDirection(direction)) {
      return new Error(`Cash flow at index ${index} has invalid direction.`);
    }

    parsedCashFlows.push({
      id: generateId(),
      date,
      amount,
      direction,
    });
  }

  // Validate history array
  if (!Array.isArray(history)) {
    return new Error("Invalid or missing history array in imported data.");
  }

  if (history.length === 0) {
    return new Error("History array cannot be empty. At least one snapshot is required.");
  }

  // Parse and enrich history entries
  const enrichedHistory: SummarySnapshot[] = [];
  const sortedCashFlows = sortCashFlowsByDate(parsedCashFlows);

  for (const [index, item] of history.entries()) {
    if (!isObject(item)) {
      return new Error(`History entry at index ${index} is not an object.`);
    }

    const { calculationDateTime, valuationDate, currentValue, netInvested, irr, simpleRate, profit } = item;

    // Required fields
    if (!isString(valuationDate)) {
      return new Error(`History entry at index ${index} has invalid or missing valuationDate.`);
    }
    if (!isNumber(currentValue)) {
      return new Error(`History entry at index ${index} has invalid or missing currentValue.`);
    }

    // Enrich with computed metrics if missing
    const enrichedSnapshot = enrichHistorySnapshot(
      {
        calculationDateTime: isString(calculationDateTime) ? calculationDateTime : new Date().toISOString(),
        valuationDate,
        currentValue,
        netInvested: isNumber(netInvested) ? netInvested : undefined,
        irr: isNumber(irr) ? irr : (irr === null ? null : undefined),
        simpleRate: isNumber(simpleRate) ? simpleRate : (simpleRate === null ? null : undefined),
        profit: isNumber(profit) ? profit : undefined,
      },
      sortedCashFlows
    );

    enrichedHistory.push(enrichedSnapshot);
  }

  return {
    fundName: fundName.trim(),
    cashFlows: parsedCashFlows,
    history: enrichedHistory,
  };
}

/**
 * Enrich a history snapshot with computed metrics if they are missing.
 * Uses computeSnapshotMetrics from cashflow.ts for dynamic calculation.
 */
function enrichHistorySnapshot(
  snapshot: {
    calculationDateTime: string;
    valuationDate: string;
    currentValue: number;
    netInvested?: number;
    irr?: number | null;
    simpleRate?: number | null;
    profit?: number;
  },
  cashFlows: CashFlowEntry[]
): SummarySnapshot {
  const hasStoredNetInvested = typeof snapshot.netInvested === 'number';
  const hasStoredIrr = snapshot.irr !== undefined;
  const hasStoredSimpleRate = snapshot.simpleRate !== undefined;
  const hasStoredProfit = typeof snapshot.profit === 'number';

  // If all values are present, use them directly
  if (hasStoredNetInvested && hasStoredIrr && hasStoredSimpleRate && hasStoredProfit) {
    return {
      calculationDateTime: snapshot.calculationDateTime,
      valuationDate: snapshot.valuationDate,
      currentValue: snapshot.currentValue,
      netInvested: snapshot.netInvested!,
      irr: snapshot.irr!,
      simpleRate: snapshot.simpleRate!,
      profit: snapshot.profit!,
      isDynamicallyCalculated: false,
    };
  }

  // Calculate missing values dynamically
  const metrics = computeSnapshotMetrics(
    {
      valuationDate: snapshot.valuationDate,
      currentValue: snapshot.currentValue,
      netInvested: snapshot.netInvested,
    },
    cashFlows
  );

  return {
    calculationDateTime: snapshot.calculationDateTime,
    valuationDate: snapshot.valuationDate,
    currentValue: snapshot.currentValue,
    netInvested: hasStoredNetInvested ? snapshot.netInvested! : metrics.netInvested,
    irr: hasStoredIrr ? snapshot.irr! : metrics.irr,
    simpleRate: hasStoredSimpleRate ? snapshot.simpleRate! : metrics.simpleRate,
    profit: hasStoredProfit ? snapshot.profit! : metrics.profit,
    isDynamicallyCalculated: !hasStoredIrr || !hasStoredSimpleRate,
  };
}

/**
 * Add or replace a fund in the funds array.
 * If a fund with the same name exists, it is replaced with the new one.
 */
export function addOrReplaceFund(
  existingFunds: SummaryFund[],
  newFund: SummaryFund
): SummaryFund[] {
  const filtered = existingFunds.filter(
    (f) => f.fundName.toLowerCase() !== newFund.fundName.toLowerCase()
  );
  return [...filtered, newFund];
}

/**
 * Remove a fund by name from the funds array.
 */
export function removeFund(
  funds: SummaryFund[],
  fundName: string
): SummaryFund[] {
  return funds.filter((f) => f.fundName !== fundName);
}
