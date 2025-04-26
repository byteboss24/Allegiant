import React from "react";

export const OverviewIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    className="w-8 h-8 text-blue-500"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m4 0h-1v-4h-1m-4 0h-1v-4h-1"
    />
  </svg>
); 