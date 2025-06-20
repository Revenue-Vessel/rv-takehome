"use client";

import React, { useState, useEffect } from 'react';
import HistoricalAnalysis from '../../components/analytics/HistoricalAnalysis';

interface WinRateAnalysis {
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  totalValue: number;
  wonValue: number;
  lostValue: number;
  averageDealSize: number;
  averageWonDealSize: number;
  averageLostDealSize: number;
}

interface HistoricalAnalysisData {
  overall: WinRateAnalysis;
  byTransportationMode: Record<string, WinRateAnalysis>;
  bySalesRep: Record<string, WinRateAnalysis>;
  byDealSize: Record<string, WinRateAnalysis>;
  byTimePeriod: Record<string, WinRateAnalysis>;
  insights: string[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<HistoricalAnalysisData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalAnalysis = async (filters?: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });
      }

      const response = await fetch(`/api/analytics/historical?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching historical analysis:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalAnalysis();
  }, []);

  const handleFiltersChange = (filters: Record<string, string>) => {
    fetchHistoricalAnalysis(filters);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sales Analytics
          </h1>
          <p className="text-gray-600">
            Analyze win rates, performance trends, and identify coaching opportunities across your sales team
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading analytics data
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => fetchHistoricalAnalysis()}
                    className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Dashboard */}
        <HistoricalAnalysis 
          data={data} 
          loading={loading} 
          onFiltersChange={handleFiltersChange}
        />

        {/* Additional Context */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How to Use This Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">For Sales Leaders</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Use filters to analyze specific time periods, transportation modes, or sales reps</li>
                <li>• Click &quot;Filter Results&quot; to apply your selections and see updated analytics</li>
                <li>• Identify performance gaps between deal sizes to target coaching efforts</li>
                <li>• Compare win rates across transportation modes to optimize resource allocation</li>
                <li>• Use insights to identify top performers who can mentor struggling team members</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Key Metrics Explained</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Win Rate:</strong> Percentage of closed deals that were won</li>
                <li>• <strong>Average Deal Size:</strong> Mean value of deals in the category</li>
                <li>• <strong>Total Value:</strong> Sum of all deal values in the category</li>
                <li>• <strong>Deal Count:</strong> Number of deals in each category</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 