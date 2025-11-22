import type React from "react";
import { useRef, useState } from "react";
import type { CalculatorState } from "../../types";
import { buildExportJson, parseImportedJson } from "../../domain/jsonSchema";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";

export interface ImportExportPanelProps {
  calculatorState: CalculatorState;
  onImportScenario(nextState: CalculatorState): void;
}

export function ImportExportPanel({ calculatorState, onImportScenario }: ImportExportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImportClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result;
        if (typeof text !== "string") throw new Error("Unable to read file contents as text.");
        const json = JSON.parse(text);
        const parsed = parseImportedJson(json);
        if (parsed instanceof Error) { setError(parsed.message); return; }
        onImportScenario(parsed);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to import JSON scenario.";
        setError(message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => setError("Failed to read the selected file.");
    reader.readAsText(file);
  };

  const handleExportClick = () => {
    try {
      const exportJson = buildExportJson(calculatorState);
      const blob = new Blob([JSON.stringify(exportJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0,10);
      const baseName = (calculatorState.fundName && calculatorState.fundName.trim() !== '')
        ? calculatorState.fundName.trim().replace(/[^A-Za-z0-9_-]+/g, '_')
        : 'effective-interest-scenario';
      link.download = `${baseName}_${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export JSON scenario.';
      setError(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Import / Export</CardTitle>
        <CardDescription>
          Save or load your scenario, including cash flows and history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import JSON
          </Button>
          <Button className="w-full" onClick={handleExportClick}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />
        {error && (
          <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ImportExportPanel;
