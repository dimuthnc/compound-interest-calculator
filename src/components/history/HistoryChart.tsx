import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";
import type { TooltipItem } from "chart.js";
import { Line } from "react-chartjs-2";
import type { HistoricalSnapshot } from "../../types";
import { Paper, Alert } from "@mui/material";

// Register Chart.js components once for this module.
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Legend,
);

export interface HistoryChartProps {
  history: HistoricalSnapshot[];
}

export function HistoryChart({ history }: HistoryChartProps) {
  if (history.length < 2) {
    return (
      <Alert
        severity="info"
        variant="outlined"
        sx={{ mt: 2 }}
      >
        Add more snapshots over time to see a trend line.
      </Alert>
    );
  }

  const sorted = [...history].sort((a, b) =>
    a.calculationDateTime.localeCompare(b.calculationDateTime),
  );

  const labels = sorted.map((s) => s.calculationDateTime);

  const irrData = sorted.map((s) => (s.irr !== null ? s.irr * 100 : null));
  const simpleRateData = sorted.map((s) =>
    s.simpleRate !== null ? s.simpleRate * 100 : null,
  );

  const data = {
    labels,
    datasets: [
      {
        label: "IRR",
        data: irrData,
        borderColor: "#0f766e", // teal-700
        backgroundColor: "rgba(15, 118, 110, 0.1)",
        tension: 0.25,
        spanGaps: true,
        pointRadius: 3,
        pointHoverRadius: 4,
      },
      {
        label: "Simple rate",
        data: simpleRateData,
        borderColor: "#1d4ed8", // blue-700
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.25,
        spanGaps: true,
        pointRadius: 3,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false as const,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"line">) => {
            const label = ctx.dataset.label || "";
            const value = ctx.parsed.y as number | null | undefined;
            if (value === null || value === undefined) return `${label}: N/A`;
            return `${label}: ${value.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Calculation time",
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Rate (%)",
        },
        ticks: {
          callback: (value: number | string) => `${value}%`,
        },
      },
    },
  };

  return (
    <Paper variant="outlined" sx={{ mt: 2, height: 280, p: 2 }}>
      <Line data={data} options={options} />
    </Paper>
  );
}

export default HistoryChart;
