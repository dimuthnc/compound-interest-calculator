import { test, expect } from '@playwright/test';
import { clearLocalStorage } from './utils/localStorage';
import { verifyEmptyCashFlowState } from './utils/cashflow-helpers';
import { verifyIRRIsNA, verifySimpleRateIsNA } from './utils/calculation-helpers';

test.describe('First-time User - Empty State', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to simulate first-time user
    await page.goto('/');
    await clearLocalStorage(page);
    await page.reload();
  });

  test('First-time user - no data', async ({ page }) => {
    await test.step('Verify Cash Flows section shows empty state', async () => {
      // Check for the helper text
      const helperText = await verifyEmptyCashFlowState(page);
      await expect(helperText).toBeVisible();

      // Verify the Add button is present
      const addButton = page.getByRole('button', { name: /add/i }).first();
      await expect(addButton).toBeVisible();
    });

    await test.step('Verify Current Value & Valuation Date section shows empty inputs', async () => {
      // Valuation date input should be present but may be empty or have a default
      const valuationDateInput = page.getByLabel(/valuation date/i);
      await expect(valuationDateInput).toBeVisible();

      // Current fund value should be empty
      const currentValueInput = page.getByLabel(/current.*value|current fund value/i);
      await expect(currentValueInput).toBeVisible();
      const currentValueValue = await currentValueInput.inputValue();
      expect(currentValueValue).toBe('');
    });

    await test.step('Verify Results section shows zeros and N/A', async () => {
      // Net invested should be 0
      const netInvestedSection = page.locator('text=Net Invested').locator('..');
      await expect(netInvestedSection).toContainText('0.00');

      // Profit should be 0
      const profitSection = page.locator('text=/Profit|Loss/').locator('..');
      await expect(profitSection).toContainText('0.00');

      // IRR should be N/A
      await verifyIRRIsNA(page);

      // Simple Rate should be N/A
      await verifySimpleRateIsNA(page);
    });

    await test.step('Verify History section shows empty state', async () => {
      // History table should show empty state message
      await expect(page.getByText(/no historical snapshots yet/i)).toBeVisible();
    });

    await test.step('Verify Calculate & Save button exists', async () => {
      const saveButton = page.getByRole('button', { name: /save.*snapshot/i });
      await expect(saveButton).toBeVisible();
    });
  });

  test('Empty state prevents snapshot creation without data', async ({ page }) => {
    await test.step('Attempt to save snapshot without data', async () => {
      const saveButton = page.getByRole('button', { name: /save.*snapshot/i });

      // Button should be disabled or clicking should not create a snapshot
      const historyBefore = page.locator('text=/no historical snapshots yet/i');
      await expect(historyBefore).toBeVisible();

      // Even if we click, it should not create a snapshot
      await saveButton.click({ force: true });

      // History should still show empty state
      await expect(historyBefore).toBeVisible();
    });
  });
});

