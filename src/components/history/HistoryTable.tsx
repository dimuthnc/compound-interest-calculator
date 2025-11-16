import { format } from "date-fns";
import type { HistoricalSnapshot } from "../../types";
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography, Alert } from '@mui/material';

export interface HistoryTableProps {
  history: HistoricalSnapshot[];
}

const DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm";

export function HistoryTable({ history }: HistoryTableProps) {
  if (history.length === 0) {
    return (
      <Alert severity="info" variant="outlined" sx={{ my: 1 }}>
        No historical snapshots yet. Use "Calculate & save snapshot" to build a timeline.
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ width: '100%', overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Calculated At</TableCell>
            <TableCell>Valuation Date</TableCell>
            <TableCell align="right">Current Value</TableCell>
            <TableCell align="right">Net Invested</TableCell>
            <TableCell align="right">Profit</TableCell>
            <TableCell align="right">IRR</TableCell>
            <TableCell align="right">Simple Rate</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((snapshot, index) => {
            const calculatedAt = format(new Date(snapshot.calculationDateTime), DATE_TIME_FORMAT);
            const formatPercent = (value: number | null): string => (value !== null ? `${(value * 100).toFixed(2)}%` : "N/A");
            return (
              <TableRow key={`${snapshot.calculationDateTime}-${index}`}>
                <TableCell>{calculatedAt}</TableCell>
                <TableCell>{snapshot.valuationDate}</TableCell>
                <TableCell align="right">{snapshot.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                <TableCell align="right">{snapshot.netInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                <TableCell align="right">
                  <Typography color={snapshot.profit > 0 ? 'success.main' : snapshot.profit < 0 ? 'error.main' : 'text.primary'}>
                    {snapshot.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                <TableCell align="right">{formatPercent(snapshot.irr)}</TableCell>
                <TableCell align="right">{formatPercent(snapshot.simpleRate)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default HistoryTable;
