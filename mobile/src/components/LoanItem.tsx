import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Loan, markRepaid, deleteLoan } from '../api/client';
import { Colors, FontSize, Radius, Spacing } from '../theme';

interface LoanItemProps {
  loan: Loan;
  onUpdate: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(amount: string | number): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

const AVATAR_COLORS = [
  '#5B6AF8', '#3AC97B', '#F05252', '#F0A030',
  '#38BDF8', '#A78BFA', '#34D399', '#FB923C',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function LoanItem({ loan, onUpdate }: LoanItemProps) {
  const [acting, setActing] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleMarkRepaid = () => {
    Alert.alert(
      'Mark as repaid',
      `${loan.friend_name} paid back ${formatAmount(loan.amount)}?`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, mark repaid',
          onPress: async () => {
            setActing(true);
            try {
              await markRepaid(loan.id);
              onUpdate();
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update');
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete entry',
      `Remove the loan for ${loan.friend_name}? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActing(true);
            try {
              await deleteLoan(loan.id);
              onUpdate();
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  };

  const isOverdue = loan.is_overdue && !loan.is_repaid;
  const color = avatarColor(loan.friend_name);

  const statusColor = loan.is_repaid
    ? Colors.success
    : isOverdue
    ? Colors.danger
    : Colors.accent;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={pulse}
        onLongPress={handleDelete}
        style={[
          styles.card,
          loan.is_repaid && styles.cardRepaid,
          isOverdue && styles.cardOverdue,
        ]}
      >
        {/* Status bar on left edge */}
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: color + '1A' }]}>
          <Text style={[styles.avatarText, { color }]}>{getInitials(loan.friend_name)}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>{loan.friend_name}</Text>
            <Text style={[styles.amount, { color: statusColor }]}>
              {formatAmount(loan.amount)}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={[styles.dateText, isOverdue && styles.dateTextOverdue]}>
              {loan.is_repaid
                ? `Repaid ${loan.repaid_at ? formatDate(loan.repaid_at) : ''}`
                : isOverdue
                ? `Overdue since ${formatDate(loan.due_date)}`
                : `Due ${formatDate(loan.due_date)}`}
            </Text>

            {!loan.is_repaid && (
              <TouchableOpacity
                onPress={handleMarkRepaid}
                disabled={acting}
                style={styles.repayBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.repayBtnText}>
                  {acting ? 'Saving…' : 'Mark repaid'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loan.note ? (
            <Text style={styles.note} numberOfLines={1}>{loan.note}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardRepaid: {
    opacity: 0.55,
  },
  cardOverdue: {
    borderColor: 'rgba(240,82,82,0.2)',
  },
  statusBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
    marginVertical: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    flex: 1,
  },
  dateTextOverdue: {
    color: Colors.danger,
  },
  repayBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  repayBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  note: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
