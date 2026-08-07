import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import {
  useContacts,
  type ContactListItem,
} from '@/hooks/useContacts';
import { useContactsAllSections } from '@/hooks/useContactsAllSections';
import { useContactsFilter } from '@/hooks/useContactsFilter';
import { useContactsTab } from '@/hooks/useContactsTab';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import type { HomeStackParamList } from '@/navigation/types';

function ContactRows({ contacts }: { contacts: ContactListItem[] }) {
  return (
    <>
      {contacts.map((contact) => (
        <View key={contact.id} style={styles.contactRow}>
          <Text style={styles.contactLabel}>{contact.label}</Text>
          {contact.subtitle ? (
            <Text style={styles.contactSubtitle}>{contact.subtitle}</Text>
          ) : null}
        </View>
      ))}
    </>
  );
}

function CollapsibleSection({
  title,
  expanded,
  onToggle,
  contacts,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  contacts: ContactListItem[];
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
      {expanded ? <ContactRows contacts={contacts} /> : null}
    </View>
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
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goHome = usePopToHome();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { userContacts, externalContacts, isLoading } = useContacts();
  const {
    query,
    setQuery,
    filteredUserContacts,
    filteredExternalContacts,
    hasActiveQuery,
  } = useContactsFilter({ userContacts, externalContacts });
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
    externalExpanded,
    toggleContacts,
    toggleExternal,
  } = useContactsAllSections();

  const hasAnyContacts =
    userContacts.length > 0 || externalContacts.length > 0;

  const hasSourceContacts = isAllTab
    ? hasAnyContacts
    : isContactsTab
      ? userContacts.length > 0
      : externalContacts.length > 0;

  const hasFilteredResults = isAllTab
    ? filteredUserContacts.length > 0 || filteredExternalContacts.length > 0
    : isContactsTab
      ? filteredUserContacts.length > 0
      : filteredExternalContacts.length > 0;

  const searchPlaceholder =
    selectedTab === 'all'
      ? 'Search contacts'
      : selectedTab === 'contacts'
        ? 'Search contacts'
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
          <Text style={styles.topBarTitle}>Contacts</Text>
          <Pressable
            accessibilityLabel="New contact"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              navigation.navigate('newContact');
            }}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <Ionicons name="add" size={24} color="#f0fdf4" />
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
          ) : isAllTab ? (
            <>
              {filteredUserContacts.length > 0 ? (
                <CollapsibleSection
                  title="Contacts"
                  expanded={contactsExpanded}
                  onToggle={toggleContacts}
                  contacts={filteredUserContacts}
                />
              ) : null}
              {filteredExternalContacts.length > 0 ? (
                <CollapsibleSection
                  title="External Contacts"
                  expanded={externalExpanded}
                  onToggle={toggleExternal}
                  contacts={filteredExternalContacts}
                />
              ) : null}
            </>
          ) : (
            <View style={styles.section}>
              <ContactRows
                contacts={
                  isContactsTab
                    ? filteredUserContacts
                    : filteredExternalContacts
                }
              />
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
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
    color: '#166534',
  },
  addButton: {
    width: 36,
    height: 36,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#166534',
    borderRadius: 10,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  webBack: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  webBackPressed: {
    opacity: 0.7,
  },
  webBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
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
  sectionHeader: {
    marginTop: 16,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
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
  contactRow: {
    width: '100%',
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  contactSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
  },
});
