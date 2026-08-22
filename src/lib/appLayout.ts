export type AppLayoutId = 'default' | 'advanced';

export type AppLayoutOption = {
  id: AppLayoutId;
  label: string;
  description: string;
};

export const APP_LAYOUT_OPTIONS: readonly AppLayoutOption[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Everyday layout with extras tucked away.',
  },
  {
    id: 'advanced',
    label: 'Advanced (Money on Steroids)',
    description: 'Power-user layout with more money details in view.',
  },
] as const;

export const DEFAULT_APP_LAYOUT_ID: AppLayoutId = 'default';

export function getAppLayoutOption(
  id: AppLayoutId,
): AppLayoutOption | undefined {
  return APP_LAYOUT_OPTIONS.find((option) => option.id === id);
}
