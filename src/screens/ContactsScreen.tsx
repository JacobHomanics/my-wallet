import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmDeleteContactModal } from '@/components/ConfirmDeleteContactModal';
import { IconButton } from '@/components/IconButton';
import { SwipeableContactRow } from '@/components/SwipeableContactRow';
import {
  groupWalletContactsByChain,
  useContacts,
  type ContactListItem,
} from '@/hooks/useContacts';
import { useConfirmDeleteContact } from '@/hooks/useConfirmDeleteContact';
import { useContactsAllSections } from '@/hooks/useContactsAllSections';
import { useContactsFilter } from '@/hooks/useContactsFilter';
import { useContactsSwipe } from '@/hooks/useContactsSwipe';
import { useContactsTab } from '@/hooks/useContactsTab';
import type { ContactsStackParamList } from '@/navigation/types';
import type Swipeable from 'react-native-gesture-handler/Swipeable';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

function ContactRows({
  contacts,
  onPressContact,
  onDeleteContact,
  onRowOpen,
  onRowClose,
}: {
  contacts: ContactListItem[];
  onPressContact: (contactId: string) => void;
  onDeleteContact: (contactId: string, label: string) => void;
  onRowOpen: (contactId: string, ref: Swipeable) => void;
  onRowClose: (contactId: string) => void;
}) {
  return (
    <>
      {contacts.map((contact) => (
        <SwipeableContactRow
          key={contact.id}
          contact={contact}
          onPress={() => {
            onPressContact(contact.id);
          }}
          onDelete={() => {
            onDeleteContact(contact.id, contact.label);
          }}
          onOpen={(ref) => {
            onRowOpen(contact.id, ref);
          }}
          onClose={() => {
            onRowClose(contact.id);
          }}
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
  onPressContact,
  onDeleteContact,
  onRowOpen,
  onRowClose,
  nested = false,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  contacts: ContactListItem[];
  onPressContact: (contactId: string) => void;
  onDeleteContact: (contactId: string, label: string) => void;
  onRowOpen: (contactId: string, ref: Swipeable) => void;
  onRowClose: (contactId: string) => void;
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
        <ContactRows
          contacts={contacts}
          onPressContact={onPressContact}
          onDeleteContact={onDeleteContact}
          onRowOpen={onRowOpen}
          onRowClose={onRowClose}
        />
      ) : null}
    </View>
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

function WalletChainSections({
  contacts,
  evmExpanded,
  solanaExpanded,
  multiChainExpanded,
  onToggleEvm,
  onToggleSolana,
  onToggleMultiChain,
  onPressContact,
  onDeleteContact,
  onRowOpen,
  onRowClose,
}: {
  contacts: ContactListItem[];
  evmExpanded: boolean;
  solanaExpanded: boolean;
  multiChainExpanded: boolean;
  onToggleEvm: () => void;
  onToggleSolana: () => void;
  onToggleMultiChain: () => void;
  onPressContact: (contactId: string) => void;
  onDeleteContact: (contactId: string, label: string) => void;
  onRowOpen: (contactId: string, ref: Swipeable) => void;
  onRowClose: (contactId: string) => void;
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
            onPressContact={onPressContact}
            onDeleteContact={onDeleteContact}
            onRowOpen={onRowOpen}
            onRowClose={onRowClose}
            nested
          />
        </View>
      ))}
    </>
  );
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

export function ContactsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<ContactsStackParamList>>();
  const { userContacts, farcasterContacts, ensContacts, externalContacts, isLoading } =
    useContacts();
  const {
    query,
    setQuery,
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
  const {
    confirmVisible,
    contactLabel,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting,
    errorMessage,
  } = useConfirmDeleteContact();
  const { onRowOpen, onRowClose, closeOpen } = useContactsSwipe();

  const openContact = (contactId: string) => {
    closeOpen();
    navigation.navigate('contactDetails', { contactId });
  };

  const deleteContact = (contactId: string, label: string) => {
    closeOpen();
    requestDelete(contactId, label);
  };

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
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Text style={styles.topBarTitle}>Contacts</Text>
          <IconButton
            accessibilityLabel="New contact"
            backgroundColor={colors.primary}
            color={colors.primaryText}
            icon="add"
            iconSize={24}
            onPress={() => {
              navigation.navigate('newContact');
            }}
            size={36}
            style={styles.addButton}
          />
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

        <GestureHandlerRootView style={styles.gestureRoot}>
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
                placeholderTextColor={colors.textSubtle}
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
                <ContactRows
                  contacts={filteredUserContacts}
                  onPressContact={openContact}
                  onDeleteContact={deleteContact}
                  onRowOpen={onRowOpen}
                  onRowClose={onRowClose}
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
                          onPressContact={openContact}
                          onDeleteContact={deleteContact}
                          onRowOpen={onRowOpen}
                          onRowClose={onRowClose}
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
                    onPressContact={openContact}
                    onDeleteContact={deleteContact}
                    onRowOpen={onRowOpen}
                    onRowClose={onRowClose}
                  />
                ) : null}
                {filteredEnsContacts.length > 0 ? (
                  <CollapsibleSection
                    title="ENS"
                    expanded={ensExpanded}
                    onToggle={toggleEns}
                    contacts={filteredEnsContacts}
                    onPressContact={openContact}
                    onDeleteContact={deleteContact}
                    onRowOpen={onRowOpen}
                    onRowClose={onRowClose}
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
                    onPressContact={openContact}
                    onDeleteContact={deleteContact}
                    onRowOpen={onRowOpen}
                    onRowClose={onRowClose}
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
                            onPressContact={openContact}
                            onDeleteContact={deleteContact}
                            onRowOpen={onRowOpen}
                            onRowClose={onRowClose}
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
                        onPressContact={openContact}
                        onDeleteContact={deleteContact}
                        onRowOpen={onRowOpen}
                        onRowClose={onRowClose}
                        nested
                      />
                    ) : null}
                    {filteredEnsContacts.length > 0 ? (
                      <CollapsibleSection
                        title="ENS"
                        expanded={ensExpanded}
                        onToggle={toggleEns}
                        contacts={filteredEnsContacts}
                        onPressContact={openContact}
                        onDeleteContact={deleteContact}
                        onRowOpen={onRowOpen}
                        onRowClose={onRowClose}
                        nested
                      />
                    ) : null}
                  </CollapsibleGroup>
                ) : null}
              </>
            )}
          </ScrollView>
        </GestureHandlerRootView>
      </View>

      <ConfirmDeleteContactModal
        visible={confirmVisible}
        contactLabel={contactLabel}
        isDeleting={isDeleting}
        errorMessage={errorMessage}
        onCancel={cancelDelete}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
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
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  gestureRoot: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: c.primary,
  },
  topBarSpacer: {
    width: 36,
    marginHorizontal: 4,
  },
  addButton: {
    marginHorizontal: 4,
  },
  tabs: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    marginTop: 4,
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
  });
}