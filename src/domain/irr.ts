import type { CashFlowEntry } from "../types";

export interface IrrCashFlow {
  date: Date;
  amount: number; // signed: negative for deposits, positive for withdrawals/current value
}

const DAYS_IN_YEAR = 365;

function daysBetween(base: Date, date: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return (date.getTime() - base.getTime()) / msPerDay;
}

function hasBothSigns(flows: IrrCashFlow[]): boolean {
  let hasPositive = false;
  let hasNegative = false;
  for (const f of flows) {
    if (f.amount > 0) hasPositive = true;
    if (f.amount < 0) hasNegative = true;
    if (hasPositive && hasNegative) return true;
  }
  return hasPositive && hasNegative;
}

/**
 * Compute annualized IRR/XIRR for a series of dated cash flows.
 *
 * Uses the equation: \sum CF_i * (1 + R)^(-t_i / 365) = 0
 * where t_i is the day difference between each flow date and the earliest date.
 *
 * Algorithm:
 * 1. Guard against invalid inputs (fewer than 2 flows, same-sign flows).
 * 2. Use Newton–Raphson starting from an initial guess.
 * 3. If Newton fails to converge or goes out of bounds, fall back to bisection
 *    within [-0.9999, 10].
 *
 * Returns the annualized rate R (e.g. 0.12 for 12%), or null if no solution
 * exists or the input is degenerate.
 */
export function computeIrr(cashFlows: IrrCashFlow[]): number | null {
  if (cashFlows.length < 2) return null;
  if (!hasBothSigns(cashFlows)) return null;

  // Sort by date and precompute time offsets and amounts.
  const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const baseDate = sorted[0].date;

  const times: number[] = [];
  const amounts: number[] = [];
  for (const flow of sorted) {
    times.push(daysBetween(baseDate, flow.date) / DAYS_IN_YEAR);
    amounts.push(flow.amount);
  }

  const f = (r: number): number => {
    let sum = 0;
    for (let i = 0; i < amounts.length; i++) {
      sum += amounts[i] * Math.pow(1 + r, -times[i]);
    }
    return sum;
  };

  const fPrime = (r: number): number => {
    let sum = 0;
    for (let i = 0; i < amounts.length; i++) {
      const t = times[i];
      // d/dr (1 + r)^(-t) = -t * (1 + r)^(-t - 1)
      sum += -t * amounts[i] * Math.pow(1 + r, -t - 1);
    }
    return sum;
  };

  const minRate = -0.9999;
  const maxRate = 10;
  const tolerance = 1e-7;

  // --- Newton–Raphson phase ---
  let guess = 0.1; // 10% initial guess
  for (let i = 0; i < 50; i++) {
    const value = f(guess);
    const deriv = fPrime(guess);

    if (Math.abs(value) < tolerance) {
      return guess;
    }

    if (deriv === 0 || !Number.isFinite(deriv)) {
      break; // can't continue Newton safely
    }

    const next = guess - value / deriv;

    if (!Number.isFinite(next) || next <= minRate || next >= maxRate) {
      // Out of reasonable bounds; fall back to bisection.
      guess = NaN;
      break;
    }

    guess = next;
  }

  // --- Bisection fallback ---
  let low = minRate;
  let high = maxRate;
  let fLow = f(low);
  let fHigh = f(high);

  // If f(low) and f(high) have the same sign, we can't guarantee a root.
  if (fLow * fHigh > 0 || !Number.isFinite(fLow) || !Number.isFinite(fHigh)) {
    return null;
  }

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const fMid = f(mid);

    if (!Number.isFinite(fMid)) {
      return null;
    }

    if (Math.abs(fMid) < tolerance) {
      return mid;
    }

    if (fLow * fMid < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }

  return null;
}

/** Map UI cash flows to IRR format. */
export function mapCashFlowsToIrrFormat(entries: CashFlowEntry[], currentValue?: { date: Date; value: number }): IrrCashFlow[] {
  const flows: IrrCashFlow[] = entries.map((entry) => ({
    date: new Date(entry.date),
    amount: entry.direction === "deposit" ? -entry.amount : entry.amount,
  }));

  if (currentValue) {
    flows.push({ date: currentValue.date, amount: currentValue.value });
  }

  return flows;
}

// Example usage (pseudo-code):
// const irr = computeIrr([
//   { date: new Date("2024-01-01"), amount: -1000 }, // deposit
//   { date: new Date("2025-01-01"), amount: 1100 },  // final value
// ]);
// if (irr !== null) {
//   console.log(`IRR = ${(irr * 100).toFixed(2)}%`);
// }
