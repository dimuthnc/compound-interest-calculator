import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { SummaryFund } from "../../types";
import { parseSummaryFundJson, addOrReplaceFund, removeFund } from "../../domain/summarySchema";
import { RateComparisonChart } from "./RateComparisonChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ArrowLeft, Calculator } from "lucide-react";

export function SummaryPage() {
  const [funds, setFunds] = useState<SummaryFund[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportClick = () => {
    setError(null);
    setSuccessMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const errors: string[] = [];
    const importedFunds: SummaryFund[] = [];
    const replacedFunds: string[] = [];

    // Process all selected files
    for (const file of Array.from(files)) {
      try {
        const text = await readFileAsText(file);
        const json = JSON.parse(text);
        const parsed = parseSummaryFundJson(json);

        if (parsed instanceof Error) {
          errors.push(`${file.name}: ${parsed.message}`);
        } else {
          // Check if this fund already exists
          const existingFund = funds.find(
            (f) => f.fundName.toLowerCase() === parsed.fundName.toLowerCase()
          );
          if (existingFund) {
            replacedFunds.push(parsed.fundName);
          }
          importedFunds.push(parsed);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${file.name}: ${message}`);
      }
    }

    // Update state with all successfully imported funds
    if (importedFunds.length > 0) {
      setFunds((prevFunds) => {
        let updated = [...prevFunds];
        for (const newFund of importedFunds) {
          updated = addOrReplaceFund(updated, newFund);
        }
        return updated;
      });

      const messages: string[] = [];
      if (importedFunds.length > 0) {
        messages.push(`Successfully imported ${importedFunds.length} fund(s).`);
      }
      if (replacedFunds.length > 0) {
        messages.push(`Replaced existing: ${replacedFunds.join(", ")}.`);
      }
      setSuccessMessage(messages.join(" "));
    }

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFund = (fundName: string) => {
    setFunds((prevFunds) => removeFund(prevFunds, fundName));
    setSuccessMessage(null);
    setError(null);
  };

  const handleClearAll = () => {
    setFunds([]);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Fund Summary
              </h1>
              <p className="text-sm text-slate-600">
                Compare IRR and Simple Rate across multiple funds
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Calculator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Fund Files</CardTitle>
              <CardDescription>
                Import JSON files exported from the calculator. You can select multiple files at once.
                If a fund with the same name is imported again, it will replace the existing one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button onClick={handleImportClick} className="w-full sm:w-auto">
                  <Upload className="mr-2 h-4 w-4" />
                  Import JSON Files
                </Button>
                {funds.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleClearAll}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Funds
                  </Button>
                )}
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 whitespace-pre-line">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Imported Funds List */}
          {funds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Imported Funds ({funds.length})</CardTitle>
                <CardDescription>
                  Funds currently loaded for comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {funds.map((fund) => (
                    <div
                      key={fund.fundName}
                      className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm"
                    >
                      <Calculator className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-slate-700">
                        {fund.fundName}
                      </span>
                      <span className="text-sm text-slate-500">
                        ({fund.history.length} snapshot{fund.history.length !== 1 ? "s" : ""})
                      </span>
                      {/* Show indicator if any snapshot was dynamically calculated */}
                      {fund.history.some((s) => s.isDynamicallyCalculated) && (
                        <span
                          className="text-xs text-amber-600"
                          title="Some metrics were calculated dynamically"
                        >
                          ⚡
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveFund(fund.fundName)}
                        className="ml-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                        title="Remove fund"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {funds.some((f) => f.history.some((s) => s.isDynamicallyCalculated)) && (
                  <p className="mt-3 text-xs text-amber-600">
                    ⚡ Some funds have metrics calculated dynamically from current cash flows (historical data may differ).
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* IRR Comparison Chart */}
            <RateComparisonChart
              funds={funds}
              rateType="irr"
              title="IRR Comparison"
              description="Annualized effective return (XIRR-style) across all funds over time"
            />

            {/* Simple Rate Comparison Chart */}
            <RateComparisonChart
              funds={funds}
              rateType="simpleRate"
              title="Simple Rate Comparison"
              description="Simple annual interest rate (balance × days) across all funds over time"
            />
          </div>

          {/* Empty State */}
          {funds.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Calculator className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">
                    No funds imported yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Import JSON files exported from the Effective Interest Rate Calculator
                    to compare fund performance side by side.
                  </p>
                  <Button onClick={handleImportClick} className="mt-4">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Your First Fund
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Helper to read a file as text using FileReader.
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as text."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

export default SummaryPage;
