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

function StatBox({
  label,
  value,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[styles.statBox, { backgroundColor: bgColor }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function SummaryCard({ summary, loading }: SummaryCardProps) {
  const fmt = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.title}>My Ledger Summary</Text>
        {summary && summary.overdueCount > 0 && (
          <View style={styles.overdueChip}>
            <Text style={styles.overdueChipText}>
              {summary.overdueCount} overdue
            </Text>
          </View>
        )}
      </View>

      {/* Big total */}
      <Text style={styles.totalAmount}>
        {summary ? fmt(summary.totalLent) : '—'}
      </Text>
      <Text style={styles.totalLabel}>Total Lent</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats grid */}
      <View style={styles.statsRow}>
        <StatBox
          label="Repaid"
          value={summary ? fmt(summary.totalRepaid) : '—'}
          color={Colors.success}
          bgColor={Colors.successDim}
        />
        <StatBox
          label="Outstanding"
          value={summary ? fmt(summary.totalOutstanding) : '—'}
          color={Colors.accentLight}
          bgColor={Colors.accentDim}
        />
        <StatBox
          label="Overdue"
          value={summary ? fmt(summary.overdueAmount) : '—'}
          color={Colors.danger}
          bgColor={Colors.dangerDim}
        />
      </View>

      {/* Footer counts */}
      {summary && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {summary.totalLoans} loans total · {summary.pendingCount} pending
          </Text>
        </View>
      )}
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
    // Glow effect via shadow
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  loadingCard: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
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
    fontWeight: '700',
  },
  totalAmount: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    letterSpacing: -1,
  },
  totalLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  footer: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
