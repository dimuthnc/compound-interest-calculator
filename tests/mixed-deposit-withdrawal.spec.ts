import { test, expect } from '@playwright/test';
import { clearLocalStorage } from './utils/localStorage';
import { addCashFlow } from './utils/cashflow-helpers';
import {
  setValuationDate,
  setCurrentValue,
  saveSnapshot,
  getNetInvested,
  getProfit,
  getIRR,
  getSimpleRate,
  parseCurrency,
  parsePercentage,
} from './utils/calculation-helpers';
import { mixedDepositWithdrawal } from './utils/test-data';

test.describe('Scenario 3 - Deposit and Withdrawal Pattern', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await page.reload();
  });

  test('Mixed deposits and withdrawals', async ({ page }) => {
    const scenario = mixedDepositWithdrawal;

    await test.step('Add multiple cash flows with deposits and withdrawals', async () => {
      for (const cf of scenario.cashFlows) {
        await addCashFlow(page, cf.date, cf.amount, cf.direction);
        await page.waitForTimeout(300); // Wait between additions
      }

      // Wait for UI to update
      await page.waitForTimeout(500);
    });

    await test.step('Set valuation date and current value', async () => {
      await setValuationDate(page, scenario.valuationDate);
      await setCurrentValue(page, scenario.currentValue);
      await page.waitForTimeout(500);
    });

    await test.step('Verify net invested and profit calculations', async () => {
      const netInvested = await getNetInvested(page);
      const profit = await getProfit(page);

      // Net invested should be 1200 (1000 + 500 - 300)
      const netInvestedValue = parseCurrency(netInvested);
      expect(netInvestedValue).toBeCloseTo(scenario.expected.netInvested, 0);

      // Profit should be 300 (1500 - 1200)
      const profitValue = parseCurrency(profit);
      expect(profitValue).toBeCloseTo(scenario.expected.profit, 0);
    });

    await test.step('Verify IRR and Simple Rate are both positive and reasonable', async () => {
      const irr = await getIRR(page);
      const simpleRate = await getSimpleRate(page);

      // Both should show percentage values (not N/A)
      expect(irr).toMatch(/%/);
      expect(simpleRate).toMatch(/%/);

      const irrValue = parsePercentage(irr);
      const simpleRateValue = parsePercentage(simpleRate);

      // Both should be positive
      expect(irrValue).toBeGreaterThan(0);
      expect(simpleRateValue).toBeGreaterThan(0);

      // They should be in the same ballpark (not wildly different orders of magnitude)
      // For this scenario, both should be reasonable positive returns
      expect(irrValue).toBeGreaterThan(5); // At least 5%
      expect(irrValue).toBeLessThan(50); // Less than 50%
      expect(simpleRateValue).toBeGreaterThan(5);
      expect(simpleRateValue).toBeLessThan(50);

      // The difference between them should not be extreme
      const difference = Math.abs(irrValue - simpleRateValue);
      expect(difference).toBeLessThan(20); // Within 20 percentage points
    });

    await test.step('Save snapshot and verify history row', async () => {
      await saveSnapshot(page);
      await page.waitForTimeout(500);

      // History should have one row
      const historyRows = page.locator('table tbody tr').filter({ hasText: scenario.valuationDate });
      await expect(historyRows).toHaveCount(1);

      const row = historyRows.first();
      await expect(row).toContainText(scenario.valuationDate);
      await expect(row).toContainText('1,500'); // Formatted with comma

      // Should show the profit value
      await expect(row).toContainText('300');
    });
  });

  test('Verify calculations update dynamically', async ({ page }) => {
    const scenario = mixedDepositWithdrawal;

    await test.step('Add initial cash flows', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
      await page.waitForTimeout(500);
    });

    await test.step('Get initial profit value', async () => {
      const initialProfit = await getProfit(page);
      const initialProfitValue = parseCurrency(initialProfit);
      expect(initialProfitValue).toBeCloseTo(100, 0); // 1100 - 1000
    });

    await test.step('Add a withdrawal and verify profit updates', async () => {
      await addCashFlow(page, '2024-06-01', 200, 'Withdrawal');
      await page.waitForTimeout(500);

      const updatedProfit = await getProfit(page);
      const updatedProfitValue = parseCurrency(updatedProfit);

      // Profit should increase because net invested decreased
      // Net invested: 1000 - 200 = 800
      // Profit: 1100 - 800 = 300
      expect(updatedProfitValue).toBeCloseTo(300, 0);
    });
  });
});

