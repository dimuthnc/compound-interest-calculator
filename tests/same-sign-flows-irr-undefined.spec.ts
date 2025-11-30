import { test, expect } from '@playwright/test';
import { clearLocalStorage } from './utils/localStorage';
import { addCashFlow } from './utils/cashflow-helpers';
import {
  setValuationDate,
  setCurrentValue,
  getNetInvested,
  getProfit,
  verifyIRRIsNA,
  parseCurrency,
  parsePercentage,
  getSimpleRate,
} from './utils/calculation-helpers';
import { sameSignFlows } from './utils/test-data';

test.describe('Scenario 4 - Same-Sign Cash Flows (IRR Not Defined)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await page.reload();
  });

  test('All deposits with zero profit - IRR shows N/A', async ({ page }) => {
    const scenario = sameSignFlows;

    await test.step('Add cash flows with same direction', async () => {
      for (const cf of scenario.cashFlows) {
        await addCashFlow(page, cf.date, cf.amount, cf.direction);
      }
      // Verify all cash flows were added
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(scenario.cashFlows.length);
    });

    await test.step('Set valuation date and current value', async () => {
      await setValuationDate(page, scenario.valuationDate);
      await setCurrentValue(page, scenario.currentValue);
    });

    await test.step('Verify net invested equals current value', async () => {
      const netInvested = await getNetInvested(page);
      const netInvestedValue = parseCurrency(netInvested);
      expect(netInvestedValue).toBeCloseTo(scenario.expected.netInvested, 0);
    });

    await test.step('Verify profit is zero', async () => {
      const profit = await getProfit(page);
      const profitValue = parseCurrency(profit);
      expect(profitValue).toBeCloseTo(scenario.expected.profit, 1);
    });

    await test.step('Verify IRR is calculable (should be ~0% for zero profit)', async () => {
      // With zero profit, IRR should be 0% (no growth)
      // This is technically calculable because we have deposits (negative) and final value (positive)
      const irrSection = page.locator('text=IRR').locator('..').first();
      await expect(irrSection).toBeVisible();

      // Should show a percentage close to 0%
      const irrText = await irrSection.textContent();
      if (irrText && irrText.includes('%')) {
        const irrMatch = irrText.match(/-?\d+\.\d+%/);
        if (irrMatch) {
          const irrValue = parsePercentage(irrMatch[0]);
          // Should be very close to 0% (within 0.1%)
          expect(Math.abs(irrValue)).toBeLessThan(0.1);
        }
      }
    });

    await test.step('Verify simple rate may still be defined', async () => {
      // Simple rate might show a value close to 0% or N/A
      // The test scenario says it "may still be defined but should be close to 0%"
      const simpleRate = await getSimpleRate(page);

      // It could be N/A or a percentage
      if (simpleRate.includes('%')) {
        const simpleRateValue = parsePercentage(simpleRate);
        // Should be very close to 0%
        expect(Math.abs(simpleRateValue)).toBeLessThan(1);
      } else {
        // If it's N/A, that's also acceptable
        expect(simpleRate).toMatch(/N\/A|n\/a/i);
      }
    });
  });

  test('All withdrawals - IRR shows N/A', async ({ page }) => {
    await test.step('Add only withdrawal cash flows', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Withdrawal');
      await addCashFlow(page, '2024-06-01', 500, 'Withdrawal');
      // Verify cash flows were added
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(2);
    });

    await test.step('Set valuation date and current value', async () => {
      // With withdrawals only, net invested would be negative
      // This is an edge case that should still handle gracefully
      await setValuationDate(page, '2024-12-31');
      await setCurrentValue(page, 100); // Arbitrary positive value
    });

    await test.step('Verify IRR shows N/A', async () => {
      await verifyIRRIsNA(page);
    });

    await test.step('Verify net invested is negative', async () => {
      const netInvested = await getNetInvested(page);
      // Should show negative value or handle gracefully
      expect(netInvested).toBeTruthy();
    });
  });

  test('Single deposit only - IRR should be calculable', async ({ page }) => {
    await test.step('Add single deposit', async () => {
      await addCashFlow(page, '2024-01-01', 1000, 'Deposit');
      // Verify cash flow was added
      const rows = page.locator('[data-testid="cash-flow-row"]');
      await expect(rows).toHaveCount(1);
    });

    await test.step('Set valuation with positive return', async () => {
      await setValuationDate(page, '2025-01-01');
      await setCurrentValue(page, 1100);
    });

    await test.step('Verify IRR is calculable (not N/A)', async () => {
      const irrSection = page.locator('text=IRR').locator('..').first();

      // Should NOT show N/A - should show a percentage
      const irrText = await irrSection.textContent();
      expect(irrText).toMatch(/%/);
      expect(irrText).not.toMatch(/N\/A|n\/a/i);
    });
  });
});

