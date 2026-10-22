import React, { useState } from 'react';
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
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

// Deterministic color from name
function avatarColor(name: string): string {
  const palette = [
    '#7C5CFC', '#22D3A5', '#FF5572', '#FFB547',
    '#38BDF8', '#FB7185', '#A78BFA', '#34D399',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return palette[hash % palette.length];
}

export default function LoanItem({ loan, onUpdate }: LoanItemProps) {
  const [loading, setLoading] = useState(false);
  const scale = new Animated.Value(1);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleMarkRepaid = async () => {
    Alert.alert(
      'Mark as Repaid',
      `Mark ₹${parseFloat(loan.amount).toLocaleString('en-IN')} from ${loan.friend_name} as repaid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await markRepaid(loan.id);
              onUpdate();
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Loan',
      `Delete this entry for ${loan.friend_name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteLoan(loan.id);
              onUpdate();
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const isOverdue = loan.is_overdue && !loan.is_repaid;
  const color = avatarColor(loan.friend_name);

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        onLongPress={handleDelete}
        style={[
          styles.card,
          loan.is_repaid && styles.cardRepaid,
          isOverdue && styles.cardOverdue,
        ]}
      >
        {/* Left accent bar */}
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor: loan.is_repaid
                ? Colors.success
                : isOverdue
                ? Colors.danger
                : Colors.accent,
            },
          ]}
        />

        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={[styles.avatarText, { color }]}>
            {getInitials(loan.friend_name)}
          </Text>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>
              {loan.friend_name}
            </Text>
            <Text
              style={[
                styles.amount,
                loan.is_repaid && styles.amountRepaid,
                isOverdue && styles.amountOverdue,
              ]}
            >
              {formatAmount(loan.amount)}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.dueBadge}>
              {isOverdue ? (
                <Text style={[styles.dueText, styles.dueTextOverdue]}>
                  ⚠ Due {formatDate(loan.due_date)}
                </Text>
              ) : loan.is_repaid ? (
                <Text style={[styles.dueText, styles.dueTextRepaid]}>
                  ✓ Repaid {loan.repaid_at ? formatDate(loan.repaid_at) : ''}
                </Text>
              ) : (
                <Text style={styles.dueText}>
                  Due {formatDate(loan.due_date)}
                </Text>
              )}
            </View>

            {!loan.is_repaid && (
              <TouchableOpacity
                onPress={handleMarkRepaid}
                disabled={loading}
                style={styles.repayBtn}
              >
                <Text style={styles.repayBtnText}>
                  {loading ? '...' : 'Repaid ✓'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loan.note ? (
            <Text style={styles.note} numberOfLines={1}>
              {loan.note}
            </Text>
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
    marginVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardRepaid: {
    opacity: 0.65,
  },
  cardOverdue: {
    borderColor: Colors.dangerDim,
    backgroundColor: '#1F1520',
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
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
    color: Colors.accentLight,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  amountRepaid: {
    color: Colors.success,
  },
  amountOverdue: {
    color: Colors.danger,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dueBadge: {
    flex: 1,
  },
  dueText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  dueTextOverdue: {
    color: Colors.danger,
  },
  dueTextRepaid: {
    color: Colors.success,
  },
  repayBtn: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderFocus,
  },
  repayBtnText: {
    color: Colors.accentLight,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  note: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
