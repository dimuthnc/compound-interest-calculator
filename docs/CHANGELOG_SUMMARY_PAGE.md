# Changelog: Summary Page Feature

**Date:** January 24, 2026

## Overview

Added a new **Summary Page** (`/summary`) that allows users to compare performance across multiple funds by importing their exported JSON files.

## New Features

### Multi-Fund Comparison Page

- **New route**: `/summary` accessible via React Router
- **Navigation**: "Summary" link added to the main header for easy access
- **Back navigation**: "Back to Calculator" button on the Summary page

### Fund Import

- Import multiple JSON files at once or sequentially
- Validates each file for required fields:
  - Non-empty `fundName`
  - At least one history snapshot with `valuationDate` and `currentValue`
- Displays success/error messages for each import attempt
- Shows imported funds count with snapshot details

### Duplicate Handling

- When importing a fund with the same name as an existing one, the new import **replaces** the old one
- Case-insensitive name matching
- Displays "Replaced existing" message when duplicates are detected

### Dynamic Metric Calculation

- Automatically calculates `irr`, `simpleRate`, `netInvested`, and `profit` if missing from history snapshots
- Uses existing `computeSnapshotMetrics()` function from `cashflow.ts`
- Shows ⚡ indicator next to funds with dynamically calculated metrics
- Displays explanatory text when dynamic calculations were performed

### Comparison Charts

Two side-by-side charts using `react-chartjs-2`:

1. **IRR Comparison** - Annualized effective return (XIRR-style) for each fund over time
2. **Simple Rate Comparison** - Simple annual interest rate for each fund over time

Chart features:
- Multi-line time series with color-coded lines per fund
- X-axis: Valuation dates
- Y-axis: Rate as percentage
- Interactive tooltips with formatted values
- Legend with fund names

### Fund Management

- Remove individual funds via trash icon button
- Clear all funds with "Clear All Funds" button
- Empty state with helpful guidance when no funds are imported

## Technical Implementation

### New Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | Added `SummaryFund` and `SummarySnapshot` types |
| `src/domain/summarySchema.ts` | Validation, parsing, and metric enrichment logic |
| `src/domain/summarySchema.test.ts` | Unit tests (14 tests) |
| `src/components/summary/SummaryPage.tsx` | Main Summary page component |
| `src/components/summary/RateComparisonChart.tsx` | Reusable comparison chart component |
| `src/components/summary/index.ts` | Barrel exports |
| `tests/summary-page.spec.ts` | E2E tests (21 tests per browser) |
| `tests/fixtures/*.json` | Test fixture files for E2E tests |

### Modified Files

| File | Changes |
|------|---------|
| `src/main.tsx` | Added React Router with `/` and `/summary` routes |
| `src/components/layout/Layout.tsx` | Added navigation link to Summary page |
| `README.md` | Documentation updates |

### Dependencies

- `react-router-dom` - Already installed, now actively used for routing

## Testing

### Unit Tests

14 new tests in `summarySchema.test.ts`:
- Parsing valid fund JSON
- Validation errors (missing fundName, empty history, invalid version)
- Dynamic metric calculation
- Fund name trimming
- `addOrReplaceFund` function (add, replace, case-insensitivity)
- `removeFund` function

### E2E Tests

21 new tests in `summary-page.spec.ts` covering:
- Navigation (to/from summary page)
- Empty state display
- Single fund import
- Multiple funds import (simultaneous and sequential)
- Duplicate fund handling
- Remove individual fund
- Clear all funds
- Validation errors
- Dynamic calculation indicator
- Chart rendering
- Mixed cash flows handling
- Page accessibility

## Design Decisions

1. **No localStorage**: Summary page data is in-memory only, lost on refresh (as per requirements)
2. **Chart.js reuse**: Used existing `react-chartjs-2` for consistency with main app
3. **Dynamic calculation**: Ensures backward compatibility with older exports missing computed fields
4. **Case-insensitive duplicates**: More user-friendly when fund names differ only in capitalization

## Future Enhancements

- Additional summary metrics (total portfolio value, weighted average return)
- Export summary as PDF/image
- Date range filtering for charts
- Custom fund grouping/categorization
