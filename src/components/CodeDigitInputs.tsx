import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import {
  CODE_DIGIT_COUNT,
  useCodeDigitInput,
} from '@/hooks/useCodeDigitInput';
import { colors } from '@/theme/colors';

type CodeDigitInputsProps = {
  editable?: boolean;
  focusOnMount?: boolean;
  onCodeComplete?: (code: string) => void;
  resetSignal?: number;
};

/**
 * Six individual digit boxes for login verification codes.
 */
export function CodeDigitInputs({
  editable = true,
  focusOnMount = false,
  onCodeComplete,
  resetSignal,
}: CodeDigitInputsProps) {
  const { codeDigits, codeInputRefs, handleDigitChange, handleKeyPress } =
    useCodeDigitInput({
      focusOnMount,
      onCodeComplete,
      resetSignal,
    });
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  return (
    <View style={styles.codeRow}>
      {Array.from({ length: CODE_DIGIT_COUNT }, (_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            codeInputRefs.current[index] = ref;
          }}
          accessibilityLabel={`Digit ${index + 1} of ${CODE_DIGIT_COUNT}`}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoCorrect={false}
          editable={editable}
          inputMode="numeric"
          keyboardType="number-pad"
          onBlur={() => {
            setFocusedIndex((current) => (current === index ? null : current));
          }}
          onChangeText={(value) => handleDigitChange(index, value)}
          onFocus={() => {
            setFocusedIndex(index);
          }}
          onKeyPress={({ nativeEvent }) =>
            handleKeyPress(index, nativeEvent.key)
          }
          selectTextOnFocus
          style={[
            styles.codeInput,
            focusedIndex === index && styles.codeInputFocused,
            !editable && styles.codeInputDisabled,
          ]}
          textContentType="oneTimeCode"
          value={codeDigits[index] ?? ''}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 360,
    gap: 8,
  },
  codeInput: {
    flexGrow: 1,
    flexBasis: 0,
    maxWidth: 48,
    height: 48,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    backgroundColor: colors.surface,
    color: colors.primary,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  codeInputFocused: {
    borderColor: colors.primary,
  },
  codeInputDisabled: {
    opacity: 0.55,
  },
});
