# Net Invested Historical Preservation Fix - Change Log

## Overview
Fixed a major bug where adding new transactions caused historical snapshots to recalculate their "Net Invested" values. This made past snapshots show incorrect values that didn't reflect the actual invested amount at the time of the snapshot.

## Problem
When a user added a new transaction (deposit or withdrawal), all historical snapshots in the Calculation History table would update their "Net Invested" values based on the current total of all cash flows. This was incorrect because:
- Historical snapshots should preserve the invested amount at the time they were created
- Adding future transactions should not change past snapshot values

## Root Cause
The `netInvested` field was not being stored in the `HistoricalSnapshot` - it was calculated dynamically from the current cash flows every time the history table was rendered.

## Solution
Store `netInvested` in the snapshot at the time of creation, and use the stored value when displaying historical data.

## Changes Made

### 1. Type Definitions (`src/types/index.ts`)
- Updated `HistoricalSnapshot` interface:
  - `netInvested` is now a stored field (optional for backward compatibility)
  - Added clear documentation distinguishing stored fields from deprecated calculated fields
  - `irr`, `simpleRate`, and `profit` remain calculated dynamically

### 2. Domain Logic (`src/domain/cashflow.ts`)
- Updated `computeSnapshotMetrics()` function:
  - Now uses stored `netInvested` if available
  - Falls back to dynamic calculation if not stored (backward compatibility for old data)
  - Added `hasStoredNetInvested` flag in return value to indicate data source
  - `profit` is calculated from stored `netInvested`: `currentValue - netInvested`

### 3. Export/Import (`src/domain/jsonSchema.ts`)
- **Export (`buildExportJson`)**: Now includes `netInvested` in history snapshots
- **Import (`parseImportedJson`)**: Handles both formats:
  - New files with `netInvested`: Uses stored value
  - Old files without `netInvested`: Backward compatible (calculated dynamically)

### 4. Calculator Hook (`src/hooks/useCalculator.ts`)
- **`saveSnapshot()`**: Now calculates and stores `netInvested` at snapshot creation time
- **`updateHistorySnapshot()`**: Updated to allow editing `netInvested` field

### 5. UI Components

#### HistoryTable (`src/components/history/HistoryTable.tsx`)
- Added `netInvested` to the edit form
- Visual indicator (⚠️ icon) for snapshots without stored `netInvested`:
  - Shows orange warning text with dotted underline
  - Tooltip explains the value is calculated from current cash flows
  - Users can edit the snapshot to set a fixed value
- Updated props type to include `netInvested` in updateable fields

### 6. Tests

#### `src/domain/cashflow.test.ts`
- Added tests for backward compatibility:
  - "uses stored netInvested when available"
  - "calculates netInvested dynamically when not stored"

#### `src/domain/jsonSchema.test.ts`
- Updated export test to expect `netInvested` in exported history

## Backward Compatibility

### Importing Old Files
- Old JSON files without `netInvested` in history will still work
- The app will calculate `netInvested` dynamically from current cash flows
- A visual warning (⚠️) indicates the value is not stored
- Users can manually edit the snapshot to set the correct historical value

### Exporting Files
- New exports always include `netInvested` in history snapshots
- Re-importing an exported file preserves historical `netInvested` values

## User Experience

### New Behavior
1. When saving a new snapshot, `netInvested` is captured and preserved
2. Adding new transactions does NOT change past snapshot values
3. Each snapshot shows the invested amount as it was at snapshot creation time

### Migration Path for Old Data
1. Open the app with old data (or import an old JSON file)
2. Historical snapshots show ⚠️ next to calculated `netInvested` values
3. Click edit (pencil icon) on each historical snapshot
4. Verify or correct the `netInvested` value
5. Save to preserve the value permanently
6. Export to create a backup with fixed values

## Technical Notes

### Why Store netInvested but Not IRR/simpleRate?
- `netInvested` represents the state of cash flows at a point in time - it's historical data
- `IRR` and `simpleRate` are calculations based on the relationship between invested capital and current value
- These rates depend on the time structure of cash flows, which may need recalculation if dates are corrected
- Storing `netInvested` gives users control over historical accuracy while keeping rate calculations flexible

### Storage Format
```json
{
  "history": [
    {
      "calculationDateTime": "2025-01-11T10:15:30Z",
      "valuationDate": "2025-01-11",
      "currentValue": 12500,
      "netInvested": 10000
    }
  ]
}
```

## Testing
All 30 unit tests pass, including new tests for backward compatibility.

