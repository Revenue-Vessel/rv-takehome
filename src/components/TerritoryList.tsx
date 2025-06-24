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
    onTerritoryClick(territory);
  };

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
            placeholder="Search territories or agents..."
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
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(territory.territory)}
              >
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

      {filteredAndSortedTerritories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No territories found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default TerritoryList; 