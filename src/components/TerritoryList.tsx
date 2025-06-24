"use client";
import React, { useEffect, useMemo, useState } from "react";

interface SalesRep {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  amount_of_deals: number;
  territory: string;
}

interface TerritoryData {
  territory: string;
  sales_rep_count: number;
  agent_names: string[];
}

type SortField = keyof TerritoryData;
type SortDirection = "asc" | "desc";

interface TerritoryListProps {
  onTerritoryClick: (territory: string) => void;
}

const TerritoryList: React.FC<TerritoryListProps> = ({ onTerritoryClick }) => {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("territory");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedTerritories, setSelectedTerritories] = useState<Set<string>>(new Set());
  const [showUpdatePopover, setShowUpdatePopover] = useState(false);
  const [newTerritory, setNewTerritory] = useState<string>("");

  useEffect(() => {
    const fetchSalesReps = async () => {
      try {
        const response = await fetch("/api/sales-reps");
        if (!response.ok) {
          throw new Error("Failed to fetch sales representatives");
        }
        const data = await response.json();
        setSalesReps(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSalesReps();
  }, []);

  // Group sales reps by territory
  const territoryData = useMemo(() => {
    const territoryMap = new Map<string, SalesRep[]>();
    
    salesReps.forEach(salesRep => {
      if (!territoryMap.has(salesRep.territory)) {
        territoryMap.set(salesRep.territory, []);
      }
      territoryMap.get(salesRep.territory)!.push(salesRep);
    });

    const territories: TerritoryData[] = Array.from(territoryMap.entries()).map(([territory, reps]) => ({
      territory,
      sales_rep_count: reps.length,
      agent_names: reps.map(rep => `${rep.first_name} ${rep.last_name}`).sort()
    }));

    return territories;
  }, [salesReps]);

  // Filter and sort territories
  const filteredAndSortedTerritories = useMemo(() => {
    let filtered = territoryData.filter(
      (territory) =>
        territory.territory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        territory.agent_names.some(name => 
          name.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        territory.sales_rep_count.toString().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortDirection === "asc" ? -1 : 1;
      if (bValue === undefined) return sortDirection === "asc" ? 1 : -1;

      // Handle different data types
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [territoryData, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedTerritories.size === filteredAndSortedTerritories.length) {
      setSelectedTerritories(new Set());
    } else {
      setSelectedTerritories(new Set(filteredAndSortedTerritories.map(territory => territory.territory)));
    }
  };

  const handleSelectTerritory = (territory: string) => {
    const newSelected = new Set(selectedTerritories);
    if (newSelected.has(territory)) {
      newSelected.delete(territory);
    } else {
      newSelected.add(territory);
    }
    setSelectedTerritories(newSelected);
  };

  const handleUpdateTerritories = async () => {
    if (!newTerritory || selectedTerritories.size === 0) return;

    try {
      // Get all sales rep IDs from selected territories
      const salesRepIds: number[] = [];
      salesReps.forEach(rep => {
        if (selectedTerritories.has(rep.territory)) {
          salesRepIds.push(rep.id);
        }
      });

      const response = await fetch("/api/sales-reps/update-territories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salesRepIds: salesRepIds,
          newTerritory: newTerritory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update territories");
      }

      // Update local state
      setSalesReps(prev => 
        prev.map(rep => 
          selectedTerritories.has(rep.territory) 
            ? { ...rep, territory: newTerritory }
            : rep
        )
      );

      // Clear selections and close popover
      setSelectedTerritories(new Set());
      setShowUpdatePopover(false);
      setNewTerritory("");
    } catch (err) {
      console.error("Error updating territories:", err);
      // You might want to show an error message to the user here
    }
  };

  const getTerritoryColor = (territory: string) => {
    const colors = {
      CA: "bg-blue-100 text-blue-800",
      NY: "bg-green-100 text-green-800",
      TX: "bg-yellow-100 text-yellow-800",
      FL: "bg-purple-100 text-purple-800",
    };
    return colors[territory as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleRowClick = (territory: string) => {
    // Only trigger if no territories are selected
    if (selectedTerritories.size === 0) {
      onTerritoryClick(territory);
    }
  };

  const availableTerritories = ["CA", "NY", "TX", "FL"];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading territories: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search territories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedTerritories.length} of {territoryData.length} territories
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTerritories.size === filteredAndSortedTerritories.length && filteredAndSortedTerritories.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-xs text-gray-500">Select All</span>
                </div>
              </th>
              {[
                { key: "territory", label: "Territory" },
                { key: "sales_rep_count", label: "Sales Reps" },
                { key: "agent_names", label: "Agent Names" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(key as SortField)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    {sortField === key && (
                      <span className="text-blue-500">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedTerritories.map((territory) => (
              <tr 
                key={territory.territory} 
                className={`hover:bg-gray-50 transition-colors ${
                  selectedTerritories.size === 0 ? 'cursor-pointer' : ''
                }`}
                onClick={() => handleRowClick(territory.territory)}
              >
                <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedTerritories.has(territory.territory)}
                    onChange={() => handleSelectTerritory(territory.territory)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTerritoryColor(
                      territory.territory
                    )}`}
                  >
                    {territory.territory}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="font-semibold">{territory.sales_rep_count}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex flex-wrap gap-1">
                    {territory.agent_names.map((name, index) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Update Button */}
      {selectedTerritories.size > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowUpdatePopover(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update Selected ({selectedTerritories.size})
          </button>
        </div>
      )}

      {/* Update Territory Popover */}
      {showUpdatePopover && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Territory</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Selected Territories:</p>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                {filteredAndSortedTerritories
                  .filter(territory => selectedTerritories.has(territory.territory))
                  .map(territory => (
                    <div key={territory.territory} className="text-sm text-gray-700 mb-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTerritoryColor(territory.territory)}`}>
                        {territory.territory}
                      </span>
                      <span className="ml-2">({territory.sales_rep_count} sales reps)</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Territory:
              </label>
              <select
                value={newTerritory}
                onChange={(e) => setNewTerritory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a territory</option>
                {availableTerritories.map(territory => (
                  <option key={territory} value={territory}>
                    {territory}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUpdatePopover(false);
                  setNewTerritory("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTerritories}
                disabled={!newTerritory}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredAndSortedTerritories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No territories found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default TerritoryList; 