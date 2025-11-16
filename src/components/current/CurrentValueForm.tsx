import type React from "react";
import { Box, TextField, Typography, Alert } from '@mui/material';

export interface CurrentValueFormProps {
  valuationDate: string | null;
  currentValue: number | null;
  fundName?: string | null;
  onValuationDateChange(dateString: string): void;
  onCurrentValueChange(value: number | null): void;
  onFundNameChange?(name: string | null): void;
}

export function CurrentValueForm({
  valuationDate,
  currentValue,
  fundName,
  onValuationDateChange,
  onCurrentValueChange,
  onFundNameChange,
}: CurrentValueFormProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValuationDateChange(e.target.value);
  };
  const handleCurrentValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") { onCurrentValueChange(null); return; }
    const num = Number(value);
    if (Number.isNaN(num)) return;
    onCurrentValueChange(num);
  };

  const isCurrentValueMissing = currentValue === null;

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        label="Fund Name"
        value={fundName ?? ''}
        onChange={(e) => onFundNameChange && onFundNameChange(e.target.value.trim() === '' ? null : e.target.value)}
        helperText="Optional. Used for exported JSON filename if provided."
        fullWidth
      />
      <TextField
        label="Valuation Date"
        type="date"
        value={valuationDate ?? ''}
        onChange={handleDateChange}
        InputLabelProps={{ shrink: true }}
        helperText="The date at which the fund value is measured."
        fullWidth
      />
      <TextField
        label="Current Fund Value"
        type="number"
        value={currentValue ?? ''}
        onChange={handleCurrentValueChange}
        inputProps={{ step: '0.01', min: 0 }}
        helperText="Enter the fund value at the valuation date."
        fullWidth
      />
      {isCurrentValueMissing && (
        <Alert severity="warning" variant="outlined">
          Rates cannot be computed until a current fund value is provided.
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        Provide both a valuation date and current value to enable rate calculations.
      </Typography>
    </Box>
  );
}

export default CurrentValueForm;
