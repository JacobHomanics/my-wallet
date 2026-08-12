import Svg, { Path, Rect } from 'react-native-svg';

/** Official Stripe blurple. */
export const STRIPE_BLURPLE = '#635BFF';

type StripeIconProps = {
  size?: number;
};

/**
 * Stripe brand mark on blurple rounded square.
 * Glyph from Simple Icons, centered in a 32×32 tile.
 */
export function StripeIcon({ size = 32 }: StripeIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      accessibilityRole="image"
      accessibilityLabel="Stripe"
    >
      <Rect width="32" height="32" rx="8" fill={STRIPE_BLURPLE} />
      {/* Simple Icons Stripe path is 24×24; 4px inset centers it in 32×32. */}
      <Path
        d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.876 4.515 3.225 3.697 5.136 3.697 7.718c0 4.071 2.48 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"
        fill="#ffffff"
        transform="translate(4 4)"
      />
    </Svg>
  );
}
