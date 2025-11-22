import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ResultsPanelProps {
  netInvested: number;
  profit: number;
  irr: number | null;
  simpleRate: number | null;
}

export function ResultsPanel({ netInvested, profit, irr, simpleRate }: ResultsPanelProps) {
  const formatCurrency = (value: number): string =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatPercent = (value: number): string => `${(value * 100).toFixed(2)}%`;
  const profitLabel = profit >= 0 ? "Profit" : "Loss";

  const profitColor = profit > 0 ? "text-green-600" : profit < 0 ? "text-red-600" : "text-foreground";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Results</CardTitle>
        <CardDescription>
          Key performance indicators based on your cash flows and valuation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-muted-foreground">Net Invested</p>
            <p className="text-lg font-semibold">{formatCurrency(netInvested)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-muted-foreground">{profitLabel}</p>
            <p className={`text-lg font-semibold ${profitColor}`}>{formatCurrency(profit)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-muted-foreground">IRR (Annualised)</p>
            {irr !== null ? (
              <Badge variant="default">{formatPercent(irr)}</Badge>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase text-muted-foreground">Simple Annual Rate</p>
            {simpleRate !== null ? (
              <Badge variant="secondary">{formatPercent(simpleRate)}</Badge>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </div>
        </div>
        {(irr === null || simpleRate === null) && (
          <div className="mt-4 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
            {irr === null && 'IRR requires both positive and negative cash flows (e.g., deposits and a final value/withdrawal). '}
            {simpleRate === null && 'Simple rate requires a current value and at least one cash flow.'}
          </div>
        )}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">
            <strong>IRR:</strong> Accounts for the timing of cash flows (time-weighted).
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Simple Rate:</strong> Averages return over the capital invested over time (money-weighted).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ResultsPanel;
