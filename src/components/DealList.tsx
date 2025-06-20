"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import LoadingSpinner from "./LoadingSpinner";

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
  assigned_rep_id?: number;
  territory_id?: number;
}

interface PipelineData {
  totalDeals: number;
  stageAnalytics: Record<
    string,
    { deals: Deal[]; count: number; percentage: number }
  >;
}

interface Rep { id: number; name: string; }
interface Territory { id: number; name: string; }

type SortField = keyof Deal;
type SortDirection = "asc" | "desc";

const DealList: React.FC = () => {
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [reps, setReps] = useState<Rep[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [selectedDeals, setSelectedDeals] = useState<number[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRep, setBulkRep] = useState<number | null>(null);
  const [bulkTerritory, setBulkTerritory] = useState<number | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [auditDealId, setAuditDealId] = useState<number | null>(null);
  const [repFilter, setRepFilter] = useState<number | null>(null);
  const [territoryFilter, setTerritoryFilter] = useState<number | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [savedSearches, setSavedSearches] = useState<{name: string, filters: any}[]>([]);
  const [recentFilters, setRecentFilters] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [bulkAssignSuccess, setBulkAssignSuccess] = useState<string | null>(null);
  const [bulkAssignError, setBulkAssignError] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    fetch("/api/reps").then(r => r.json()).then(setReps);
    fetch("/api/territories").then(r => r.json()).then(setTerritories);
  }, []);

  // Load saved searches and recent filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("dealListSavedSearches");
    if (saved) setSavedSearches(JSON.parse(saved));
    const recent = localStorage.getItem("dealListRecentFilters");
    if (recent) setRecentFilters(JSON.parse(recent));
  }, []);

  // Save recent filters to localStorage
  useEffect(() => {
    if (repFilter || territoryFilter || stageFilter || dateRange.start || dateRange.end || searchTerm) {
      const newRecent = [{ repFilter, territoryFilter, stageFilter, dateRange, searchTerm }, ...recentFilters].slice(0, 3);
      setRecentFilters(newRecent);
      localStorage.setItem("dealListRecentFilters", JSON.stringify(newRecent));
    }
    // eslint-disable-next-line
  }, [repFilter, territoryFilter, stageFilter, dateRange, searchTerm]);

  // Smart suggestions for search input
  useEffect(() => {
    if (!searchInput) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const repMatches = reps.filter(r => r.name.toLowerCase().includes(searchInput.toLowerCase())).map(r => `Rep: ${r.name}`);
    const territoryMatches = territories.filter(t => t.name.toLowerCase().includes(searchInput.toLowerCase())).map(t => `Territory: ${t.name}`);
    setSuggestions([...repMatches, ...territoryMatches]);
    setShowSuggestions(repMatches.length > 0 || territoryMatches.length > 0);
  }, [searchInput, reps, territories]);

  // Save current filters as a named search
  const handleSaveSearch = () => {
    const name = prompt("Name this search?");
    if (!name) return;
    const newSaved = [...savedSearches, { name, filters: { repFilter, territoryFilter, stageFilter, dateRange: { ...dateRange }, searchTerm } }];
    setSavedSearches(newSaved);
    localStorage.setItem("dealListSavedSearches", JSON.stringify(newSaved));
  };

  // Apply a saved or recent filter set
  const applyFilters = (filters: any) => {
    setRepFilter(filters.repFilter ?? null);
    setTerritoryFilter(filters.territoryFilter ?? null);
    setStageFilter(filters.stageFilter ?? "");
    setDateRange(filters.dateRange ?? { start: "", end: "" });
    setSearchTerm(filters.searchTerm ?? "");
  };

  // Clear all filters
  const clearAll = () => {
    setRepFilter(null);
    setTerritoryFilter(null);
    setStageFilter("");
    setDateRange({ start: "", end: "" });
    setSearchTerm("");
    setSearchInput("");
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
    let filtered = allDeals.filter((deal) => {
      let match = (
        deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.deal_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.sales_rep.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.transportation_mode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (repFilter && deal.assigned_rep_id !== repFilter) return false;
      if (territoryFilter && deal.territory_id !== territoryFilter) return false;
      if (stageFilter && deal.stage !== stageFilter) return false;
      if (dateRange.start && new Date(deal.created_date) < new Date(dateRange.start)) return false;
      if (dateRange.end && new Date(deal.created_date) > new Date(dateRange.end)) return false;
      return match;
    });

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
  }, [allDeals, searchTerm, sortField, sortDirection, repFilter, territoryFilter, stageFilter, dateRange]);

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

  // Trap focus in modal
  useEffect(() => {
    if (!showBulkModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowBulkModal(false);
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showBulkModal]);

  const handleBulkAssign = async () => {
    setBulkAssignLoading(true);
    setBulkAssignSuccess(null);
    setBulkAssignError(null);
    try {
      if (bulkRep == null && bulkTerritory == null) {
        setBulkAssignError("Please select a rep or territory to assign.");
        setBulkAssignLoading(false);
        return;
      }
      const res = await fetch("/api/deals/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealIds: selectedDeals,
          ...(bulkRep != null ? { assigned_rep_id: bulkRep } : {}),
          ...(bulkTerritory != null ? { territory_id: bulkTerritory } : {}),
          changed_by: "admin", // TODO: use real user
        }),
      });
      if (!res.ok) throw new Error("Failed to assign deals");
      setBulkAssignSuccess("Assignment successful!");
      setBulkAssignLoading(false);
      setTimeout(() => {
        setShowBulkModal(false);
        setSelectedDeals([]);
        fetchDeals();
      }, 1000);
    } catch (e) {
      setBulkAssignError("Assignment failed. Please try again.");
      setBulkAssignLoading(false);
    }
  };

  // Audit modal handler
  const openAuditModal = async (dealId: number) => {
    setAuditDealId(dealId);
    setAuditLoading(true);
    setAuditError(null);
    setShowAuditModal(true);
    try {
      const res = await fetch(`/api/deals/audit?id=${dealId}`);
      if (!res.ok) throw new Error("Failed to fetch audit trail");
      const data = await res.json();
      setAuditTrail(data.audit_trail || []);
    } catch (e) {
      setAuditError("Failed to load audit trail. Please try again.");
      setAuditTrail([]);
    } finally {
      setAuditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
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
      {/* Filters and Save Search Section with gap */}
      <div className="space-y-6 mb-8">
        {/* Advanced Search Bar */}
        <div className="flex flex-wrap gap-2 items-center relative">
          <div className="relative w-64">
          <input
            type="text"
              placeholder="Search by company, contact, deal ID, rep, territory, or stage..."
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setSearchTerm(e.target.value); }}
              className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none placeholder-gray-400 text-gray-900 shadow-sm"
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              aria-label="Search deals, reps, territories"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-12 left-0 bg-white border border-blue-200 rounded-lg shadow z-20 w-full max-h-40 overflow-y-auto animate-fade-in">
                {suggestions.map((s, i) => (
                  <div key={i} className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-800" onMouseDown={() => { setSearchInput(s.split(": ")[1]); setSearchTerm(s.split(": ")[1]); setShowSuggestions(false); }}>{s}</div>
                ))}
              </div>
            )}
          </div>
          <select value={repFilter ?? ""} onChange={e => setRepFilter(e.target.value ? Number(e.target.value) : null)} className="w-44 pl-3 pr-8 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm">
            <option value="">All Reps</option>
            {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={territoryFilter ?? ""} onChange={e => setTerritoryFilter(e.target.value ? Number(e.target.value) : null)} className="w-48 pl-3 pr-8 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm">
            <option value="">All Territories</option>
            {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="w-40 pl-3 pr-8 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm">
            <option value="">All Stages</option>
            {Array.from(new Set(allDeals.map(d => d.stage))).map(stage => <option key={stage} value={stage}>{stage}</option>)}
          </select>
          <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="w-36 pl-3 pr-3 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm" />
          <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="w-36 pl-3 pr-3 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm" />
          <button
            className="bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none shadow-sm px-4 py-2 h-10 flex items-center justify-center"
            onClick={clearAll}
            aria-label="Clear all filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Saved/Recent Search UI (moved below filters) */}
        <div className="flex flex-wrap gap-2 items-center">
          <button className="bg-blue-600 text-white rounded-[4px] px-4 py-2 shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 font-semibold transition" onClick={handleSaveSearch}>Save Search</button>
          {savedSearches.length > 0 && (
            <select className="w-44 pl-3 pr-8 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm" onChange={e => { const idx = Number(e.target.value); if (!isNaN(idx)) applyFilters(savedSearches[idx].filters); }} defaultValue="">
              <option value="">Saved Searches</option>
              {savedSearches.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
            </select>
          )}
          {recentFilters.length > 0 && (
            <select className="w-44 pl-3 pr-8 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm" onChange={e => { const idx = Number(e.target.value); if (!isNaN(idx)) applyFilters(recentFilters[idx]); }} defaultValue="">
              <option value="">Recent Filters</option>
              {recentFilters.map((f, i) => <option key={i} value={i}>Recent {i + 1}</option>)}
            </select>
          )}
          <button className="bg-blue-600 text-white rounded-[4px] px-4 py-2 shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 font-semibold transition ml-auto" disabled={selectedDeals.length === 0} onClick={() => setShowBulkModal(true)}>Bulk Assign</button>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center align-middle">
                <input type="checkbox" checked={selectedDeals.length === filteredAndSortedDeals.length && filteredAndSortedDeals.length > 0} onChange={e => setSelectedDeals(e.target.checked ? filteredAndSortedDeals.map(d => d.id) : [])} className="accent-blue-600 w-4 h-4 rounded" aria-label="Select all deals" />
              </th>
              {[
                { key: "deal_id", label: "Deal ID" },
                { key: "company_name", label: "Company" },
                { key: "contact_name", label: "Contact" },
                { key: "stage", label: "Stage" },
                { key: "transportation_mode", label: "Mode" },
                { key: "value", label: "Value" },
                { key: "probability", label: "Probability" },
                { key: "sales_rep", label: "Sales Rep" },
                { key: "assigned_rep_id", label: "Assigned Rep" },
                { key: "territory_id", label: "Territory" },
                { key: "expected_close_date", label: "Expected Close" },
                { key: "audit", label: "Audit" },
              ].map(({ key, label }) => (
                <th key={key} className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left align-middle cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => handleSort(key as SortField)}>
                  <div className="flex items-center space-x-1">
                    <span>{label}</span>
                    {sortField === key && (
                      <span className="text-blue-500">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedDeals.map((deal, idx) => (
              <tr key={deal.id} className={
                `transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-blue-50"} hover:bg-blue-100 group`}
              >
                <td className="px-3 py-2 text-center align-middle">
                  <input type="checkbox" checked={selectedDeals.includes(deal.id)} onChange={e => setSelectedDeals(e.target.checked ? [...selectedDeals, deal.id] : selectedDeals.filter(id => id !== deal.id))} className="accent-blue-600 w-4 h-4 rounded" aria-label={`Select deal ${deal.deal_id}`} />
                </td>
                <td className="px-4 py-2 font-mono text-xs text-blue-900 whitespace-nowrap">{deal.deal_id}</td>
                <td className="px-4 py-2 font-semibold text-gray-900 whitespace-nowrap">{deal.company_name}</td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{deal.contact_name}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(deal.stage)}`}>{deal.stage.replace("_", " ")}</span>
                </td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap capitalize">{deal.transportation_mode}</td>
                <td className="px-4 py-2 text-gray-700 text-right whitespace-nowrap">{formatCurrency(deal.value)}</td>
                <td className="px-4 py-2 text-gray-700 text-center whitespace-nowrap">{deal.probability}%</td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{deal.sales_rep}</td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{reps.find(r => r.id === deal.assigned_rep_id)?.name || '-'}</td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{territories.find(t => t.id === deal.territory_id)?.name || '-'}</td>
                <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{formatDate(deal.expected_close_date)}</td>
                <td className="px-4 py-2 text-center whitespace-nowrap">
                  <button className="border border-blue-400 text-blue-700 bg-white rounded-full px-3 py-1 text-sm hover:bg-blue-50 focus:ring-2 focus:ring-blue-400 font-semibold transition" onClick={() => openAuditModal(deal.id)} aria-label={`View audit for deal ${deal.deal_id}`}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Bulk Assign Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowBulkModal(false); }}>
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in" tabIndex={-1} aria-modal="true" role="dialog">
            <button className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-2xl font-bold transition" onClick={() => setShowBulkModal(false)} aria-label="Close modal">×</button>
            <h2 className="text-xl font-bold mb-4 text-blue-800">Bulk Assign Deals</h2>
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">Assign Rep</label>
              <select className="w-full pl-3 pr-8 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm" value={bulkRep ?? ""} onChange={e => setBulkRep(e.target.value ? Number(e.target.value) : null)}>
                <option value="">-- No Change --</option>
                {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">Assign Territory</label>
              <select className="w-full pl-3 pr-8 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm" value={bulkTerritory ?? ""} onChange={e => setBulkTerritory(e.target.value ? Number(e.target.value) : null)}>
                <option value="">-- No Change --</option>
                {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">Selected Deals:</div>
              <div className="flex flex-wrap gap-2">
                {selectedDeals.map(id => <span key={id} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-mono">{id}</span>)}
              </div>
            </div>
            {bulkAssignError && <div className="text-red-600 mb-2 text-sm">{bulkAssignError}</div>}
            {bulkAssignSuccess && <div className="text-green-600 mb-2 text-sm">{bulkAssignSuccess}</div>}
            <div className="flex gap-2 mt-4">
              <button className="bg-blue-600 text-white rounded-full px-4 py-2 shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 font-semibold transition disabled:opacity-50" onClick={handleBulkAssign} disabled={bulkAssignLoading} autoFocus>
                {bulkAssignLoading ? "Assigning..." : "Assign"}
              </button>
              <button className="border border-blue-400 text-blue-700 bg-white rounded-full px-4 py-2 hover:bg-blue-50 focus:ring-2 focus:ring-blue-400 font-semibold transition" onClick={() => setShowBulkModal(false)} disabled={bulkAssignLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Audit Trail Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) setShowAuditModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in" tabIndex={-1} aria-modal="true" role="dialog">
            <button className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-2xl font-bold transition" onClick={() => setShowAuditModal(false)} aria-label="Close modal">×</button>
            <h2 className="text-xl font-bold mb-4 text-blue-800">Audit Trail</h2>
            <div className="mb-4 max-h-64 overflow-y-auto min-h-[64px] flex items-center justify-center">
              {auditLoading ? (
                <div className="flex justify-center items-center w-full h-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : auditError ? (
                <div className="text-red-600 text-center w-full">{auditError}</div>
              ) : auditTrail.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No audit trail.</div>
              ) : (
                <ol className="relative border-l-2 border-blue-200 ml-2">
                  {auditTrail.map((entry, i) => (
                    <li key={i} className="mb-6 ml-4">
                      <div className="absolute w-3 h-3 bg-blue-400 rounded-full -left-1.5 border-2 border-white"></div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-700"><span className="font-semibold text-blue-700">{entry.changed_by}</span> changed <span className="font-semibold">{entry.from}</span> to <span className="font-semibold">{entry.to}</span></span>
                        <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button className="border border-blue-400 text-blue-700 bg-white rounded-full px-4 py-2 hover:bg-blue-50 focus:ring-2 focus:ring-blue-400 font-semibold transition" onClick={() => setShowAuditModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {filteredAndSortedDeals.length === 0 && (
        <div className="text-center py-8 text-gray-500">No deals found matching your search criteria.</div>
      )}
    </div>
  );
};

export default DealList;
