"use client";
import React, { useState } from "react";
import SalesRepList from "./SalesRepList";
import SalesRepMap from "./SalesRepMap";

const SalesRepSection: React.FC = () => {
  const [activeView, setActiveView] = useState<"sales-reps" | "map">("sales-reps");

  return (
    <div className="space-y-4">
      {/* Toggle Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveView("sales-reps")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeView === "sales-reps"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Sales Representatives
        </button>
        <button
          onClick={() => setActiveView("map")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeView === "map"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Map
        </button>
      </div>

      {/* Content */}
      <div className="mt-4">
        {activeView === "sales-reps" ? <SalesRepList /> : <SalesRepMap />}
      </div>
    </div>
  );
};

export default SalesRepSection; 