"use client";

import React, { useState } from 'react';
import RevenueForecastChart from './RevenueForecastChart';

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

interface RevenueForecastProps {
  forecast?: RevenueForecast[];
  insights?: ForecastInsights;
  loading?: boolean;
  onFiltersChange?: (filters: any) => void;
}

export default function RevenueForecast({ 
  forecast, 
  insights, 
  loading = false, 
  onFiltersChange 
}: RevenueForecastProps) {
  const [filters, setFilters] = useState({
    transportationMode: '',
    salesRep: '',
    dealSizeCategory: '',
    startDate: '',
    endDate: '',
    monthsToForecast: '6',
    quotaTarget: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    transportationMode: '',
    salesRep: '',
    dealSizeCategory: '',
    startDate: '',
    endDate: '',
    monthsToForecast: '6',
    quotaTarget: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    onFiltersChange?.(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      transportationMode: '',
      salesRep: '',
      dealSizeCategory: '',
      startDate: '',
      endDate: '',
      monthsToForecast: '6',
      quotaTarget: ''
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗';
      case 'decreasing': return '↘';
      default: return '→';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const hasActiveFilters = Object.values(appliedFilters).some(value => value !== '' && value !== '6');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!forecast || !insights) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No forecast data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Forecast Filters</h2>
          <div className="flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Update Forecast
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transportation Mode
            </label>
            <select
              value={filters.transportationMode}
              onChange={(e) => handleFilterChange('transportationMode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Modes</option>
              <option value="trucking">Trucking</option>
              <option value="rail">Rail</option>
              <option value="ocean">Ocean</option>
              <option value="air">Air</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sales Rep
            </label>
            <input
              type="text"
              value={filters.salesRep}
              onChange={(e) => handleFilterChange('salesRep', e.target.value)}
              placeholder="Enter name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Size
            </label>
            <select
              value={filters.dealSizeCategory}
              onChange={(e) => handleFilterChange('dealSizeCategory', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sizes</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
          
          {/* Date filters commented out for now
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Closed After
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Closed Before
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          */}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forecast Months
            </label>
            <select
              value={filters.monthsToForecast}
              onChange={(e) => handleFilterChange('monthsToForecast', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">12 Months</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quota Target
            </label>
            <input
              type="number"
              value={filters.quotaTarget}
              onChange={(e) => handleFilterChange('quotaTarget', e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Predicted Revenue</h3>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(insights.totalPredictedRevenue)}</div>
          <p className="text-sm text-gray-500 mt-1">Next {appliedFilters.monthsToForecast} months</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average Monthly Revenue</h3>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(insights.averageMonthlyRevenue)}</div>
          <p className="text-sm text-gray-500 mt-1">Monthly average</p>
        </div>
        
        {insights.quotaTarget && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Quota Gap</h3>
            <div className={`text-2xl font-bold ${insights.quotaGap && insights.quotaGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {insights.quotaGap ? formatCurrency(Math.abs(insights.quotaGap)) : 'On Track'}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {insights.quotaGap && insights.quotaGap > 0 ? 'Below target' : 'Above target'}
            </p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Forecast Confidence</h3>
          <div className="text-2xl font-bold text-gray-900">
            {formatPercentage(forecast.reduce((sum, month) => sum + month.confidence, 0) / forecast.length)}
          </div>
          <p className="text-sm text-gray-500 mt-1">Average confidence</p>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Forecast Insights</h3>
          <div className="space-y-3">
            <p className="text-blue-700">{insights.trendAnalysis}</p>
            
            {insights.riskFactors.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Risk Factors:</h4>
                <ul className="space-y-1">
                  {insights.riskFactors.map((risk, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">⚠</span>
                      <span className="text-blue-700 text-sm">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {insights.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">→</span>
                <span className="text-green-700 text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Revenue Forecast Chart */}
      <RevenueForecastChart forecast={forecast} insights={insights} />

      {/* Monthly Forecast */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Monthly Revenue Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forecast.map((month) => (
            <div key={month.month} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{month.month}</h3>
                <span className={`text-lg font-bold ${getTrendColor(month.trend)}`}>
                  {getTrendIcon(month.trend)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Predicted Revenue:</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(month.predictedRevenue)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Confidence:</span>
                  <span className={`text-sm font-semibold ${getConfidenceColor(month.confidence)}`}>
                    {formatPercentage(month.confidence)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Deals in Pipeline:</span>
                  <span className="text-sm font-semibold text-gray-900">{month.dealCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Historical Avg:</span>
                  <span className="text-sm text-gray-500">{formatCurrency(month.historicalAverage)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 