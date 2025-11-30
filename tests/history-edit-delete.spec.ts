import { test, expect } from '@playwright/test';
import { clearLocalStorage } from './utils/localStorage';
import { addCashFlow } from './utils/cashflow-helpers';
import { setValuationDate, setCurrentValue, saveSnapshot } from './utils/calculation-helpers';

test.describe('History Snapshot Edit and Delete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await page.reload();
  });

  test('Edit historical snapshot valuation date and current value', async ({ page }) => {
    await test.step('Create initial snapshot', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
      await page.waitForTimeout(500);
      await saveSnapshot(page);
      await page.waitForTimeout(500);
    });

    await test.step('Verify snapshot exists', async () => {
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(1);
      await expect(historyRows.first()).toContainText('2025-01-01');
      await expect(historyRows.first()).toContainText('1,100');
    });

    await test.step('Click edit button on snapshot', async () => {
      const editButton = page.locator('table tbody tr').first().getByRole('button', { name: /edit/i });
      await editButton.click();
      await page.waitForTimeout(300);
    });

    await test.step('Update valuation date in edit mode', async () => {
      // In edit mode, there should be editable inputs
      const dateInput = page.locator('table tbody tr').first().locator('input[type="date"]');
      await dateInput.fill('2025-06-01');
    });

    await test.step('Update current value in edit mode', async () => {
      const valueInput = page.locator('table tbody tr').first().locator('input[type="number"]');
      await valueInput.clear();
      await valueInput.fill('1150');
    });

    await test.step('Save the edit', async () => {
      const saveButton = page.locator('table tbody tr').first().getByRole('button', { name: /save|check/i });
      await saveButton.click();
      await page.waitForTimeout(500);
    });

    await test.step('Verify snapshot is updated with recalculated values', async () => {
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(1);
      await expect(historyRows.first()).toContainText('2025-06-01');
      await expect(historyRows.first()).toContainText('1,150');

      // IRR and simple rate should be recalculated
      // We can't predict exact values but should contain percentage
      const rowText = await historyRows.first().textContent();
      expect(rowText).toMatch(/%/);
    });
  });

  test('Cancel edit restores original values', async ({ page }) => {
    await test.step('Create snapshot', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
      await page.waitForTimeout(500);
      await saveSnapshot(page);
      await page.waitForTimeout(500);
    });

    await test.step('Enter edit mode', async () => {
      const editButton = page.locator('table tbody tr').first().getByRole('button', { name: /edit/i });
      await editButton.click();
      await page.waitForTimeout(300);
    });

    await test.step('Change values', async () => {
      const valueInput = page.locator('table tbody tr').first().locator('input[type="number"]');
      await valueInput.clear();
      await valueInput.fill('9999');
    });

    await test.step('Cancel the edit', async () => {
      const cancelButton = page.locator('table tbody tr').first().getByRole('button', { name: /cancel|x/i });
      await cancelButton.click();
      await page.waitForTimeout(300);
    });

    await test.step('Verify original values are restored', async () => {
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows.first()).toContainText('1,100');
      await expect(historyRows.first()).not.toContainText('9,999');
    });
  });

  test('Delete historical snapshot', async ({ page }) => {
    await test.step('Create multiple snapshots', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');

      // First snapshot
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
      await page.waitForTimeout(500);
      await saveSnapshot(page);
      await page.waitForTimeout(500);

      // Second snapshot
      await setValuationDate(page, '2025-06-01');
      await setCurrentValue(page, 1150);
      await page.waitForTimeout(500);
      await saveSnapshot(page);
      await page.waitForTimeout(500);

      // Third snapshot
      await setValuationDate(page, '2025-12-01');
      await setCurrentValue(page, 1200);
      await page.waitForTimeout(500);
      await saveSnapshot(page);
      await page.waitForTimeout(500);
    });

    await test.step('Verify 3 snapshots exist', async () => {
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(3);
    });

    await test.step('Click delete button on second snapshot', async () => {
      const deleteButton = page.locator('table tbody tr').nth(1).getByRole('button', { name: /delete|trash/i });
      await deleteButton.click();
      await page.waitForTimeout(300);
    });

    await test.step('Confirm deletion in modal', async () => {
      // Modal should appear with confirmation
      await expect(page.getByText(/confirm delete/i)).toBeVisible();
      await expect(page.getByText(/are you sure/i)).toBeVisible();

      // Click the Delete button in the modal (not Cancel)
      const confirmButton = page.getByRole('button', { name: /^delete$/i }).last();
      await confirmButton.click();
      await page.waitForTimeout(500);
    });

    await test.step('Verify snapshot count decreased to 2', async () => {
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(2);
    });

    await test.step('Verify the correct snapshot was deleted', async () => {
      const historyRows = page.locator('table tbody tr');

      // First row should still be 2025-01-01
      await expect(historyRows.nth(0)).toContainText('2025-01-01');

      // Second row should now be 2025-12-01 (the middle one was deleted)
      await expect(historyRows.nth(1)).toContainText('2025-12-01');

      // Should not contain 2025-06-01 anymore
      const allText = await page.locator('table tbody').textContent();
      expect(allText).not.toContain('2025-06-01');
    });
  });

  test('Delete all snapshots returns to empty state', async ({ page }) => {
    await test.step('Create one snapshot', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
      await page.waitForTimeout(500);
      await saveSnapshot(page);
      await page.waitForTimeout(500);
    });

    await test.step('Delete the snapshot', async () => {
      const deleteButton = page.locator('table tbody tr').first().getByRole('button', { name: /delete|trash/i });
      await deleteButton.click();
      await page.waitForTimeout(300);

      // Confirm in modal
      await expect(page.getByText(/confirm delete/i)).toBeVisible();
      const confirmButton = page.getByRole('button', { name: /^delete$/i }).last();
      await confirmButton.click();
      await page.waitForTimeout(500);
    });

    await test.step('Verify empty state is shown', async () => {
      await expect(page.getByText(/no historical snapshots yet/i)).toBeVisible();
    });

    await test.step('Verify chart is hidden or shows placeholder', async () => {
      // Chart should not be visible or show placeholder text
      const canvas = page.locator('canvas');
      const canvasCount = await canvas.count();

      if (canvasCount > 0) {
        // If canvas exists, check for placeholder text
        await expect(page.getByText(/add more snapshots/i)).toBeVisible();
      }
    });
  });

  test('Edit with invalid value shows validation error', async ({ page }) => {
    await test.step('Create snapshot', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
      await page.waitForTimeout(500);
      await saveSnapshot(page);
      await page.waitForTimeout(500);
    });

    await test.step('Enter edit mode', async () => {
      const editButton = page.locator('table tbody tr').first().getByRole('button', { name: /edit/i });
      await editButton.click();
      await page.waitForTimeout(300);
    });

    await test.step('Enter invalid current value (negative)', async () => {
      const valueInput = page.locator('table tbody tr').first().locator('input[type="number"]');
      await valueInput.clear();
      await valueInput.fill('-100');
    });

    await test.step('Attempt to save', async () => {
      const saveButton = page.locator('table tbody tr').first().getByRole('button', { name: /save|check/i });
      await saveButton.click();
      await page.waitForTimeout(300);
    });

    await test.step('Verify error message or value is not saved', async () => {
      // Either an alert appears or the edit mode stays active
      // Check if we're still in edit mode or if an error is shown
      const hasAlert = await page.locator('text=/error|invalid|positive/i').isVisible().catch(() => false);
      const hasEditInput = await page.locator('table tbody tr').first().locator('input[type="number"]').isVisible().catch(() => false);

      expect(hasAlert || hasEditInput).toBeTruthy();
    });
  });
});

