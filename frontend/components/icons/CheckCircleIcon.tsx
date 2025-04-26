import React from "react";

export const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    className="w-6 h-6 text-green-400"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12l2 2 4-4"
    />
  </svg>
); 