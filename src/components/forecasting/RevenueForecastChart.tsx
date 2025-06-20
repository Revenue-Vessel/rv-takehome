"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar
} from 'recharts';

interface RevenueForecast {
  month: string;
  predictedRevenue: number;
  confidence: number;
  dealCount: number;
  weightedValue: number;
  historicalAverage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface RevenueForecastChartProps {
  forecast: RevenueForecast[];
  insights?: {
    totalPredictedRevenue: number;
    averageMonthlyRevenue: number;
  };
}

export default function RevenueForecastChart({ forecast, insights }: RevenueForecastChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (monthKey: string) => {
    const date = new Date(monthKey + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Prepare data for the chart
  const chartData = forecast.map(month => ({
    month: formatMonth(month.month),
    monthKey: month.month,
    predictedRevenue: month.predictedRevenue,
    historicalAverage: month.historicalAverage,
    weightedValue: month.weightedValue,
    dealCount: month.dealCount,
    confidence: month.confidence,
    // Calculate confidence interval
    confidenceUpper: month.predictedRevenue * (1 + (1 - month.confidence)),
    confidenceLower: month.predictedRevenue * (1 - (1 - month.confidence)),
    trend: month.trend
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-xl">
          <p className="font-bold text-gray-900 mb-3 text-base">{label}</p>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-semibold text-blue-700">Predicted Revenue:</span>{' '}
              <span className="font-bold text-gray-900">{formatCurrency(data.predictedRevenue)}</span>
            </p>
            <p className="text-sm">
              <span className="font-semibold text-gray-700">Historical Average:</span>{' '}
              <span className="font-bold text-gray-900">{formatCurrency(data.historicalAverage)}</span>
            </p>
            <p className="text-sm">
              <span className="font-semibold text-green-700">Weighted Value:</span>{' '}
              <span className="font-bold text-gray-900">{formatCurrency(data.weightedValue)}</span>
            </p>
            <p className="text-sm">
              <span className="font-semibold text-purple-700">Deals in Pipeline:</span>{' '}
              <span className="font-bold text-gray-900">{data.dealCount}</span>
            </p>
            <p className="text-sm">
              <span className="font-semibold text-orange-700">Confidence:</span>{' '}
              <span className="font-bold text-gray-900">{Math.round(data.confidence * 100)}%</span>
            </p>
            <p className="text-sm">
              <span className="font-semibold text-gray-700">Trend:</span>{' '}
              <span className={`font-bold capitalize ${
                data.trend === 'increasing' ? 'text-green-700' : 
                data.trend === 'decreasing' ? 'text-red-700' : 'text-gray-700'
              }`}>
                {data.trend}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => (
    <div className="flex flex-wrap gap-6 justify-center mt-6 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-600 rounded"></div>
        <span className="font-semibold text-gray-800">Predicted Revenue</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-600 rounded"></div>
        <span className="font-semibold text-gray-800">Historical Average</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-green-600 rounded"></div>
        <span className="font-semibold text-gray-800">Weighted Pipeline Value</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-blue-300 rounded"></div>
        <span className="font-semibold text-gray-800">Confidence Interval</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Revenue Forecast Trend</h3>
        <p className="text-sm text-gray-600">
          Monthly revenue predictions with historical averages and confidence intervals
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Confidence Interval Area */}
            <Area
              type="monotone"
              dataKey="confidenceUpper"
              stackId="1"
              stroke="none"
              fill="#dbeafe"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="confidenceLower"
              stackId="1"
              stroke="none"
              fill="#dbeafe"
              fillOpacity={0.3}
            />
            
            {/* Historical Average Line */}
            <Line
              type="monotone"
              dataKey="historicalAverage"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#9ca3af', strokeWidth: 2, r: 4 }}
              name="Historical Average"
            />
            
            {/* Weighted Pipeline Value Line */}
            <Line
              type="monotone"
              dataKey="weightedValue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="Weighted Pipeline Value"
            />
            
            {/* Predicted Revenue Line */}
            <Line
              type="monotone"
              dataKey="predictedRevenue"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
              name="Predicted Revenue"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <CustomLegend />

      {/* Summary Stats */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(insights.totalPredictedRevenue)}
            </div>
            <div className="text-sm text-gray-600">Total Forecast</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {formatCurrency(insights.averageMonthlyRevenue)}
            </div>
            <div className="text-sm text-gray-600">Monthly Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(forecast.reduce((sum, month) => sum + month.confidence, 0) / forecast.length * 100)}%
            </div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {forecast.reduce((sum, month) => sum + month.dealCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Deals</div>
          </div>
        </div>
      )}
    </div>
  );
} 