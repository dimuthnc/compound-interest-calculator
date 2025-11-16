import { Card, CardContent, CardHeader, Typography, Chip, Alert, Stack, Box } from "@mui/material";

export interface ResultsPanelProps {
  netInvested: number;
  profit: number;
  irr: number | null;
  simpleRate: number | null;
}

export function ResultsPanel({ netInvested, profit, irr, simpleRate }: ResultsPanelProps) {
  const formatCurrency = (value: number): string =>
    value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const formatPercent = (value: number): string => `${(value * 100).toFixed(2)}%`;
  const profitLabel = profit >= 0 ? "Profit" : "Loss";

  return (
    <Card variant="outlined" sx={{ mt: 1 }}>
      <CardHeader titleTypographyProps={{ variant: "h2", fontSize: "1rem" }} title="Results" />
      <CardContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Net Invested</Typography>
            <Typography variant="body1" fontWeight={600}>{formatCurrency(netInvested)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">{profitLabel}</Typography>
            <Typography
              variant="body1"
              fontWeight={600}
              color={profit > 0 ? 'success.main' : profit < 0 ? 'error.main' : 'text.primary'}
            >
              {formatCurrency(profit)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">IRR (Annualised)</Typography>
            {irr !== null ? (
              <Chip label={formatPercent(irr)} color="primary" size="small" />
            ) : (
              <Typography variant="body2" color="text.disabled">N/A</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Simple Annual Rate</Typography>
            {simpleRate !== null ? (
              <Chip label={formatPercent(simpleRate)} color="secondary" size="small" />
            ) : (
              <Typography variant="body2" color="text.disabled">N/A</Typography>
            )}
          </Box>
        </Box>
        {(irr === null || simpleRate === null) && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {irr === null && 'IRR requires at least one deposit and one withdrawal plus a current value. '}
            {simpleRate === null && 'Simple rate requires a current value and at least one cash flow.'}
          </Alert>
        )}
        <Stack mt={2} spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            IRR accounts for cash flow timing via discounting; simple rate averages return over invested balance × time.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ResultsPanel;
