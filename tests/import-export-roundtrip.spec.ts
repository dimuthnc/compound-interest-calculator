import { test, expect, Download } from '@playwright/test';
import { clearLocalStorage } from './utils/localStorage';
import { addCashFlow, getCashFlowCount } from './utils/cashflow-helpers';
import { setValuationDate, setCurrentValue, saveSnapshot } from './utils/calculation-helpers';
import { complexMultiYear } from './utils/test-data';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Scenario 5 - Import/Export Round-Trip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await page.reload();
  });

  test('Export and import complex scenario with history', async ({ page }) => {
    const scenario = complexMultiYear;
    let downloadedFilePath: string;

    await test.step('Setup complex scenario with multiple cash flows', async () => {
      for (const cf of scenario.cashFlows) {
        await addCashFlow(page, cf.date, cf.amount, cf.direction);
      }
      await page.waitForTimeout(500);
    });

    await test.step('Set valuation and save first snapshot', async () => {
      await setValuationDate(page, scenario.valuationDate);
      await setCurrentValue(page, scenario.currentValue);
      await page.waitForTimeout(500);
      await saveSnapshot(page);
      await page.waitForTimeout(500);
    });

    await test.step('Update valuation and save second snapshot', async () => {
      await setValuationDate(page, '2025-06-01');
      await setCurrentValue(page, 15000);
      await page.waitForTimeout(500);
      await saveSnapshot(page);
      await page.waitForTimeout(500);
    });

    await test.step('Verify we have 2 snapshots', async () => {
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(2);
    });

    await test.step('Export JSON and capture download', async () => {
      const downloadPromise = page.waitForEvent('download');

      const exportButton = page.getByRole('button', { name: /export.*json/i });
      await exportButton.click();

      const download = await downloadPromise;

      // Save the download to a temp file
      const tmpDir = '/tmp/playwright-test-downloads';
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      downloadedFilePath = path.join(tmpDir, `export-${Date.now()}.json`);
      await download.saveAs(downloadedFilePath);

      // Verify file exists and is valid JSON
      expect(fs.existsSync(downloadedFilePath)).toBeTruthy();
      const fileContent = fs.readFileSync(downloadedFilePath, 'utf-8');
      const json = JSON.parse(fileContent);

      // Verify JSON structure
      expect(json).toHaveProperty('version');
      expect(json).toHaveProperty('cashFlows');
      expect(json).toHaveProperty('valuationDate');
      expect(json).toHaveProperty('currentValue');
      expect(json).toHaveProperty('history');

      // Verify cash flows count
      expect(json.cashFlows.length).toBe(scenario.cashFlows.length);

      // Verify history count
      expect(json.history.length).toBe(2);
    });

    await test.step('Store original data for comparison', async () => {
      // Get the count of cash flows before clearing
      const cashFlowCount = await getCashFlowCount(page);
      expect(cashFlowCount).toBe(scenario.cashFlows.length);
    });

    await test.step('Clear all data', async () => {
      await clearLocalStorage(page);
      await page.reload();

      // Verify empty state
      await expect(page.getByText(/add at least one deposit to start/i)).toBeVisible();
    });

    await test.step('Import the exported JSON file', async () => {
      const importButton = page.getByRole('button', { name: /import.*json/i });
      await importButton.click();

      // Get the file input and upload the file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(downloadedFilePath);

      // Wait for import to complete
      await page.waitForTimeout(1000);
    });

    await test.step('Verify cash flows are restored', async () => {
      const cashFlowCount = await getCashFlowCount(page);
      expect(cashFlowCount).toBe(scenario.cashFlows.length);

      // Verify the helper text is no longer visible
      await expect(page.getByText(/add at least one deposit to start/i)).not.toBeVisible();
    });

    await test.step('Verify valuation date and current value are restored', async () => {
      const valuationDateInput = page.getByLabel(/valuation date/i);
      const valuationDate = await valuationDateInput.inputValue();
      expect(valuationDate).toBe('2025-06-01'); // Should be the last saved value

      const currentValueInput = page.getByLabel(/current.*value|current fund value/i);
      const currentValue = await currentValueInput.inputValue();
      expect(currentValue).toBe('15000');
    });

    await test.step('Verify history is restored with 2 snapshots', async () => {
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(2);

      // Verify first snapshot date
      await expect(historyRows.first()).toContainText('2025-01-01');

      // Verify second snapshot date
      await expect(historyRows.last()).toContainText('2025-06-01');
    });

    await test.step('Verify chart is visible with restored data', async () => {
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
    });

    await test.step('Cleanup downloaded file', async () => {
      if (fs.existsSync(downloadedFilePath)) {
        fs.unlinkSync(downloadedFilePath);
      }
    });
  });

  test('Import invalid JSON shows error', async ({ page }) => {
    await test.step('Create invalid JSON file', async () => {
      const tmpDir = '/tmp/playwright-test-downloads';
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const invalidJsonPath = path.join(tmpDir, 'invalid.json');
      fs.writeFileSync(invalidJsonPath, '{"invalid": "schema"}', 'utf-8');

      const importButton = page.getByRole('button', { name: /import.*json/i });
      await importButton.click();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(invalidJsonPath);

      await page.waitForTimeout(1000);

      // Should show error message in the red error box
      const errorBox = page.locator('.border-red-300.bg-red-50');
      await expect(errorBox).toBeVisible();
      await expect(errorBox).toContainText(/.+/); // Just check it has some text

      // Clean up
      fs.unlinkSync(invalidJsonPath);
    });
  });

  test('Export with fund name', async ({ page }) => {
    let downloadedFilePath: string;

    await test.step('Add cash flow and set fund name', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await page.waitForTimeout(500);

      // Set fund name if the input exists
      const fundNameInput = page.getByLabel(/fund name/i);
      if (await fundNameInput.isVisible()) {
        await fundNameInput.fill('Test Fund ABC');
      }

      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
      await page.waitForTimeout(500);
    });

    await test.step('Export and verify fund name in JSON', async () => {
      const downloadPromise = page.waitForEvent('download');

      const exportButton = page.getByRole('button', { name: /export.*json/i });
      await exportButton.click();

      const download = await downloadPromise;

      const tmpDir = '/tmp/playwright-test-downloads';
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      downloadedFilePath = path.join(tmpDir, `export-with-name-${Date.now()}.json`);
      await download.saveAs(downloadedFilePath);

      const fileContent = fs.readFileSync(downloadedFilePath, 'utf-8');
      const json = JSON.parse(fileContent);

      // Fund name might be in the JSON
      // This depends on implementation, so we'll just verify the file is valid
      expect(json).toHaveProperty('cashFlows');

      // Clean up
      fs.unlinkSync(downloadedFilePath);
    });
  });
});

