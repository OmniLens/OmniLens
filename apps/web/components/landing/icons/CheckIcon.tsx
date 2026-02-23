interface CheckIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function CheckIcon({
  width = 9,
  height = 9,
  className,
}: CheckIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 9 9"
      fill="none"
      className={className}
    >
      <circle
        cx="4.5"
        cy="4.5"
        r="3.5"
        stroke="currentColor"
        strokeWidth={0.8}
      />
      <path
        d="M3 4.5l1 1 2-2"
        stroke="currentColor"
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
