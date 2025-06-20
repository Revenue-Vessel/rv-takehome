'use client';

import { useState, useEffect } from 'react';
import { DealTrend, TrendInsights, TrendFilters } from '../../lib/business/deals/trendDetection';
import TrendFiltersComponent from '../../components/trends/TrendFilters';
import TrendInsightsCards from '../../components/trends/TrendInsightsCards';
import TrendDealsTable from '../../components/trends/TrendDealsTable';
import RiskDistributionChart from '../../components/trends/RiskDistributionChart';

export default function TrendsPage() {
  const [trends, setTrends] = useState<DealTrend[]>([]);
  const [insights, setInsights] = useState<TrendInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<TrendFilters>({});

  const fetchTrends = async (filters: TrendFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trends data');
      }

      const result = await response.json();
      
      if (result.success) {
        setTrends(result.data.trends);
        setInsights(result.data.insights);
      } else {
        throw new Error(result.error || 'Failed to fetch trends data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const handleFiltersApply = (filters: TrendFilters) => {
    setAppliedFilters(filters);
    fetchTrends(filters);
  };

  if (loading && !trends.length) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Trends</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => fetchTrends()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Deal Trend Analysis</h1>
          <p className="text-gray-600">
            Identify stalling deals and prioritize your time with risk-based scoring
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <TrendFiltersComponent 
            onApplyFilters={handleFiltersApply} 
            appliedFilters={appliedFilters}
          />
        </div>

        {/* Insights Cards */}
        {insights && (
          <div className="mb-8">
            <TrendInsightsCards insights={insights} />
          </div>
        )}

        {/* Charts */}
        {insights && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
              <RiskDistributionChart insights={insights} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(insights.dealsByPriority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="capitalize text-gray-700">{priority}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            priority === 'urgent' ? 'bg-red-500' :
                            priority === 'high' ? 'bg-orange-500' :
                            priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(count / insights.totalDeals) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deals Table */}
        <div className="bg-white rounded-lg shadow">
          <TrendDealsTable trends={trends} loading={loading} />
        </div>
      </div>
    </div>
  );
} 