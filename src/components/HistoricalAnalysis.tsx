"use client";
import React, { useEffect, useMemo, useState } from "react";

const HistoricalAnalysis: React.FC = ({grouping}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
	const response = await fetch("/api/history?group=" + grouping);
        if (!response.ok) {
          throw new Error("Failed to fetch deals");
        }
	const hdata = await response.json();
	console.log("help");
	setData(hdata);  // Don't know why this does not work
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
  const labels = {"mode": "Transportation Mode",
		  "rep": "Sales Representative",
		  "size": "Deal Size"};
    // Here is my original
    return (
    <div className="space-y-4">
      <h2>{labels[grouping]}</h2>
      <ul>
	{data ? data.forEach((hd) => (
	  <li>
	    <div class="hd-mode">{hd.mode}</div>
	    <div class="hd-winratio">{(100 * hd.wins / hd.total).toFixed(2)}%</div>
	  </li>
	)) : (
	  <div> No data found</div>
	)}
      </ul>
    </div>
    );
};

export default HistoricalAnalysis;
