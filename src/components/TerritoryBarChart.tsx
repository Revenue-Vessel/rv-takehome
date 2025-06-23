"use client";
import React, { useEffect, useMemo, useState } from "react";
import { enrichDeal } from "@/lib/territory";
import { Deal, DealWithTerritory } from "@/lib/types";

interface StageData {
  deals: Deal[];
  count: number;
  percentage: number;
}
interface PipelineData {
  totalDeals: number;
  stageAnalytics: Record<string, StageData>;
}

const territoryColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-violet-500",
];

// Format currency for display
const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
  }).format(v);

const barMaxHeight = 200;

// Borrow component layout from `PipelineFunnel`
const TerritoryBarChart: React.FC = () => {
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        const response = await fetch("/api/deals");
        if (!response.ok) {
          throw new Error("Failed to fetch pipeline data");
        }
        setPipelineData(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchPipelineData();
  }, []);

  // Flatten and enrich
  const allDeals: DealWithTerritory[] = useMemo(() => {
    if (!pipelineData) return [];
    return Object.values(pipelineData.stageAnalytics).flatMap((stageData) =>
      stageData.deals.map(enrichDeal)
    );
  }, [pipelineData]);

  // Group by territory
  const territoryStats = useMemo(() => {
    const stats: Record<string, { count: number; totalValue: number }> = {};
    for (const deal of allDeals) {
      const t = deal.territory ?? "Unknown";
      if (!stats[t]) stats[t] = { count: 0, totalValue: 0 };
      stats[t].count += 1;
      stats[t].totalValue += deal.value;
    }
    return stats;
  }, [allDeals]);

  const dataArr = Object.entries(territoryStats).map(([territory, val], i) => ({
    territory,
    ...val,
    color: territoryColors[i % territoryColors.length],
  }));

  const maxTotalSales = Math.max(...dataArr.map((d) => d.totalValue), 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading data: {error}
      </div>
    );
  }
  if (!dataArr.length) {
    return (
      <div className="text-center text-gray-500 p-4">No data available</div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Total Deals: {allDeals.length}
        </h3>
      </div>
      <div
        className="flex items-end justify-center gap-2 sm:gap-4 md:gap-6"
        style={{ minHeight: barMaxHeight + 60 }}
      >
        {dataArr.map((d) => {
          const barHeight = (d.totalValue / maxTotalSales) * barMaxHeight;
          return (
            <div
              key={d.territory}
              className="flex flex-col items-center"
              style={{ width: 64 }}
            >
              {/* Value above bar if bar is too short */}
              {barHeight < 48 ? (
                <div className="mb-1 text-xs text-gray-700 text-center whitespace-nowrap">
                  <span className="font-bold">{d.count}</span>
                  <span className="ml-1 text-[10px]">deals</span>
                  <br />
                  <span>{formatCurrency(d.totalValue)}</span>
                </div>
              ) : null}
              {/* Bar */}
              <div
                className={`w-12 ${d.color} rounded-t-lg flex flex-col items-center justify-center transition-all duration-300`}
                style={{
                  height: Math.max(barHeight, 16), // min: 16px
                  minHeight: "16px",
                }}
                title={`${d.territory}: ${d.count} deals, ${formatCurrency(
                  d.totalValue
                )}`}
              >
                {/* Value inside bar if bar is tall enough */}
                {barHeight >= 48 ? (
                  <div className="flex flex-col items-center justify-center py-1">
                    <span className="text-sm font-bold text-white">
                      {d.count}
                    </span>
                    <span className="text-[11px] text-white">
                      {formatCurrency(d.totalValue)}
                    </span>
                  </div>
                ) : null}
              </div>
              {/* Territory label */}
              <span
                className="mt-2 text-xs text-gray-700 text-center truncate w-16"
                title={d.territory}
              >
                {d.territory}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-500 text-center mt-4">
        (Bar height = total sales)
      </div>
    </div>
  );
};

export default TerritoryBarChart;
