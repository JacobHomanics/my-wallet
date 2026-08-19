import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {StyleSheet, 
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { AccountNumber } from '@/components/AccountNumber';
import { TaxDetailsCollapsible } from '@/components/TaxDetailsCollapsible';
import { useAppTax } from '@/hooks/useAppTax';
import { useConvexUsername } from '@/hooks/useConvexUsername';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useReceivePaymentUrl } from '@/hooks/useReceivePaymentUrl';
import type { HomeStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

export function ReceiveQrScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'receiveQr'>>();
  const usdAmount = route.params.usdAmount;
  const { ready, url, identityId, ethereumAddress, solanaAddress } =
    useReceivePaymentUrl(usdAmount);
  const { username } = useConvexUsername();
  const { copy, isCopied } = useCopyToClipboard();
  const { formatFromUsd, parseDisplayInputToUsd, currencySymbol } =
    useFiatDisplay();
  const { taxUsdFor, payerTotalUsdFor } = useAppTax();

  const usd = parseDisplayInputToUsd(usdAmount);
  const taxUsd = usd != null && usd > 0 ? taxUsdFor(usd) : 0;
  const payerTotalUsd =
    usd != null && usd > 0 ? payerTotalUsdFor(usd) : null;
  const amountLabel =
    (payerTotalUsd != null ? formatFromUsd(payerTotalUsd) : null) ??
    `${currencySymbol}${usdAmount}`;
  const taxLabel = taxUsd > 0 ? formatFromUsd(taxUsd) : null;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                navigation.goBack();
              }}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton accessibilityLabel="Back" />
          )}
          <Text style={styles.topBarTitle}>Request</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.body} style={styles.flex}>
          {!ready || !url ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <>
              <Text style={styles.amount} accessibilityRole="header">
                {amountLabel}
              </Text>

              {taxLabel ? (
                <TaxDetailsCollapsible
                  showEvm={Boolean(ethereumAddress)}
                  showSolana={Boolean(solanaAddress)}
                  style={styles.taxSection}
                  taxLabel={taxLabel}
                />
              ) : null}

              <View style={styles.qrWrap}>
                <QRCodeStyled
                  data={url}
                  padding={16}
                  size={200}
                  color={colors.primary}
                  style={styles.qr}
                />
              </View>

              {username || identityId ? (
                <View style={styles.identitySection}>
                  {username ? (
                    <AccountNumber
                      username={username}
                      style={styles.accountNumber}
                    />
                  ) : null}
                  {identityId ? (
                    <AccountNumber
                      identityId={identityId}
                      style={styles.accountNumber}
                    />
                  ) : null}
                </View>
              ) : null}

              <Pressable
                accessibilityLabel={
                  isCopied('url') ? 'Link copied' : 'Copy receive link'
                }
                accessibilityRole="button"
                onPress={() => {
                  void copy(url, 'url');
                }}
                style={({ pressed }) => [
                  styles.copyLinkButton,
                  pressed && styles.copyLinkButtonPressed,
                ]}
              >
                <Ionicons
                  name={isCopied('url') ? 'checkmark' : 'link-outline'}
                  size={18}
                  color={isCopied('url') ? '#15803d' : '#166534'}
                />
                <Text
                  style={[
                    styles.copyLinkText,
                    isCopied('url') && styles.copyLinkTextCopied,
                  ]}
                >
                  {isCopied('url') ? 'Link copied' : 'Copy link'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 44,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: c.primary,
  },
  topBarSpacer: {
    width: 44,
  },
  webBack: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  webBackPressed: {
    opacity: 0.6,
  },
  webBackText: {
    fontSize: 16,
    fontWeight: '500',
    color: c.primary,
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  loader: {
    marginTop: 48,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    marginBottom: 8,
  },
  taxSection: {
    marginTop: 8,
    marginBottom: 20,
    maxWidth: 360,
    width: '100%',
  },
  qrWrap: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 8,
  },
  qr: {
    backgroundColor: c.surface,
  },
  identitySection: {
    width: '100%',
    marginTop: 20,
    gap: 10,
    alignItems: 'center',
  },
  accountNumber: {
    marginTop: 0,
  },
  copyLinkButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
  },
  copyLinkButtonPressed: {
    opacity: 0.85,
  },
  copyLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.primary,
  },
  copyLinkTextCopied: {
    color: c.success,
  },
});
}
