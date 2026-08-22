import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeActionButton } from '@/components/HomeActionButton';
import { useChooseAppLayout } from '@/hooks/useChooseAppLayout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';

/**
 * Required first-run screen so the user picks Default vs Advanced before using the app.
 */
export function ChooseAppLayoutScreen() {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { actions, canContinue, continueWithLayout, skipWithDefaultLayout } =
    useChooseAppLayout();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 24) + 24 },
        ]}
      >
        <Text style={styles.title}>Choose your layout</Text>
        <Text style={styles.prompt}>
          Pick how you want the app to look. You can change this later in
          Appearance settings.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.actionsRow}>
          {actions.map((action) => (
            <View key={action.id} style={styles.action}>
              <HomeActionButton
                icon={action.icon}
                label={action.label}
                onPress={action.onPress}
                selected={action.selected}
                size="large"
              />
              {action.hint ? (
                <Text style={styles.hint}>{action.hint}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 24) + 8 },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          disabled={!canContinue}
          onPress={continueWithLayout}
          style={({ pressed }) => [
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
            pressed && canContinue && styles.continueButtonPressed,
          ]}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={skipWithDefaultLayout}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.skipButtonPressed,
          ]}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </Pressable>
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
    header: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: c.primary,
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    prompt: {
      marginTop: 12,
      fontSize: 16,
      lineHeight: 24,
      color: c.textSecondary,
      textAlign: 'center',
    },
    actionsRow: {
      marginTop: 32,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: 28,
    },
    action: {
      alignItems: 'center',
      maxWidth: 148,
    },
    hint: {
      marginTop: 8,
      fontSize: 13,
      lineHeight: 18,
      color: c.textSubtle,
      textAlign: 'center',
    },
    footer: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    continueButton: {
      width: '100%',
      backgroundColor: c.primary,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      minHeight: 52,
      justifyContent: 'center',
    },
    continueButtonPressed: {
      opacity: 0.85,
    },
    continueButtonDisabled: {
      opacity: 0.45,
    },
    continueButtonText: {
      color: c.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
    skipButton: {
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 12,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skipButtonPressed: {
      opacity: 0.65,
    },
    skipButtonText: {
      fontSize: 15,
      fontWeight: '500',
      color: c.textMuted,
      textDecorationLine: 'underline',
    },
  });
}
