/**
 * Predefined test data scenarios for E2E tests
 */

export interface CashFlowData {
  date: string;
  amount: number;
  direction: 'Deposit' | 'Withdrawal';
}

/**
 * Scenario: Single deposit with positive return
 * Expected: ~10% IRR and Simple Rate
 */
export const singleDepositPositiveReturn = {
  cashFlows: [
    { date: '2024-01-01', amount: 1000, direction: 'Deposit' as const },
  ],
  valuationDate: '2025-01-01',
  currentValue: 1100,
  expected: {
    netInvested: 1000,
    profit: 100,
    irrMin: 9.5,
    irrMax: 10.5,
    simpleRateMin: 9.5,
    simpleRateMax: 10.5,
  },
};

/**
 * Scenario: Mixed deposits and withdrawals
 */
export const mixedDepositWithdrawal = {
  cashFlows: [
    { date: '2024-01-01', amount: 1000, direction: 'Deposit' as const },
    { date: '2024-06-01', amount: 500, direction: 'Deposit' as const },
    { date: '2024-09-01', amount: 300, direction: 'Withdrawal' as const },
  ],
  valuationDate: '2025-01-01',
  currentValue: 1500,
  expected: {
    netInvested: 1200, // 1000 + 500 - 300
    profit: 300, // 1500 - 1200
  },
};

/**
 * Scenario: Same-sign cash flows (IRR undefined)
 */
export const sameSignFlows = {
  cashFlows: [
    { date: '2024-01-01', amount: 1000, direction: 'Deposit' as const },
    { date: '2024-03-01', amount: 500, direction: 'Deposit' as const },
  ],
  valuationDate: '2024-12-31',
  currentValue: 1500,
  expected: {
    netInvested: 1500,
    profit: 0,
    irrIsNA: true,
  },
};

/**
 * Scenario: Complex multi-year investment with multiple transactions
 */
export const complexMultiYear = {
  cashFlows: [
    { date: '2022-01-15', amount: 5000, direction: 'Deposit' as const },
    { date: '2022-06-01', amount: 2000, direction: 'Deposit' as const },
    { date: '2023-01-01', amount: 3000, direction: 'Deposit' as const },
    { date: '2023-08-15', amount: 1000, direction: 'Withdrawal' as const },
    { date: '2024-03-01', amount: 2500, direction: 'Deposit' as const },
    { date: '2024-09-01', amount: 500, direction: 'Withdrawal' as const },
  ],
  valuationDate: '2025-01-01',
  currentValue: 14000,
  expected: {
    netInvested: 11000, // 5000 + 2000 + 3000 - 1000 + 2500 - 500
    profit: 3000, // 14000 - 11000
  },
};

/**
 * Scenario: Empty state (no cash flows)
 */
export const emptyState = {
  cashFlows: [],
  valuationDate: null,
  currentValue: null,
  expected: {
    netInvested: 0,
    profit: 0,
    irrIsNA: true,
    simpleRateIsNA: true,
  },
};

/**
 * Scenario: Single large deposit
 */
export const largeSingleDeposit = {
  cashFlows: [
    { date: '2023-01-01', amount: 100000, direction: 'Deposit' as const },
  ],
  valuationDate: '2025-01-01',
  currentValue: 125000,
  expected: {
    netInvested: 100000,
    profit: 25000,
  },
};

/**
 * Scenario: Small amounts with precise decimals
 */
export const smallAmounts = {
  cashFlows: [
    { date: '2024-01-01', amount: 10.50, direction: 'Deposit' as const },
    { date: '2024-06-01', amount: 5.25, direction: 'Deposit' as const },
  ],
  valuationDate: '2025-01-01',
  currentValue: 17.00,
  expected: {
    netInvested: 15.75,
    profit: 1.25,
  },
};

