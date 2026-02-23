interface AddIconProps {
  width?: number;
  height?: number;
  className?: string;
  /** Override stroke color (default: currentColor) */
  stroke?: string;
}

export function AddIcon({
  width = 10,
  height = 10,
  className,
  stroke = "currentColor",
}: AddIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 10 10"
      fill="none"
      className={className}
    >
      <path
        d="M5 1v8M1 5h8"
        stroke={stroke}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
    </svg>
  );
}
