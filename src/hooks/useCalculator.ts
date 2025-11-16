import { useEffect, useMemo, useRef, useState } from "react";
import type { CalculatorState, CashFlowEntry } from "../types";
import {
  sortCashFlowsByDate,
  computeNetInvested,
  mapToIrrCashFlows,
} from "../domain/cashflow";
import { computeIrr } from "../domain/irr";
import { computeSimpleRate } from "../domain/simpleRate";

export interface SaveSnapshotResult {
  ok: boolean;
  error?: string;
}

const AUTOSAVE_KEY = "effective-interest-calculator-state-v1";
const AUTOSAVE_DELAY_MS = 400;

function createEmptyState(): CalculatorState {
  return {
    cashFlows: [],
    valuationDate: null,
    currentValue: null,
    history: [],
    fundName: null,
  };
}

function safeParseStoredState(value: string | null): CalculatorState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<CalculatorState>;
    if (!parsed || !Array.isArray(parsed.cashFlows)) return null;

    return {
      cashFlows: parsed.cashFlows ?? [],
      valuationDate: parsed.valuationDate ?? null,
      currentValue: parsed.currentValue ?? null,
      history: parsed.history ?? [],
      fundName: parsed.fundName ?? null,
    };
  } catch {
    return null;
  }
}

function generateId(): string {
  if (typeof globalThis !== "undefined") {
    const anyGlobal = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
    if (anyGlobal.crypto?.randomUUID) {
      return anyGlobal.crypto.randomUUID();
    }
  }
  return `cf_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(() => {
    if (typeof window === "undefined") {
      return createEmptyState();
    }
    try {
      const stored = window.localStorage.getItem(AUTOSAVE_KEY);
      return safeParseStoredState(stored) ?? createEmptyState();
    } catch {
      return createEmptyState();
    }
  });

  const [saveSnapshotResult, setSaveSnapshotResult] = useState<SaveSnapshotResult | null>(
    null,
  );

  const autosaveTimeout = useRef<number | null>(null);

  // Derived metrics: netInvested, profit, irr, simpleRate.
  const { netInvested, profit, irr, simpleRate } = useMemo(() => {
    const sorted = sortCashFlowsByDate(state.cashFlows);
    const net = computeNetInvested(sorted);

    const currentValue = state.currentValue ?? 0;
    const profitValue = currentValue - net;

    let irrValue: number | null = null;
    let simpleRateValue: number | null = null;

    if (state.valuationDate && state.currentValue !== null && sorted.length > 0) {
      const valuationDate = new Date(state.valuationDate);
      const irrFlows = mapToIrrCashFlows(sorted, valuationDate, state.currentValue);
      irrValue = computeIrr(irrFlows);

      simpleRateValue = computeSimpleRate({
        cashFlows: sorted,
        valuationDate,
        currentValue: state.currentValue,
      });
    }

    return {
      netInvested: net,
      profit: profitValue,
      irr: irrValue,
      simpleRate: simpleRateValue,
    };
  }, [state.cashFlows, state.currentValue, state.valuationDate]);

  // Autosave: debounce writes to localStorage on state changes.
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (autosaveTimeout.current !== null) {
      window.clearTimeout(autosaveTimeout.current);
    }

    autosaveTimeout.current = window.setTimeout(() => {
      try {
        const payload: CalculatorState = {
          cashFlows: state.cashFlows,
          valuationDate: state.valuationDate,
          currentValue: state.currentValue,
          history: state.history,
          fundName: state.fundName ?? null,
        };
        window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
      } catch {
        // Ignore storage errors.
      }
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimeout.current !== null) {
        window.clearTimeout(autosaveTimeout.current);
      }
    };
  }, [state.cashFlows, state.valuationDate, state.currentValue, state.history, state.fundName]);

  // ---- Actions ----

  const addCashFlow = () => {
    const today = new Date();
    const isoToday = today.toISOString().slice(0, 10);

    const newEntry: CashFlowEntry = {
      id: generateId(),
      date: isoToday,
      amount: 0,
      direction: "deposit",
    };

    setState((prev) => ({
      ...prev,
      cashFlows: [...prev.cashFlows, newEntry],
    }));
  };

  const updateCashFlow = (id: string, patch: Partial<CashFlowEntry>): void => {
    setState((prev) => ({
      ...prev,
      cashFlows: prev.cashFlows.map((cf) =>
        cf.id === id
          ? { ...cf, ...patch, id: cf.id } // never allow id to change via patch
          : cf,
      ),
    }));
  };

  const deleteCashFlow = (id: string): void => {
    setState((prev) => ({
      ...prev,
      cashFlows: prev.cashFlows.filter((cf) => cf.id !== id),
    }));
  };

  const setValuationDate = (dateString: string): void => {
    setState((prev) => ({
      ...prev,
      valuationDate: dateString,
    }));
  };

  const setCurrentValue = (value: number | null): void => {
    setState((prev) => ({
      ...prev,
      currentValue: value,
    }));
  };

  const setFundName = (name: string | null): void => {
    setState((prev) => ({ ...prev, fundName: name }));
  };

  const saveSnapshot = (): SaveSnapshotResult => {
    const sorted = sortCashFlowsByDate(state.cashFlows);

    if (sorted.length === 0) {
      const result = { ok: false, error: "Add at least one cash flow before saving." };
      setSaveSnapshotResult(result);
      return result;
    }

    if (!state.valuationDate) {
      const result = { ok: false, error: "Set a valuation date before saving a snapshot." };
      setSaveSnapshotResult(result);
      return result;
    }

    if (state.currentValue === null || state.currentValue <= 0) {
      const result = {
        ok: false,
        error: "Enter a current fund value greater than 0 before saving a snapshot.",
      };
      setSaveSnapshotResult(result);
      return result;
    }

    const valuationDate = new Date(state.valuationDate);
    const currentValue = state.currentValue;

    const irrFlows = mapToIrrCashFlows(sorted, valuationDate, currentValue);
    const irrValue = computeIrr(irrFlows);

    const simpleRateValue = computeSimpleRate({
      cashFlows: sorted,
      valuationDate,
      currentValue,
    });

    const net = computeNetInvested(sorted);
    const profitValue = currentValue - net;

    const calculationDateTime = new Date().toISOString();

    const snapshot = {
      calculationDateTime,
      valuationDate: state.valuationDate,
      currentValue,
      irr: irrValue,
      simpleRate: simpleRateValue,
      netInvested: net,
      profit: profitValue,
    };

    setState((prev) => ({
      ...prev,
      history: [...prev.history, snapshot],
    }));

    const result: SaveSnapshotResult = { ok: true };
    setSaveSnapshotResult(result);
    return result;
  };

  const importScenario = (nextState: CalculatorState): void => {
    setState(nextState);
    setSaveSnapshotResult(null);
  };

  const clearAll = (): void => {
    // Reset in-memory state
    setState(createEmptyState());
    setSaveSnapshotResult(null);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTOSAVE_KEY);
      }
    } catch {}
  };

  return {
    state,
    netInvested,
    profit,
    irr,
    simpleRate,
    saveSnapshotResult,
    addCashFlow,
    updateCashFlow,
    deleteCashFlow,
    setValuationDate,
    setCurrentValue,
    setFundName,
    saveSnapshot,
    importScenario,
    clearAll,
  };
}
