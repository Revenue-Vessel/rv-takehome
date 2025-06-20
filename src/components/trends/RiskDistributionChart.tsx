'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendInsights } from '../../lib/business/deals/trendDetection';

interface RiskDistributionChartProps {
  insights: TrendInsights;
}

export default function RiskDistributionChart({ insights }: RiskDistributionChartProps) {
  const data = [
    { name: 'Low Risk', value: insights.dealsByRiskLevel.low, color: '#10B981' },
    { name: 'Medium Risk', value: insights.dealsByRiskLevel.medium, color: '#F59E0B' },
    { name: 'High Risk', value: insights.dealsByRiskLevel.high, color: '#F97316' },
    { name: 'Critical Risk', value: insights.dealsByRiskLevel.critical, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / insights.totalDeals) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-gray-600">{data.value} deals ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700">{entry.value}</span>
          <span className="text-sm text-gray-500">
            ({data[index]?.value || 0})
          </span>
        </div>
      ))}
    </div>
  );

  if (insights.totalDeals === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 