import type { CashFlowEntry } from "../../types";
import type React from "react";
import { Box, TextField, Select, MenuItem, IconButton, Tooltip } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import DeleteOutline from '@mui/icons-material/DeleteOutline';

export interface CashFlowRowProps {
  entry: CashFlowEntry;
  onUpdate(id: string, patch: Partial<CashFlowEntry>): void;
  onDelete(id: string): void;
}

export function CashFlowRow({ entry, onUpdate, onDelete }: CashFlowRowProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(entry.id, { date: e.target.value });
  };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const amount = value === "" ? 0 : Number(value);
    if (Number.isNaN(amount)) return;
    onUpdate(entry.id, { amount });
  };
  const handleDirectionChange = (e: SelectChangeEvent) => {
    onUpdate(entry.id, { direction: e.target.value as CashFlowEntry['direction'] });
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(12, 1fr)' },
        gap: 1,
        py: 1,
        alignItems: 'center',
      }}
    >
      <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'span 3' } }}>
        <TextField
          label="Date"
          type="date"
          value={entry.date}
          onChange={handleDateChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'span 3' } }}>
        <TextField
          label="Amount"
          type="number"
          inputProps={{ step: '0.01', min: 0 }}
          value={entry.amount}
          onChange={handleAmountChange}
          fullWidth
        />
      </Box>
      <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'span 3' } }}>
        <Select
          value={entry.direction}
          onChange={handleDirectionChange}
          fullWidth
          displayEmpty
          aria-label="Direction"
        >
          <MenuItem value="deposit">Deposit</MenuItem>
          <MenuItem value="withdrawal">Withdrawal</MenuItem>
        </Select>
      </Box>
      <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'span 3' }, textAlign: { xs: 'left', sm: 'right' } }}>
        <Tooltip title="Delete cash flow">
          <IconButton color="error" onClick={() => onDelete(entry.id)} size="small" aria-label="delete cash flow">
            <DeleteOutline />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default CashFlowRow;
