import { Page } from '@playwright/test';

const STORAGE_KEY = 'effective-interest-calculator-state-v1';

/**
 * Clear localStorage for the calculator app
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, STORAGE_KEY);
}

/**
 * Calculator state interface representing the localStorage structure
 */
export interface CalculatorLocalState {
  cashFlows: Array<{
    id: string;
    date: string;
    amount: number;
    direction: 'deposit' | 'withdrawal';
  }>;
  valuationDate: string | null;
  currentValue: number | null;
  history: Array<{
    calculationDateTime: string;
    valuationDate: string;
    currentValue: number;
    irr: number | null;
    simpleRate: number | null;
    netInvested: number;
    profit: number;
  }>;
}

/**
 * Get the current calculator state from localStorage
 */
export async function getLocalStorageState(page: Page): Promise<CalculatorLocalState | null> {
  return await page.evaluate((key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }, STORAGE_KEY);
}

/**
 * Set calculator state in localStorage
 */
export async function setLocalStorageState(page: Page, state: CalculatorLocalState): Promise<void> {
  await page.evaluate(({ key, state }) => {
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: STORAGE_KEY, state });
}

/**
 * Wait for localStorage to be updated (after debounce)
 */
export async function waitForAutosave(page: Page, timeoutMs = 1000): Promise<void> {
  await page.waitForTimeout(timeoutMs);
}

/**
 * Verify that localStorage contains the expected data
 */
export async function verifyLocalStorageContains(page: Page, expectedFields: Partial<CalculatorLocalState>): Promise<boolean> {
  const state = await getLocalStorageState(page);
  if (!state || typeof state !== 'object') return false;

  for (const [key, value] of Object.entries(expectedFields)) {
    const stateKey = key as keyof CalculatorLocalState;
    if (JSON.stringify(state[stateKey]) !== JSON.stringify(value)) {
      return false;
    }
  }
  return true;
}

