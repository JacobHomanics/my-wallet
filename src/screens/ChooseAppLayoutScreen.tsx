import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { actions } = useChooseAppLayout();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 24) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Choose your layout</Text>
        <Text style={styles.prompt}>
          Pick how you want the app to look. You can change this later in
          Appearance settings.
        </Text>

        <View style={styles.actionsRow}>
          {actions.map((action) => (
            <HomeActionButton
              key={action.id}
              icon={action.icon}
              label={action.label}
              onPress={action.onPress}
            />
          ))}
        </View>
      </ScrollView>
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
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      paddingHorizontal: 24,
      alignItems: 'center',
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
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
  });
}
