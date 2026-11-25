interface StatusBadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
}

export function StatusBadge({ label, color = "text-gray-700", bgColor = "bg-gray-100" }: StatusBadgeProps) {
  // Check if color is hex or Tailwind class
  const isHexColor = color.startsWith("#") || color.startsWith("rgb");
  const isHexBg = bgColor.startsWith("#") || bgColor.startsWith("rgb");

  if (isHexColor || isHexBg) {
    return (
      <span
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{
          color: isHexColor ? color : undefined,
          backgroundColor: isHexBg ? bgColor : undefined,
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color} ${bgColor}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
