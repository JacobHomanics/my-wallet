import Svg, { Circle, Path, Rect } from 'react-native-svg';

type CashRegisterIconProps = {
  size?: number;
  color?: string;
  /** Secondary color used for “cutouts” / inner details. */
  detailColor?: string;
};

/**
 * Old-school cash register mark for the welcome screen.
 */
export function CashRegisterIcon({
  size = 32,
  color = '#D33D3D',
  detailColor = '#FFF4E6',
}: CashRegisterIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityRole="image"
      accessibilityLabel="Cash register"
    >
      {/* Top/front lip */}
      <Path
        d="M6 6.5h12A1.5 1.5 0 0 1 19.5 8v2H4.5V8A1.5 1.5 0 0 1 6 6.5Z"
        fill={color}
      />

      {/* Body */}
      <Path
        d="M5.25 10.5h13.5A1.75 1.75 0 0 1 20.5 12.25v6.5A2.25 2.25 0 0 1 18.25 21H5.75A2.25 2.25 0 0 1 3.5 18.75v-6.5A1.75 1.75 0 0 1 5.25 10.5Z"
        fill={color}
      />

      {/* Key/coin drawer seam */}
      <Path
        d="M4.8 14.2h14.4"
        stroke={detailColor}
        strokeWidth={1.35}
        strokeLinecap="round"
      />

      {/* Key row */}
      <Rect x="7" y="15.15" width="1.7" height="1.55" rx="0.35" fill={detailColor} />
      <Rect x="9.1" y="15.15" width="1.7" height="1.55" rx="0.35" fill={detailColor} />
      <Rect x="11.2" y="15.15" width="1.7" height="1.55" rx="0.35" fill={detailColor} />
      <Rect x="13.3" y="15.15" width="1.7" height="1.55" rx="0.35" fill={detailColor} />

      {/* Drawer */}
      <Path
        d="M6 6.5h12V9H6V6.5Z"
        fill={detailColor}
        opacity={0.9}
      />
      <Path
        d="M8 10.5h8v3.2c0 .9-.7 1.6-1.6 1.6h-4.8c-.9 0-1.6-.7-1.6-1.6v-3.2Z"
        fill={detailColor}
        opacity={0.9}
      />

      {/* Coin slot / indicator */}
      <Circle cx="12" cy="9.6" r="1.3" fill={detailColor} />
    </Svg>
  );
}

