import { format } from "date-fns";
import { useState } from "react";
import type { CashFlowEntry, HistoricalSnapshot } from "../../types";
import { computeSnapshotMetrics } from "../../domain/cashflow";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X } from "lucide-react";

export interface HistoryTableProps {
  history: HistoricalSnapshot[];
  cashFlows: CashFlowEntry[]; // Used to calculate metrics dynamically
  onDeleteSnapshot: (index: number) => void;
  onUpdateSnapshot: (index: number, patch: Partial<Pick<HistoricalSnapshot, 'valuationDate' | 'currentValue'>>) => void;
}

const DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm";

export function HistoryTable({ history, cashFlows, onDeleteSnapshot, onUpdateSnapshot }: HistoryTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ valuationDate: string; currentValue: string }>({
    valuationDate: '',
    currentValue: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  if (history.length === 0) {
    return (
      <div className="my-1 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800">
        No historical snapshots yet. Use "Calculate & save snapshot" to build a timeline.
      </div>
    );
  }

  const handleEditStart = (index: number, snapshot: HistoricalSnapshot) => {
    setEditingIndex(index);
    setEditValues({
      valuationDate: snapshot.valuationDate,
      currentValue: snapshot.currentValue.toString(),
    });
  };

  const handleEditSave = (index: number) => {
    const currentValue = parseFloat(editValues.currentValue);
    if (isNaN(currentValue) || currentValue <= 0) {
      alert("Please enter a valid positive number for current value");
      return;
    }

    onUpdateSnapshot(index, {
      valuationDate: editValues.valuationDate,
      currentValue,
    });
    setEditingIndex(null);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditValues({ valuationDate: '', currentValue: '' });
  };

  const handleDeleteClick = (index: number) => {
    setShowDeleteConfirm(index);
  };

  const handleDeleteConfirm = (index: number) => {
    onDeleteSnapshot(index);
    setShowDeleteConfirm(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <>
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this historical snapshot? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleDeleteCancel}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteConfirm(showDeleteConfirm)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((snapshot, index) => {
                  const isEditing = editingIndex === index;
                  const calculatedAt = format(new Date(snapshot.calculationDateTime), DATE_TIME_FORMAT);
                  const formatPercent = (value: number | null): string => (value !== null ? `${(value * 100).toFixed(2)}%` : "N/A");

                  // Compute metrics dynamically from current cash flows
                  const metrics = computeSnapshotMetrics(snapshot, cashFlows);
                  const profitColor = metrics.profit > 0 ? "text-green-600" : metrics.profit < 0 ? "text-red-600" : "";

                  return (
                    <TableRow key={`${snapshot.calculationDateTime}-${index}`}>
                      <TableCell className="font-mono text-sm">{calculatedAt}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editValues.valuationDate}
                            onChange={(e) => setEditValues({ ...editValues, valuationDate: e.target.value })}
                            className="w-40"
                          />
                        ) : (
                          snapshot.valuationDate
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValues.currentValue}
                            onChange={(e) => setEditValues({ ...editValues, currentValue: e.target.value })}
                            className="w-32 text-right"
                            step="0.01"
                            min="0"
                          />
                        ) : (
                          snapshot.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        )}
                      </TableCell>
                      <TableCell className="text-right">{metrics.netInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className={`text-right font-medium ${profitColor}`}>
                        {metrics.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(metrics.irr)}</TableCell>
                      <TableCell className="text-right">{formatPercent(metrics.simpleRate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSave(index)}
                                title="Save changes"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleEditCancel}
                                title="Cancel editing"
                              >
                                <X className="h-4 w-4 text-gray-600" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStart(index, snapshot)}
                                title="Edit snapshot"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(index)}
                                title="Delete snapshot"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default HistoryTable;
