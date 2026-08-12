import Svg, { Path, Rect } from 'react-native-svg';

/** Privy off-black from brand guidelines. */
export const PRIVY_BLACK = '#010110';

type PrivyIconProps = {
  size?: number;
  color?: string;
};

/**
 * Official Privy logomark (circle + base oval) from privy.io.
 * @see https://www.privy.io/brand-guidelines
 */
export function PrivyIcon({
  size = 32,
  color = PRIVY_BLACK,
}: PrivyIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      accessibilityRole="image"
      accessibilityLabel="Privy"
    >
      <Rect width="32" height="32" rx="8" fill="#F4F4F5" />
      {/* Official mark is 19×24; center in the 32×32 tile. */}
      <Path
        d="M9.329 18.594C14.48 18.594 18.658 14.431 18.658 9.297C18.658 4.163 14.48 0 9.329 0C4.178 0 0 4.163 0 9.297C0 14.431 4.178 18.594 9.329 18.594ZM9.329 24C12.85 24 15.704 23.401 15.704 22.667C15.704 21.932 12.851 21.334 9.329 21.334C5.806 21.334 2.953 21.932 2.953 22.667C2.953 23.401 5.806 24 9.329 24Z"
        fill={color}
        transform="translate(6.5 4)"
      />
    </Svg>
  );
}
