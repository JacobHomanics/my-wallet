import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSupportedChains } from '@/hooks/useSupportedChains';
import { useSupportedChainsExpanded } from '@/hooks/useSupportedChainsExpanded';
import { getNetworkIconUrl } from '@/lib/alchemy/networkIcons';

function GasLegendItem() {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendIconWrap, styles.legendIconWrapSponsored]}>
        <Ionicons name="flash" size={12} color="#15803d" />
      </View>
      <Text style={styles.legendLabel}>Capable of gas sponsorship</Text>
    </View>
  );
}

const SupportedChainCard = memo(function SupportedChainCard({
  label,
  nativeSymbol,
  networkId,
  gasSponsorship,
}: {
  label: string;
  nativeSymbol: string;
  networkId: string;
  gasSponsorship: boolean;
}) {
  const iconUrl = getNetworkIconUrl(networkId);
  const [failedIconUrl, setFailedIconUrl] = useState<string | null>(null);
  const showIcon = iconUrl != null && failedIconUrl !== iconUrl;

  return (
    <View
      accessibilityLabel={`${label}, ${nativeSymbol}${
        gasSponsorship ? ', capable of gas sponsorship' : ''
      }`}
      style={styles.chainCard}
    >
      {gasSponsorship ? (
        <View style={styles.gasBadge}>
          <Ionicons name="flash" size={11} color="#15803d" />
        </View>
      ) : null}

      <View style={styles.chainIconWrap}>
        {showIcon ? (
          <Image
            source={{ uri: iconUrl }}
            style={styles.chainIcon}
            onError={() => {
              setFailedIconUrl(iconUrl);
            }}
          />
        ) : (
          <View style={styles.chainIconFallback}>
            <Text style={styles.chainIconFallbackText}>
              {label.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <Text numberOfLines={2} style={styles.chainLabel}>
        {label}
      </Text>
      <Text style={styles.chainMeta}>{nativeSymbol}</Text>
    </View>
  );
});

/**
 * Collapsible grid of networks the app supports for balances and sends.
 */
export function SupportedChainsCollapsible() {
  const { chains, count } = useSupportedChains();
  const { expanded, toggleExpanded } = useSupportedChainsExpanded();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Supported chains</Text>
      <Pressable
        accessibilityLabel={
          expanded
            ? `Hide ${count} supported chains`
            : `Show ${count} supported chains`
        }
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={toggleExpanded}
        style={({ pressed }) => [
          styles.toggleRow,
          pressed && styles.toggleRowPressed,
        ]}
      >
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>{count} networks</Text>
          <Text style={styles.toggleDescription}>
            Balances, sends, and history across these chains
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#86a894"
        />
      </Pressable>

      {expanded ? (
        <View style={styles.panel}>
          <View style={styles.legend}>
            <GasLegendItem />
          </View>

          <View style={styles.cardGrid}>
            {chains.map((chain) => (
              <SupportedChainCard
                key={chain.id}
                gasSponsorship={chain.gasSponsorship}
                label={chain.label}
                nativeSymbol={chain.nativeSymbol}
                networkId={chain.id}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleRowPressed: {
    opacity: 0.85,
  },
  toggleText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendIconWrapSponsored: {
    backgroundColor: '#dcfce7',
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a7d6a',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chainCard: {
    position: 'relative',
    width: '48%',
    minWidth: 132,
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 6,
  },
  gasBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#bbf7d0',
  },
  chainIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
  },
  chainIcon: {
    width: 36,
    height: 36,
  },
  chainIconFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainIconFallbackText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  chainLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
    lineHeight: 17,
  },
  chainMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#86a894',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
