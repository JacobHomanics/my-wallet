import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { IdentityBadgeKind } from '@/lib/identityProtocols';
import { TIER1_PROTOCOLS } from '@/lib/identityProtocols';
import { EnsIcon, ENS_BLUE } from '@/components/EnsIcon';
import { FarcasterIcon, FARCASTER_PURPLE } from '@/components/FarcasterIcon';

type IdentityBadgeIconProps = {
  kind: IdentityBadgeKind;
  size?: number;
  withBackground?: boolean;
  color?: string;
};

function GenericBadge({
  size,
  withBackground,
  backgroundColor,
  color = '#ffffff',
  label,
}: {
  size: number;
  withBackground: boolean;
  backgroundColor: string;
  color?: string;
  label: string;
}) {
  const fontSize = Math.max(8, Math.round(size * 0.42));
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      {withBackground ? (
        <Rect width="100" height="100" rx="22" fill={backgroundColor} />
      ) : null}
      <Circle cx="50" cy="50" r="28" fill={color} opacity={0.95} />
    </Svg>
  );
}

/**
 * Brand badge for external identity contacts (Farcaster, ENS, Tier-1 protocols).
 */
export function IdentityBadgeIcon({
  kind,
  size = 24,
  withBackground = true,
  color = '#ffffff',
}: IdentityBadgeIconProps) {
  if (kind === 'farcaster') {
    return <FarcasterIcon size={size} withBackground={withBackground} color={color} />;
  }

  if (kind === 'ens') {
    return <EnsIcon size={size} withBackground={withBackground} color={color} />;
  }

  const config = TIER1_PROTOCOLS[kind];

  if (kind === 'lens') {
    return (
      <GenericBadge
        size={size}
        withBackground={withBackground}
        backgroundColor={config.badgeColor}
        color={color}
        label="Lens"
      />
    );
  }

  if (kind === 'sns') {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        accessibilityRole="image"
        accessibilityLabel="SNS"
      >
        {withBackground ? (
          <Rect width="100" height="100" rx="22" fill={config.badgeColor} />
        ) : null}
        <Path
          d="M30 55 L50 30 L70 55 L58 55 L58 72 L42 72 L42 55 Z"
          fill={color}
        />
      </Svg>
    );
  }

  if (kind === 'nostr') {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        accessibilityRole="image"
        accessibilityLabel="Nostr"
      >
        {withBackground ? (
          <Rect width="100" height="100" rx="22" fill={config.badgeColor} />
        ) : null}
        <Path
          d="M28 72 V28 H44 L56 52 L68 28 H84 V72 H68 V48 L56 72 H44 V48 L28 72 Z"
          fill={color}
        />
      </Svg>
    );
  }

  return (
    <GenericBadge
      size={size}
      withBackground={withBackground}
      backgroundColor={config.badgeColor}
      color={color}
      label={config.title}
    />
  );
}

export function identityBadgeColor(kind: IdentityBadgeKind): string {
  if (kind === 'farcaster') return FARCASTER_PURPLE;
  if (kind === 'ens') return ENS_BLUE;
  return TIER1_PROTOCOLS[kind].badgeColor;
}
