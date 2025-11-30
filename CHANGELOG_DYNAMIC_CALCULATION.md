# Dynamic Calculation Update - Change Log

## Overview
Changed the application to calculate IRR, simple rate, net invested, and profit dynamically instead of storing them in files. This ensures values are always recalculated based on current cash flows.

## Changes Made

### 1. Type Definitions (`src/types/index.ts`)
- Made calculated fields in `HistoricalSnapshot` optional: `irr?`, `simpleRate?`, `netInvested?`, `profit?`
- Added deprecation comments indicating these fields are calculated dynamically
- **Backward compatibility**: Old files with these fields will still load, but new exports won't include them

### 2. Domain Logic (`src/domain/cashflow.ts`)
- Added new function `computeSnapshotMetrics()` to calculate all metrics dynamically:
  - Accepts a snapshot (with valuationDate and currentValue) and cash flows
  - Returns: `irr`, `simpleRate`, `netInvested`, and `profit`
- This function is pure and reusable across the application

### 3. Export/Import (`src/domain/jsonSchema.ts`)
- **Export (`buildExportJson`)**: Modified to exclude calculated fields from history snapshots
  - Only exports: `calculationDateTime`, `valuationDate`, `currentValue`
  - Calculated fields (`irr`, `simpleRate`, `netInvested`, `profit`) are NOT exported
- **Import (`parseImportedJson`)**: Handles both old and new formats
  - Old files with calculated fields: Fields are preserved but ignored
  - New files without calculated fields: Works as expected
  - **Backward compatibility maintained**: Application won't break with old files

### 4. Calculator Hook (`src/hooks/useCalculator.ts`)
- **`saveSnapshot()`**: Simplified to only store `calculationDateTime`, `valuationDate`, and `currentValue`
  - No longer calculates or stores IRR, simple rate, net invested, or profit
- **`updateHistorySnapshot()`**: Updated to only update `valuationDate` and `currentValue`
  - Explicitly removes any legacy calculated fields with `undefined`

### 5. UI Components

#### HistoryTable (`src/components/history/HistoryTable.tsx`)
- Added `cashFlows` prop to receive current cash flows
- Uses `computeSnapshotMetrics()` to calculate values dynamically for each row
- Displays are always up-to-date with current cash flows

#### HistoryChart (`src/components/history/HistoryChart.tsx`)
- Added `cashFlows` prop to receive current cash flows
- Uses `computeSnapshotMetrics()` to calculate IRR and simple rate dynamically for each data point
- Chart always reflects current cash flows

#### App (`src/App.tsx`)
- Updated to pass `state.cashFlows` to both `HistoryTable` and `HistoryChart`

### 6. Tests

#### `src/domain/jsonSchema.test.ts`
- Updated export test to verify calculated fields are NOT included in exports
- Added backward compatibility test to verify old files with calculated fields still import correctly

#### `src/domain/cashflow.test.ts`
- Added comprehensive tests for `computeSnapshotMetrics()`:
  - Normal profit scenario
  - Loss scenario (negative profit)
  - Empty cash flows scenario
  - Validates all returned metrics

## Benefits

1. **Always Accurate**: Values are recalculated each time, reflecting current cash flows
2. **Smaller File Size**: Exported JSON files no longer contain redundant calculated data
3. **Maintainability**: Single source of truth for calculations
4. **Backward Compatible**: Old files still work without breaking the application
5. **Future-Proof**: Easier to update calculation logic without migrating old data

## Breaking Changes

**None** - This is a backward-compatible change:
- Old files with calculated fields will load successfully
- New files are smaller and cleaner
- Users can continue using existing saved files

## Migration

No migration required! Users can:
1. Continue using existing exported JSON files
2. The app will automatically use dynamic calculation
3. Next time they export, files will be in the new cleaner format

## Testing

All tests pass (28 tests):
- ✓ src/domain/jsonSchema.test.ts (10 tests)
- ✓ src/domain/cashflow.test.ts (6 tests)
- ✓ src/domain/irr.test.ts (2 tests)
- ✓ src/domain/irr.more.test.ts (4 tests)
- ✓ src/domain/simpleRate.test.ts (2 tests)
- ✓ src/domain/simpleRate.more.test.ts (4 tests)

Build successful with no errors.

