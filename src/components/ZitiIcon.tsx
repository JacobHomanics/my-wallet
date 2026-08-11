import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/colors';

type ZitiIconProps = {
  size?: number;
  color?: string;
  /** Cutout / detail color (background behind the icon). */
  detailColor?: string;
};

/**
 * Brand mark used for Ziti.
 */
export function ZitiIcon({
  size = 32,
  color = colors.primary,
  detailColor = colors.bg,
}: ZitiIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityRole="image"
      accessibilityLabel="Ziti"
    >
      {/* Lid */}
      <Path
        d="M6.5 3.5h11A1.5 1.5 0 0 1 19 5v2.25H5V5a1.5 1.5 0 0 1 1.5-1.5Z"
        fill={color}
      />
      {/* Coin slot */}
      <Rect x="9" y="5" width="6" height="1.35" rx="0.65" fill={detailColor} />
      {/* Body */}
      <Path
        d="M4.5 7.5h15A1.5 1.5 0 0 1 21 9v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5V9a1.5 1.5 0 0 1 1.5-1.5Z"
        fill={color}
      />
      {/* Drawer seam */}
      <Path
        d="M5.75 15.25h12.5"
        stroke={detailColor}
        strokeWidth={1.35}
        strokeLinecap="round"
      />
      {/* Drawer pull */}
      <Rect x="10" y="17" width="4" height="1.6" rx="0.8" fill={detailColor} />
      {/* Coin */}
      <Circle cx="12" cy="11.35" r="2.35" fill={detailColor} />
      {/* Dollar */}
      <Path
        d="M12 9.85v3M10.85 10.55c.3-.4.7-.6 1.15-.6.7 0 1.15.35 1.15.9 0 .5-.4.8-1.15.95-.75.15-1.15.45-1.15.95 0 .55.45.9 1.15.9.45 0 .85-.2 1.15-.6"
        stroke={color}
        strokeWidth={1.15}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
