"use client";
import React, { useEffect, useMemo, useState } from "react";
import { calculateMonthlyForecasts, calculateAverageDealDuration } from "../lib/business/deals/forecast";

interface Deal {
  id: number;
  deal_id: string;
  company_name: string;
  contact_name: string;
  transportation_mode: string;
  stage: string;
  value: number;
  probability: number;
  created_date: string;
  updated_date: string;
  expected_close_date: string;
  sales_rep: string;
  origin_city: string;
  destination_city: string;
  cargo_type?: string;
}

interface PipelineData {
  totalDeals: number;
  stageAnalytics: Record<
    string,
    { deals: Deal[]; count: number; percentage: number }
  >;
}

interface DealForecastProps {
  onCardClick: (month: string, type: 'won' | 'expected' | 'all') => void;
}

const DealForecast: React.FC<DealForecastProps> = ({ onCardClick }) => {
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch("/api/deals");
        if (!response.ok) {
          throw new Error("Failed to fetch deals");
        }
        const data = await response.json();
        setPipelineData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const forecast = useMemo(() => {
    if (!pipelineData) return null;

    // Flatten all deals
    const allDeals: Deal[] = [];
    Object.values(pipelineData.stageAnalytics).forEach((stageData) => {
      allDeals.push(...stageData.deals);
    });

    // Get closed won deals for historical analysis
    const closedWonDeals = pipelineData.stageAnalytics.closed_won?.deals || [];

    // Use current date for forecasting
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const twoMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 2, 1);

    const months = [
      { date: currentMonth, label: currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
      { date: nextMonth, label: nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) },
      { date: twoMonthsAhead, label: twoMonthsAhead.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
    ];

    // Filter deals that are not closed_won or closed_lost
    const activeDeals = allDeals.filter(deal => 
      deal.stage !== 'closed_won' && deal.stage !== 'closed_lost'
    );

    // Get already won deals for current month
    const currentMonthWonDeals = closedWonDeals.filter(deal => {
      const updatedDate = new Date(deal.updated_date);
      return updatedDate.getMonth() === now.getMonth() && 
             updatedDate.getFullYear() === now.getFullYear();
    });

    const monthlyForecasts = calculateMonthlyForecasts(allDeals, closedWonDeals, months);

    return {
      monthlyForecasts,
      totalActiveDeals: activeDeals.length,
      currentMonthWonDealsCount: currentMonthWonDeals.length
    };
  }, [pipelineData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading forecast: {error}
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className="text-center text-gray-500 p-4">No forecast data available</div>
    );
  }

  const forecastCards = forecast.monthlyForecasts.map((monthForecast, index) => ({
    title: `${monthForecast.monthLabel} - Expected Revenue`,
    value: index === 0 
      ? `${formatCurrency(monthForecast.alreadyWon)} / ${formatCurrency(monthForecast.totalRevenue)}`
      : formatCurrency(monthForecast.totalRevenue),
    icon: index === 0 ? "📈" : "🔮",
    color: index === 0 ? "bg-green-500" : "bg-purple-500",
    description: index === 0 
      ? `${forecast.currentMonthWonDealsCount} deals won / ${forecast.currentMonthWonDealsCount + monthForecast.dealCount} deals expected`
      : `${monthForecast.dealCount} deals expected`,
  }));

  return (
    <div className="space-y-6">
      {/* Forecast Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-600 text-lg">📊</span>
          <h3 className="text-lg font-semibold text-blue-800">Forecast Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-600 font-medium">Active Deals:</span> {forecast.totalActiveDeals}
          </div>
          <div>
            <span className="text-blue-600 font-medium">Avg Deal Duration:</span> {Math.round(calculateAverageDealDuration(pipelineData?.stageAnalytics.closed_won?.deals || []))} days
          </div>
          <div>
            <span className="text-blue-600 font-medium">Total Predicted Revenue:</span> {formatCurrency(
              forecast.monthlyForecasts.reduce((sum, month) => sum + month.totalRevenue, 0)
            )}
          </div>
        </div>
      </div>

      {/* Monthly Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecastCards.map((card, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              const monthForecast = forecast.monthlyForecasts[index];
              if (index === 0) {
                // Current month - show all deals for this month
                onCardClick(monthForecast.month, 'all');
              } else {
                // Future months - show expected deals
                onCardClick(monthForecast.month, 'expected');
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500">{card.description}</p>
              </div>
              <div
                className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl`}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Monthly Revenue Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Already Won
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Predicted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deals
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecast.monthlyForecasts.map((month, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {month.monthLabel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(month.alreadyWon)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(month.predictedRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(month.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {month.dealCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DealForecast; 