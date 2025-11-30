import { differenceInCalendarDays } from "date-fns";
import type { CashFlowEntry } from "../types";

export interface IrrCashFlow {
  date: Date;
  amount: number; // signed: negative for deposits, positive for withdrawals/currentValue
}

const MAX_ITERATIONS = 100;
const TOLERANCE = 1e-7;

// Calculates the Net Present Value (NPV) for a given rate and cash flows.
const calculateNpv = (rate: number, flows: IrrCashFlow[], baseDate: Date): number => {
  return flows.reduce((acc, flow) => {
    const days = differenceInCalendarDays(flow.date, baseDate);
    const years = days / 365.0;
    return acc + flow.amount / Math.pow(1 + rate, years);
  }, 0);
};

// Calculates the derivative of the NPV function, required for Newton-Raphson.
const calculateDerivative = (rate: number, flows: IrrCashFlow[], baseDate: Date): number => {
  return flows.reduce((acc, flow) => {
    const days = differenceInCalendarDays(flow.date, baseDate);
    if (days === 0) return acc; // First cash flow has no impact on derivative
    const years = days / 365.0;
    return acc - (flow.amount * years) / Math.pow(1 + rate, years + 1);
  }, 0);
};

/**
 * Computes the Internal Rate of Return (IRR) for a series of cash flows.
 * It uses the Newton-Raphson method for fast convergence and falls back to the
 * Bisection method for stability if Newton-Raphson fails.
 */
export function computeIrr(cashFlows: IrrCashFlow[]): number | null {
  if (cashFlows.length < 2) {
    return null;
  }

  const sortedFlows = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const baseDate = sortedFlows[0].date;

  const allPositive = sortedFlows.every((cf) => cf.amount >= 0);
  const allNegative = sortedFlows.every((cf) => cf.amount <= 0);
  if (allPositive || allNegative) {
    return null; // IRR is not defined if all cash flows have the same sign.
  }

  let guess = 0.1; // Initial guess: 10%
  let low = -0.9999; // Lower bound: -99.99%
  let high = 10.0; // Upper bound: 1000%

  // --- Newton-Raphson Method ---
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const npv = calculateNpv(guess, sortedFlows, baseDate);
    const derivative = calculateDerivative(guess, sortedFlows, baseDate);

    if (Math.abs(npv) < TOLERANCE) {
      return guess; // Solution found
    }

    if (derivative === 0) {
      break; // Cannot continue, switch to bisection
    }

    const nextGuess = guess - npv / derivative;

    if (nextGuess <= low || nextGuess >= high) {
      break; // Out of bounds, switch to bisection
    }
    guess = nextGuess;
  }

  // --- Bisection Method (Fallback) ---
  let mid = 0;
  let npvLow = calculateNpv(low, sortedFlows, baseDate);
  const npvHigh = calculateNpv(high, sortedFlows, baseDate);

  if (npvLow * npvHigh > 0) {
    return null; // No root in the interval [low, high]
  }

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    mid = (low + high) / 2;
    const npvMid = calculateNpv(mid, sortedFlows, baseDate);

    if (Math.abs(npvMid) < TOLERANCE) {
      return mid; // Solution found
    }

    if (npvLow * npvMid < 0) {
      high = mid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }

  return null; // Failed to converge
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

