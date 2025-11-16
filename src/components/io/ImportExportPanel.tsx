import type React from "react";
import { useRef, useState } from "react";
import type { CalculatorState } from "../../types";
import { buildExportJson, parseImportedJson } from "../../domain/jsonSchema";
import { Card, CardHeader, CardContent, Button, Stack, Alert, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';

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
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader titleTypographyProps={{ variant: 'h2', fontSize: '1rem' }} title="Import / Export" />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Import an existing scenario or export current cash flows, valuation and history for backup.
        </Typography>
        <Stack direction="column" spacing={1.5} mb={1}>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleImportClick} size="medium" fullWidth>
            Import JSON
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportClick} size="medium" color="primary" fullWidth>
            Export JSON
          </Button>
        </Stack>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </CardContent>
    </Card>
  );
}

export default ImportExportPanel;
