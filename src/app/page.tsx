"use client";

import Image from "next/image";
import { useState } from "react";
import PipelineDashboard from "../components/PipelineDashboard";
import TerritoryDashboard from "../components/TerritoryDashboard";

export default function Home() {
  const [tab, setTab] = useState<'pipeline' | 'territory'>('pipeline');
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full">
        <div className="flex gap-4 mb-6">
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
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
