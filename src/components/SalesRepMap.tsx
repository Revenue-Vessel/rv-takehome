import React from "react";

const SalesRepMap: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Map Feature Coming Soon
        </h3>
        <p className="text-gray-500">
          Map feature showing sales reps locations will go here
        </p>
      </div>
    </div>
  );
};

export default SalesRepMap; 