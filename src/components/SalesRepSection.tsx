"use client";
import React, { useState } from "react";
import SalesRepList from "./SalesRepList";
import SalesRepMap from "./SalesRepMap";
import TerritoryList from "./TerritoryList";

type ViewType = "sales-reps" | "map";
type FilterType = "sales-reps" | "territories";

const SalesRepSection: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>("sales-reps");
  const [activeFilter, setActiveFilter] = useState<FilterType>("sales-reps");
  const [territoryFilter, setTerritoryFilter] = useState<string>("");

  const handleTerritoryClick = (territory: string) => {
    setTerritoryFilter(territory);
    setActiveFilter("sales-reps");
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    if (filter === "territories") {
      setTerritoryFilter(""); // Clear territory filter when switching to territories view
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Toggle Buttons */}
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

      {/* Filter Options (only show when Sales Representatives view is active) */}
      {activeView === "sales-reps" && (
        <div className="flex space-x-4 text-sm">
          <button
            onClick={() => handleFilterChange("sales-reps")}
            className={`px-3 py-1 rounded transition-colors ${
              activeFilter === "sales-reps"
                ? "text-blue-600 font-medium underline"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            List by sales reps
          </button>
          <button
            onClick={() => handleFilterChange("territories")}
            className={`px-3 py-1 rounded transition-colors ${
              activeFilter === "territories"
                ? "text-blue-600 font-medium underline"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            List by territories
          </button>
        </div>
      )}

      {/* Content */}
      <div className="mt-4">
        {activeView === "map" ? (
          <SalesRepMap />
        ) : activeFilter === "sales-reps" ? (
          <SalesRepList territoryFilter={territoryFilter} />
        ) : (
          <TerritoryList onTerritoryClick={handleTerritoryClick} />
        )}
      </div>
    </div>
  );
};

export default SalesRepSection; 