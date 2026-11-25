interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

export function KPICard({ title, value, icon, trend, color = "indigo" }: KPICardProps) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/60", text: "text-indigo-600 dark:text-indigo-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-600 dark:text-emerald-400" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/60", text: "text-amber-600 dark:text-amber-400" },
    blue: { bg: "bg-blue-50 dark:bg-blue-950/60", text: "text-blue-600 dark:text-blue-400" },
    gray: { bg: "bg-gray-50 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>
          {trend && (
            <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              {trend}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${scheme.bg} ${scheme.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default KPICard;
