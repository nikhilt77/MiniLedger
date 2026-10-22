import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  Animated,
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
  { key: 'overdue', label: '⚠ Overdue' },
  { key: 'repaid', label: '✓ Repaid' },
];

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const fabScale = useRef(new Animated.Value(1)).current;

  const fetchData = useCallback(async () => {
    try {
      const [loansData, summaryData] = await Promise.all([
        getLoans(),
        getSummary(),
      ]);
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

  // Load on mount
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredLoans = loans.filter((loan) => {
    switch (activeTab) {
      case 'pending':
        return !loan.is_repaid && !loan.is_overdue;
      case 'overdue':
        return loan.is_overdue && !loan.is_repaid;
      case 'repaid':
        return loan.is_repaid;
      default:
        return true;
    }
  });

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await clearToken();
          onLogout();
        },
      },
    ]);
  };

  const animateFab = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const renderHeader = () => (
    <View>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>My Ledger</Text>
          <Text style={styles.subGreeting}>Track money lent to friends</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>↩ Out</Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <SummaryCard summary={summary} loading={loading} />

      {/* Filter tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section heading */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {filteredLoans.length} {activeTab === 'all' ? 'total' : activeTab} entries
        </Text>
        {summary && summary.overdueCount > 0 && activeTab !== 'overdue' && (
          <TouchableOpacity onPress={() => setActiveTab('overdue')}>
            <Text style={styles.overdueAlert}>
              {summary.overdueCount} overdue ⚠
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>💸</Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'all' ? 'No loans yet' : `No ${activeTab} loans`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'all'
          ? 'Tap + to record money you\'ve lent'
          : 'Switch tabs to see other entries'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLoans}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <LoanItem loan={item} onUpdate={fetchData} />
        )}
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

      {/* FAB */}
      <Animated.View style={[styles.fabWrapper, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            animateFab();
            setShowAddModal(true);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Add Loan Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddLoanScreen
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
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
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subGreeting: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  overdueAlert: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 36,
    includeFontPadding: false,
  },
});
