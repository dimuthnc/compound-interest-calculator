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
import 'chartjs-adapter-date-fns';
import type { TooltipItem } from "chart.js";
import { Line } from "react-chartjs-2";
import type { CashFlowEntry, HistoricalSnapshot } from "../../types";
import { computeSnapshotMetrics } from "../../domain/cashflow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
  cashFlows: CashFlowEntry[]; // Used to calculate metrics dynamically
}

export function HistoryChart({ history, cashFlows }: HistoryChartProps) {
  if (history.length < 2) {
    return (
      <div className="mt-2 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800">
        Add at least two snapshots over time to see a trend line.
      </div>
    );
  }

  const sorted = [...history].sort((a, b) =>
    a.valuationDate.localeCompare(b.valuationDate),
  );

  const labels = sorted.map((s) => s.valuationDate);

  // Compute metrics dynamically for each snapshot (only once per snapshot)
  const metricsData = sorted.map((s) => computeSnapshotMetrics(s, cashFlows));
  const irrData = metricsData.map((m) => m.irr !== null ? m.irr * 100 : null);
  const simpleRateData = metricsData.map((m) => m.simpleRate !== null ? m.simpleRate * 100 : null);

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
        type: "time" as const,
        time: {
          unit: "day" as const,
          tooltipFormat: "MMM d, yyyy",
        },
        title: {
          display: true,
          text: "Valuation Date",
        },
        grid: {
          display: false,
        }
      },
      y: {
        title: {
          display: true,
          text: "Annualised Rate (%)",
        },
        ticks: {
          callback: (value: string | number) => `${value}%`,
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance Over Time</CardTitle>
        <CardDescription>
          Visual timeline of IRR and Simple Annual Rate across saved snapshots.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[300px]">
          <Line key={JSON.stringify(history)} data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

export default HistoryChart;
