import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  RectButton,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { Avatar } from '@/components/Avatar';
import type { ContactListItem } from '@/hooks/useContacts';

const DELETE_WIDTH = 72;
/** Progress (0–1) before the trash icon fades in. */
const TRASH_REVEAL_PROGRESS = 0.55;

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

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const buttonOpacity = progress.interpolate({
      inputRange: [
        0,
        TRASH_REVEAL_PROGRESS,
        Math.min(TRASH_REVEAL_PROGRESS + 0.12, 1),
        1,
      ],
      outputRange: [0, 0, 1, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.deleteSlot, { opacity: buttonOpacity }]}>
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
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      rightThreshold={DELETE_WIDTH * TRASH_REVEAL_PROGRESS}
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => {
        if (swipeableRef.current) {
          onOpen(swipeableRef.current);
        }
      }}
      onSwipeableClose={onClose}
      containerStyle={styles.swipeContainer}
    >
      <TouchableOpacity
        accessibilityLabel={`View ${contact.label}`}
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.contactRow}
      >
        <Avatar
          label={contact.label}
          photoUrl={contact.profilePhotoUrl}
          seed={contact.username ?? contact.ensName ?? contact.id}
          size={40}
          showFarcasterBadge={contact.isFarcaster}
        />
        <View style={styles.contactRowText}>
          <Text style={styles.contactLabel}>{contact.label}</Text>
          {contact.subtitle ? (
            <Text style={styles.contactSubtitle}>{contact.subtitle}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#86a894" />
      </TouchableOpacity>
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
  deleteSlot: {
    width: DELETE_WIDTH,
    marginLeft: 8,
    alignSelf: 'stretch',
  },
  deleteButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
