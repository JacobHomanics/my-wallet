import { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { getNetworkIconUrl } from '@/lib/alchemy/networkIcons';

type TokenIconProps = {
  symbol: string;
  logoUrl: string | null;
  network: string;
  size?: number;
  /** When false, omit the chain badge (e.g. already shown in a chain section header). */
  showNetworkBadge?: boolean;
};

/**
 * Token logo with an optional chain badge anchored to the bottom-right.
 */
export const TokenIcon = memo(function TokenIcon({
  symbol,
  logoUrl,
  network,
  size = 40,
  showNetworkBadge = true,
}: TokenIconProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const [failedChainUrl, setFailedChainUrl] = useState<string | null>(null);
  const chainIconUrl = getNetworkIconUrl(network);
  const showLogo = Boolean(logoUrl) && logoUrl !== failedLogoUrl;
  const showChain =
    showNetworkBadge && Boolean(chainIconUrl) && chainIconUrl !== failedChainUrl;
  const badgeSize = Math.max(18, Math.round(size * 0.5));

  return (
    <View style={{ width: size, height: size }}>
      {showLogo ? (
        <Image
          accessibilityIgnoresInvertColors
          cachePolicy="memory-disk"
          onError={() => {
            setFailedLogoUrl(logoUrl);
          }}
          source={logoUrl}
          style={[
            styles.logo,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.logoFallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.logoFallbackText, { fontSize: size * 0.4 }]}>
            {symbol.slice(0, 1)}
          </Text>
        </View>
      )}
      {showChain ? (
        <View
          style={[
            styles.chainBadgeWrap,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        >
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel={`${network} network`}
            cachePolicy="memory-disk"
            onError={() => {
              setFailedChainUrl(chainIconUrl);
            }}
            source={chainIconUrl}
            style={{
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            }}
          />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  logo: {
    backgroundColor: '#e2e8f0',
  },
  logoFallback: {
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontWeight: '700',
    color: '#475569',
  },
  chainBadgeWrap: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    backgroundColor: '#f8fafc',
  },
});
