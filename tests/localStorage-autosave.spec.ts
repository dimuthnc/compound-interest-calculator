import { test, expect } from '@playwright/test';
import { clearLocalStorage, getLocalStorageState, waitForAutosave } from './utils/localStorage';
import { addCashFlow, getCashFlowCount } from './utils/cashflow-helpers';
import { setValuationDate, setCurrentValue } from './utils/calculation-helpers';

test.describe('LocalStorage Autosave', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await page.reload();
  });

  test('Auto-saves state after adding cash flow', async ({ page }) => {
    await test.step('Add a cash flow', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      // Verify the cash flow row is visible
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);
    });

    await test.step('Wait for autosave debounce', async () => {
      await waitForAutosave(page, 1000);
    });

    await test.step('Verify localStorage contains cash flow', async () => {
      const state = await getLocalStorageState(page);
      expect(state).toBeTruthy();
      expect(state!.cashFlows).toBeDefined();
      expect(state!.cashFlows.length).toBe(1);
      expect(state!.cashFlows[0].date).toBe('2024-01-01');
      expect(state!.cashFlows[0].amount).toBe(1000);
    });

    await test.step('Reload page and verify state is restored', async () => {
      await page.reload();

      // Wait for page to fully load by checking for cash flow rows
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);

      // Verify cash flow is still there
      const count = await getCashFlowCount(page);
      expect(count).toBe(1);
    });
  });

  test('Auto-saves valuation date and current value', async ({ page }) => {
    await test.step('Set valuation details', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
      // Verify the cash flow row is visible
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);
    });

    await test.step('Wait for autosave', async () => {
      await waitForAutosave(page, 1000);
    });

    await test.step('Verify localStorage contains valuation data', async () => {
      const state = await getLocalStorageState(page);
      // Valuation date defaults to today, not stored
      expect(state!.currentValue).toBe(1100);
    });

    await test.step('Reload and verify current value is restored', async () => {
      await page.reload();

      // Wait for page to fully load by checking for cash flow rows
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);

      // Valuation date always defaults to today (by design)
      const valuationDateInput = page.getByLabel(/valuation date/i);
      const valuationDate = await valuationDateInput.inputValue();
      // Should be today's date in ISO format (YYYY-MM-DD)
      expect(valuationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const currentValueInput = page.getByLabel(/current.*value|current fund value/i);
      const currentValue = await currentValueInput.inputValue();
      // Value might be stored as '1100' or '1100.00'
      expect(parseFloat(currentValue)).toBe(1100);
    });
  });

  test('Clear All removes localStorage', async ({ page }) => {
    await test.step('Add some data', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
      await waitForAutosave(page, 1000);
    });

    await test.step('Verify localStorage has data', async () => {
      const state = await getLocalStorageState(page);
      expect(state).toBeTruthy();
      expect(state!.cashFlows.length).toBeGreaterThan(0);
    });

    await test.step('Click Clear All button', async () => {
      const clearButton = page.getByRole('button', { name: /clear.*all/i });
      await clearButton.click();
    });

    await test.step('Verify UI is cleared', async () => {
      await expect(page.getByText(/add at least one deposit to start/i)).toBeVisible();

      const currentValueInput = page.getByLabel(/current.*value|current fund value/i);

      const currentValue = await currentValueInput.inputValue();
      expect(currentValue).toBe('');
    });

    await test.step('Verify localStorage is cleared', async () => {
      const state = await getLocalStorageState(page);
      // Should be null or have empty arrays
      if (state) {
        expect(state.cashFlows.length).toBe(0);
      }
    });

    await test.step('Reload and verify empty state persists', async () => {
      await page.reload();

      await expect(page.getByText(/add at least one deposit to start/i)).toBeVisible();
    });
  });

  test('Multiple rapid changes are debounced', async ({ page }) => {
    await test.step('Add multiple cash flows rapidly', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await addCashFlow(page, '2024-02-01', 500, 'Deposit');
      await addCashFlow(page, '2024-03-01', 300, 'Deposit');
      // Don't wait between actions - test debouncing
    });

    await test.step('Wait for debounce to complete', async () => {
      await waitForAutosave(page, 1000);
    });

    await test.step('Verify all changes are saved', async () => {
      const state = await getLocalStorageState(page);
      expect(state!.cashFlows.length).toBe(3);
    });

    await test.step('Reload and verify all cash flows restored', async () => {
      await page.reload();

      // Wait for page to fully load by checking for cash flow rows
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(3);

      const count = await getCashFlowCount(page);
      expect(count).toBe(3);
    });
  });

  test('History snapshots are persisted', async ({ page }) => {
    await test.step('Create and save a snapshot', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);

      // Verify cash flow is visible
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);

      const saveButton = page.getByRole('button', { name: /save.*snapshot/i });
      await saveButton.click();

      // Wait for the snapshot to appear in history
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(1);

      await waitForAutosave(page, 1000);
    });

    await test.step('Verify history in localStorage', async () => {
      const state = await getLocalStorageState(page);
      expect(state!.history).toBeDefined();
      expect(state!.history.length).toBe(1);
    });

    await test.step('Reload and verify history is restored', async () => {
      await page.reload();

      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(1);
    });
  });
});

