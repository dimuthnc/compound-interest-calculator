import { Page, expect } from '@playwright/test';

/**
 * Set the valuation date
 */
export async function setValuationDate(page: Page, date: string): Promise<void> {
  const dateInput = page.getByLabel(/valuation date/i);
  await dateInput.fill(date);
}

/**
 * Set the current fund value
 */
export async function setCurrentValue(page: Page, value: number): Promise<void> {
  const valueInput = page.getByLabel(/current.*value|current fund value/i);
  await valueInput.fill(value.toString());
}

/**
 * Click the "Save Snapshot" button
 */
export async function saveSnapshot(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: /save.*snapshot/i });
  await button.click();
}

/**
 * Get the displayed net invested value
 */
export async function getNetInvested(page: Page): Promise<string> {
  const element = page.locator('text=Net Invested').locator('..').locator('p').last();
  return await element.textContent() || '';
}

/**
 * Get the displayed profit/loss value
 */
export async function getProfit(page: Page): Promise<string> {
  const element = page.locator('text=/Profit|Loss/').locator('..').locator('p').last();
  return await element.textContent() || '';
}

/**
 * Get the displayed IRR value
 */
export async function getIRR(page: Page): Promise<string> {
  try {
    const element = page.locator('text=IRR').locator('..').first().locator('div').last();
    const text = await element.textContent({ timeout: 5000 });
    return text || '';
  } catch (error) {
    return '';
  }
}

/**
 * Get the displayed simple rate value
 */
export async function getSimpleRate(page: Page): Promise<string> {
  try {
    const element = page.locator('text=Simple Annual Rate').locator('..').first().locator('div').last();
    const text = await element.textContent({ timeout: 5000 });
    return text || '';
  } catch (error) {
    return '';
  }
}

/**
 * Verify that IRR shows N/A
 */
export async function verifyIRRIsNA(page: Page): Promise<void> {
  const irrSection = page.locator('text=IRR').locator('..').first();
  await expect(irrSection).toContainText(/N\/A|n\/a/i);
}

/**
 * Verify that Simple Rate shows N/A
 */
export async function verifySimpleRateIsNA(page: Page): Promise<void> {
  const simpleRateSection = page.locator('text=Simple Annual Rate').locator('..').first();
  await expect(simpleRateSection).toContainText(/N\/A|n\/a/i);
}

/**
 * Parse percentage string to number (e.g., "10.00%" -> 10.00)
 */
export function parsePercentage(percentStr: string): number {
  return parseFloat(percentStr.replace('%', ''));
}

/**
 * Parse currency string to number (e.g., "1,000.00" -> 1000.00)
 */
export function parseCurrency(currencyStr: string): number {
  return parseFloat(currencyStr.replace(/,/g, ''));
}

/**
 * Verify a percentage value is within a range
 */
export function assertPercentageInRange(
  actual: string,
  min: number,
  max: number,
  message?: string
): void {
  const value = parsePercentage(actual);
  expect(value, message).toBeGreaterThanOrEqual(min);
  expect(value, message).toBeLessThanOrEqual(max);
}

/**
 * Verify a currency value matches expected
 */
export function assertCurrencyEquals(
  actual: string,
  expected: number,
  tolerance: number = 0.01,
  message?: string
): void {
  const value = parseCurrency(actual);
  expect(Math.abs(value - expected), message).toBeLessThanOrEqual(tolerance);
}

