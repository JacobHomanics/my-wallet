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

import { AccountNumber } from '@/components/AccountNumber';
import { AccountNumberWalletDetails } from '@/components/AccountNumberWalletDetails';
import { BackButton } from '@/components/BackButton';
import { IconButton } from '@/components/IconButton';
import { TaxDetailsCollapsible } from '@/components/TaxDetailsCollapsible';
import { useAppTax } from '@/hooks/useAppTax';
import { useConvexUsername } from '@/hooks/useConvexUsername';
import { useFiatDisplay } from '@/hooks/useFiatDisplay';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useReceivePaymentUrl } from '@/hooks/useReceivePaymentUrl';
import { useShareReceiveLink } from '@/hooks/useShareReceiveLink';
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
  const {
    onShare,
    disabled: shareDisabled,
    icon: shareIcon,
    accessibilityLabel: shareLabel,
    color: shareColor,
  } = useShareReceiveLink(url);
  const { formatFromUsd, formatServiceFeeFromUsd, parseDisplayInputToUsd, currencySymbol } =
    useFiatDisplay();
  const { taxUsdFor, payerTotalUsdFor } = useAppTax();

  const usd = parseDisplayInputToUsd(usdAmount);
  const taxUsd = usd != null && usd > 0 ? taxUsdFor(usd) : 0;
  const payerTotalUsd =
    usd != null && usd > 0 ? payerTotalUsdFor(usd) : null;
  const amountLabel =
    (payerTotalUsd != null ? formatFromUsd(payerTotalUsd) : null) ??
    `${currencySymbol}${usdAmount}`;
  const taxLabel = taxUsd > 0 ? formatServiceFeeFromUsd(taxUsd) : null;

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
          <IconButton
            accessibilityLabel={shareLabel}
            color={shareColor}
            disabled={shareDisabled}
            icon={shareIcon}
            iconSize={22}
            onPress={onShare}
          />
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

              <View style={styles.identitySection}>
                {username ? (
                  <AccountNumber
                    username={username}
                    style={styles.accountNumber}
                  />
                ) : null}
                <AccountNumberWalletDetails
                  compact
                  identityId={identityId}
                  style={styles.accountNumber}
                />
              </View>
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
});
}
