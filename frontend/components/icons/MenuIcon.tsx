import React from "react";

export const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    className="w-6 h-6 text-blue-400"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 7h18M3 12h18M3 17h18"
    />
  </svg>
); 