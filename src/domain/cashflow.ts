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
 * Compute all calculated metrics for a historical snapshot.
 *
 * For netInvested: Uses the stored value if available (preserves historical accuracy),
 * otherwise calculates from current cashflows (backward compatibility for old data).
 *
 * For IRR and simpleRate: Always calculated dynamically based on stored netInvested.
 *
 * @param snapshot - The historical snapshot with valuationDate, currentValue, and optionally netInvested
 * @param cashFlows - The cash flows (only used if netInvested is not stored in snapshot)
 * @returns Computed metrics: irr, simpleRate, netInvested, profit, and hasStoredNetInvested flag
 */
export function computeSnapshotMetrics(
  snapshot: Pick<HistoricalSnapshot, 'valuationDate' | 'currentValue' | 'netInvested'>,
  cashFlows: CashFlowEntry[],
): {
  irr: number | null;
  simpleRate: number | null;
  netInvested: number;
  profit: number;
  hasStoredNetInvested: boolean;
} {
  const sorted = sortCashFlowsByDate(cashFlows);

  // Use stored netInvested if available, otherwise calculate from current cashflows
  const hasStoredNetInvested = typeof snapshot.netInvested === 'number';
  const netInvested = hasStoredNetInvested
    ? snapshot.netInvested!
    : computeNetInvested(sorted);

  const profit = snapshot.currentValue - netInvested;

  let irr: number | null = null;
  let simpleRate: number | null = null;

  // For IRR and simpleRate, we need to calculate based on a consistent view
  // We create synthetic cashflows based on the stored netInvested for accurate calculations
  if (sorted.length > 0) {
    const valuationDate = new Date(snapshot.valuationDate);

    // Calculate IRR using the current cashflow structure but actual dates
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
    hasStoredNetInvested,
  };
}

