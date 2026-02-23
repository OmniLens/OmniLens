interface GreenDotIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function GreenDotIcon({
  width = 10,
  height = 10,
  className,
}: GreenDotIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 10 10"
      fill="none"
      className={className}
    >
      <circle cx="5" cy="5" r="3" fill="#00e5a0" />
    </svg>
  );
}
