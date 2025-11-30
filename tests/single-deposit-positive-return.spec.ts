import { test, expect } from '@playwright/test';
import { clearLocalStorage } from './utils/localStorage';
import { addCashFlow, getCashFlowCount } from './utils/cashflow-helpers';
import {
  setValuationDate,
  setCurrentValue,
  saveSnapshot,
  getNetInvested,
  getProfit,
  getIRR,
  getSimpleRate,
  assertPercentageInRange,
  assertCurrencyEquals,
} from './utils/calculation-helpers';
import { singleDepositPositiveReturn } from './utils/test-data';

test.describe('Scenario 2 - Single Deposit and Current Value', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await page.reload();
  });

  test('Single deposit with positive return (~10%)', async ({ page }) => {
    const scenario = singleDepositPositiveReturn;

    await test.step('Add one cash flow', async () => {
      await addCashFlow(
        page,
        scenario.cashFlows[0].date,
        scenario.cashFlows[0].amount,
        scenario.cashFlows[0].direction
      );

      // Verify cash flow was added
      const count = await getCashFlowCount(page);
      expect(count).toBe(1);
    });

    await test.step('Set valuation date and current value', async () => {
      await setValuationDate(page, scenario.valuationDate);
      await setCurrentValue(page, scenario.currentValue);
    });

    await test.step('Verify Results panel shows correct calculations', async () => {
      // Get displayed values
      const netInvested = await getNetInvested(page);
      const profit = await getProfit(page);
      const irr = await getIRR(page);
      const simpleRate = await getSimpleRate(page);

      // Verify net invested
      assertCurrencyEquals(netInvested, scenario.expected.netInvested);

      // Verify profit
      assertCurrencyEquals(profit, scenario.expected.profit);

      // Verify IRR is around 10%
      assertPercentageInRange(
        irr,
        scenario.expected.irrMin,
        scenario.expected.irrMax,
        'IRR should be between 9.5% and 10.5%'
      );

      // Verify Simple Rate is around 10%
      assertPercentageInRange(
        simpleRate,
        scenario.expected.simpleRateMin,
        scenario.expected.simpleRateMax,
        'Simple Rate should be between 9.5% and 10.5%'
      );
    });

    await test.step('Click Calculate & save snapshot', async () => {
      await saveSnapshot(page);

      // Verify snapshot was saved
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(1);
    });

    await test.step('Verify History table has one row', async () => {
      // History should no longer show empty state
      await expect(page.getByText(/no historical snapshots yet/i)).not.toBeVisible();

      // Should have one snapshot row in the history table
      const historyRows = page.locator('table tbody tr').filter({ hasText: scenario.valuationDate });
      await expect(historyRows).toHaveCount(1);

      // Verify the row contains expected data
      const row = historyRows.first();
      await expect(row).toContainText(scenario.valuationDate);
      await expect(row).toContainText('1,100'); // Formatted with comma
    });
  });

  test('Add second snapshot to enable chart', async ({ page }) => {
    const scenario = singleDepositPositiveReturn;

    await test.step('Add cash flow and first snapshot', async () => {
      await addCashFlow(
        page,
        scenario.cashFlows[0].date,
        scenario.cashFlows[0].amount,
        scenario.cashFlows[0].direction
      );
      await setValuationDate(page, scenario.valuationDate);
      await setCurrentValue(page, scenario.currentValue);
      await saveSnapshot(page);
      // Verify first snapshot was saved
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(1);
    });

    await test.step('Update valuation and add second snapshot', async () => {
      // Change valuation date and value for second snapshot
      await setValuationDate(page, '2025-06-01');
      await setCurrentValue(page, 1150);
      await saveSnapshot(page);
      // Verify second snapshot was saved
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(2);
    });

    await test.step('Verify chart is now visible', async () => {
      // With 2+ snapshots, the chart should render
      const historyRows = page.locator('table tbody tr');
      await expect(historyRows).toHaveCount(2);

      // Check that canvas element exists (Chart.js renders to canvas)
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();
    });
  });
});

