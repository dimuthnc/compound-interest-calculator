import "./index.css";
import Layout from "./components/layout/Layout";
import { useCalculator } from "./hooks/useCalculator";
import CashFlowTable from "./components/cashflow/CashFlowTable";
import CurrentValueForm from "./components/current/CurrentValueForm";
import ResultsPanel from "./components/results/ResultsPanel";
import HistoryTable from "./components/history/HistoryTable";
import HistoryChart from "./components/history/HistoryChart";
import ImportExportPanel from "./components/io/ImportExportPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Trash2 } from "lucide-react";

function App() {
  const {
    state,
    netInvested,
    profit,
    irr,
    simpleRate,
    saveSnapshotResult,
    addCashFlow,
    updateCashFlow,
    deleteCashFlow,
    setValuationDate,
    setCurrentValue,
    saveSnapshot,
    importScenario,
    clearAll,
    setFundName,
    deleteHistorySnapshot,
    updateHistorySnapshot,
  } = useCalculator();

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Row 1: Cash Flows (span 6), Current Value (span 3), Import/Export (span 3) */}
        <div className="md:col-span-12 lg:col-span-6">
          <CashFlowTable
            cashFlows={state.cashFlows}
            onAddCashFlow={addCashFlow}
            onUpdateCashFlow={updateCashFlow}
            onDeleteCashFlow={deleteCashFlow}
          />
        </div>

        <div className="md:col-span-6 lg:col-span-3">
          <CurrentValueForm
            valuationDate={state.valuationDate}
            currentValue={state.currentValue}
            fundName={state.fundName ?? null}
            onValuationDateChange={setValuationDate}
            onCurrentValueChange={setCurrentValue}
            onFundNameChange={setFundName}
          />
        </div>

        <div className="md:col-span-6 lg:col-span-3">
          <ImportExportPanel calculatorState={state} onImportScenario={importScenario} />
        </div>

        {/* Row 2: Results (wide) and Actions */}
        <div className="md:col-span-12 lg:col-span-8">
          <ResultsPanel netInvested={netInvested} profit={profit} irr={irr} simpleRate={simpleRate} />
        </div>

        <div className="md:col-span-12 lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={saveSnapshot} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Snapshot
                </Button>
                <Button onClick={clearAll} variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
              {saveSnapshotResult?.error && (
                <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                  {saveSnapshotResult.error}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                "Clear All" resets everything, including cash flows, valuation, and history. This action cannot be undone.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: History Table */}
        <div className="md:col-span-12">
          <HistoryTable
            history={state.history}
            cashFlows={state.cashFlows}
            onDeleteSnapshot={deleteHistorySnapshot}
            onUpdateSnapshot={updateHistorySnapshot}
          />
        </div>

        {/* Row 4: History Chart */}
        <div className="md:col-span-12">
          <HistoryChart history={state.history} cashFlows={state.cashFlows} />
        </div>
      </div>
    </Layout>
  );
}

export default App;
