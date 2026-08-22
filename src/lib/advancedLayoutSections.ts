export type AdvancedLayoutSectionId =
  | 'wallets'
  | 'send'
  | 'search'
  | 'contacts'
  | 'rewards';

export type AdvancedLayoutSectionOption = {
  id: AdvancedLayoutSectionId;
  label: string;
  description: string;
};

export const ADVANCED_LAYOUT_SECTIONS: readonly AdvancedLayoutSectionOption[] =
  [
    {
      id: 'wallets',
      label: 'Wallets',
      description:
        'Keep wallet cards visible instead of behind a toggle.',
    },
    {
      id: 'send',
      label: 'Send',
      description:
        'Show token allocations on amount, confirm, and sent.',
    },
    {
      id: 'search',
      label: 'Search',
      description:
        'Show Farcaster, ENS, and wallet search without a toggle.',
    },
    {
      id: 'contacts',
      label: 'Contacts',
      description: 'Show All and External tabs without a toggle.',
    },
    {
      id: 'rewards',
      label: 'Rewards',
      description: 'Show token contract details without a toggle.',
    },
  ] as const;

export const DEFAULT_ADVANCED_LAYOUT_SECTIONS: Record<
  AdvancedLayoutSectionId,
  boolean
> = {
  wallets: true,
  send: true,
  search: true,
  contacts: true,
  rewards: true,
};

export function createDefaultAdvancedLayoutSections(): Record<
  AdvancedLayoutSectionId,
  boolean
> {
  return { ...DEFAULT_ADVANCED_LAYOUT_SECTIONS };
}

export function getAdvancedLayoutSection(
  id: AdvancedLayoutSectionId,
): AdvancedLayoutSectionOption | undefined {
  return ADVANCED_LAYOUT_SECTIONS.find((option) => option.id === id);
}
