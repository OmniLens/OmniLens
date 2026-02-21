interface ArrowRightIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function ArrowRightIcon({
  width = 14,
  height = 14,
  className,
}: ArrowRightIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
    >
      <path
        d="M7 1.5L12.5 7L7 12.5M1.5 7H12.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
