import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { useContactsAdvancedSection } from '@/hooks/useContactsAdvancedSection';
import { useContactsAllSections } from '@/hooks/useContactsAllSections';
import { useContactsFilter } from '@/hooks/useContactsFilter';
import {
  groupWalletContactsByChain,
  useContacts,
  type ContactListItem,
} from '@/hooks/useContacts';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

type ContactPickerContentProps = {
  onSelect: (contact: ContactListItem) => void;
  /** When false, clears the filter query (e.g. modal closed). Defaults to true. */
  active?: boolean;
};

function canSelectContact(contact: ContactListItem): boolean {
  return Boolean(
    contact.identityId || contact.evmAddress || contact.solanaAddress,
  );
}

function contactDisplayLabel(contact: ContactListItem): string {
  if (contact.isEns && contact.ensName) {
    return contact.ensName;
  }
  if (contact.isExternal && !contact.isFarcaster) {
    const name = contact.name?.trim();
    return name || contact.label;
  }
  return contact.label;
}

function contactDescription(contact: ContactListItem): string | null {
  if (contact.isFarcaster || contact.isEns || contact.isExternal) {
    return null;
  }
  return contact.subtitle;
}

function ContactsTabChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.tabChip, selected && styles.tabChipSelected]}
    >
      <Text style={[styles.tabChipText, selected && styles.tabChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ContactPickerRow({
  contact,
  onSelect,
}: {
  contact: ContactListItem;
  onSelect: (contact: ContactListItem) => void;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const selectable = canSelectContact(contact);
  const label = contactDisplayLabel(contact);
  const description = contactDescription(contact);

  return (
    <Pressable
      accessibilityLabel={`Select ${label}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !selectable }}
      disabled={!selectable}
      onPress={() => {
        onSelect(contact);
      }}
      style={({ pressed }) => [
        styles.option,
        pressed && selectable && styles.optionPressed,
        !selectable && styles.optionDisabled,
      ]}
    >
      <Avatar
        label={label}
        photoUrl={contact.profilePhotoUrl}
        seed={contact.username ?? contact.ensName ?? contact.id}
        size={40}
        showFarcasterBadge={contact.isFarcaster}
        showEnsBadge={contact.isEns}
      />
      <View style={styles.optionText}>
        <Text style={styles.optionLabel}>{label}</Text>
        {description ? (
          <Text style={styles.optionDescription}>{description}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

function ContactPickerRows({
  contacts,
  onSelect,
}: {
  contacts: ContactListItem[];
  onSelect: (contact: ContactListItem) => void;
}) {
  return (
    <>
      {contacts.map((contact) => (
        <ContactPickerRow
          key={contact.id}
          contact={contact}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function CollapsibleSection({
  title,
  expanded,
  onToggle,
  contacts,
  onSelect,
  nested = false,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  contacts: ContactListItem[];
  onSelect: (contact: ContactListItem) => void;
  nested?: boolean;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.section, nested && styles.nestedSection]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.sectionHeader,
          nested && styles.nestedSectionHeader,
          pressed && styles.sectionHeaderPressed,
        ]}
      >
        <Text style={[styles.sectionTitle, nested && styles.nestedSectionTitle]}>
          {title}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>
      {expanded ? (
        <ContactPickerRows contacts={contacts} onSelect={onSelect} />
      ) : null}
    </View>
  );
}

function WalletChainSections({
  contacts,
  evmExpanded,
  solanaExpanded,
  multiChainExpanded,
  onToggleEvm,
  onToggleSolana,
  onToggleMultiChain,
  onSelect,
}: {
  contacts: ContactListItem[];
  evmExpanded: boolean;
  solanaExpanded: boolean;
  multiChainExpanded: boolean;
  onToggleEvm: () => void;
  onToggleSolana: () => void;
  onToggleMultiChain: () => void;
  onSelect: (contact: ContactListItem) => void;
}) {
  const styles = useThemedStyles(createStyles);
  const groups = groupWalletContactsByChain(contacts);

  return (
    <>
      {groups.map((group) => (
        <View key={group.title} style={styles.walletChainSection}>
          <CollapsibleSection
            title={group.title}
            expanded={
              group.title === 'EVM'
                ? evmExpanded
                : group.title === 'Solana'
                  ? solanaExpanded
                  : multiChainExpanded
            }
            onToggle={
              group.title === 'EVM'
                ? onToggleEvm
                : group.title === 'Solana'
                  ? onToggleSolana
                  : onToggleMultiChain
            }
            contacts={group.contacts}
            onSelect={onSelect}
            nested
          />
        </View>
      ))}
    </>
  );
}

function CollapsibleGroup({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.sectionHeader,
          pressed && styles.sectionHeaderPressed,
        ]}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>
      {expanded ? <View style={styles.groupBody}>{children}</View> : null}
    </View>
  );
}

/**
 * Contacts picker body (tabs + list) shared by the modal and Recipient screen.
 */
export function ContactPickerContent({
  onSelect,
  active = true,
}: ContactPickerContentProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const { userContacts, farcasterContacts, ensContacts, externalContacts, isLoading } =
    useContacts();
  const {
    query,
    setQuery,
    clearQuery,
    filteredUserContacts,
    filteredFarcasterContacts,
    filteredEnsContacts,
    filteredExternalContacts,
    hasActiveQuery,
  } = useContactsFilter({
    userContacts,
    farcasterContacts,
    ensContacts,
    externalContacts,
  });
  const {
    showContactsTabs,
    showContactsAdvancedToggle,
    showContactsAdvanced,
    toggleContactsAdvanced,
    selectedTab,
    isAllTab,
    isContactsTab,
    isExternalTab,
    selectAll,
    selectContacts,
    selectExternal,
  } = useContactsAdvancedSection();
  const {
    contactsExpanded,
    externalGroupExpanded,
    walletsExpanded,
    walletsEvmExpanded,
    walletsSolanaExpanded,
    walletsMultiChainExpanded,
    farcasterExpanded,
    ensExpanded,
    toggleContacts,
    toggleExternalGroup,
    toggleWallets,
    toggleWalletsEvm,
    toggleWalletsSolana,
    toggleWalletsMultiChain,
    toggleFarcaster,
    toggleEns,
  } = useContactsAllSections();

  useEffect(() => {
    if (!active) {
      clearQuery();
    }
  }, [active, clearQuery]);

  const hasAnyContacts =
    userContacts.length > 0 ||
    farcasterContacts.length > 0 ||
    ensContacts.length > 0 ||
    externalContacts.length > 0;

  const hasSourceContacts = isAllTab
    ? hasAnyContacts
    : isContactsTab
      ? userContacts.length > 0
      : externalContacts.length > 0 ||
        farcasterContacts.length > 0 ||
        ensContacts.length > 0;

  const hasFilteredResults = isAllTab
    ? filteredUserContacts.length > 0 ||
      filteredFarcasterContacts.length > 0 ||
      filteredEnsContacts.length > 0 ||
      filteredExternalContacts.length > 0
    : isContactsTab
      ? filteredUserContacts.length > 0
      : filteredExternalContacts.length > 0 ||
        filteredFarcasterContacts.length > 0 ||
        filteredEnsContacts.length > 0;

  const searchPlaceholder =
    selectedTab === 'all'
      ? 'Search contacts'
      : selectedTab === 'contacts'
        ? '@username'
        : 'Search external contacts';

  const emptyMessage = !hasSourceContacts
    ? selectedTab === 'external'
      ? 'No external contacts yet.'
      : selectedTab === 'contacts'
        ? 'No contacts yet.'
        : 'No contacts yet.'
    : hasActiveQuery
      ? 'No contacts match your search.'
      : selectedTab === 'external'
        ? 'No external contacts yet.'
        : 'No contacts yet.';

  return (
    <View style={styles.root}>
      {showContactsAdvancedToggle ? (
        <Pressable
          accessibilityLabel={
            showContactsAdvanced
              ? 'Hide advanced details'
              : 'Show advanced details'
          }
          accessibilityRole="button"
          accessibilityState={{ expanded: showContactsAdvanced }}
          onPress={toggleContactsAdvanced}
          style={({ pressed }) => [
            styles.advancedToggle,
            pressed && styles.advancedTogglePressed,
          ]}
        >
          <Text style={styles.advancedToggleText}>
            {showContactsAdvanced
              ? 'Hide advanced details'
              : 'Show advanced details'}
          </Text>
          <Ionicons
            name={showContactsAdvanced ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textMuted}
          />
        </Pressable>
      ) : null}

      {showContactsTabs ? (
        <View style={styles.tabs}>
          <ContactsTabChip
            label="All"
            selected={isAllTab}
            onPress={selectAll}
          />
          <ContactsTabChip
            label="Contacts"
            selected={isContactsTab}
            onPress={selectContacts}
          />
          <ContactsTabChip
            label="External"
            selected={isExternalTab}
            onPress={selectExternal}
          />
        </View>
      ) : null}

      <View style={styles.list}>
        {hasAnyContacts ? (
          <TextInput
            accessibilityLabel="Search contacts"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor="#86a894"
            style={styles.searchInput}
            value={query}
          />
        ) : null}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : !hasFilteredResults ? (
          <Text style={styles.empty}>{emptyMessage}</Text>
        ) : isContactsTab ? (
          <View style={styles.section}>
            <ContactPickerRows
              contacts={filteredUserContacts}
              onSelect={onSelect}
            />
          </View>
        ) : isExternalTab ? (
          <>
            {filteredExternalContacts.length > 0 ? (
              <View style={styles.section}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: walletsExpanded }}
                  onPress={toggleWallets}
                  style={({ pressed }) => [
                    styles.sectionHeader,
                    pressed && styles.sectionHeaderPressed,
                  ]}
                >
                  <Text style={styles.sectionTitle}>Wallets</Text>
                  <Ionicons
                    name={walletsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textMuted}
                  />
                </Pressable>
                {walletsExpanded ? (
                  <View style={styles.groupBody}>
                    <WalletChainSections
                      contacts={filteredExternalContacts}
                      evmExpanded={walletsEvmExpanded}
                      solanaExpanded={walletsSolanaExpanded}
                      multiChainExpanded={walletsMultiChainExpanded}
                      onToggleEvm={toggleWalletsEvm}
                      onToggleSolana={toggleWalletsSolana}
                      onToggleMultiChain={toggleWalletsMultiChain}
                      onSelect={onSelect}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
            {filteredFarcasterContacts.length > 0 ? (
              <CollapsibleSection
                title="Farcaster"
                expanded={farcasterExpanded}
                onToggle={toggleFarcaster}
                contacts={filteredFarcasterContacts}
                onSelect={onSelect}
              />
            ) : null}
            {filteredEnsContacts.length > 0 ? (
              <CollapsibleSection
                title="ENS"
                expanded={ensExpanded}
                onToggle={toggleEns}
                contacts={filteredEnsContacts}
                onSelect={onSelect}
              />
            ) : null}
          </>
        ) : (
          <>
            {filteredUserContacts.length > 0 ? (
              <CollapsibleSection
                title="Contacts"
                expanded={contactsExpanded}
                onToggle={toggleContacts}
                contacts={filteredUserContacts}
                onSelect={onSelect}
              />
            ) : null}
            {filteredExternalContacts.length > 0 ||
            filteredFarcasterContacts.length > 0 ||
            filteredEnsContacts.length > 0 ? (
              <CollapsibleGroup
                title="External Contacts"
                expanded={externalGroupExpanded}
                onToggle={toggleExternalGroup}
              >
                {filteredExternalContacts.length > 0 ? (
                  <View style={styles.nestedSection}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: walletsExpanded }}
                      onPress={toggleWallets}
                      style={({ pressed }) => [
                        styles.sectionHeader,
                        styles.nestedSectionHeader,
                        pressed && styles.sectionHeaderPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectionTitle,
                          styles.nestedSectionTitle,
                        ]}
                      >
                        Wallets
                      </Text>
                      <Ionicons
                        name={walletsExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textMuted}
                      />
                    </Pressable>
                    {walletsExpanded ? (
                      <WalletChainSections
                        contacts={filteredExternalContacts}
                        evmExpanded={walletsEvmExpanded}
                        solanaExpanded={walletsSolanaExpanded}
                        multiChainExpanded={walletsMultiChainExpanded}
                        onToggleEvm={toggleWalletsEvm}
                        onToggleSolana={toggleWalletsSolana}
                        onToggleMultiChain={toggleWalletsMultiChain}
                        onSelect={onSelect}
                      />
                    ) : null}
                  </View>
                ) : null}
                {filteredFarcasterContacts.length > 0 ? (
                  <CollapsibleSection
                    title="Farcaster"
                    expanded={farcasterExpanded}
                    onToggle={toggleFarcaster}
                    contacts={filteredFarcasterContacts}
                    onSelect={onSelect}
                    nested
                  />
                ) : null}
                {filteredEnsContacts.length > 0 ? (
                  <CollapsibleSection
                    title="ENS"
                    expanded={ensExpanded}
                    onToggle={toggleEns}
                    contacts={filteredEnsContacts}
                    onSelect={onSelect}
                    nested
                  />
                ) : null}
              </CollapsibleGroup>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  root: {
    width: '100%',
  },
  advancedToggle: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  advancedTogglePressed: {
    opacity: 0.65,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
  },
  tabs: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    marginTop: 12,
    marginHorizontal: 24,
    padding: 4,
    gap: 4,
    backgroundColor: c.surfaceMuted,
    borderRadius: 12,
  },
  tabChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  tabChipSelected: {
    backgroundColor: c.surface,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textAlign: 'center',
  },
  tabChipTextSelected: {
    color: c.primary,
  },
  list: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    maxWidth: 420,
    marginTop: 16,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: c.primary,
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    fontSize: 15,
    color: c.textSubtle,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    maxWidth: 420,
    marginTop: 8,
  },
  nestedSection: {
    marginTop: 4,
  },
  walletChainSection: {
    marginLeft: 12,
  },
  groupBody: {
    paddingLeft: 8,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  nestedSectionHeader: {
    marginTop: 8,
  },
  sectionHeaderPressed: {
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  nestedSectionTitle: {
    fontSize: 13,
    letterSpacing: 0.4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textMuted,
  },
});
}
