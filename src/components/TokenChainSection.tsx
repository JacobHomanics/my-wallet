import { memo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TokenIcon } from '@/components/TokenIcon';
import { isNetworkExpandedInState } from '@/hooks/useExpandedNetworks';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import {
  UNKNOWN_TOKEN_NETWORK,
  type OwnedToken,
  type TokenChainGroup,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkIconUrl } from '@/lib/alchemy/networkIcons';

const TokenRow = memo(function TokenRow({
  token,
  selected = false,
  showNetworkMeta = false,
  onPress,
}: {
  token: OwnedToken;
  selected?: boolean;
  /** When true, show network under the symbol (token picker). */
  showNetworkMeta?: boolean;
  onPress: (tokenId: string) => void;
}) {
  const { formatFromUsd } = useFiatDisplay();
  const fiatLabel = formatFromUsd(token.usdValue);
  const meta = showNetworkMeta
    ? token.networkLabel
    : token.name && token.name !== token.symbol
      ? token.name
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selected ? { selected: true } : undefined}
      onPress={() => {
        onPress(token.id);
      }}
      style={({ pressed }) => [
        styles.tokenRow,
        selected && styles.tokenRowSelected,
        pressed && styles.tokenRowPressed,
      ]}
    >
      <View style={styles.tokenLeft}>
        <TokenIcon
          logoUrl={token.logoUrl}
          network={token.network}
          showNetworkBadge={false}
          symbol={token.symbol}
        />
        <View style={styles.tokenText}>
          <Text style={styles.tokenSymbol} numberOfLines={1}>
            {token.symbol}
          </Text>
          {meta ? (
            <Text style={styles.tokenMeta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={styles.tokenBalance} numberOfLines={1}>
          {token.balanceFormatted}
        </Text>
        {fiatLabel ? (
          <Text style={styles.tokenUsd} numberOfLines={1}>
            {fiatLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

const ChainHeader = memo(function ChainHeader({
  label,
  meta,
  usdLabel,
  iconUrl,
  iconFallback,
  expanded,
  onToggle,
  compact = false,
}: {
  label: string;
  meta: string;
  usdLabel: string | null;
  iconUrl: string | null;
  iconFallback: string;
  expanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const [failedIconUrl, setFailedIconUrl] = useState<string | null>(null);
  const showIcon = Boolean(iconUrl) && iconUrl !== failedIconUrl;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onToggle}
      style={({ pressed }) => [
        compact ? styles.nestedHeader : styles.chainHeader,
        pressed && styles.chainHeaderPressed,
      ]}
    >
      <View style={styles.chainHeaderLeft}>
        {showIcon ? (
          <View style={compact ? styles.nestedChainIcon : styles.chainIcon}>
            <Image
              accessibilityIgnoresInvertColors
              cachePolicy="memory-disk"
              onError={() => {
                setFailedIconUrl(iconUrl);
              }}
              source={iconUrl}
              style={
                compact ? styles.nestedChainIconImage : styles.chainIconImage
              }
            />
          </View>
        ) : (
          <View
            style={
              compact ? styles.nestedChainIconFallback : styles.chainIconFallback
            }
          >
            <Text
              style={
                compact
                  ? styles.nestedChainIconFallbackText
                  : styles.chainIconFallbackText
              }
            >
              {iconFallback}
            </Text>
          </View>
        )}
        <View style={styles.chainHeaderText}>
          <Text style={compact ? styles.nestedLabel : styles.chainLabel}>
            {label}
          </Text>
          <Text style={styles.chainMeta}>{meta}</Text>
        </View>
      </View>
      <View style={styles.chainHeaderRight}>
        {usdLabel ? <Text style={styles.chainUsd}>{usdLabel}</Text> : null}
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={compact ? 14 : 16}
          color="#C37A7A"
        />
      </View>
    </Pressable>
  );
});

/**
 * Collapsible chain group used on Balances and the send token picker.
 */
export const TokenChainSection = memo(function TokenChainSection({
  group,
  expanded,
  expandedNetworks,
  onToggle,
  onToggleNetwork,
  onTokenPress,
  selectedTokenId = null,
  showNetworkMeta = false,
}: {
  group: TokenChainGroup;
  expanded: boolean;
  expandedNetworks: Record<string, boolean>;
  onToggle: () => void;
  onToggleNetwork: (key: string) => void;
  onTokenPress: (tokenId: string) => void;
  selectedTokenId?: string | null;
  showNetworkMeta?: boolean;
}) {
  const { formatFromUsd } = useFiatDisplay();
  const isUnknown = group.network === UNKNOWN_TOKEN_NETWORK;
  const subgroups = group.subgroups ?? [];
  const chainFiatLabel = formatFromUsd(group.totalUsd);
  const tokenCountLabel =
    group.tokens.length === 1 ? '1 token' : `${group.tokens.length} tokens`;

  return (
    <View style={styles.chainSection}>
      <ChainHeader
        label={group.networkLabel}
        meta={tokenCountLabel}
        usdLabel={chainFiatLabel}
        iconUrl={isUnknown ? null : getNetworkIconUrl(group.network)}
        iconFallback={isUnknown ? '?' : group.networkLabel.slice(0, 1)}
        expanded={expanded}
        onToggle={onToggle}
      />

      {expanded ? (
        isUnknown && subgroups.length > 0 ? (
          <View style={styles.unknownSubgroups}>
            {subgroups.map((subgroup) => {
              const subgroupKey = `${UNKNOWN_TOKEN_NETWORK}:${subgroup.network}`;
              const subgroupExpanded = isNetworkExpandedInState(
                subgroupKey,
                expandedNetworks,
              );
              const subgroupCount =
                subgroup.tokens.length === 1
                  ? '1 token'
                  : `${subgroup.tokens.length} tokens`;

              return (
                <View key={subgroup.network} style={styles.nestedSection}>
                  <ChainHeader
                    compact
                    label={subgroup.networkLabel}
                    meta={subgroupCount}
                    usdLabel={null}
                    iconUrl={getNetworkIconUrl(subgroup.network)}
                    iconFallback={subgroup.networkLabel.slice(0, 1)}
                    expanded={subgroupExpanded}
                    onToggle={() => {
                      onToggleNetwork(subgroupKey);
                    }}
                  />
                  {subgroupExpanded ? (
                    <View style={styles.chainTokens}>
                      {subgroup.tokens.map((token) => (
                        <TokenRow
                          key={token.id}
                          onPress={onTokenPress}
                          selected={token.id === selectedTokenId}
                          showNetworkMeta={showNetworkMeta}
                          token={token}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.chainTokens}>
            {group.tokens.map((token) => (
              <TokenRow
                key={token.id}
                onPress={onTokenPress}
                selected={token.id === selectedTokenId}
                showNetworkMeta={showNetworkMeta}
                token={token}
              />
            ))}
          </View>
        )
      ) : null}
      <View style={styles.chainDivider} />
    </View>
  );
});

const styles = StyleSheet.create({
  chainSection: {
    gap: 4,
  },
  chainDivider: {
    marginTop: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F5BFA9',
  },
  unknownSubgroups: {
    gap: 8,
    paddingTop: 4,
    paddingLeft: 4,
  },
  nestedSection: {
    gap: 2,
  },
  nestedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  nestedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3f6b52',
  },
  nestedChainIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#F5BFA9',
  },
  nestedChainIconImage: {
    width: 18,
    height: 18,
  },
  nestedChainIconFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: '#F5BFA9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nestedChainIconFallbackText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A3B3B',
  },
  chainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  chainHeaderPressed: {
    opacity: 0.65,
  },
  chainHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  chainIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#F5BFA9',
  },
  chainIconImage: {
    width: 22,
    height: 22,
  },
  chainIconFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#F5BFA9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainIconFallbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A3B3B',
  },
  chainHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  chainLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#365c45',
  },
  chainMeta: {
    fontSize: 12,
    color: '#C37A7A',
  },
  chainHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chainUsd: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9B5A5A',
    fontVariant: ['tabular-nums'],
  },
  chainTokens: {
    gap: 6,
    paddingLeft: 4,
    paddingTop: 4,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tokenRowSelected: {
    backgroundColor: '#F5BFA9',
  },
  tokenRowPressed: {
    opacity: 0.65,
  },
  tokenLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  tokenText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D33D3D',
  },
  tokenMeta: {
    fontSize: 13,
    color: '#C37A7A',
  },
  tokenRight: {
    alignItems: 'flex-end',
    gap: 2,
    maxWidth: '42%',
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D33D3D',
    fontVariant: ['tabular-nums'],
  },
  tokenUsd: {
    fontSize: 13,
    color: '#9B5A5A',
    fontVariant: ['tabular-nums'],
  },
});
