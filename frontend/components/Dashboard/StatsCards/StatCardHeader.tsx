import { ReactNode } from "react";

interface StatCardHeaderProps {
  title: string;
  icon: ReactNode;
}

export default function StatCardHeader({ title, icon }: StatCardHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
      <span className="text-base font-semibold text-blue-700">{title}</span>
      <div className="bg-blue-100 p-2 rounded-full">{icon}</div>
    </div>
  );
}
