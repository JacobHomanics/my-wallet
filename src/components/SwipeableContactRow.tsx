import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import type { ContactListItem } from '@/hooks/useContacts';

const DELETE_WIDTH = 72;

type SwipeableContactRowProps = {
  contact: ContactListItem;
  onPress: () => void;
  onDelete: () => void;
  onOpen: (ref: Swipeable) => void;
  onClose: () => void;
};

/**
 * Contact list row that swipes left to reveal delete.
 */
export function SwipeableContactRow({
  contact,
  onPress,
  onDelete,
  onOpen,
  onClose,
}: SwipeableContactRowProps) {
  const swipeableRef = useRef<Swipeable | null>(null);

  const renderRightActions = () => (
    <RectButton
      accessibilityLabel={`Delete ${contact.label}`}
      onPress={() => {
        swipeableRef.current?.close();
        onDelete();
      }}
      style={styles.deleteButton}
    >
      <Ionicons name="trash-outline" size={22} color="#ffffff" />
    </RectButton>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      rightThreshold={40}
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => {
        if (swipeableRef.current) {
          onOpen(swipeableRef.current);
        }
      }}
      onSwipeableClose={onClose}
      containerStyle={styles.swipeContainer}
    >
      <Pressable
        accessibilityLabel={`View ${contact.label}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.contactRow,
          pressed && styles.contactRowPressed,
        ]}
      >
        <View style={styles.contactRowText}>
          <Text style={styles.contactLabel}>{contact.label}</Text>
          {contact.subtitle ? (
            <Text style={styles.contactSubtitle}>{contact.subtitle}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#86a894" />
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    width: '100%',
    marginTop: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contactRowPressed: {
    opacity: 0.85,
  },
  contactRowText: {
    flex: 1,
    minWidth: 0,
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
  deleteButton: {
    width: DELETE_WIDTH,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
