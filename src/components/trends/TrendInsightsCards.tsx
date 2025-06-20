'use client';

import { TrendInsights } from '../../lib/business/deals/trendDetection';

interface TrendInsightsCardsProps {
  insights: TrendInsights;
}

export default function TrendInsightsCards({ insights }: TrendInsightsCardsProps) {
  const cards = [
    {
      title: 'Total Active Deals',
      value: insights.totalDeals,
      change: null,
      color: 'blue',
      icon: '📊',
      description: 'Deals in pipeline'
    },
    {
      title: 'Stalling Deals',
      value: insights.stallingDeals,
      change: insights.totalDeals > 0 ? Math.round((insights.stallingDeals / insights.totalDeals) * 100) : 0,
      color: 'red',
      icon: '⏰',
      description: '21+ days in stage'
    },
    {
      title: 'High Risk Deals',
      value: insights.highRiskDeals,
      change: insights.totalDeals > 0 ? Math.round((insights.highRiskDeals / insights.totalDeals) * 100) : 0,
      color: 'orange',
      icon: '⚠️',
      description: 'High or critical risk'
    },
    {
      title: 'Value at Risk',
      value: `$${insights.totalValueAtRisk.toLocaleString()}`,
      change: null,
      color: 'purple',
      icon: '💰',
      description: 'High risk deal value'
    },
    {
      title: 'Avg Risk Score',
      value: insights.averageRiskScore,
      change: null,
      color: 'yellow',
      icon: '📈',
      description: 'Average risk score'
    },
    {
      title: 'Urgent Priority',
      value: insights.dealsByPriority.urgent,
      change: insights.totalDeals > 0 ? Math.round((insights.dealsByPriority.urgent / insights.totalDeals) * 100) : 0,
      color: 'red',
      icon: '🚨',
      description: 'Requires immediate attention'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      green: 'bg-green-50 border-green-200 text-green-800'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl">{card.icon}</div>
            {card.change !== null && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClasses(card.color)}`}>
                {card.change}%
              </span>
            )}
          </div>
          
          <div className="mb-2">
            <p className="text-sm font-medium text-gray-600">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
          
          <p className="text-sm text-gray-500">{card.description}</p>
        </div>
      ))}
    </div>
  );
} 