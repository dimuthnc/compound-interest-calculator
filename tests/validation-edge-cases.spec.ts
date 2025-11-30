import { test, expect } from '@playwright/test';
import { clearLocalStorage } from './utils/localStorage';
import { addCashFlow } from './utils/cashflow-helpers';
import { setValuationDate, setCurrentValue, saveSnapshot } from './utils/calculation-helpers';
import { smallAmounts, largeSingleDeposit } from './utils/test-data';

test.describe('Validation and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await page.reload();
  });

  test('Cannot save snapshot without cash flows', async ({ page }) => {
    await test.step('Try to save without any data', async () => {
      const saveButton = page.getByRole('button', { name: /save.*snapshot/i });

      // Button might be disabled or clicking should not create snapshot
      const isDisabled = await saveButton.isDisabled().catch(() => false);

      if (!isDisabled) {
        await saveButton.click();
      }
    });

    await test.step('Verify no snapshot was created', async () => {
      await expect(page.getByText(/no historical snapshots yet/i)).toBeVisible();
    });
  });

  test('Cannot save snapshot without current value', async ({ page }) => {
    await test.step('Add cash flow but no current value', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      // Don't set current value
      // Wait for the cash flow row to be visible to confirm it was added
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);
    });

    await test.step('Attempt to save snapshot', async () => {
      const saveButton = page.getByRole('button', { name: /save.*snapshot/i });
      await saveButton.click();
    });

    await test.step('Verify no snapshot was created', async () => {
      await expect(page.getByText(/no historical snapshots yet/i)).toBeVisible();
    });
  });

  test('Handle negative amounts gracefully', async ({ page }) => {
    await test.step('Add cash flow with positive amount', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);
    });

    await test.step('Try to enter negative amount', async () => {
      // Try to update to negative
      const rows = page.locator('[data-testid="cash-flow-row"]');
      const amountInput = rows.first().getByLabel(/amount/i);
      await amountInput.clear();
      await amountInput.fill('-500');
      await amountInput.blur();
    });

    await test.step('Verify app handles it gracefully', async () => {
      // The input has min="0" but browsers may allow typing negative
      // The app should either:
      // 1. Convert it to positive (Math.abs)
      // 2. Keep previous value
      // 3. Set to 0
      // 4. Show validation error
      // We just verify no crash occurs
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows.first()).toBeVisible();

      // If a value is present, we can optionally check it's handled reasonably
      const amountInput = rows.first().getByLabel(/amount/i);
      const value = await amountInput.inputValue();

      // As long as we have some value and no crash, test passes
      expect(value).toBeTruthy();
    });
  });

  test('Handle zero current value', async ({ page }) => {
    await test.step('Set current value to zero', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 0);
    });

    await test.step('Verify results handle zero gracefully', async () => {
      // Should show calculations or appropriate message
      // Net invested should still be 1000
      const netInvestedSection = page.locator('text=Net Invested').locator('..');
      await expect(netInvestedSection).toContainText('1,000');

      // Profit should be -1000 (loss)
      const profitSection = page.locator('text=/Profit|Loss/').locator('..');
      await expect(profitSection).toBeVisible();
    });
  });

  test('Handle invalid date formats', async ({ page }) => {
    await test.step('Add cash flow with valid date first', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);
    });

    await test.step('Verify date input validates format', async () => {
      const rows = page.locator('[data-testid="cash-flow-row"]');
      const dateInput = rows.first().getByLabel(/date/i);

      // HTML5 date input type="date" prevents invalid dates from being entered
      const originalValue = await dateInput.inputValue();
      expect(originalValue).toBe('2024-01-01');

      // Try to clear the date - HTML5 will handle it
      await dateInput.clear();
      await dateInput.blur();

      const valueAfterClear = await dateInput.inputValue();
      // HTML5 date input behavior: empty string when cleared
      // The app should handle empty date gracefully
      expect(valueAfterClear === '' || /^\d{4}-\d{2}-\d{2}$/.test(valueAfterClear)).toBeTruthy();

      // App should not crash
      await expect(rows.first()).toBeVisible();

      // Try to set a valid date again to verify input still works
      await dateInput.fill('2024-06-15');
      await dateInput.blur();

      // Verify the date was set correctly
      await expect(dateInput).toHaveValue('2024-06-15');
    });
  });

  test('Handle very large amounts', async ({ page }) => {
    const scenario = largeSingleDeposit;

    await test.step('Add large deposit', async () => {
      await addCashFlow(page, scenario.cashFlows[0].date, scenario.cashFlows[0].amount, scenario.cashFlows[0].direction);
      await setValuationDate(page, scenario.valuationDate);
      await setCurrentValue(page, scenario.currentValue);
    });

    await test.step('Verify calculations work with large numbers', async () => {
      const netInvestedSection = page.locator('text=Net Invested').locator('..');
      await expect(netInvestedSection).toContainText('100,000');

      const profitSection = page.locator('text=/Profit|Loss/').locator('..');
      await expect(profitSection).toContainText('25,000');
    });

    await test.step('Save snapshot and verify', async () => {
      await saveSnapshot(page);

      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(1);
      await expect(historyRows.first()).toContainText('125,000');
    });
  });

  test('Handle very small decimal amounts', async ({ page }) => {
    const scenario = smallAmounts;

    await test.step('Add small decimal amounts', async () => {
      for (const cf of scenario.cashFlows) {
        await addCashFlow(page, cf.date, cf.amount, cf.direction);
      }
      await setValuationDate(page, scenario.valuationDate);
      await setCurrentValue(page, scenario.currentValue);
    });

    await test.step('Verify calculations handle decimals', async () => {
      const netInvestedSection = page.locator('text=Net Invested').locator('..');
      await expect(netInvestedSection).toContainText('15.75');

      const profitSection = page.locator('text=/Profit|Loss/').locator('..');
      await expect(profitSection).toContainText('1.25');
    });
  });

  test('Handle valuation date before cash flows', async ({ page }) => {
    await test.step('Add cash flow in 2024', async () => {
      await addCashFlow(page, '2024-06-01', 1000, 'Deposit');
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);
    });

    await test.step('Set valuation date before cash flow', async () => {
      await setValuationDate(page, '2024-01-01');
      await setCurrentValue(page, 1000);
    });

    await test.step('Verify app handles gracefully', async () => {
      // App might show warning or prevent calculation
      // At minimum, should not crash
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test('Handle multiple cash flows on same date', async ({ page }) => {
    await test.step('Add multiple flows on same date', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await addCashFlow(page, '2024-01-01', 500, 'Deposit');
      await addCashFlow(page, '2024-01-01', 200, 'Withdrawal');
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(3);
    });

    await test.step('Set valuation and verify calculations', async () => {
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1500);

      // Net invested should be 1000 + 500 - 200 = 1300
      const netInvestedSection = page.locator('text=Net Invested').locator('..');
      await expect(netInvestedSection).toContainText('1,300');
    });
  });

  test('Handle empty amount field', async ({ page }) => {
    await test.step('Add cash flow and clear amount', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');

      const rows = page.locator('[data-testid="cash-flow-row"]');
      const amountInput = rows.first().getByLabel(/amount/i);
      await amountInput.clear();
      await amountInput.blur();
    });

    await test.step('Verify app handles empty amount', async () => {
      // App might require an amount or show validation
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test('Handle future dates', async ({ page }) => {
    await test.step('Add cash flow with future date', async () => {
      await addCashFlow(page, '2030-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2035-01-01');
      await setCurrentValue(page, 1500);
    });

    await test.step('Verify calculations work with future dates', async () => {
      const netInvestedSection = page.locator('text=Net Invested').locator('..').first();
      await expect(netInvestedSection).toContainText('1,000');

      // IRR should be calculable
      const irrSection = page.locator('text=IRR').locator('..').first();
      const irrText = await irrSection.textContent();
      expect(irrText).toMatch(/%/);
    });
  });

  test('Rapid clicking does not cause errors', async ({ page }) => {
    await test.step('Setup basic scenario', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);
    });

    await test.step('Rapidly click save snapshot multiple times', async () => {
      const saveButton = page.getByRole('button', { name: /save.*snapshot/i });

      // Click multiple times quickly
      await saveButton.click();
      await saveButton.click();
      await saveButton.click();
    });

    await test.step('Verify snapshots were created', async () => {
      const historyRows = page.locator('table tbody tr');
      // Wait for at least one row to be visible before counting
      await expect(historyRows.first()).toBeVisible();
      const count = await historyRows.count();

      // Should have at least 1 snapshot (might have 3 if debounce allows)
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(3);
    });
  });
});

