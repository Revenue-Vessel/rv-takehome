import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import LoadingSpinner from "./LoadingSpinner";

interface Territory {
  id: number;
  name: string;
  region: string;
  assigned_reps: number[];
  performance_metrics?: {
    total_deals: number;
    won_deals: number;
    lost_deals: number;
    revenue: number;
  };
}

interface Rep {
  id: number;
  name: string;
}

const TerritoryDashboard: React.FC = () => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);
  const [regionFilter, setRegionFilter] = useState("");
  const [repFilter, setRepFilter] = useState<number | null>(null);
  const [sortField, setSortField] = useState<keyof Territory>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/reps").then((res) => res.json()),
      fetch("/api/territories").then((res) => res.json()),
    ]).then(([repsData, territoriesData]) => {
      setReps(repsData);
      setTerritories(territoriesData);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    setLoading(true);
    let url = "/api/territories";
    const params = [];
    if (regionFilter) params.push(`region=${encodeURIComponent(regionFilter)}`);
    if (repFilter) params.push(`rep=${repFilter}`);
    if (params.length) url += `?${params.join("&")}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setTerritories(data);
        setLoading(false);
      });
  }, [regionFilter, repFilter]);

  const sortedTerritories = useMemo(() => {
    return [...territories].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      if (aValue === bValue) return 0;
      if (aValue == null) return sortDirection === "asc" ? -1 : 1;
      if (bValue == null) return sortDirection === "asc" ? 1 : -1;
      return aValue < bValue
        ? sortDirection === "asc" ? -1 : 1
        : sortDirection === "asc" ? 1 : -1;
    });
  }, [territories, sortField, sortDirection]);

  const handleSort = (field: keyof Territory) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 rounded-tr-lg">
      <div className="mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Territory Dashboard</h1>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
        <div className="grid gap-6">
          {/* Filters and Table Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <select
                className="w-44 pl-3 pr-8 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <option value="">All Regions</option>
                {[...new Set(territories.map((t) => t.region))].map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <select
                className="w-44 pl-3 pr-8 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none text-gray-900 shadow-sm"
                value={repFilter === null ? "" : repFilter}
                onChange={(e) => {
                  if (e.target.value === "") {
                    setRepFilter(null);
                  } else {
                    setRepFilter(Number(e.target.value));
                  }
                }}
              >
                <option value="">All Reps</option>
                {reps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
              <button
                className="bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition outline-none shadow-sm px-4 py-2 h-10 flex items-center justify-center"
                onClick={() => {
                  setRegionFilter("");
                  setRepFilter(null);
                }}
                type="button"
                aria-label="Clear filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left align-middle cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => handleSort("name")}>Name</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left align-middle cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => handleSort("region")}>Region</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-left align-middle">Assigned Reps</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center align-middle">Total Deals</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center align-middle">Won</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center align-middle">Lost</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right align-middle">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTerritories.map((t, idx) => (
                    <tr key={t.id} className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-blue-50"} hover:bg-blue-100`}>
                      <td className="px-4 py-2 font-semibold text-gray-900 whitespace-nowrap">{t.name}</td>
                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{t.region}</td>
                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap">
                        {t.assigned_reps && t.assigned_reps.length > 0
                          ? (
                              <div className="flex flex-wrap gap-1">
                                {t.assigned_reps.map((id, idx) => {
                                  const numId = typeof id === 'string' ? Number(id) : id;
                                  const repName = reps.find((r) => r.id === numId)?.name;
                                  // Color palette for pills
                                  const pillColors = [
                                    "bg-blue-600",
                                    "bg-green-600",
                                    "bg-purple-600",
                                    "bg-pink-600",
                                    "bg-yellow-500",
                                    "bg-indigo-600",
                                    "bg-red-600",
                                    "bg-teal-600",
                                  ];
                                  // Assign color based on rep index in reps array for consistency
                                  const repIdx = reps.findIndex(r => r.id === numId);
                                  const colorClass = pillColors[repIdx % pillColors.length];
                                  return repName ? (
                                    <span
                                      key={repName + idx}
                                      className={`inline-block ${colorClass} text-white text-xs font-semibold rounded-full px-3 py-1 shadow-sm`}
                                      style={{ lineHeight: '1.5' }}
                                    >
                                      {repName}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )
                          : "-"}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-700 whitespace-nowrap">{t.performance_metrics?.total_deals ?? "-"}</td>
                      <td className="px-4 py-2 text-center text-gray-700 whitespace-nowrap">{t.performance_metrics?.won_deals ?? "-"}</td>
                      <td className="px-4 py-2 text-center text-gray-700 whitespace-nowrap">{t.performance_metrics?.lost_deals ?? "-"}</td>
                      <td className="px-4 py-2 text-right text-gray-700 whitespace-nowrap">${t.performance_metrics?.revenue?.toLocaleString() ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Performance Trends Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Trends</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedTerritories.map(t => ({
                    name: t.name,
                    Revenue: t.performance_metrics?.revenue ?? 0,
                    "Won Deals": t.performance_metrics?.won_deals ?? 0,
                    "Lost Deals": t.performance_metrics?.lost_deals ?? 0,
                  }))}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#2563eb', fontWeight: 600 }} />
                  <YAxis tick={{ fill: '#2563eb', fontWeight: 600 }} />
                  <Tooltip formatter={(value: any, name: string) => name === 'Revenue' ? `$${value.toLocaleString()}` : value} />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={32} />
                  <Bar dataKey="Won Deals" fill="#22c55e" radius={[8, 8, 0, 0]} barSize={20} />
                  <Bar dataKey="Lost Deals" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default TerritoryDashboard; 