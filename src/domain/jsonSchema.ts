import type {
  CalculatorState,
  CashFlowEntry,
  ExportedScenarioJson,
} from "../types";

/** Build a JSON-friendly export object from the current calculator state. */
export function buildExportJson(state: CalculatorState): ExportedScenarioJson {
  return {
    version: 1,
    cashFlows: state.cashFlows.map((cf) => ({
      date: cf.date,
      amount: cf.amount,
      direction: cf.direction,
    })),
    valuationDate: state.valuationDate,
    currentValue: state.currentValue,
    history: state.history.map((snapshot) => ({
      calculationDateTime: snapshot.calculationDateTime,
      valuationDate: snapshot.valuationDate,
      currentValue: snapshot.currentValue,
      // Exclude calculated fields (irr, simpleRate, netInvested, profit)
      // These will be calculated dynamically when needed
    })),
    fundName: state.fundName ?? null,
  };
}

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
  // Prefer crypto.randomUUID if available in this environment.
  // This function remains pure with respect to application state.
  if (typeof globalThis !== "undefined") {
    const anyGlobal = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
    if (anyGlobal.crypto?.randomUUID) {
      return anyGlobal.crypto.randomUUID();
    }
  }
  return `cf_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

/**
 * Parse and validate an imported JSON payload into a CalculatorState.
 *
 * Performs shallow shape checks and returns an Error with a helpful message
 * if the structure does not match the expected ExportedScenarioJson shape.
 *
 * Note: valuationDate is intentionally NOT restored from import - it will be
 * set to today's date by the hook/component.
 */
export function parseImportedJson(raw: unknown): CalculatorState | Error {
  if (!isObject(raw)) {
    return new Error("Imported data must be an object.");
  }

  const { version, cashFlows, valuationDate, currentValue, history, fundName } = raw;

  if (version !== 1) {
    return new Error("Unsupported scenario version. Expected version 1.");
  }

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

  // Validate valuationDate format if present, but don't use it
  if (valuationDate !== null && valuationDate !== undefined && !isString(valuationDate)) {
    return new Error("valuationDate must be a string or null.");
  }

  if (currentValue !== null && currentValue !== undefined && !isNumber(currentValue)) {
    return new Error("currentValue must be a number or null.");
  }

  if (!Array.isArray(history)) {
    return new Error("Invalid or missing history array in imported data.");
  }

  // We trust history entries to conform to HistoricalSnapshot; we only do a shallow check.
  // Each entry should be an object; deeper validation could be added if needed later.
  for (const [index, item] of history.entries()) {
    if (!isObject(item)) {
      return new Error(`History entry at index ${index} is not an object.`);
    }
  }

  const state: CalculatorState = {
    cashFlows: parsedCashFlows,
    valuationDate: null, // Will be set to today's date by useCalculator
    currentValue: (currentValue as number | null) ?? null,
    history: history as CalculatorState["history"],
    fundName: (fundName as string | null) ?? null,
  };

  return state;
}
