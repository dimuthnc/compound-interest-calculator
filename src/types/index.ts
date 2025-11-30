export type Direction = "deposit" | "withdrawal";

export interface CashFlowEntry {
  id: string; // unique client-side ID
  date: string; // ISO date string, "YYYY-MM-DD"
  amount: number; // > 0
  direction: Direction;
}

export interface HistoricalSnapshot {
  calculationDateTime: string; // ISO datetime, e.g. "2025-11-16T10:15:30Z"
  valuationDate: string; // ISO date used for this calculation
  currentValue: number; // fund value used at valuation date
  // Legacy fields for backward compatibility when reading old files
  // These should NOT be written to new exports
  irr?: number | null; // DEPRECATED: Calculated dynamically
  simpleRate?: number | null; // DEPRECATED: Calculated dynamically
  netInvested?: number; // DEPRECATED: Calculated dynamically
  profit?: number; // DEPRECATED: Calculated dynamically
}

export interface CalculatorState {
  cashFlows: CashFlowEntry[];
  valuationDate: string | null; // ISO date, null means "not set"
  currentValue: number | null;
  history: HistoricalSnapshot[];
  fundName?: string | null; // optional fund name provided by user
}

export interface ExportedScenarioJson {
  version: number; // e.g. 1
  cashFlows: {
    date: string;
    amount: number;
    direction: Direction;
  }[];
  valuationDate: string | null;
  currentValue: number | null;
  history: HistoricalSnapshot[];
  fundName?: string | null; // optional for backward compatibility
}
