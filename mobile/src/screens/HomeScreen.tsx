import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import SummaryCard from '../components/SummaryCard';
import LoanItem from '../components/LoanItem';
import AddLoanScreen from './AddLoanScreen';
import { getLoans, getSummary, clearToken, Loan, Summary } from '../api/client';
import { Colors, FontSize, Radius, Spacing } from '../theme';

interface HomeScreenProps {
  onLogout: () => void;
}

type FilterTab = 'all' | 'pending' | 'repaid' | 'overdue';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'repaid', label: 'Repaid' },
];

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchData = useCallback(async () => {
    try {
      const [loansData, summaryData] = await Promise.all([getLoans(), getSummary()]);
      setLoans(loansData.loans);
      setSummary(summaryData.summary);
    } catch (err: unknown) {
      console.error('Fetch error:', err);
      if (err instanceof Error && err.message.includes('403')) {
        onLogout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onLogout]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredLoans = loans.filter((loan) => {
    switch (activeTab) {
      case 'pending': return !loan.is_repaid && !loan.is_overdue;
      case 'overdue': return loan.is_overdue && !loan.is_repaid;
      case 'repaid': return loan.is_repaid;
      default: return true;
    }
  });

  const handleLogout = () => {
    Alert.alert('Sign out', 'Sign out of MiniLedger?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => { await clearToken(); onLogout(); },
      },
    ]);
  };

  const renderHeader = () => (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.pageTitle}>My Ledger</Text>
          {summary && (
            <Text style={styles.pageSubtitle}>
              {summary.totalLoans} {summary.totalLoans === 1 ? 'loan' : 'loans'} recorded
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <SummaryCard summary={summary} loading={loading} />

      {/* Filter tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'overdue' && summary && summary.overdueCount > 0;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{summary!.overdueCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List heading */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>
          {filteredLoans.length} {activeTab === 'all' ? 'total' : activeTab}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>
        {activeTab === 'all' ? 'No loans yet' : `No ${activeTab} loans`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'all'
          ? "Tap + to record the first one"
          : 'Switch tabs to see other entries'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLoans}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <LoanItem loan={item} onUpdate={fetchData} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={loading ? null : renderEmpty()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddLoanScreen
          onSuccess={() => { setShowAddModal(false); fetchData(); }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  listContent: {
    paddingBottom: 100,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 56 : Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  signOutBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  signOutText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  tabActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.accentLight,
  },
  badge: {
    backgroundColor: Colors.danger,
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  sectionRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  addBtn: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    includeFontPadding: false,
  },
});
