import React from "react";

const LoadingSpinner: React.FC<{ className?: string; size?: number }> = ({ className = "", size = 48 }) => (
  <div
    className={`animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 ${className}`}
    style={{ width: size, height: size }}
    role="status"
    aria-label="Loading"
  >
    <span className="sr-only">Loading...</span>
  </div>
);

export default LoadingSpinner; 