import type { CashFlowEntry } from "../../types";
import CashFlowRow from "./CashFlowRow";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Cash Flows</CardTitle>
          <Button size="sm" onClick={onAddCashFlow}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasCashFlows && (
          <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800">
            Add at least one deposit to start. Use the Add button above to enter your initial investment.
          </div>
        )}
        <div className="space-y-2">
          {cashFlows.map((entry) => (
            <CashFlowRow
              key={entry.id}
              entry={entry}
              onUpdate={onUpdateCashFlow}
              onDelete={onDeleteCashFlow}
            />
          ))}
        </div>
        {hasCashFlows && (
          <p className="mt-3 text-xs text-muted-foreground">
            Deposits increase invested capital; withdrawals reduce it.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default CashFlowTable;
