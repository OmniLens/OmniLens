interface BlogIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function BlogIcon({
  width = 12,
  height = 12,
  className,
}: BlogIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 12 12"
      fill="none"
      className={className}
    >
      <path
        d="M2 3h8M2 6h6M2 9h4"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  );
}
