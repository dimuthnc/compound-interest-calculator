import "./index.css";
import Layout from "./components/layout/Layout";
import { useCalculator } from "./hooks/useCalculator";
import CashFlowTable from "./components/cashflow/CashFlowTable";
import CurrentValueForm from "./components/current/CurrentValueForm";
import ResultsPanel from "./components/results/ResultsPanel";
import HistoryTable from "./components/history/HistoryTable";
import HistoryChart from "./components/history/HistoryChart";
import ImportExportPanel from "./components/io/ImportExportPanel";
import { Card, CardContent, CardHeader, Button, Alert, Stack, Typography, Box } from "@mui/material";
import AssessmentOutlined from "@mui/icons-material/AssessmentOutlined";
import DeleteSweepOutlined from "@mui/icons-material/DeleteSweepOutlined";

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
  } = useCalculator();

  return (
    <Layout>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {/* Row 1: Cash Flows (span 6), Current Value (span 3), Import/Export (span 3) */}
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6' } }}>
          <CashFlowTable
            cashFlows={state.cashFlows}
            onAddCashFlow={addCashFlow}
            onUpdateCashFlow={updateCashFlow}
            onDeleteCashFlow={deleteCashFlow}
          />
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardHeader titleTypographyProps={{ variant: 'h2', fontSize: '1rem' }} title="Fund Details" />
            <CardContent>
              <CurrentValueForm
                valuationDate={state.valuationDate}
                currentValue={state.currentValue}
                fundName={state.fundName ?? null}
                onValuationDateChange={setValuationDate}
                onCurrentValueChange={setCurrentValue}
                onFundNameChange={setFundName}
              />
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}>
          <ImportExportPanel calculatorState={state} onImportScenario={importScenario} />
        </Box>

        {/* Row 2: Results (wide) and Actions */}
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 8' } }}>
          <ResultsPanel netInvested={netInvested} profit={profit} irr={irr} simpleRate={simpleRate} />
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardHeader titleTypographyProps={{ variant: 'h2', fontSize: '1rem' }} title="Actions" />
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
                <Button onClick={saveSnapshot} variant="contained" size="medium" startIcon={<AssessmentOutlined />} color="primary" sx={{ whiteSpace: 'nowrap' }}>
                  Save Snapshot
                </Button>
                <Button onClick={clearAll} variant="outlined" size="medium" color="error" startIcon={<DeleteSweepOutlined />} sx={{ whiteSpace: 'nowrap' }}>
                  Clear All
                </Button>
              </Stack>
              {saveSnapshotResult?.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {saveSnapshotResult.error}
                </Alert>
              )}
              <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                Clear All resets cash flows, valuation, current value, and history, and wipes the saved session.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Row 3: History table (wide) */}
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 8' } }}>
          <Card variant="outlined">
            <CardHeader titleTypographyProps={{ variant: 'h2', fontSize: '1rem' }} title="History" />
            <CardContent>
              <HistoryTable history={state.history} />
            </CardContent>
          </Card>
        </Box>

        {/* Row 4: History chart (wide) */}
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 8' } }}>
          <Card variant="outlined">
            <CardHeader titleTypographyProps={{ variant: 'h2', fontSize: '1rem' }} title="History Chart" />
            <CardContent>
              <HistoryChart history={state.history} />
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Layout>
  );
}

export default App;
