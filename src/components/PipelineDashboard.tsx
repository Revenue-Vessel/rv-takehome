"use client";
import React, { useState } from "react";
import DealList from "./DealList";
import DealForecast from "./DealForecast";
import PerformanceMetrics from "./PerformanceMetrics";
import PipelineFunnel from "./PipelineFunnel";

interface DealFilter {
  month?: string;
  type?: 'won' | 'expected' | 'all';
}

const PipelineDashboard: React.FC = () => {
  const [dealFilter, setDealFilter] = useState<DealFilter | null>(null);

  const handleForecastCardClick = (month: string, type: 'won' | 'expected' | 'all') => {
    setDealFilter({ month, type });
    // Scroll to deal list
    const dealListSection = document.getElementById('deal-list-section');
    if (dealListSection) {
      dealListSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Pipeline Analytics Dashboard
        </h1>

        <div className="grid gap-6">
          {/* Pipeline Overview Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Pipeline Overview
            </h2>
            <PipelineFunnel />
          </div>

          {/* Deal Forecast Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Deal Forecast
            </h2>
            <DealForecast onCardClick={handleForecastCardClick} />
          </div>

          {/* Performance Metrics Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Performance Metrics
            </h2>
            <PerformanceMetrics />
          </div>

          {/* Deal List Section */}
          <div id="deal-list-section" className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Deal List
            </h2>
            <DealList filter={dealFilter} onClearFilter={() => setDealFilter(null)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineDashboard;
