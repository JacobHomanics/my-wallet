import { useQuery } from 'convex/react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useConvexUserId } from '@/hooks/useConvexUserId';
import {
  useHeadlessOnramp,
  type KycInput,
  type RegistrationInput,
} from '@/hooks/useHeadlessOnramp';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useUserWallets } from '@/hooks/useUserWallets';
import type { ThemeColors } from '@/theme/types';
import { api } from '../../convex/_generated/api';

const EMPTY_REGISTRATION: RegistrationInput = {
  phone: '',
  country: 'US',
  fullName: '',
};

const EMPTY_KYC: KycInput = {
  givenName: '',
  surname: '',
  dateOfBirth: '',
  line1: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  ssn: '',
};

/** Statuses that mean Stripe is done and funds are on their way or settled. */
const TERMINAL_STATUSES = new Set([
  'fulfillment_complete',
  'fulfillment_processing',
  'rejected',
  'failed',
  'canceled',
]);

function describeStatus(status: string): string {
  switch (status) {
    case 'fulfillment_complete':
      return 'Deposit complete.';
    case 'fulfillment_processing':
      return 'Payment confirmed. Stripe is delivering your funds.';
    case 'rejected':
    case 'failed':
      return 'Stripe could not complete this deposit.';
    case 'canceled':
      return 'This deposit was canceled.';
    default:
      return 'Waiting for Stripe to confirm your payment…';
  }
}

export function StripeHeadlessOnrampScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goHome = usePopToHome();

  const { userId } = useConvexUserId();
  const { wallets } = useUserWallets();
  const ethereumAddress =
    wallets.find((wallet) => wallet.chain === 'ethereum')?.address ?? null;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [registration, setRegistration] =
    useState<RegistrationInput>(EMPTY_REGISTRATION);
  const [kyc, setKyc] = useState<KycInput>(EMPTY_KYC);
  const [amount, setAmount] = useState('');

  const flow = useHeadlessOnramp({
    ethereumAddress,
    onSessionStarted: setSessionId,
  });

  const sessionStatus = useQuery(
    api.onrampHeadless.getSessionStatus,
    userId && sessionId ? { userId, stripeSessionId: sessionId } : 'skip',
  );

  const { step, error, isBusy, setAuthContainer, setPaymentContainer } = flow;
  const isSettled = Boolean(
    sessionStatus && TERMINAL_STATUSES.has(sessionStatus.status),
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.shell}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to home"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goHome}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton accessibilityLabel="Back to home" onPress={goHome} />
          )}
          <Text style={styles.topBarTitle}>Deposit</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
        >
          {!ethereumAddress ? (
            <Text style={styles.errorText}>
              No Ethereum wallet available to deposit into.
            </Text>
          ) : null}

          {error ? (
            <View style={styles.messageBlock}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityLabel="Dismiss error"
                accessibilityRole="button"
                onPress={flow.dismissError}
              >
                <Text style={styles.linkText}>Dismiss</Text>
              </Pressable>
            </View>
          ) : null}

          {/*
            Stripe mounts its own DOM elements into these hosts. Both stay
            mounted for the whole flow: the hook appends and clears their
            children as steps change, and unmounting them would strip the
            element Stripe is actively driving.
          */}
          <div ref={setAuthContainer} />
          <div ref={setPaymentContainer} />

          {step.kind === 'loading' ? (
            <View accessibilityRole="progressbar" style={styles.loadingPanel}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.hintText}>Loading Stripe…</Text>
            </View>
          ) : null}

          {step.kind === 'unavailable' ? (
            <Text style={styles.errorText}>{step.reason}</Text>
          ) : null}

          {step.kind === 'email' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sign in with Link</Text>
              <Text style={styles.hintText}>
                Stripe uses your Link account to verify your identity and hold
                your payment methods.
              </Text>
              <LabeledInput
                autoComplete="email"
                keyboardType="email-address"
                label="Email"
                onChangeText={setEmail}
                placeholder="you@example.com"
                styles={styles}
                value={email}
              />
              <PrimaryButton
                busy={isBusy}
                disabled={!email.trim() || isBusy}
                label="Continue"
                onPress={() => void flow.submitEmail(email)}
                styles={styles}
              />
            </View>
          ) : null}

          {step.kind === 'register' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create a Link account</Text>
              <Text style={styles.hintText}>
                {step.email} has no Link account yet. Link needs a phone number
                to verify it is you.
              </Text>
              <LabeledInput
                keyboardType="phone-pad"
                label="Phone number"
                onChangeText={(phone) =>
                  setRegistration((prev) => ({ ...prev, phone }))
                }
                placeholder="+15551234567"
                styles={styles}
                value={registration.phone}
              />
              <LabeledInput
                label="Country"
                onChangeText={(country) =>
                  setRegistration((prev) => ({ ...prev, country }))
                }
                placeholder="US"
                styles={styles}
                value={registration.country}
              />
              <LabeledInput
                label="Full name (optional)"
                onChangeText={(fullName) =>
                  setRegistration((prev) => ({ ...prev, fullName }))
                }
                placeholder="Jane Doe"
                styles={styles}
                value={registration.fullName}
              />
              <PrimaryButton
                busy={isBusy}
                disabled={!registration.phone.trim() || isBusy}
                label="Create account"
                onPress={() => void flow.submitRegistration(registration)}
                styles={styles}
              />
            </View>
          ) : null}

          {step.kind === 'authenticating' ? (
            <View accessibilityRole="progressbar" style={styles.loadingPanel}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.hintText}>
                Finish signing in to Link in the Stripe window.
              </Text>
            </View>
          ) : null}

          {step.kind === 'kyc' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verify your identity</Text>
              <Text style={styles.hintText}>
                Stripe requires this before your first crypto purchase. Enter
                your real details — this is a live account.
              </Text>
              <LabeledInput
                label="First name"
                onChangeText={(givenName) =>
                  setKyc((prev) => ({ ...prev, givenName }))
                }
                styles={styles}
                value={kyc.givenName}
              />
              <LabeledInput
                label="Last name"
                onChangeText={(surname) =>
                  setKyc((prev) => ({ ...prev, surname }))
                }
                styles={styles}
                value={kyc.surname}
              />
              <LabeledInput
                label="Date of birth (YYYY-MM-DD)"
                onChangeText={(dateOfBirth) =>
                  setKyc((prev) => ({ ...prev, dateOfBirth }))
                }
                placeholder="1990-01-31"
                styles={styles}
                value={kyc.dateOfBirth}
              />
              <LabeledInput
                label="Address"
                onChangeText={(line1) => setKyc((prev) => ({ ...prev, line1 }))}
                styles={styles}
                value={kyc.line1}
              />
              <LabeledInput
                label="City"
                onChangeText={(city) => setKyc((prev) => ({ ...prev, city }))}
                styles={styles}
                value={kyc.city}
              />
              <LabeledInput
                label="State"
                onChangeText={(state) => setKyc((prev) => ({ ...prev, state }))}
                placeholder="CA"
                styles={styles}
                value={kyc.state}
              />
              <LabeledInput
                label="Postal code"
                onChangeText={(postalCode) =>
                  setKyc((prev) => ({ ...prev, postalCode }))
                }
                styles={styles}
                value={kyc.postalCode}
              />
              <LabeledInput
                label="Country"
                onChangeText={(country) =>
                  setKyc((prev) => ({ ...prev, country }))
                }
                placeholder="US"
                styles={styles}
                value={kyc.country}
              />
              <LabeledInput
                label="Social Security number"
                onChangeText={(ssn) => setKyc((prev) => ({ ...prev, ssn }))}
                secureTextEntry
                styles={styles}
                value={kyc.ssn}
              />
              <PrimaryButton
                busy={isBusy}
                disabled={isBusy}
                label="Submit"
                onPress={() => void flow.submitKyc(kyc)}
                styles={styles}
              />
            </View>
          ) : null}

          {step.kind === 'wallet' ? (
            <View accessibilityRole="progressbar" style={styles.loadingPanel}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.hintText}>
                Registering your wallet with Stripe…
              </Text>
            </View>
          ) : null}

          {step.kind === 'payment' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose how to pay</Text>
            </View>
          ) : null}

          {step.kind === 'amount' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount</Text>
              {step.paymentLabel ? (
                <Text style={styles.hintText}>
                  Paying with {step.paymentLabel}
                </Text>
              ) : null}
              <LabeledInput
                keyboardType="decimal-pad"
                label="Amount in USD"
                onChangeText={setAmount}
                placeholder="25.00"
                styles={styles}
                value={amount}
              />
              <PrimaryButton
                busy={isBusy}
                disabled={!amount.trim() || isBusy}
                label="Buy"
                onPress={() => void flow.submitAmount(amount)}
                styles={styles}
              />
            </View>
          ) : null}

          {step.kind === 'confirming' ? (
            <View accessibilityRole="progressbar" style={styles.loadingPanel}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.hintText}>Confirming your purchase…</Text>
            </View>
          ) : null}

          {step.kind === 'tracking' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deposit in progress</Text>
              {sessionStatus === undefined ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Text
                    style={
                      sessionStatus?.status === 'fulfillment_complete'
                        ? styles.successText
                        : styles.hintText
                    }
                  >
                    {describeStatus(sessionStatus?.status ?? '')}
                  </Text>
                  {sessionStatus?.failureReason ? (
                    <Text style={styles.errorText}>
                      {sessionStatus.failureReason}
                    </Text>
                  ) : null}
                  {sessionStatus?.autoDepositMessage ? (
                    <Text style={styles.warningText}>
                      {sessionStatus.autoDepositMessage}
                    </Text>
                  ) : null}
                </>
              )}
              <PrimaryButton
                busy={false}
                disabled={false}
                label={isSettled ? 'Done' : 'Back to home'}
                onPress={goHome}
                styles={styles}
              />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

function LabeledInput({
  label,
  styles,
  ...inputProps
}: {
  label: string;
  styles: Styles;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        style={styles.input}
        {...inputProps}
      />
    </View>
  );
}

function PrimaryButton({
  busy,
  disabled,
  label,
  onPress,
  styles,
}: {
  busy: boolean;
  disabled: boolean;
  label: string;
  onPress: () => void;
  styles: Styles;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.primaryButtonPressed,
        disabled && styles.primaryButtonDisabled,
      ]}
    >
      <Text style={styles.primaryButtonText}>{busy ? 'Working…' : label}</Text>
    </Pressable>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    shell: {
      flex: 1,
      maxWidth: 560,
      width: '100%',
      alignSelf: 'center',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 8,
      minHeight: 44,
    },
    topBarTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '600',
      color: c.text,
    },
    topBarSpacer: {
      width: 64,
    },
    webBack: {
      width: 64,
      paddingVertical: 8,
    },
    webBackPressed: {
      opacity: 0.7,
    },
    webBackText: {
      fontSize: 16,
      color: c.primary,
      fontWeight: '500',
    },
    body: {
      paddingHorizontal: 16,
      paddingTop: 8,
      gap: 16,
    },
    section: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: c.text,
    },
    field: {
      gap: 6,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textMuted,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: c.text,
      backgroundColor: c.surface,
    },
    loadingPanel: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      minHeight: 200,
    },
    messageBlock: {
      alignItems: 'center',
      gap: 8,
    },
    hintText: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textMuted,
    },
    linkText: {
      fontSize: 15,
      color: c.primary,
      fontWeight: '500',
    },
    successText: {
      fontSize: 15,
      lineHeight: 22,
      color: c.primary,
    },
    warningText: {
      fontSize: 15,
      lineHeight: 22,
      color: '#b45309',
    },
    errorText: {
      fontSize: 15,
      lineHeight: 22,
      color: c.danger,
    },
    primaryButton: {
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: c.primary,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 10,
    },
    primaryButtonPressed: {
      opacity: 0.85,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      color: c.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
