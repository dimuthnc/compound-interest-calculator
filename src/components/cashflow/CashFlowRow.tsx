import type { CashFlowEntry } from "../../types";
import type React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";

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
  const handleDirectionChange = (value: string) => {
    onUpdate(entry.id, { direction: value as CashFlowEntry['direction'] });
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:gap-3 items-center" data-testid="cash-flow-row">
      <div className="sm:col-span-4">
        <Input
          type="date"
          value={entry.date}
          onChange={handleDateChange}
          aria-label="Date"
        />
      </div>
      <div className="sm:col-span-3">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={entry.amount}
          onChange={handleAmountChange}
          aria-label="Amount"
          placeholder="Amount"
        />
      </div>
      <div className="sm:col-span-3">
        <Select
          value={entry.direction}
          onValueChange={handleDirectionChange}
        >
          <SelectTrigger aria-label="Direction">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2 text-right">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => onDelete(entry.id)}
                aria-label="delete cash flow"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete cash flow</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default CashFlowRow;
