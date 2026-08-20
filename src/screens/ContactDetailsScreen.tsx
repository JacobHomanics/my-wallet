import { Ionicons } from '@expo/vector-icons';
import { useRoute, type RouteProp } from '@react-navigation/native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountNumber } from '@/components/AccountNumber';
import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { ConfirmDeleteContactModal } from '@/components/ConfirmDeleteContactModal';
import { IconButton } from '@/components/IconButton';
import { useConfirmDeleteContact } from '@/hooks/useConfirmDeleteContact';
import { useContactDetails } from '@/hooks/useContactDetails';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { isPlatformContact } from '@/lib/contactPresentation';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToContacts } from '@/hooks/usePopToContacts';
import { useSendToContact } from '@/hooks/useSendToContact';
import type { ContactsStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

function DetailField({
  label,
  value,
  copyKey,
}: {
  label: string;
  value: string;
  copyKey: string;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const { copy, isCopied } = useCopyToClipboard();

  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <IconButton
          accessibilityLabel={
            isCopied(copyKey) ? `${label} copied` : `Copy ${label}`
          }
          color={colors.textMuted}
          icon={isCopied(copyKey) ? 'checkmark' : 'copy-outline'}
          iconSize={18}
          onPress={() => {
            void copy(value, copyKey);
          }}
          size={32}
        />
      </View>
      <Text style={styles.fieldValue} selectable>
        {value}
      </Text>
    </View>
  );
}

export function ContactDetailsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goContacts = usePopToContacts();
  const route = useRoute<RouteProp<ContactsStackParamList, 'contactDetails'>>();
  const contactId = route.params?.contactId;
  const { contact, isLoading, notFound } = useContactDetails(contactId);
  const {
    confirmVisible,
    contactLabel,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting,
    errorMessage,
  } = useConfirmDeleteContact(goContacts);
  const { canSendToContact, sendToContact } = useSendToContact();

  const canDelete = Boolean(contactId) && !notFound && !isLoading && Boolean(contact);
  const canSend = canSendToContact(contact);

  const handleDelete = () => {
    if (!contactId || !contact || isDeleting) {
      return;
    }
    requestDelete(contactId, contact.title);
  };

  const handleSend = () => {
    if (!contact || !canSend) {
      return;
    }
    sendToContact(contact);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to contacts"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goContacts}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton
              accessibilityLabel="Back to contacts"
              onPress={goContacts}
            />
          )}
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {contact?.title ?? 'Contact'}
          </Text>
          {canDelete ? (
            <IconButton
              accessibilityLabel="Delete contact"
              backgroundColor={colors.danger}
              color={colors.primaryText}
              disabled={isDeleting}
              icon="trash-outline"
              iconSize={20}
              onPress={handleDelete}
              size={36}
              style={styles.deleteButton}
            />
          ) : (
            <View style={styles.topBarSpacer} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : notFound || !contact ? (
            <Text style={styles.empty}>Contact not found.</Text>
          ) : (
            <>
              <Avatar
                label={contact.title}
                photoUrl={contact.profilePhotoUrl}
                seed={contact.username ?? contact.ensName ?? contact.id}
                size={88}
                identityBadge={contact.identityBadge}
                style={styles.avatar}
              />
              <Text style={styles.contactTitle}>{contact.title}</Text>
              {contact.isEns ? (
                <View style={styles.card}>
                  {contact.ensName ? (
                    <DetailField
                      label="ENS"
                      value={contact.ensName}
                      copyKey="ens"
                    />
                  ) : null}
                  {contact.evmAddress ? (
                    <DetailField
                      label="EVM address"
                      value={contact.evmAddress}
                      copyKey="evm"
                    />
                  ) : null}
                </View>
              ) : !isPlatformContact(contact) &&
                (contact.username ||
                  contact.name ||
                  contact.evmAddress ||
                  contact.solanaAddress) ? (
                <View style={styles.card}>
                  {contact.username ? (
                    <DetailField
                      label="Username"
                      value={`@${contact.username}`}
                      copyKey="username"
                    />
                  ) : null}
                  {contact.name ? (
                    <DetailField
                      label="Name"
                      value={contact.name}
                      copyKey="name"
                    />
                  ) : null}
                  {contact.evmAddress ? (
                    <DetailField
                      label="EVM address"
                      value={contact.evmAddress}
                      copyKey="evm"
                    />
                  ) : null}
                  {contact.solanaAddress ? (
                    <DetailField
                      label="Solana address"
                      value={contact.solanaAddress}
                      copyKey="solana"
                    />
                  ) : null}
                </View>
              ) : null}
              {!isPlatformContact(contact) && contact.identityId ? (
                <AccountNumber
                  identityId={contact.identityId}
                  style={styles.accountNumber}
                />
              ) : null}
              {!isPlatformContact(contact) &&
              !contact.username &&
              !contact.name &&
              !contact.evmAddress &&
              !contact.solanaAddress &&
              !contact.identityId ? (
                <Text style={styles.empty}>No details available.</Text>
              ) : null}
              {canSend ? (
                <Pressable
                  accessibilityLabel={`Send to ${contact.title}`}
                  accessibilityRole="button"
                  onPress={handleSend}
                  style={({ pressed }) => [
                    styles.sendButton,
                    pressed && styles.sendButtonPressed,
                  ]}
                >
                  <Ionicons name="send" size={18} color={colors.primaryText} />
                  <Text style={styles.sendButtonText}>Send</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </ScrollView>
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
    width: 44,
  },
  deleteButton: {
    marginHorizontal: 4,
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
    color: c.primary,
  },
  body: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatar: {
    marginTop: 24,
  },
  contactTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: c.primary,
    textAlign: 'center',
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
  card: {
    width: '100%',
    maxWidth: 420,
    marginTop: 16,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  field: {
    paddingVertical: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldValue: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    color: c.primary,
  },
  accountNumber: {
    width: '100%',
    maxWidth: 420,
    marginTop: 16,
  },
  sendButton: {
    width: '100%',
    maxWidth: 420,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
  sendButtonText: {
    color: c.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  });
}
