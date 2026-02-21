interface OmniLensLogoProps {
  width?: number;
  height?: number;
  className?: string;
  /** When true, uses currentColor for stroke/fill (e.g. in sidebar) */
  useCurrentColor?: boolean;
}

export function OmniLensLogo({
  width = 14,
  height = 14,
  className,
  useCurrentColor = false,
}: OmniLensLogoProps) {
  const fill = useCurrentColor ? "currentColor" : "#00e5a0";
  const stroke = useCurrentColor ? "currentColor" : "#00e5a0";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
    >
      <circle cx="7" cy="7" r="2.5" fill={fill} />
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke={stroke}
        strokeWidth={0.8}
        strokeDasharray="2 2"
      />
    </svg>
  );
}
