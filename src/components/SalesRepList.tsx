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

type SortField = keyof SalesRep;
type SortDirection = "asc" | "desc";

interface SalesRepListProps {
  initialSearchTerm?: string;
  territoryFilter?: string;
}

const SalesRepList: React.FC<SalesRepListProps> = ({ initialSearchTerm = "", territoryFilter = "" }) => {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [sortField, setSortField] = useState<SortField>("first_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedReps, setSelectedReps] = useState<Set<number>>(new Set());
  const [showUpdatePopover, setShowUpdatePopover] = useState(false);
  const [newTerritory, setNewTerritory] = useState<string>("");

  // Update search term when initialSearchTerm prop changes
  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

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

  // Filter and sort sales reps
  const filteredAndSortedSalesReps = useMemo(() => {
    let filtered = salesReps;

    // If territory filter is provided, filter by territory first
    if (territoryFilter) {
      filtered = filtered.filter(salesRep => 
        salesRep.territory.toLowerCase() === territoryFilter.toLowerCase()
      );
    }

    // Then apply general search filter (if no territory filter or in addition to it)
    if (searchTerm && !territoryFilter) {
      filtered = filtered.filter(
        (salesRep) =>
          salesRep.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          salesRep.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          salesRep.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          salesRep.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          salesRep.territory.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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
  }, [salesReps, searchTerm, territoryFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedReps.size === filteredAndSortedSalesReps.length) {
      setSelectedReps(new Set());
    } else {
      setSelectedReps(new Set(filteredAndSortedSalesReps.map(rep => rep.id)));
    }
  };

  const handleSelectRep = (repId: number) => {
    const newSelected = new Set(selectedReps);
    if (newSelected.has(repId)) {
      newSelected.delete(repId);
    } else {
      newSelected.add(repId);
    }
    setSelectedReps(newSelected);
  };

  const handleUpdateTerritories = async () => {
    if (!newTerritory || selectedReps.size === 0) return;

    try {
      const response = await fetch("/api/sales-reps/update-territories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salesRepIds: Array.from(selectedReps),
          newTerritory: newTerritory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update territories");
      }

      // Update local state
      setSalesReps(prev => 
        prev.map(rep => 
          selectedReps.has(rep.id) 
            ? { ...rep, territory: newTerritory }
            : rep
        )
      );

      // Clear selections and close popover
      setSelectedReps(new Set());
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
        Error loading sales representatives: {error}
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
            placeholder="Search sales representatives..."
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
          Showing {filteredAndSortedSalesReps.length} of {salesReps.length} sales representatives
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
                    checked={selectedReps.size === filteredAndSortedSalesReps.length && filteredAndSortedSalesReps.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-xs text-gray-500">Select All</span>
                </div>
              </th>
              {[
                { key: "first_name", label: "First Name" },
                { key: "last_name", label: "Last Name" },
                { key: "email", label: "Email" },
                { key: "phone_number", label: "Phone" },
                { key: "territory", label: "Territory" },
                { key: "amount_of_deals", label: "Deals" },
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
            {filteredAndSortedSalesReps.map((salesRep) => (
              <tr key={salesRep.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedReps.has(salesRep.id)}
                    onChange={() => handleSelectRep(salesRep.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {salesRep.first_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {salesRep.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <a 
                    href={`mailto:${salesRep.email}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {salesRep.email}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <a 
                    href={`tel:${salesRep.phone_number}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {salesRep.phone_number}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTerritoryColor(
                      salesRep.territory
                    )}`}
                  >
                    {salesRep.territory}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="font-semibold">{salesRep.amount_of_deals}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Update Button */}
      {selectedReps.size > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowUpdatePopover(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update Selected ({selectedReps.size})
          </button>
        </div>
      )}

      {/* Update Territory Popover */}
      {showUpdatePopover && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Update Territory</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Selected Sales Representatives:</p>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                {filteredAndSortedSalesReps
                  .filter(rep => selectedReps.has(rep.id))
                  .map(rep => (
                    <div key={rep.id} className="text-sm text-gray-700">
                      {rep.first_name} {rep.last_name} ({rep.territory})
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

      {filteredAndSortedSalesReps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No sales representatives found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default SalesRepList; 