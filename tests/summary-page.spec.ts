import { test, expect } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test.describe('Summary Page - Multi-Fund Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/summary');
  });

  test.describe('Navigation', () => {
    test('can navigate to summary page from main calculator', async ({ page }) => {
      // Start from main page
      await page.goto('/');

      // Click on Summary link in header
      await page.click('a[href="/summary"]');

      // Verify we're on summary page
      await expect(page.locator('h1')).toContainText('Fund Summary');
    });

    test('can navigate back to calculator from summary page', async ({ page }) => {
      // Click back to calculator button
      await page.click('text=Back to Calculator');

      // Verify we're on main page
      await expect(page.locator('text=Effective Interest Rate Calculator')).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test('shows empty state message when no funds imported', async ({ page }) => {
      await expect(page.locator('text=No funds imported yet')).toBeVisible();
      await expect(page.locator('text=Import Your First Fund')).toBeVisible();
    });

    test('shows placeholder message in charts when no funds', async ({ page }) => {
      const chartPlaceholders = page.locator('text=Import fund files to see comparison charts');
      await expect(chartPlaceholders).toHaveCount(2);
    });
  });

  test.describe('Single Fund Import', () => {
    test('can import a single fund file', async ({ page }) => {
      const filePath = path.join(FIXTURES_DIR, 'alpha-growth-fund.json');

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);

      // Verify success message
      await expect(page.locator('text=Successfully imported 1 fund')).toBeVisible();

      // Verify fund appears in list
      await expect(page.locator('text=Alpha Growth Fund')).toBeVisible();

      // Verify snapshot count
      await expect(page.locator('text=(6 snapshots)')).toBeVisible();
    });

    test('displays charts after importing fund with multiple snapshots', async ({ page }) => {
      const filePath = path.join(FIXTURES_DIR, 'alpha-growth-fund.json');

      await page.locator('input[type="file"]').setInputFiles(filePath);
      await page.waitForTimeout(500);

      // Verify IRR chart is visible
      await expect(page.locator('text=IRR Comparison')).toBeVisible();

      // Verify Simple Rate chart is visible
      await expect(page.locator('text=Simple Rate Comparison')).toBeVisible();

      // Verify chart canvas elements exist
      const canvasElements = page.locator('canvas');
      await expect(canvasElements).toHaveCount(2);
    });
  });

  test.describe('Multiple Funds Import', () => {
    test('can import multiple fund files at once', async ({ page }) => {
      const files = [
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json'),
        path.join(FIXTURES_DIR, 'beta-conservative-fund.json'),
      ];

      await page.locator('input[type="file"]').setInputFiles(files);

      // Verify success message
      await expect(page.locator('text=Successfully imported 2 fund')).toBeVisible();

      // Verify both funds appear in list
      await expect(page.locator('text=Alpha Growth Fund')).toBeVisible();
      await expect(page.locator('text=Beta Conservative Fund')).toBeVisible();

      // Verify imported funds count
      await expect(page.locator('text=Imported Funds (2)')).toBeVisible();
    });

    test('can import funds sequentially', async ({ page }) => {
      // Import first fund
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json')
      );
      await expect(page.locator('text=Alpha Growth Fund')).toBeVisible();

      // Import second fund
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'beta-conservative-fund.json')
      );
      await expect(page.locator('text=Beta Conservative Fund')).toBeVisible();

      // Verify both are present
      await expect(page.locator('text=Imported Funds (2)')).toBeVisible();
    });

    test('can import three or more funds', async ({ page }) => {
      const files = [
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json'),
        path.join(FIXTURES_DIR, 'beta-conservative-fund.json'),
        path.join(FIXTURES_DIR, 'gamma-balanced-fund.json'),
      ];

      await page.locator('input[type="file"]').setInputFiles(files);

      // Verify all funds appear
      await expect(page.locator('text=Alpha Growth Fund')).toBeVisible();
      await expect(page.locator('text=Beta Conservative Fund')).toBeVisible();
      await expect(page.locator('text=Gamma Balanced Fund')).toBeVisible();

      // Verify count
      await expect(page.locator('text=Imported Funds (3)')).toBeVisible();
    });
  });

  test.describe('Duplicate Fund Handling', () => {
    test('replaces existing fund when importing duplicate name', async ({ page }) => {
      // Import first fund
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json')
      );
      await expect(page.locator('text=Alpha Growth Fund')).toBeVisible();
      await expect(page.locator('text=(6 snapshots)')).toBeVisible();

      // Import same fund again (would have same name)
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json')
      );

      // Verify replaced message
      await expect(page.locator('text=Replaced existing')).toBeVisible();

      // Verify still only one fund
      await expect(page.locator('text=Imported Funds (1)')).toBeVisible();
    });
  });

  test.describe('Remove Fund', () => {
    test('can remove a single fund', async ({ page }) => {
      // Import two funds
      const files = [
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json'),
        path.join(FIXTURES_DIR, 'beta-conservative-fund.json'),
      ];
      await page.locator('input[type="file"]').setInputFiles(files);

      // Find the fund item containing "Alpha Growth Fund" and click its remove button
      // Use a more specific selector that targets the fund card directly
      const alphaFundItem = page.locator('div.flex.items-center.gap-2').filter({ hasText: 'Alpha Growth Fund' });
      await alphaFundItem.locator('button[title="Remove fund"]').click();

      // Verify Alpha is removed
      await expect(page.locator('text=Alpha Growth Fund')).not.toBeVisible();

      // Verify Beta still exists
      await expect(page.locator('text=Beta Conservative Fund')).toBeVisible();
      await expect(page.locator('text=Imported Funds (1)')).toBeVisible();
    });

    test('shows empty state after removing all funds', async ({ page }) => {
      // Import one fund
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json')
      );
      await expect(page.locator('text=Alpha Growth Fund')).toBeVisible();

      // Remove it using more specific selector
      const fundItem = page.locator('div.flex.items-center.gap-2').filter({ hasText: 'Alpha Growth Fund' });
      await fundItem.locator('button[title="Remove fund"]').click();

      // Verify empty state
      await expect(page.locator('text=No funds imported yet')).toBeVisible();
    });
  });

  test.describe('Clear All Funds', () => {
    test('can clear all funds at once', async ({ page }) => {
      // Import multiple funds
      const files = [
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json'),
        path.join(FIXTURES_DIR, 'beta-conservative-fund.json'),
        path.join(FIXTURES_DIR, 'gamma-balanced-fund.json'),
      ];
      await page.locator('input[type="file"]').setInputFiles(files);
      await expect(page.locator('text=Imported Funds (3)')).toBeVisible();

      // Click Clear All button
      await page.click('text=Clear All Funds');

      // Verify all funds removed
      await expect(page.locator('text=No funds imported yet')).toBeVisible();
      await expect(page.locator('text=Alpha Growth Fund')).not.toBeVisible();
      await expect(page.locator('text=Beta Conservative Fund')).not.toBeVisible();
      await expect(page.locator('text=Gamma Balanced Fund')).not.toBeVisible();
    });
  });

  test.describe('Validation Errors', () => {
    test('shows error for file with empty history', async ({ page }) => {
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'invalid-empty-history.json')
      );

      // Verify error message
      await expect(page.locator('text=cannot be empty')).toBeVisible();

      // Verify no funds were imported
      await expect(page.locator('text=No funds imported yet')).toBeVisible();
    });

    test('shows error for file without fund name', async ({ page }) => {
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'invalid-no-fund-name.json')
      );

      // Verify error message
      await expect(page.locator('text=Fund name is required')).toBeVisible();

      // Verify no funds were imported
      await expect(page.locator('text=No funds imported yet')).toBeVisible();
    });

    test('imports valid files and shows errors for invalid ones in same batch', async ({ page }) => {
      const files = [
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json'),
        path.join(FIXTURES_DIR, 'invalid-no-fund-name.json'),
      ];

      await page.locator('input[type="file"]').setInputFiles(files);

      // Verify success for valid file
      await expect(page.locator('text=Alpha Growth Fund')).toBeVisible();

      // Verify error for invalid file
      await expect(page.locator('text=Fund name is required')).toBeVisible();
    });
  });

  test.describe('Dynamic Calculation Indicator', () => {
    test('shows indicator when metrics are dynamically calculated', async ({ page }) => {
      // The alpha-growth-fund.json has first snapshot without netInvested, irr, simpleRate
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json')
      );

      // Look for the dynamic calculation indicator (⚡) - use more specific selector
      // The indicator appears next to fund name in the fund card
      const fundCardWithIndicator = page.locator('div.flex.items-center.gap-2').filter({ hasText: '⚡' });
      await expect(fundCardWithIndicator).toBeVisible();

      // Verify explanatory text at bottom of card
      await expect(page.locator('p.text-amber-600')).toBeVisible();
    });
  });

  test.describe('Chart Rendering', () => {
    test('charts update when funds are added', async ({ page }) => {
      // Import first fund
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json')
      );
      await page.waitForTimeout(500);

      // Verify charts exist
      let canvasElements = page.locator('canvas');
      await expect(canvasElements).toHaveCount(2);

      // Import second fund
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'beta-conservative-fund.json')
      );
      await page.waitForTimeout(500);

      // Charts should still be there (2 canvases)
      canvasElements = page.locator('canvas');
      await expect(canvasElements).toHaveCount(2);
    });

    test('charts handle fund with single snapshot gracefully', async ({ page }) => {
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'delta-single-snapshot-fund.json')
      );

      // Verify fund is imported
      await expect(page.locator('text=Delta Single Snapshot Fund')).toBeVisible();
      await expect(page.locator('text=(1 snapshot)')).toBeVisible();

      // Charts should still render without error
      const canvasElements = page.locator('canvas');
      await expect(canvasElements).toHaveCount(2);
    });
  });

  test.describe('Fund with Mixed Cash Flows', () => {
    test('correctly displays fund with deposits and withdrawals', async ({ page }) => {
      await page.locator('input[type="file"]').setInputFiles(
        path.join(FIXTURES_DIR, 'gamma-balanced-fund.json')
      );

      // Verify fund is imported
      await expect(page.locator('text=Gamma Balanced Fund')).toBeVisible();
      await expect(page.locator('text=(3 snapshots)')).toBeVisible();

      // Charts should render
      const canvasElements = page.locator('canvas');
      await expect(canvasElements).toHaveCount(2);
    });
  });

  test.describe('Page Accessibility', () => {
    test('page has proper heading structure', async ({ page }) => {
      // Main heading
      await expect(page.locator('h1')).toContainText('Fund Summary');

      // Import multiple funds to see all sections
      const files = [
        path.join(FIXTURES_DIR, 'alpha-growth-fund.json'),
        path.join(FIXTURES_DIR, 'beta-conservative-fund.json'),
      ];
      await page.locator('input[type="file"]').setInputFiles(files);

      // Section headings (Card titles) - verify key sections are present
      // Using getByText with exact to avoid ambiguity
      await expect(page.getByText('Import Fund Files', { exact: true })).toBeVisible();
      await expect(page.getByText('Imported Funds (2)', { exact: true })).toBeVisible();
      await expect(page.getByText('IRR Comparison', { exact: true })).toBeVisible();
      await expect(page.getByText('Simple Rate Comparison', { exact: true })).toBeVisible();
    });
  });
});
