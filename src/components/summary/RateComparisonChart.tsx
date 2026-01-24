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
import "chartjs-adapter-date-fns";
import type { TooltipItem } from "chart.js";
import { Line } from "react-chartjs-2";
import type { SummaryFund } from "../../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Register Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Legend
);

// Color palette for different funds
const FUND_COLORS = [
  { border: "#0f766e", background: "rgba(15, 118, 110, 0.1)" },   // teal
  { border: "#1d4ed8", background: "rgba(29, 78, 216, 0.1)" },    // blue
  { border: "#dc2626", background: "rgba(220, 38, 38, 0.1)" },    // red
  { border: "#7c3aed", background: "rgba(124, 58, 237, 0.1)" },   // violet
  { border: "#ea580c", background: "rgba(234, 88, 12, 0.1)" },    // orange
  { border: "#16a34a", background: "rgba(22, 163, 74, 0.1)" },    // green
  { border: "#0891b2", background: "rgba(8, 145, 178, 0.1)" },    // cyan
  { border: "#be185d", background: "rgba(190, 24, 93, 0.1)" },    // pink
  { border: "#854d0e", background: "rgba(133, 77, 14, 0.1)" },    // yellow-dark
  { border: "#4338ca", background: "rgba(67, 56, 202, 0.1)" },    // indigo
];

export type RateType = "irr" | "simpleRate";

export interface RateComparisonChartProps {
  funds: SummaryFund[];
  rateType: RateType;
  title: string;
  description: string;
}

export function RateComparisonChart({
  funds,
  rateType,
  title,
  description,
}: RateComparisonChartProps) {
  // Check if we have enough data to render a chart
  const fundsWithHistory = funds.filter((f) => f.history.length > 0);

  if (fundsWithHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800">
            Import fund files to see comparison charts.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build datasets for each fund
  const datasets = fundsWithHistory.map((fund, index) => {
    const colorIndex = index % FUND_COLORS.length;
    const color = FUND_COLORS[colorIndex];

    // Sort history by valuation date for proper line rendering
    const sortedHistory = [...fund.history].sort((a, b) =>
      a.valuationDate.localeCompare(b.valuationDate)
    );

    const dataPoints = sortedHistory.map((snapshot) => {
      const rate = rateType === "irr" ? snapshot.irr : snapshot.simpleRate;
      return {
        x: snapshot.valuationDate,
        y: rate !== null ? rate * 100 : null, // Convert to percentage
      };
    });

    return {
      label: fund.fundName,
      data: dataPoints,
      borderColor: color.border,
      backgroundColor: color.background,
      tension: 0.25,
      spanGaps: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    };
  });

  const data = {
    datasets,
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
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<"line">[]) => {
            if (items.length > 0) {
              const date = items[0].parsed.x;
              // Format the date nicely
              if (typeof date === "number") {
                return new Date(date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              }
            }
            return "";
          },
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
          displayFormats: {
            day: "MMM d",
            week: "MMM d",
            month: "MMM yyyy",
          },
        },
        title: {
          display: true,
          text: "Valuation Date",
          font: {
            weight: "bold" as const,
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: rateType === "irr" ? "IRR (%)" : "Simple Rate (%)",
          font: {
            weight: "bold" as const,
          },
        },
        ticks: {
          callback: (value: string | number) => `${value}%`,
        },
      },
    },
  };

  // Create a unique key based on funds data to force re-render on changes
  const chartKey = JSON.stringify(
    funds.map((f) => ({
      name: f.fundName,
      historyLength: f.history.length,
      lastDate: f.history[f.history.length - 1]?.valuationDate,
    }))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[350px]">
          <Line key={chartKey} data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

export default RateComparisonChart;
