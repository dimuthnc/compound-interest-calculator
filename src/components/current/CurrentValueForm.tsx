import type React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Valuation</CardTitle>
        <CardDescription>
          Provide the fund's name, valuation date, and current value to calculate returns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="fundName">Fund Name (Optional)</Label>
          <Input
            id="fundName"
            type="text"
            value={fundName ?? ''}
            onChange={(e) => onFundNameChange && onFundNameChange(e.target.value.trim() === '' ? null : e.target.value)}
            placeholder="e.g., My Portfolio"
          />
          <p className="text-xs text-muted-foreground">
            Used for exported JSON filename if provided.
          </p>
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="valuationDate">Valuation Date</Label>
          <Input
            id="valuationDate"
            type="date"
            value={valuationDate ?? ''}
            onChange={handleDateChange}
          />
          <p className="text-xs text-muted-foreground">
            The date at which the fund value is measured.
          </p>
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="currentValue">Current Fund Value</Label>
          <Input
            id="currentValue"
            type="number"
            value={currentValue ?? ''}
            onChange={handleCurrentValueChange}
            step="0.01"
            min="0"
            placeholder="e.g., 15000"
          />
          <p className="text-xs text-muted-foreground">
            Enter the fund value at the valuation date.
          </p>
        </div>
        {isCurrentValueMissing && (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            Rates cannot be computed until a current fund value is provided.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CurrentValueForm;
