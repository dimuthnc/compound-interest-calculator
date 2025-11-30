import { test, expect } from '@playwright/test';
import { clearLocalStorage } from './utils/localStorage';
import { addCashFlow, deleteCashFlow, updateCashFlow, getCashFlowCount } from './utils/cashflow-helpers';
import { setValuationDate, setCurrentValue } from './utils/calculation-helpers';

test.describe('Cash Flow CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await page.reload();
  });

  test('Add multiple cash flows', async ({ page }) => {
    await test.step('Add first cash flow', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      const count = await getCashFlowCount(page);
      expect(count).toBe(1);
    });

    await test.step('Add second cash flow', async () => {
      await addCashFlow(page, '2024-06-01', 500, 'Deposit');
      const count = await getCashFlowCount(page);
      expect(count).toBe(2);
    });

    await test.step('Add third cash flow with withdrawal', async () => {
      await addCashFlow(page, '2024-09-01', 300, 'Withdrawal');
      const count = await getCashFlowCount(page);
      expect(count).toBe(3);
    });
  });

  test('Edit cash flow inline', async ({ page }) => {
    await test.step('Add initial cash flow', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
    });

    await test.step('Update the amount', async () => {
      await updateCashFlow(page, 0, { amount: 1500 });
    });

    await test.step('Verify updated amount', async () => {
      const rows = page.locator('[data-testid="cash-flow-row"]');
      const amountInput = rows.first().getByLabel(/amount/i);
      await expect(amountInput).toHaveValue('1500');
    });

    await test.step('Update the date', async () => {
      await updateCashFlow(page, 0, { date: '2024-02-01' });
    });

    await test.step('Verify updated date', async () => {
      const rows = page.locator('[data-testid="cash-flow-row"]');
      const dateInput = rows.first().getByLabel(/date/i);
      await expect(dateInput).toHaveValue('2024-02-01');
    });
  });

  test('Delete cash flow', async ({ page }) => {
    await test.step('Add multiple cash flows', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await addCashFlow(page, '2024-06-01', 500, 'Deposit');
      await addCashFlow(page, '2024-09-01', 300, 'Withdrawal');

      const count = await getCashFlowCount(page);
      expect(count).toBe(3);
    });

    await test.step('Delete the middle cash flow', async () => {
      await deleteCashFlow(page, 1);
    });

    await test.step('Verify count decreased', async () => {
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(2);
    });

    await test.step('Delete all remaining cash flows', async () => {
      await deleteCashFlow(page, 0);
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);
      await deleteCashFlow(page, 0);
    });

    await test.step('Verify empty state is shown', async () => {
      await expect(page.getByText(/add at least one deposit to start/i)).toBeVisible();
    });
  });

  test('Cash flows are added in entry order (calculations use sorted data)', async ({ page }) => {
    await test.step('Add cash flows in random order', async () => {
      await addCashFlow(page, '2024-06-01', 500, 'Deposit');
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await addCashFlow(page, '2024-09-01', 300, 'Withdrawal');
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(3);
    });

    await test.step('Verify they appear in entry order (not chronologically sorted in UI)', async () => {
      const rows = page.locator('[data-testid="cash-flow-row"]');

      // UI displays in entry order, not sorted
      // First row should be 2024-06-01 (first added)
      const firstDate = await rows.nth(0).getByLabel(/date/i).inputValue();
      expect(firstDate).toBe('2024-06-01');

      // Second row should be 2024-01-01 (second added)
      const secondDate = await rows.nth(1).getByLabel(/date/i).inputValue();
      expect(secondDate).toBe('2024-01-01');

      // Third row should be 2024-09-01 (third added)
      const thirdDate = await rows.nth(2).getByLabel(/date/i).inputValue();
      expect(thirdDate).toBe('2024-09-01');
    });

    await test.step('Verify calculations work correctly despite UI order', async () => {
      // Calculations internally use sorted data
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1500);

      // Net invested should be correct: 1000 + 500 - 300 = 1200
      const netInvestedSection = page.locator('text=Net Invested').locator('..');
      await expect(netInvestedSection).toContainText('1,200');
    });
  });

  test('Add cash flow button is always visible', async ({ page }) => {
    await test.step('Verify button visible on empty state', async () => {
      const addButton = page.getByRole('button', { name: /add/i }).first();
      await expect(addButton).toBeVisible();
    });

    await test.step('Add a cash flow', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
    });

    await test.step('Verify button still visible with data', async () => {
      const addButton = page.getByRole('button', { name: /add/i }).first();
      await expect(addButton).toBeVisible();
    });

    await test.step('Add multiple cash flows', async () => {
      await addCashFlow(page, '2024-02-01', 500, 'Deposit');
      await addCashFlow(page, '2024-03-01', 300, 'Deposit');
      await addCashFlow(page, '2024-04-01', 200, 'Deposit');
    });

    await test.step('Verify button still visible with many rows', async () => {
      const addButton = page.getByRole('button', { name: /add/i }).first();
      await expect(addButton).toBeVisible();
    });
  });

  test('Direction dropdown works correctly', async ({ page }) => {
    await test.step('Add deposit', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
    });

    await test.step('Verify deposit is selected', async () => {
      const rows = page.locator('[data-testid="cash-flow-row"]');
      const direction = rows.first().getByRole('combobox');
      await expect(direction).toContainText('Deposit');
    });

    await test.step('Change to withdrawal', async () => {
      await updateCashFlow(page, 0, { direction: 'Withdrawal' });
    });

    await test.step('Verify withdrawal is selected', async () => {
      const rows = page.locator('[data-testid="cash-flow-row"]');
      const direction = rows.first().getByRole('combobox');
      await expect(direction).toContainText('Withdrawal');
    });
  });
});

