import type { CashFlowEntry } from "../../types";
import CashFlowRow from "./CashFlowRow";
import { Box, Button, Typography, Paper, Divider, Stack, Alert } from "@mui/material";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";

export interface CashFlowTableProps {
  cashFlows: CashFlowEntry[];
  onAddCashFlow(): void;
  onUpdateCashFlow(id: string, patch: Partial<CashFlowEntry>): void;
  onDeleteCashFlow(id: string): void;
}

export function CashFlowTable({
  cashFlows,
  onAddCashFlow,
  onUpdateCashFlow,
  onDeleteCashFlow,
}: CashFlowTableProps) {
  const hasCashFlows = cashFlows.length > 0;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography variant="h2" sx={{ fontSize: "1rem" }}>
          Cash Flows
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutline />}
          onClick={onAddCashFlow}
          size="small"
        >
          Add
        </Button>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {!hasCashFlows && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          Add at least one deposit to start. Use the Add button above to enter your initial investment.
        </Alert>
      )}
      <Box>
        {cashFlows.map((entry) => (
          <CashFlowRow
            key={entry.id}
            entry={entry}
            onUpdate={onUpdateCashFlow}
            onDelete={onDeleteCashFlow}
          />
        ))}
      </Box>
      {hasCashFlows && (
        <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
          Deposits increase invested capital; withdrawals reduce it.
        </Typography>
      )}
    </Paper>
  );
}

export default CashFlowTable;
