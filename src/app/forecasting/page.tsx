"use client";

import React, { useState, useEffect } from 'react';
import RevenueForecast from '../../components/forecasting/RevenueForecast';

interface RevenueForecast {
  month: string;
  predictedRevenue: number;
  confidence: number;
  dealCount: number;
  weightedValue: number;
  historicalAverage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface ForecastInsights {
  totalPredictedRevenue: number;
  averageMonthlyRevenue: number;
  trendAnalysis: string;
  riskFactors: string[];
  recommendations: string[];
  quotaGap?: number;
  quotaTarget?: number;
}

export default function ForecastingPage() {
  const [forecast, setForecast] = useState<RevenueForecast[]>([]);
  const [insights, setInsights] = useState<ForecastInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Convert filters to query parameters
      const params = new URLSearchParams();
      
      if (filters.transportationMode) {
        params.append('transportationMode', filters.transportationMode);
      }
      if (filters.salesRep) {
        params.append('salesRep', filters.salesRep);
      }
      if (filters.dealSizeCategory) {
        params.append('dealSizeCategory', filters.dealSizeCategory);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.monthsToForecast) {
        params.append('monthsToForecast', filters.monthsToForecast);
      }
      if (filters.quotaTarget) {
        params.append('quotaTarget', filters.quotaTarget);
      }

      const response = await fetch(`/api/forecasting/revenue?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setForecast(data.data.forecast);
        setInsights(data.data.insights);
      } else {
        throw new Error(data.message || 'Failed to fetch forecast data');
      }
    } catch (err) {
      console.error('Error fetching forecast:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching forecast data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const handleFiltersChange = (filters: any) => {
    fetchForecast(filters);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Forecast</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => fetchForecast()}
                    className="bg-red-100 text-red-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue Forecasting</h1>
          <p className="text-gray-600">
            Predict monthly revenue based on current pipeline and historical patterns. 
            Understand if you're on track to hit quota and identify areas for improvement.
          </p>
        </div>

        {/* Forecast Component */}
        <RevenueForecast
          forecast={forecast}
          insights={insights}
          loading={loading}
          onFiltersChange={handleFiltersChange}
        />
      </div>
    </div>
  );
} 