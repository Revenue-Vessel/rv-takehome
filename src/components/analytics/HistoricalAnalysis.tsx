"use client";

import React, { useState } from 'react';

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

interface HistoricalAnalysisProps {
  data?: HistoricalAnalysisData;
  loading?: boolean;
  onFiltersChange?: (filters: Record<string, string>) => void;
}

export default function HistoricalAnalysis({ 
  data, 
  loading = false, 
  onFiltersChange 
}: HistoricalAnalysisProps) {
  const [filters, setFilters] = useState({
    transportationMode: '',
    salesRep: '',
    dealSizeCategory: '',
    startDate: '',
    endDate: '',
    stage: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    transportationMode: '',
    salesRep: '',
    dealSizeCategory: '',
    startDate: '',
    endDate: '',
    stage: ''
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
      stage: ''
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

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-600';
    if (winRate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderWinRateCard = (title: string, analysis: WinRateAnalysis, subtitle?: string) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600 mb-4">{subtitle}</p>}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getWinRateColor(analysis.winRate)}`}>
            {analysis.winRate}%
          </div>
          <div className="text-sm text-gray-600">Win Rate</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-800">
            {analysis.totalDeals}
          </div>
          <div className="text-sm text-gray-600">Total Deals</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {analysis.wonDeals}
          </div>
          <div className="text-sm text-gray-600">Won</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">
            {analysis.lostDeals}
          </div>
          <div className="text-sm text-gray-600">Lost</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-gray-800">Total Value</div>
            <div className="text-gray-600">{formatCurrency(analysis.totalValue)}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">Avg Deal Size</div>
            <div className="text-gray-600">{formatCurrency(analysis.averageDealSize)}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInsights = (insights: string[]) => (
    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">Key Insights</h3>
      {insights.length > 0 ? (
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span className="text-blue-700">{insight}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-blue-600">No specific insights available for the current data.</p>
      )}
    </div>
  );

  const hasActiveFilters = Object.values(appliedFilters).some(value => value !== '');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No data available for historical analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Analysis Filters</h2>
          <div className="flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Filter Results
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              value={filters.stage}
              onChange={(e) => handleFilterChange('stage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stages</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overall Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderWinRateCard("Overall Performance", data.overall)}
        {renderInsights(data.insights)}
      </div>

      {/* Transportation Mode Performance */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance by Transportation Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.byTransportationMode).map(([mode, analysis]) => (
            <div key={mode} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 capitalize">{mode}</h3>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getWinRateColor(analysis.winRate)}`}>
                  {analysis.winRate}%
                </div>
                <div className="text-sm text-gray-600">Win Rate</div>
                <div className="text-sm text-gray-500 mt-1">{analysis.totalDeals} deals</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Rep Performance */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance by Sales Representative</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.bySalesRep).map(([rep, analysis]) => (
            <div key={rep} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{rep}</h3>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getWinRateColor(analysis.winRate)}`}>
                  {analysis.winRate}%
                </div>
                <div className="text-sm text-gray-600">Win Rate</div>
                <div className="text-sm text-gray-500 mt-1">{analysis.totalDeals} deals</div>
                <div className="text-xs text-gray-500 mt-1">
                  Avg: {formatCurrency(analysis.averageDealSize)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deal Size Performance */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance by Deal Size</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.byDealSize).map(([size, analysis]) => {
            // Get the range for this deal size
            const getDealSizeRange = (size: string) => {
              switch (size) {
                case 'Small': return '$0 - $10K';
                case 'Medium': return '$10K - $50K';
                case 'Large': return '$50K - $200K';
                case 'Enterprise': return '$200K+';
                default: return '';
              }
            };

            return (
              <div key={size} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{size}</h3>
                  <p className="text-xs text-gray-500">{getDealSizeRange(size)}</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getWinRateColor(analysis.winRate)}`}>
                    {analysis.winRate}%
                  </div>
                  <div className="text-sm text-gray-600">Win Rate</div>
                  <div className="text-sm text-gray-500 mt-1">{analysis.totalDeals} deals</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg: {formatCurrency(analysis.averageDealSize)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 