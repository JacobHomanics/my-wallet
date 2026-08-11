import { useEffect, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { useContactsAllSections } from '@/hooks/useContactsAllSections';
import { useContactsFilter } from '@/hooks/useContactsFilter';
import { useContactsTab } from '@/hooks/useContactsTab';
import {
  groupWalletContactsByChain,
  useContacts,
  type ContactListItem,
} from '@/hooks/useContacts';

type ContactPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (contact: ContactListItem) => void;
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
      <Ionicons name="chevron-forward" size={18} color="#86a894" />
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
          color="#5a7d6a"
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
          color="#5a7d6a"
        />
      </Pressable>
      {expanded ? <View style={styles.groupBody}>{children}</View> : null}
    </View>
  );
}

/**
 * Page-sheet modal for picking a contact as the send recipient.
 */
export function ContactPickerModal({
  visible,
  onClose,
  onSelect,
}: ContactPickerModalProps) {
  const insets = useSafeAreaInsets();
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
    selectedTab,
    isAllTab,
    isContactsTab,
    isExternalTab,
    selectAll,
    selectContacts,
    selectExternal,
  } = useContactsTab();
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
    if (!visible) {
      clearQuery();
    }
  }, [clearQuery, visible]);

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
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <View
        style={[
          styles.modalContainer,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.modalTopBar}>
          <Text style={styles.modalTitle}>Contacts</Text>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [
              styles.modalClose,
              pressed && styles.modalClosePressed,
            ]}
          >
            <Ionicons name="close" size={22} color="#166534" />
          </Pressable>
        </View>

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

        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            <ActivityIndicator color="#166534" style={styles.loader} />
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
                      color="#5a7d6a"
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
                          color="#5a7d6a"
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
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1fae5',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#166534',
    paddingLeft: 40,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClosePressed: {
    opacity: 0.6,
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
    backgroundColor: '#dcfce7',
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
    backgroundColor: '#ffffff',
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a7d6a',
    textAlign: 'center',
  },
  tabChipTextSelected: {
    color: '#166534',
  },
  list: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    maxWidth: 420,
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#166534',
  },
  loader: {
    marginTop: 48,
  },
  empty: {
    marginTop: 48,
    fontSize: 15,
    color: '#86a894',
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
    justifyContent: 'space-between',
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
    color: '#5a7d6a',
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
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
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
    color: '#166534',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5a7d6a',
  },
});
