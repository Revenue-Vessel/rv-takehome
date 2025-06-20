'use client';

import { useState, useEffect } from 'react';
import { TrendFilters } from '../../lib/business/deals/trendDetection';

interface TrendFiltersComponentProps {
  onApplyFilters: (filters: TrendFilters) => void;
  appliedFilters?: TrendFilters;
}

export default function TrendFiltersComponent({ onApplyFilters, appliedFilters = {} }: TrendFiltersComponentProps) {
  const [filters, setFilters] = useState({
    transportationMode: '',
    salesRep: '',
    dealSizeCategory: '',
    riskLevel: '',
    priority: '',
    isStalling: ''
  });

  const [appliedFiltersState, setAppliedFiltersState] = useState({
    transportationMode: '',
    salesRep: '',
    dealSizeCategory: '',
    riskLevel: '',
    priority: '',
    isStalling: ''
  });

  // Initialize filters from appliedFilters prop
  useEffect(() => {
    const stringFilters = {
      transportationMode: appliedFilters.transportationMode || '',
      salesRep: appliedFilters.salesRep || '',
      dealSizeCategory: appliedFilters.dealSizeCategory || '',
      riskLevel: appliedFilters.riskLevel || '',
      priority: appliedFilters.priority || '',
      isStalling: appliedFilters.isStalling === true ? 'true' : appliedFilters.isStalling === false ? 'false' : ''
    };
    setFilters(stringFilters);
    setAppliedFiltersState(stringFilters);
  }, [appliedFilters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    // Convert string values to proper types for the API
    const apiFilters: TrendFilters = {
      transportationMode: filters.transportationMode || undefined,
      salesRep: filters.salesRep || undefined,
      dealSizeCategory: filters.dealSizeCategory || undefined,
      riskLevel: filters.riskLevel || undefined,
      priority: filters.priority || undefined,
      isStalling: filters.isStalling === 'true' ? true : filters.isStalling === 'false' ? false : undefined
    };
    
    setAppliedFiltersState(filters);
    onApplyFilters(apiFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      transportationMode: '',
      salesRep: '',
      dealSizeCategory: '',
      riskLevel: '',
      priority: '',
      isStalling: ''
    };
    setFilters(clearedFilters);
    setAppliedFiltersState(clearedFilters);
    onApplyFilters({});
  };

  const hasActiveFilters = Object.values(appliedFiltersState).some(value => value !== '');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Trend Analysis Filters</h2>
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Apply Filters
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Transportation Mode */}
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
            <option value="road">Road</option>
            <option value="rail">Rail</option>
            <option value="air">Air</option>
            <option value="sea">Sea</option>
          </select>
        </div>

        {/* Sales Rep */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sales Representative
          </label>
          <input
            type="text"
            value={filters.salesRep}
            onChange={(e) => handleFilterChange('salesRep', e.target.value)}
            placeholder="Enter name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Deal Size Category */}
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
            <option value="Small">Small ($0 - $10K)</option>
            <option value="Medium">Medium ($10K - $50K)</option>
            <option value="Large">Large ($50K - $200K)</option>
            <option value="Enterprise">Enterprise ($200K+)</option>
          </select>
        </div>

        {/* Risk Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Risk Level
          </label>
          <select
            value={filters.riskLevel}
            onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Stalling Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stalling Status
          </label>
          <select
            value={filters.isStalling}
            onChange={(e) => handleFilterChange('isStalling', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Deals</option>
            <option value="true">Stalling Only (21+ days)</option>
            <option value="false">Active Deals</option>
          </select>
        </div>
      </div>
    </div>
  );
} 