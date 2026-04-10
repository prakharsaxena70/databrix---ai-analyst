"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { BarChart3, Download } from "lucide-react";
import { cn } from "@/lib/utils";

type ChartPayload = string | PlotlyLikeFigure | null | undefined;

interface PlotlyLikeFigure {
  data?: PlotlyLikeTrace[];
  layout?: PlotlyLikeLayout;
  error?: string;
}

interface PlotlyLikeTrace {
  type?: string;
  name?: string;
  x?: unknown[];
  y?: unknown[];
  orientation?: string;
  mode?: string;
  fill?: string;
  marker?: {
    color?: string | string[];
  };
  marker_color?: string | string[];
  line?: {
    color?: string;
  };
}

interface PlotlyLikeLayout {
  title?: string | { text?: string };
  xaxis?: {
    title?: string | { text?: string };
  };
  yaxis?: {
    title?: string | { text?: string };
  };
}

interface ParsedChart {
  kind: "bar" | "horizontal-bar" | "line" | "area";
  data: Array<Record<string, string | number | null>>;
  series: Array<{ key: string; label: string; color: string }>;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

interface PlotlyChartProps {
  dataJson: ChartPayload;
  chartId?: string;
  showToolbar?: boolean;
  height?: string | number;
}

const CHART_COLORS = ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#6D28D9"];

export function downloadChartPayload(payload: unknown, filename: string) {
  const normalized =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  const blob = new Blob([normalized], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFileName(filename)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function PlotlyChart({
  dataJson,
  chartId,
  showToolbar = true,
  height = "400px",
}: PlotlyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [containerReady, setContainerReady] = useState(false);
  const parsedChart = useMemo(() => parseChartPayload(dataJson), [dataJson]);
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;

  useEffect(() => {
    const element = chartRef.current;
    if (!element) return;

    const updateSize = () => {
      setContainerReady(element.clientWidth > 0 && element.clientHeight > 0);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  if (!parsedChart) {
    return (
      <div className="h-[400px] rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <BarChart3 className="h-8 w-8" />
          <span className="text-xs font-medium">Chart unavailable</span>
        </div>
      </div>
    );
  }

  const downloadName = chartId || parsedChart.title || "data-chart";

  const handleDownload = async () => {
    const svg = chartRef.current?.querySelector("svg");
    if (!svg) {
      downloadChartPayload(dataJson, downloadName);
      return;
    }

    try {
      await downloadSvgAsPng(svg, downloadName);
    } catch (error) {
      console.error("PNG export failed, downloading chart JSON instead.", error);
      downloadChartPayload(dataJson, downloadName);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col",
        showToolbar
          ? "relative rounded-xl border border-border/50 bg-white/80 backdrop-blur-sm p-3 shadow-sm hover:shadow-md transition-shadow duration-300"
          : "w-full h-full"
      )}
      style={{ height: resolvedHeight }}
    >
      {showToolbar && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {parsedChart.title && (
              <p className="text-sm font-semibold text-slate-800">{parsedChart.title}</p>
            )}
            {(parsedChart.xAxisLabel || parsedChart.yAxisLabel) && (
              <p className="text-xs text-slate-500">
                {[parsedChart.xAxisLabel, parsedChart.yAxisLabel].filter(Boolean).join(" / ")}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-white/80 backdrop-blur-sm rounded-lg shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
        </div>
      )}

      <div ref={chartRef} className="min-h-0 flex-1 w-full" id={chartId}>
        {containerReady ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            {renderChart(parsedChart)}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl bg-slate-50 text-xs font-medium text-slate-400">
            Preparing chart...
          </div>
        )}
      </div>
    </div>
  );
}

function renderChart(chart: ParsedChart) {
  const showLegend = chart.series.length > 1;
  const axisLabelStyle = { fontSize: 12, fill: "#64748B" };

  if (chart.kind === "horizontal-bar") {
    return (
      <BarChart
        data={chart.data}
        layout="vertical"
        margin={{ top: 12, right: 24, left: 24, bottom: 12 }}
      >
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#64748B", fontSize: 12 }} tickFormatter={formatAxisValue} />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fill: "#475569", fontSize: 12 }}
          interval={0}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
        {showLegend && <Legend wrapperStyle={legendStyle} />}
        {chart.series.map((series) => (
          <Bar
            key={series.key}
            dataKey={series.key}
            fill={series.color}
            radius={[0, 8, 8, 0]}
            name={series.label}
          >
            {chart.series.length === 1 && (
              <LabelList
                dataKey={series.key}
                position="right"
                formatter={(label) => formatLabelListText(label)}
                style={axisLabelStyle}
              />
            )}
          </Bar>
        ))}
      </BarChart>
    );
  }

  if (chart.kind === "line") {
    return (
      <LineChart data={chart.data} margin={{ top: 12, right: 24, left: 12, bottom: 12 }}>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} />
        <YAxis tick={{ fill: "#64748B", fontSize: 12 }} tickFormatter={formatAxisValue} />
        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
        {showLegend && <Legend wrapperStyle={legendStyle} />}
        {chart.series.map((series) => (
          <Line
            key={series.key}
            type="monotone"
            dataKey={series.key}
            stroke={series.color}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            name={series.label}
          />
        ))}
      </LineChart>
    );
  }

  if (chart.kind === "area") {
    return (
      <AreaChart data={chart.data} margin={{ top: 12, right: 24, left: 12, bottom: 12 }}>
        <defs>
          {chart.series.map((series, index) => (
            <linearGradient key={series.key} id={`area-fill-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={series.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={series.color} stopOpacity={0.06} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} />
        <YAxis tick={{ fill: "#64748B", fontSize: 12 }} tickFormatter={formatAxisValue} />
        <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
        {showLegend && <Legend wrapperStyle={legendStyle} />}
        {chart.series.map((series, index) => (
          <Area
            key={series.key}
            type="monotone"
            dataKey={series.key}
            stroke={series.color}
            fill={`url(#area-fill-${index})`}
            strokeWidth={3}
            name={series.label}
          />
        ))}
      </AreaChart>
    );
  }

  return (
    <BarChart data={chart.data} margin={{ top: 12, right: 24, left: 12, bottom: 24 }}>
      <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="label" tick={{ fill: "#64748B", fontSize: 12 }} />
      <YAxis tick={{ fill: "#64748B", fontSize: 12 }} tickFormatter={formatAxisValue} />
      <Tooltip contentStyle={tooltipStyle} formatter={tooltipFormatter} />
      {showLegend && <Legend wrapperStyle={legendStyle} />}
      {chart.series.map((series) => (
        <Bar
          key={series.key}
          dataKey={series.key}
          fill={series.color}
          radius={[8, 8, 0, 0]}
          name={series.label}
        >
          {chart.series.length === 1 && (
            <LabelList
              dataKey={series.key}
              position="top"
              formatter={(label) => formatLabelListText(label)}
              style={axisLabelStyle}
            />
          )}
        </Bar>
      ))}
    </BarChart>
  );
}

function parseChartPayload(payload: ChartPayload): ParsedChart | null {
  try {
    const parsed = typeof payload === "string" ? (JSON.parse(payload) as PlotlyLikeFigure) : payload;

    if (!parsed || parsed.error || !Array.isArray(parsed.data) || parsed.data.length === 0) {
      return null;
    }

    const traces = parsed.data.filter((trace) => Array.isArray(trace.x) || Array.isArray(trace.y));
    if (traces.length === 0) {
      return null;
    }

    const firstTrace = traces[0];
    const isHorizontalBar = firstTrace.type === "bar" && firstTrace.orientation === "h";
    const isLineLike =
      firstTrace.type === "scatter" ||
      firstTrace.type === "line" ||
      firstTrace.mode?.includes("lines");
    const kind: ParsedChart["kind"] = isHorizontalBar
      ? "horizontal-bar"
      : isLineLike
        ? traces.some((trace) => trace.fill?.includes("tozero")) ? "area" : "line"
        : "bar";

    const dataMap = new Map<string, Record<string, string | number | null>>();
    const orderedLabels: string[] = [];
    const series = traces.map((trace, index) => ({
      key: trace.name || `series_${index + 1}`,
      label: trace.name || `Series ${index + 1}`,
      color: resolveTraceColor(trace, index),
    }));

    traces.forEach((trace, index) => {
      const seriesKey = series[index].key;
      const labelsSource = kind === "horizontal-bar" ? trace.y : trace.x;
      const valuesSource = kind === "horizontal-bar" ? trace.x : trace.y;
      const labels = Array.isArray(labelsSource) ? labelsSource : [];
      const values = Array.isArray(valuesSource) ? valuesSource : [];
      const maxLength = Math.max(labels.length, values.length);

      for (let itemIndex = 0; itemIndex < maxLength; itemIndex += 1) {
        const label = stringifyLabel(labels[itemIndex], itemIndex);
        const numericValue = toNumber(values[itemIndex]);

        if (!dataMap.has(label)) {
          orderedLabels.push(label);
          dataMap.set(label, { label });
        }

        dataMap.get(label)![seriesKey] = numericValue;
      }
    });

    return {
      kind,
      data: orderedLabels.map((label) => dataMap.get(label)!),
      series,
      title: extractText(parsed.layout?.title),
      xAxisLabel: extractText(parsed.layout?.xaxis?.title),
      yAxisLabel: extractText(parsed.layout?.yaxis?.title),
    };
  } catch (error) {
    console.error("Chart parse error:", error);
    return null;
  }
}

function resolveTraceColor(trace: PlotlyLikeTrace, index: number) {
  if (typeof trace.marker_color === "string") {
    return trace.marker_color;
  }
  if (typeof trace.marker?.color === "string") {
    return trace.marker.color;
  }
  if (typeof trace.line?.color === "string") {
    return trace.line.color;
  }
  return CHART_COLORS[index % CHART_COLORS.length];
}

function extractText(value?: string | { text?: string }) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.text;
}

function stringifyLabel(value: unknown, index: number) {
  if (value === null || value === undefined || value === "") {
    return `Item ${index + 1}`;
  }
  return String(value);
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = Number(value.replace(/,/g, ""));
    return Number.isFinite(normalized) ? normalized : null;
  }
  return null;
}

function formatAxisValue(value: string | number) {
  if (typeof value !== "number") return value;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatTooltipValue(value: string | number | undefined | null) {
  if (value == null) return "";
  if (typeof value !== "number") return String(value);
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Recharts `Tooltip` formatter: `value` may be an array for ranged data; `name` may be numeric. */
function tooltipFormatter(
  value: number | string | readonly (string | number)[] | undefined,
  name: string | number | undefined,
  _item?: unknown,
  _index?: number,
  _payload?: unknown
): [string, string] {
  const raw = Array.isArray(value) ? value.map(String).join(", ") : value;
  const nameStr = name === undefined || name === null ? "" : String(name);
  return [formatTooltipValue(raw as string | number | undefined), nameStr];
}

function formatLabelListText(label: string | number | boolean | null | undefined) {
  if (label == null || typeof label === "boolean") return "";
  return formatTooltipValue(label);
}

function sanitizeFileName(value: string) {
  return value.replace(/[^\w-]+/g, "_").toLowerCase();
}

async function downloadSvgAsPng(svg: SVGElement, filename: string) {
  const rect = svg.getBoundingClientRect();
  const width = Math.max(Math.round(rect.width), 600);
  const height = Math.max(Math.round(rect.height), 320);

  const clonedSvg = svg.cloneNode(true) as SVGElement;
  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("width", `${width}`);
  clonedSvg.setAttribute("height", `${height}`);
  clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", "#ffffff");
  clonedSvg.insertBefore(background, clonedSvg.firstChild);

  const serialized = new XMLSerializer().serializeToString(clonedSvg);
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas context unavailable"));
        return;
      }

      context.scale(scale, scale);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        if (!pngBlob) {
          reject(new Error("Failed to generate PNG"));
          return;
        }

        const pngUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${sanitizeFileName(filename)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
        resolve();
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG for export"));
    };
    image.src = url;
  });
}

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #E2E8F0",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
};

const legendStyle = {
  fontSize: 12,
  paddingTop: 8,
};
