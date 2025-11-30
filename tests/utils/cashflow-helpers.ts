import { Page, Locator } from '@playwright/test';

/**
 * Add a new cash flow entry via the UI
 */
export async function addCashFlow(
  page: Page,
  date: string,
  amount: number,
  direction: 'Deposit' | 'Withdrawal'
): Promise<void> {
  // Click the Add button in the Cash Flows card
  await page.getByRole('button', { name: /add/i }).first().click();

  // Get all cash flow rows
  const rows = page.locator('[data-testid="cash-flow-row"]').last();

  // Fill in the date
  const dateInput = rows.getByLabel(/date/i);
  await dateInput.fill(date);

  // Fill in the amount
  const amountInput = rows.getByLabel(/amount/i);
  await amountInput.fill(amount.toString());

  // Select direction
  const directionSelect = rows.getByRole('combobox');
  await directionSelect.click();
  await page.getByRole('option', { name: direction }).click();
}

/**
 * Get the number of cash flow rows
 */
export async function getCashFlowCount(page: Page): Promise<number> {
  const rows = page.locator('[data-testid="cash-flow-row"]');
  return await rows.count();
}

/**
 * Delete a cash flow by index
 */
export async function deleteCashFlow(page: Page, index: number): Promise<void> {
  const rows = page.locator('[data-testid="cash-flow-row"]');
  const row = rows.nth(index);
  const deleteButton = row.getByRole('button', { name: /delete/i });
  await deleteButton.click();
}

/**
 * Update a cash flow entry
 */
export async function updateCashFlow(
  page: Page,
  index: number,
  updates: { date?: string; amount?: number; direction?: 'Deposit' | 'Withdrawal' }
): Promise<void> {
  const rows = page.locator('[data-testid="cash-flow-row"]');
  const row = rows.nth(index);

  if (updates.date) {
    const dateInput = row.getByLabel(/date/i);
    await dateInput.fill(updates.date);
  }

  if (updates.amount !== undefined) {
    const amountInput = row.getByLabel(/amount/i);
    await amountInput.clear();
    await amountInput.fill(updates.amount.toString());
  }

  if (updates.direction) {
    const directionSelect = row.getByRole('combobox');
    await directionSelect.click();
    await page.getByRole('option', { name: updates.direction }).click();
  }
}

/**
 * Get cash flow data from a specific row
 */
export async function getCashFlowData(page: Page, index: number): Promise<{
  date: string;
  amount: string;
  direction: string;
}> {
  const rows = page.locator('[data-testid="cash-flow-row"]');
  const row = rows.nth(index);

  const date = await row.getByLabel(/date/i).inputValue();
  const amount = await row.getByLabel(/amount/i).inputValue();
  const direction = await row.getByRole('combobox').textContent();

  return { date, amount, direction: direction || '' };
}

/**
 * Verify the helper text is shown when no cash flows exist
 */
export async function verifyEmptyCashFlowState(page: Page): Promise<Locator> {
  return page.getByText(/add at least one deposit to start/i);
}

