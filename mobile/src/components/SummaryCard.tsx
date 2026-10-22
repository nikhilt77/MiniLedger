import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Summary } from '../api/client';
import { Colors, FontSize, Radius, Spacing } from '../theme';

interface SummaryCardProps {
  summary: Summary | null;
  loading?: boolean;
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function SummaryCard({ summary, loading }: SummaryCardProps) {
  const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  const hasOverdue = summary && summary.overdueCount > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Total lent out</Text>
        {hasOverdue && (
          <View style={styles.overdueChip}>
            <Text style={styles.overdueChipText}>{summary!.overdueCount} overdue</Text>
          </View>
        )}
      </View>

      <Text style={styles.totalAmount}>
        {summary ? fmt(summary.totalLent) : '—'}
      </Text>

      {summary && summary.totalLoans > 0 && (
        <Text style={styles.loanCount}>
          across {summary.totalLoans} {summary.totalLoans === 1 ? 'loan' : 'loans'} · {summary.pendingCount} pending
        </Text>
      )}

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <StatPill
          label="Repaid"
          value={summary ? fmt(summary.totalRepaid) : '—'}
          color={Colors.success}
        />
        <View style={styles.statSeparator} />
        <StatPill
          label="Outstanding"
          value={summary ? fmt(summary.totalOutstanding) : '—'}
          color={Colors.accentLight}
        />
        <View style={styles.statSeparator} />
        <StatPill
          label="Overdue"
          value={summary ? fmt(summary.overdueAmount) : '—'}
          color={hasOverdue ? Colors.danger : Colors.textMuted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingCard: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  overdueChip: {
    backgroundColor: Colors.dangerDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  overdueChipText: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  totalAmount: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 2,
  },
  loanCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statPill: {
    flex: 1,
    alignItems: 'center',
  },
  statSeparator: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: 1,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
