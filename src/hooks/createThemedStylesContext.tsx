import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';

export function createThemedStylesContext<T extends Record<string, unknown>>(
  createStyles: (colors: ThemeColors) => T,
) {
  const Context = createContext<{ styles: T; colors: ThemeColors } | null>(
    null,
  );

  function Provider({ children }: { children: ReactNode }) {
    const colors = useThemeColors();
    const styles = useThemedStyles(createStyles);

    return (
      <Context.Provider value={{ styles, colors }}>{children}</Context.Provider>
    );
  }

  function useStyles(): { styles: T; colors: ThemeColors } {
    const value = useContext(Context);
    if (!value) {
      throw new Error('Missing themed styles provider');
    }
    return value;
  }

  return { Provider, useStyles };
}
