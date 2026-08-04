import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { AccountNumber } from '@/components/AccountNumber';
import { TaxDetailsCollapsible } from '@/components/TaxDetailsCollapsible';
import { useAppTax } from '@/hooks/useAppTax';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useReceivePaymentUrl } from '@/hooks/useReceivePaymentUrl';
import type { HomeStackParamList } from '@/navigation/types';

export function ReceiveQrScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'receiveQr'>>();
  const usdAmount = route.params.usdAmount;
  const { ready, url, identityId, ethereumAddress, solanaAddress } =
    useReceivePaymentUrl(usdAmount);
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
            <ActivityIndicator color="#166534" style={styles.loader} />
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
                  size={220}
                  color="#166534"
                  style={styles.qr}
                />
              </View>

              {identityId ? (
                <AccountNumber
                  ethereumAddress={ethereumAddress}
                  identityId={identityId}
                  solanaAddress={solanaAddress}
                  style={styles.accountNumber}
                />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
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
    color: '#166534',
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
    color: '#166534',
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
    color: '#166534',
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
  },
  qr: {
    backgroundColor: '#ffffff',
  },
  accountNumber: {
    marginTop: 20,
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
    color: '#166534',
  },
  copyLinkTextCopied: {
    color: '#15803d',
  },
});
