"use client";
import React, { useEffect, useMemo, useState } from "react";
import { filterDealsByForecast, DealFilter } from "../lib/business/deals/forecast";

interface Deal {
  id: number;
  deal_id: string;
  company_name: string;
  contact_name: string;
  transportation_mode: string;
  stage: string;
  value: number;
  probability: number;
  created_date: string;
  updated_date: string;
  expected_close_date: string;
  sales_rep: string;
  origin_city: string;
  destination_city: string;
  cargo_type?: string;
}

interface PipelineData {
  totalDeals: number;
  stageAnalytics: Record<
    string,
    { deals: Deal[]; count: number; percentage: number }
  >;
}

type SortField = keyof Deal | "days_since_update" | "risk";
type SortDirection = "asc" | "desc";

interface DealListProps {
  filter?: DealFilter | null;
  onClearFilter?: () => void;
}

const DealList: React.FC<DealListProps> = ({ filter, onClearFilter }) => {
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("days_since_update");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch("/api/deals");
        if (!response.ok) {
          throw new Error("Failed to fetch deals");
        }
        const data = await response.json();
        setPipelineData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // Helper functions
  const isDealStalled = (deal: Deal) => {
    // Don't mark closed deals as stalled
    if (deal.stage === "closed_lost" || deal.stage === "closed_won") {
      return false;
    }
    
    const updated = new Date(deal.updated_date);
    const now = new Date();
    const daysSinceUpdate = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate >= 21;
  };

  const getDaysSinceUpdate = (updatedDate: string) => {
    const updated = new Date(updatedDate);
    const now = new Date();
    return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateRiskScore = (deal: Deal) => {
    // Don't calculate risk for closed deals
    if (deal.stage === "closed_lost" || deal.stage === "closed_won") {
      return 0;
    }

    const daysSinceUpdate = getDaysSinceUpdate(deal.updated_date);
    
    // Calculate risk based on all days since update - this is the dominant factor
    // 0 days = 0 points, 30+ days = 100 points
    const baseRisk = Math.min(100, (daysSinceUpdate / 30) * 100);
    
    // Multiplicative factors (much smaller impact):
    // 1. Size factor: 0.8x to 1.2x (reduced range)
    const maxDealValue = 100000;
    const sizeFactor = 0.8 + (deal.value / maxDealValue) * 0.4;
    
    // 2. Probability factor: 0.8x to 1.2x (reduced range)
    // 100% probability = 0.8x, 0% probability = 1.2x
    const probabilityFactor = 0.8 + ((100 - deal.probability) / 100) * 0.4;
    
    const totalRisk = Math.round(baseRisk * sizeFactor * probabilityFactor);
    return Math.min(100, Math.max(0, totalRisk));
  };

  // Flatten all deals from all stages
  const allDeals = useMemo(() => {
    if (!pipelineData) return [];

    const deals: Deal[] = [];
    Object.values(pipelineData.stageAnalytics).forEach((stageData) => {
      deals.push(...stageData.deals);
    });
    return deals;
  }, [pipelineData]);

  // Filter and sort deals
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = allDeals.filter(
      (deal) =>
        deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.deal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.sales_rep.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.transportation_mode
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    // Apply forecast filter if present
    if (filter) {
      const closedWonDeals = pipelineData?.stageAnalytics.closed_won?.deals || [];
      filtered = filterDealsByForecast(filtered, filter, closedWonDeals);
    }

    filtered.sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;

      // Handle the virtual "days_since_update" column
      if (sortField === "days_since_update") {
        // For closed deals, use negative values so they sort to the bottom
        if (a.stage === "closed_won" || a.stage === "closed_lost") {
          aValue = -1; // Negative value ensures closed deals sort to bottom
        } else {
          aValue = getDaysSinceUpdate(a.updated_date);
        }
        
        if (b.stage === "closed_won" || b.stage === "closed_lost") {
          bValue = -1; // Negative value ensures closed deals sort to bottom
        } else {
          bValue = getDaysSinceUpdate(b.updated_date);
        }
      } else if (sortField === "risk") {
        aValue = calculateRiskScore(a);
        bValue = calculateRiskScore(b);
      } else {
        aValue = a[sortField as keyof Deal];
        bValue = b[sortField as keyof Deal];
      }

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
  }, [allDeals, searchTerm, sortField, sortDirection, filter, pipelineData]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStageColor = (stage: string) => {
    const colors = {
      prospect: "bg-blue-100 text-blue-800",
      qualified: "bg-green-100 text-green-800",
      proposal: "bg-yellow-100 text-yellow-800",
      negotiation: "bg-orange-100 text-orange-800",
      closed_won: "bg-emerald-100 text-emerald-800",
      closed_lost: "bg-red-100 text-red-800",
    };
    return colors[stage as keyof typeof colors] || "bg-gray-100 text-gray-800";
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
        Error loading deals: {error}
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
            placeholder="Search deals..."
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
        <div className="flex items-center gap-4">
          {filter && onClearFilter && (
            <button
              onClick={onClearFilter}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Clear Filter
            </button>
          )}
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedDeals.length} of {allDeals.length} deals
            {filteredAndSortedDeals.filter(deal => isDealStalled(deal)).length > 0 && (
              <span className="ml-2 text-red-600">
                • {filteredAndSortedDeals.filter(deal => isDealStalled(deal)).length} stalled (21+ days)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      {filteredAndSortedDeals.filter(deal => isDealStalled(deal)).length > 0 && (
        <div className="flex items-center text-xs text-gray-600">
          <div className="w-4 h-4 bg-red-50 border-l-4 border-red-500 mr-2"></div>
          <span>Deals not updated in 21+ days</span>
        </div>
      )}

      {/* Filter Indicator */}
      {filter && (
        <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
          <span className="font-medium">
            Filtered by: {filter.month} ({filter.type === 'won' ? 'Won deals' : filter.type === 'expected' ? 'Expected deals' : 'All deals'})
          </span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {[
                { key: "deal_id", label: "Deal ID" },
                { key: "company_name", label: "Company" },
                { key: "contact_name", label: "Contact" },
                { key: "stage", label: "Stage" },
                { key: "transportation_mode", label: "Mode" },
                { key: "value", label: "Value" },
                { key: "probability", label: "Probability" },
                { key: "risk", label: "Risk" },
                { key: "sales_rep", label: "Sales Rep" },
                { key: "expected_close_date", label: "Expected Close" },
                { key: "days_since_update", label: "Days Since Update" },
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
            {filteredAndSortedDeals.map((deal) => (
              <tr 
                key={deal.id} 
                className={`hover:bg-gray-50 ${
                  isDealStalled(deal) 
                    ? "bg-red-50 hover:bg-red-100 border-l-4 border-red-500" 
                    : ""
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {deal.deal_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {deal.company_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {deal.contact_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(
                      deal.stage
                    )}`}
                  >
                    {deal.stage.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {deal.transportation_mode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(deal.value)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {deal.probability}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    calculateRiskScore(deal) >= 70 ? "bg-red-100 text-red-800" :
                    calculateRiskScore(deal) >= 40 ? "bg-yellow-100 text-yellow-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {calculateRiskScore(deal)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {deal.sales_rep}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(deal.expected_close_date)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  isDealStalled(deal) ? "text-red-600" : "text-gray-900"
                }`}>
                  {deal.stage === "closed_won" || deal.stage === "closed_lost" 
                    ? "-" 
                    : `${getDaysSinceUpdate(deal.updated_date)} days`
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedDeals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No deals found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default DealList;

