import type { CashFlowEntry, HistoricalSnapshot } from "../types";
import type { IrrCashFlow } from "./irr";
import { computeIrr } from "./irr";
import { computeSimpleRate } from "./simpleRate";

// Return a new array sorted ascending by ISO date without mutating the original.
export function sortCashFlowsByDate(cashFlows: CashFlowEntry[]): CashFlowEntry[] {
  return [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));
}

// Compute net invested = sum(deposits) - sum(withdrawals).
export function computeNetInvested(cashFlows: CashFlowEntry[]): number {
  return cashFlows.reduce((sum, cf) => {
    const signed = cf.direction === "deposit" ? cf.amount : -cf.amount;
    return sum + signed;
  }, 0);
}

export function computeNetInvestedAndProfit(
  cashFlows: CashFlowEntry[],
  currentValue: number,
): { netInvested: number; profit: number } {
  const netInvested = computeNetInvested(cashFlows);
  const profit = currentValue - netInvested;
  return { netInvested, profit };
}

// Map UI cash flows + current value into IrrCashFlow entries for IRR computation.
export function mapToIrrCashFlows(
  cashFlows: CashFlowEntry[],
  valuationDate: Date,
  currentValue: number,
): IrrCashFlow[] {
  const flows: IrrCashFlow[] = cashFlows.map((cf) => ({
    date: new Date(cf.date),
    // Deposits -> negative (cash out of user), withdrawals -> positive.
    amount: cf.direction === "deposit" ? -cf.amount : cf.amount,
  }));

  // Append final valuation cash flow as a positive amount at the valuation date.
  flows.push({ date: valuationDate, amount: currentValue });

  return flows;
}

/**
 * Compute all calculated metrics for a historical snapshot dynamically.
 * This function replaces stored calculated values with fresh computations.
 *
 * @param snapshot - The historical snapshot with valuationDate and currentValue
 * @param cashFlows - The cash flows to use for calculation (typically current cash flows)
 * @returns Computed metrics: irr, simpleRate, netInvested, and profit
 */
export function computeSnapshotMetrics(
  snapshot: Pick<HistoricalSnapshot, 'valuationDate' | 'currentValue'>,
  cashFlows: CashFlowEntry[],
): {
  irr: number | null;
  simpleRate: number | null;
  netInvested: number;
  profit: number;
} {
  const sorted = sortCashFlowsByDate(cashFlows);
  const { netInvested, profit } = computeNetInvestedAndProfit(sorted, snapshot.currentValue);

  let irr: number | null = null;
  let simpleRate: number | null = null;

  if (sorted.length > 0) {
    const valuationDate = new Date(snapshot.valuationDate);
    const irrFlows = mapToIrrCashFlows(sorted, valuationDate, snapshot.currentValue);
    irr = computeIrr(irrFlows);

    simpleRate = computeSimpleRate({
      cashFlows: sorted,
      valuationDate,
      currentValue: snapshot.currentValue,
    });
  }

  return {
    irr,
    simpleRate,
    netInvested,
    profit,
  };
}

