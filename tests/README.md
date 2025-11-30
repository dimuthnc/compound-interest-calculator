# E2E Tests - Effective Interest Rate Calculator

This directory contains end-to-end tests for the Interest Calculator application using Playwright.

## Overview

The test suite covers all critical user workflows including:
- First-time user experience and empty states
- Cash flow management (CRUD operations)
- Financial calculations (IRR and Simple Rate)
- Historical snapshots with edit/delete functionality
- Import/export JSON round-trip
- LocalStorage autosave functionality
- Validation and edge cases

## Test Structure

Tests are organized by feature/scenario:

- `first-time-user.spec.ts` - Empty state and initial load behavior
- `single-deposit-positive-return.spec.ts` - Basic positive return calculation
- `mixed-deposit-withdrawal.spec.ts` - Complex scenarios with multiple transactions
- `same-sign-flows-irr-undefined.spec.ts` - Edge case where IRR cannot be calculated
- `import-export-roundtrip.spec.ts` - JSON export/import functionality
- `cash-flow-crud.spec.ts` - Add, edit, delete, and sort cash flows
- `history-edit-delete.spec.ts` - Manage historical snapshots
- `localStorage-autosave.spec.ts` - Auto-save and state restoration
- `validation-edge-cases.spec.ts` - Input validation and edge cases

### Utilities

Helper functions in `utils/` directory:
- `localStorage.ts` - LocalStorage manipulation
- `cashflow-helpers.ts` - Cash flow CRUD operations
- `calculation-helpers.ts` - Valuation and calculation helpers
- `test-data.ts` - Predefined test scenarios

## Running Tests

### Run all tests (headless)
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test first-time-user.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests on mobile viewport
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Viewing Test Reports

After test execution, view the HTML report:
```bash
npm run test:e2e:report
```

## Debugging Failed Tests

### View trace for failed tests
1. Run tests with trace enabled: `npx playwright test --trace on`
2. Open the trace: `npx playwright show-trace trace.zip`

### Debug with UI Mode
The UI mode provides the best debugging experience:
```bash
npm run test:e2e:ui
```

Features:
- Time travel through test execution
- Inspect DOM at each step
- View network requests
- See console logs

### Debug specific test
```bash
npx playwright test --debug first-time-user.spec.ts
```

## Writing New Tests

### Test Guidelines

1. **Use role-based locators** - Prefer `getByRole`, `getByLabel`, `getByText`
2. **Group with test.step()** - Organize test logic into clear steps
3. **Use auto-retrying assertions** - Always use `await expect(...)`
4. **Clear localStorage** - Use `clearLocalStorage()` in `beforeEach`
5. **Wait appropriately** - Rely on auto-waiting; use `waitForTimeout` sparingly

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { clearLocalStorage } from './utils/localStorage';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearLocalStorage(page);
    await page.reload();
  });

  test('Scenario description', async ({ page }) => {
    await test.step('Setup data', async () => {
      // Setup code
    });

    await test.step('Perform action', async () => {
      // Action code
    });

    await test.step('Verify result', async () => {
      // Assertions
    });
  });
});
```

## Accessibility Testing

Tests use `toMatchAriaSnapshot` where appropriate to verify:
- Proper ARIA tree structure
- Semantic HTML elements
- Accessible names for interactive elements

## CI/CD Integration

Tests are configured to run in CI with:
- Automatic retries (2 retries on failure)
- HTML report artifacts
- Screenshot and video capture on failure
- Trace collection for debugging

## Coverage

Current test coverage includes:

### User Flows
- ✅ First-time user experience
- ✅ Single deposit calculation
- ✅ Mixed deposit/withdrawal scenarios
- ✅ Same-sign flows (IRR N/A case)
- ✅ Import/export round-trip
- ✅ LocalStorage persistence

### Features
- ✅ Cash flow CRUD operations
- ✅ Auto-sorting by date
- ✅ Historical snapshot management
- ✅ Snapshot editing with recalculation
- ✅ Snapshot deletion
- ✅ Chart rendering (2+ snapshots)
- ✅ Auto-save with debouncing

### Validation
- ✅ Empty state validation
- ✅ Missing required fields
- ✅ Invalid amounts (negative, zero)
- ✅ Invalid dates
- ✅ Large numbers
- ✅ Small decimals
- ✅ Future dates
- ✅ Multiple flows on same date

## Known Limitations

1. **Visual regression testing** - Chart rendering is verified by canvas presence, not visual comparison
2. **PWA offline mode** - Service worker testing not included in initial scope
3. **Browser-specific features** - Some tests may behave differently across browsers (file uploads, date pickers)

## Troubleshooting

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if dev server started properly
- Verify network conditions

### Flaky tests
- Add explicit waits for dynamic content
- Use `waitForLoadState()` for page transitions
- Check for race conditions in test logic

### Locator not found
- Verify component structure hasn't changed
- Check if element is hidden or not rendered
- Use Playwright Inspector to debug: `npx playwright test --debug`

## Future Improvements

- [ ] Add visual regression tests for charts
- [ ] Test PWA installation and offline mode
- [ ] Add performance testing
- [ ] Test responsive layouts systematically
- [ ] Add accessibility audit integration
- [ ] Test keyboard navigation flows
- [ ] Add API mocking for future backend integration

## Contributing

When adding new tests:
1. Follow existing test structure and naming conventions
2. Add helper functions to `utils/` for reusable logic
3. Update this README if adding new test categories
4. Ensure tests are deterministic (no flakiness)
5. Add meaningful test.step() descriptions

