import { differenceInCalendarDays } from "date-fns";
import type { CashFlowEntry } from "../types";

export interface SimpleRateInput {
  cashFlows: CashFlowEntry[];
  valuationDate: Date;
  currentValue: number;
}

const DAYS_IN_YEAR = 365;

/**
 * Compute a simple annual interest rate using a balance × days method.
 *
 * Steps:
 * 1. Sort cash flows by date and build a sequence of events including the
 *    valuation date as the final event.
 * 2. Maintain an invested balance B_j after each event (deposits increase,
 *    withdrawals decrease).
 * 3. For each interval [D_j, D_{j+1}), accumulate B_j × days(D_j, D_{j+1}).
 * 4. Net invested = sum(deposits) − sum(withdrawals).
 * 5. Profit = currentValue − netInvested.
 * 6. Simple rate X = Profit × 365 / sumWeighted, or null if sumWeighted <= 0.
 */
export function computeSimpleRate(input: SimpleRateInput): number | null {
  const { cashFlows, valuationDate, currentValue } = input;

  if (cashFlows.length === 0) {
    return null;
  }

  // Sort cash flows by date (ISO strings sort lexicographically like dates).
  const sorted = [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));

  // Build events: each cash flow date (after applying it) plus the valuation date.
  const events: { date: Date; balance: number }[] = [];
  let balance = 0;

  for (const cf of sorted) {
    const date = new Date(cf.date);

    if (cf.direction === "deposit") {
      balance += cf.amount;
    } else {
      balance -= cf.amount;
    }

    events.push({ date, balance });
  }

  // Ensure the valuation date is after or equal to the last cash flow date.
  const valuationEventDate = valuationDate;
  events.push({ date: valuationEventDate, balance });

  // Accumulate balance × days over each interval between events.
  let sumWeighted = 0;
  for (let i = 0; i < events.length - 1; i++) {
    const start = events[i];
    const end = events[i + 1];

    const days = differenceInCalendarDays(end.date, start.date);
    if (days > 0) {
      sumWeighted += start.balance * days;
    }
  }

  // Net invested: deposits minus withdrawals.
  const netInvested = cashFlows.reduce((sum, cf) => {
    return sum + (cf.direction === "deposit" ? cf.amount : -cf.amount);
  }, 0);

  const profit = currentValue - netInvested;

  if (sumWeighted <= 0) {
    return null;
  }

  return (profit * DAYS_IN_YEAR) / sumWeighted;
}
