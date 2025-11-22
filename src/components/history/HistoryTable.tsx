import { format } from "date-fns";
import type { HistoricalSnapshot } from "../../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface HistoryTableProps {
  history: HistoricalSnapshot[];
}

const DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm";

export function HistoryTable({ history }: HistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="my-1 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800">
        No historical snapshots yet. Use "Calculate & save snapshot" to build a timeline.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Calculation History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Calculated At</TableHead>
                <TableHead>Valuation Date</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Net Invested</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">IRR</TableHead>
                <TableHead className="text-right">Simple Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((snapshot, index) => {
                const calculatedAt = format(new Date(snapshot.calculationDateTime), DATE_TIME_FORMAT);
                const formatPercent = (value: number | null): string => (value !== null ? `${(value * 100).toFixed(2)}%` : "N/A");
                const profitColor = snapshot.profit > 0 ? "text-green-600" : snapshot.profit < 0 ? "text-red-600" : "";
                return (
                  <TableRow key={`${snapshot.calculationDateTime}-${index}`}>
                    <TableCell>{calculatedAt}</TableCell>
                    <TableCell>{snapshot.valuationDate}</TableCell>
                    <TableCell className="text-right">{snapshot.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{snapshot.netInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className={`text-right font-medium ${profitColor}`}>
                      {snapshot.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(snapshot.irr)}</TableCell>
                    <TableCell className="text-right">{formatPercent(snapshot.simpleRate)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default HistoryTable;
