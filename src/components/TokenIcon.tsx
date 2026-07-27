import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { getNetworkIconUrl } from '@/lib/alchemy/networkIcons';

type TokenIconProps = {
  symbol: string;
  logoUrl: string | null;
  network: string;
  size?: number;
};

/**
 * Token logo with a chain badge anchored to the bottom-right.
 */
export function TokenIcon({
  symbol,
  logoUrl,
  network,
  size = 40,
}: TokenIconProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [chainFailed, setChainFailed] = useState(false);
  const chainIconUrl = getNetworkIconUrl(network);
  const showLogo = Boolean(logoUrl) && !logoFailed;
  const showChain = Boolean(chainIconUrl) && !chainFailed;
  const badgeSize = Math.max(18, Math.round(size * 0.5));

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  useEffect(() => {
    setChainFailed(false);
  }, [chainIconUrl]);

  return (
    <View style={{ width: size, height: size }}>
      {showLogo ? (
        <Image
          accessibilityIgnoresInvertColors
          onError={() => {
            setLogoFailed(true);
          }}
          source={{ uri: logoUrl! }}
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
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={`${network} network`}
          onError={() => {
            setChainFailed(true);
          }}
          source={{ uri: chainIconUrl! }}
          style={[
            styles.chainBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

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
  chainBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    backgroundColor: '#f8fafc',
  },
});
