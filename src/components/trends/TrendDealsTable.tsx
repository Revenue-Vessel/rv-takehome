'use client';

import { useState } from 'react';
import { DealTrend } from '../../lib/business/deals/trendDetection';
import React from 'react';

interface TrendDealsTableProps {
  trends: DealTrend[];
  loading: boolean;
}

export default function TrendDealsTable({ trends, loading }: TrendDealsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (dealId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(dealId)) {
      newExpanded.delete(dealId);
    } else {
      newExpanded.add(dealId);
    }
    setExpandedRows(newExpanded);
  };

  const getRiskLevelColor = (level: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || colors.low;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const getStallingColor = (isStalling: boolean) => {
    return isStalling ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No deals match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Deal Trends ({trends.length} deals)
        </h3>
        
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days in Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trends.map((trend) => (
                <React.Fragment key={trend.dealId}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {trend.companyName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {trend.salesRep} • {trend.transportationMode}
                        </div>
                        <div className="text-sm text-gray-500">
                          {trend.currentStage.replace('_', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${trend.value.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(trend.riskLevel)}`}>
                          {trend.riskLevel}
                        </span>
                        <span className="text-sm text-gray-900">{trend.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(trend.priority)}`}>
                        {trend.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStallingColor(trend.isStalling)}`}>
                        {trend.isStalling ? 'Stalling' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {trend.daysInStage} days
                      </div>
                      <div className="text-sm text-gray-500">
                        Closes in {trend.daysUntilClose} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleRow(trend.dealId)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        {expandedRows.has(trend.dealId) ? 'Hide Details' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row */}
                  {expandedRows.has(trend.dealId) && (
                    <tr key={`${trend.dealId}-expanded`}>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Risk Factors */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Risk Factors</h4>
                            <ul className="space-y-2">
                              {trend.riskFactors.map((factor, index) => (
                                <li key={`${trend.dealId}-risk-${index}`} className="text-sm text-gray-600 flex items-start">
                                  <span className="text-red-500 mr-2">•</span>
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Recommendations */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h4>
                            <ul className="space-y-2">
                              {trend.recommendations.map((rec, index) => (
                                <li key={`${trend.dealId}-rec-${index}`} className="text-sm text-gray-600 flex items-start">
                                  <span className="text-blue-500 mr-2">→</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 