import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { useExportPrivateKey } from '@/hooks/useExportPrivateKey';
import type { UserWallet } from '@/hooks/useUserWallets.shared';
import type { RootStackParamList } from '@/navigation/types';

/**
 * Hosted page for private-key export (`/export`). Used by native WebViews and
 * as a deep-linkable web route. Relies on Privy’s React `exportWallet` modal.
 * @see https://docs.privy.io/recipes/mobile-key-export
 */
export function ExportWalletScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'exportWallet'>>();
  const { isReady, isAuthenticated } = useAuth();
  const { exportPrivateKey } = useExportPrivateKey();
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { address, chain } = route.params;
  const wallet: UserWallet = {
    address,
    chain,
    label: chain === 'ethereum' ? 'Ethereum' : 'Solana',
  };

  const onExport = async () => {
    if (isExporting) {
      return;
    }

    setErrorMessage(null);
    setIsExporting(true);
    try {
      await exportPrivateKey(wallet, { skipConfirm: true });
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Could not export this wallet. Make sure you are logged in with the account that owns it.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12) + 12,
          paddingBottom: Math.max(insets.bottom, 24) + 24,
          paddingLeft: Math.max(insets.left, 24),
          paddingRight: Math.max(insets.right, 24),
        },
      ]}
    >
      <Text style={styles.title}>Export private key</Text>
      <Text style={styles.subtitle}>
        Copy your {wallet.label} key to import this wallet into another app
        (MetaMask, Phantom, etc.). Anyone with the key can spend your funds.
      </Text>

      <Text style={styles.address} selectable>
        {address}
      </Text>

      {!isReady ? (
        <ActivityIndicator color="#166534" style={styles.loader} />
      ) : !isAuthenticated ? (
        <>
          <Text style={styles.hint}>
            Log in with the same email or phone you use in Cashbox to continue.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('login', {
                returnTo: 'exportWallet',
                address,
                chain,
              });
            }}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Log in</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={isExporting}
          onPress={() => {
            void onExport();
          }}
          style={({ pressed }) => [
            styles.button,
            isExporting && styles.buttonDisabled,
            pressed && !isExporting && styles.buttonPressed,
          ]}
        >
          {isExporting ? (
            <ActivityIndicator color="#f0fdf4" />
          ) : (
            <Text style={styles.buttonText}>Export {wallet.label} key</Text>
          )}
        </Pressable>
      )}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    maxWidth: 420,
    fontSize: 16,
    lineHeight: 24,
    color: '#3f6b52',
    textAlign: 'center',
  },
  address: {
    marginTop: 20,
    maxWidth: 420,
    fontSize: 13,
    lineHeight: 18,
    color: '#5a7d6a',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  hint: {
    marginTop: 28,
    maxWidth: 420,
    fontSize: 15,
    lineHeight: 22,
    color: '#5a7d6a',
    textAlign: 'center',
  },
  loader: {
    marginTop: 28,
  },
  button: {
    marginTop: 28,
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    marginTop: 16,
    maxWidth: 420,
    fontSize: 14,
    lineHeight: 20,
    color: '#b91c1c',
    textAlign: 'center',
  },
});
