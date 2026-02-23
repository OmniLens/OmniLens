interface GridIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function GridIcon({
  width = 14,
  height = 14,
  className,
}: GridIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="4"
        height="4"
        rx="1"
        fill="currentColor"
        opacity={0.5}
      />
      <rect
        x="8"
        y="2"
        width="4"
        height="4"
        rx="1"
        fill="currentColor"
        opacity={0.5}
      />
      <rect
        x="2"
        y="8"
        width="4"
        height="4"
        rx="1"
        fill="currentColor"
        opacity={0.5}
      />
      <rect
        x="8"
        y="8"
        width="4"
        height="4"
        rx="1"
        fill="currentColor"
        opacity={0.5}
      />
    </svg>
  );
}
