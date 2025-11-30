# CI/CD Pipeline Setup

## Overview

This project uses **GitHub Actions** for continuous integration and deployment. The CI pipeline ensures code quality, runs comprehensive tests, and validates builds before merging.

## Pipeline Structure

### Workflow File
- **Location**: `.github/workflows/ci.yml`
- **Triggers**:
  - Push to `main` branch
  - Push to `feature/*` branches
  - Pull requests targeting `main`

### Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  enforce-branch-name-precheck       │
        │  (PR only)                          │
        │  • Validates feature/* naming       │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  build-and-test                     │
        │  • Lint                             │
        │  • Unit Tests (Vitest)              │
        │  • Build (TypeScript + Vite)        │
        │  • Upload dist artifact             │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  e2e-tests (Matrix Strategy)        │
        │                                     │
        │  ┌─────────┬─────────┬─────────┐  │
        │  │Chromium │ Firefox │ WebKit  │  │
        │  │         │         │         │  │
        │  │ 40 tests│ 40 tests│ 40 tests│  │
        │  │  ~6 min │  ~6 min │  ~6 min │  │
        │  └─────────┴─────────┴─────────┘  │
        │                                     │
        │  On Failure:                        │
        │  • Upload HTML report               │
        │  • Upload test results              │
        │  • Screenshots, videos, traces      │
        └─────────────────────────────────────┘
                              │
                              ▼
                    ✅ All Checks Passed
                    (Ready to merge)
```

### Jobs

#### 1. Branch Name Enforcement (Pre-check)
**Purpose**: Ensures all PRs to main come from properly named feature branches

- **Runs On**: Pull requests only
- **Validates**: Branch name matches `feature/*` pattern
- **Blocks**: PRs from incorrectly named branches

**Why**: Maintains consistent branch naming convention for better organization and Git history.

---

#### 2. Build and Test
**Purpose**: Validates code quality and builds the application

**Steps**:
1. **Checkout repository**
2. **Setup Node.js 20.x** with npm caching
3. **Install dependencies** (`npm ci`)
4. **Lint code** (`npm run lint`)
5. **Run unit tests** (Vitest)
6. **Build application** (TypeScript compilation + Vite bundle)
7. **Upload build artifact** (dist folder)

**Matrix**: Node.js 20.x (can be expanded)

**Duration**: ~3-5 minutes

---

#### 3. E2E Tests ✨ NEW
**Purpose**: Validates end-to-end user workflows across multiple browsers

**Steps**:
1. **Checkout repository**
2. **Setup Node.js 20.x** with npm caching
3. **Install dependencies** (`npm ci`)
4. **Install Playwright browsers** (browser-specific)
5. **Run E2E tests** on assigned browser
6. **Upload artifacts on failure**:
   - Playwright HTML report
   - Test results (screenshots, videos, traces)

**Matrix**: 3 browsers in parallel
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

**Timeout**: 15 minutes per browser

**Retry Strategy**: 2 retries on failure (Playwright config)

**Duration**: ~5-8 minutes per browser (parallel execution)

**Artifacts**: Retained for 7 days

---

## E2E Test Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,  // Fails build if test.only found
  retries: process.env.CI ? 2 : 0, // 2 retries on CI
  workers: process.env.CI ? 1 : undefined, // Sequential on CI
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },
});
```

### Test Coverage

**40 tests across 9 test files** (100% passing):

1. **first-time-user.spec.ts** (2 tests)
   - Empty state behavior
   - Validation before snapshot creation

2. **single-deposit-positive-return.spec.ts** (2 tests)
   - Basic calculation accuracy
   - Chart rendering with multiple snapshots

3. **cash-flow-crud.spec.ts** (6 tests)
   - Add, edit, delete cash flows
   - UI interaction validation
   - Entry order vs calculation order

4. **history-edit-delete.spec.ts** (5 tests)
   - Edit historical snapshots
   - Delete confirmations
   - Validation on edit

5. **localStorage-autosave.spec.ts** (5 tests)
   - Auto-save functionality
   - Debouncing behavior
   - Clear all operation

6. **mixed-deposit-withdrawal.spec.ts** (2 tests)
   - Complex calculation scenarios
   - Dynamic updates

7. **validation-edge-cases.spec.ts** (11 tests)
   - Input validation
   - Edge case handling
   - Error scenarios

8. **same-sign-flows-irr-undefined.spec.ts** (3 tests)
   - IRR calculation edge cases
   - N/A display logic

9. **import-export-roundtrip.spec.ts** (3 tests)
   - Full round-trip restoration
   - Invalid JSON handling
   - Fund name preservation

---

## Viewing Test Results

### On GitHub

1. Navigate to **Actions** tab
2. Click on a workflow run
3. View job summaries and logs
4. Download artifacts on failure:
   - Click on the failed job
   - Scroll to "Artifacts" section
   - Download `playwright-report-{browser}-{sha}`

### Locally

```bash
# Run all E2E tests
npm run test:e2e

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run with UI mode (interactive debugging)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/cash-flow-crud.spec.ts

# Debug mode
npm run test:e2e:debug

# View last HTML report
npm run test:e2e:report
```

---

## Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Purpose**: Automatically cancels in-progress workflow runs when new commits are pushed to the same branch.

**Benefits**:
- Saves CI minutes
- Faster feedback on latest changes
- Prevents queue buildup

---

## Performance Optimization

### Caching Strategy
- **npm dependencies**: Cached by `actions/setup-node@v4`
- **Playwright browsers**: Installed per run (browsers cached by GitHub Actions)

### Parallel Execution
- **Build and unit tests**: Single job (fast enough)
- **E2E tests**: 3 parallel jobs (one per browser)
- **Total parallelism**: Up to 3 concurrent browser tests

### Timeout Protection
- **E2E job timeout**: 15 minutes per browser
- **Playwright webServer timeout**: 2 minutes
- **Default test timeout**: 30 seconds per test

---

## Failure Handling

### Automatic Retries
- **E2E tests**: 2 retries on CI (configured in Playwright)
- **Reason**: Reduces flakiness from network/timing issues

### Debug Artifacts
On E2E test failure, the following are captured:
- **Screenshots**: Taken on every failure
- **Videos**: Recorded for failed tests
- **Traces**: Full execution trace for debugging
- **HTML Report**: Interactive report with all details

**Retention**: 7 days

### Viewing Artifacts
1. Go to failed workflow run
2. Click on failed E2E job
3. Scroll to "Artifacts" section
4. Download `playwright-report-{browser}-{sha}.zip`
5. Unzip and open `index.html` in browser

---

## Adding New Tests

### Unit Tests (Vitest)
```typescript
// src/domain/__tests__/myFeature.test.ts
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

**Runs in**: `build-and-test` job

### E2E Tests (Playwright)
```typescript
// tests/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // ... test logic
  });
});
```

**Runs in**: `e2e-tests` job (all browsers)

---

## Best Practices

### For Developers

1. **Run tests locally before pushing**
   ```bash
   npm run lint
   npm test -- --run
   npm run test:e2e
   ```

2. **Use feature branches**
   - Always branch from `main`
   - Name branches `feature/description`

3. **Keep tests stable**
   - Avoid `test.only` (fails on CI)
   - Use proper waits, not timeouts
   - Handle async operations correctly

4. **Check CI status before merging**
   - All jobs must pass
   - Review any warnings
   - Check coverage reports

### For CI/CD Maintenance

1. **Monitor flaky tests**
   - Review retry logs
   - Fix root causes
   - Update selectors if needed

2. **Update dependencies regularly**
   - Playwright
   - Actions versions
   - Node.js version

3. **Optimize for speed**
   - Review slow tests
   - Consider test splitting
   - Monitor artifact sizes

---

## Troubleshooting

### Common Issues

#### Tests pass locally but fail on CI
- **Cause**: Timing differences, screen resolution, browser version
- **Solution**: Add explicit waits, check viewport settings

#### Playwright browser installation fails
- **Cause**: System dependencies missing
- **Solution**: Use `--with-deps` flag (already configured)

#### Workflow times out
- **Cause**: Test stuck or taking too long
- **Solution**: Check test logs, increase timeout if needed

#### Artifacts not uploaded
- **Cause**: Path incorrect or files missing
- **Solution**: Verify paths in workflow match Playwright config

### Getting Help

1. Check workflow logs in GitHub Actions
2. Download and review Playwright HTML reports
3. Run tests locally with `--debug` flag
4. Review test documentation in `tests/README.md`

---

## Future Enhancements

### Short-term
- [ ] Add code coverage reporting
- [ ] Implement visual regression testing
- [ ] Add performance benchmarks
- [ ] Test mobile viewports on CI

### Long-term
- [ ] Add deployment automation
- [ ] Implement staging environment tests
- [ ] Add accessibility testing (axe-core)
- [ ] Create custom GitHub Action for common tasks
- [ ] Add notification on test failures (Slack/Discord)

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Vitest Documentation](https://vitest.dev/)
- [Project Test Status](./E2E_TEST_STATUS.md)
- [Test Fixes Summary](./E2E_TEST_FIXES_FINAL.md)

