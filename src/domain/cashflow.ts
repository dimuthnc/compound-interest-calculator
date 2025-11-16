import type { CashFlowEntry } from "../types";
import type { IrrCashFlow } from "./irr";

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
