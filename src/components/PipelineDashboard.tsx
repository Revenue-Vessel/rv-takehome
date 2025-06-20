import React from "react";
import DealList from "./DealList";
import PerformanceMetrics from "./PerformanceMetrics";
import PipelineFunnel from "./PipelineFunnel";

const PipelineDashboard: React.FC = () => {
  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gray-50 rounded-tr-lg">
      <div className="mx-auto max-w-7xl w-full px-2 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
          Pipeline Analytics Dashboard
        </h1>
        <div className="grid gap-4 sm:gap-6">
          {/* Pipeline Overview Section */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 overflow-x-auto">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              Pipeline Overview
            </h2>
            <PipelineFunnel />
          </div>
          {/* Performance Metrics Section */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 overflow-x-auto">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              Performance Metrics
            </h2>
            <PerformanceMetrics />
          </div>
          {/* Deal List Section */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 overflow-x-auto">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              Deal List
            </h2>
            <DealList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineDashboard;
