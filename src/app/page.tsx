"use client";

import { useState } from "react";

import PipelineDashboard from "../components/PipelineDashboard";
import TerritoryDashboard from "../components/TerritoryDashboard";

export default function Home() {
  const [tab, setTab] = useState<'pipeline' | 'territory'>('pipeline');

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen sm:p-8 font-[family-name:var(--font-geist-sans)] bg-slate-300">
      <main className="flex flex-col row-start-2 items-center sm:items-start w-full ">
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold ${tab === 'pipeline' ? 'bg-white border-b-2 border-blue-600 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setTab('pipeline')}
          >
            Pipeline Dashboard
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold ${tab === 'territory' ? 'bg-white border-b-2 border-blue-600 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setTab('territory')}
          >
            Territory Dashboard
          </button>
        </div>
        <div className="w-full">
          {tab === 'pipeline' ? <PipelineDashboard /> : <TerritoryDashboard />}
        </div>
      </main>
      
    </div>
  );
}
