interface ListIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function ListIcon({
  width = 14,
  height = 14,
  className,
}: ListIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
    >
      <path
        d="M2 4h10M2 7h7M2 10h5"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.5}
      />
    </svg>
  );
}
