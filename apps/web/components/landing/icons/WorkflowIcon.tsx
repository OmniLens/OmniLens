interface WorkflowIconProps {
  width?: number;
  height?: number;
  className?: string;
}

export function WorkflowIcon({
  width = 9,
  height = 9,
  className,
}: WorkflowIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 9 9"
      fill="none"
      className={className}
    >
      <path
        d="M1 8V3.5L4.5 1 8 3.5V8H5.5V5.5H3.5V8H1Z"
        stroke="currentColor"
        strokeWidth={0.8}
      />
    </svg>
  );
}
