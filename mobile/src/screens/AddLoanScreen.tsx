import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { addLoan } from '../api/client';
import { Colors, FontSize, Radius, Spacing } from '../theme';

interface AddLoanScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddLoanScreen({ onSuccess, onCancel }: AddLoanScreenProps) {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick-fill due date helpers
  const setDaysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async () => {
    if (!friendName.trim()) {
      Alert.alert('Required', 'Please enter your friend\'s name');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }
    if (!dueDate) {
      Alert.alert('Required', 'Please set a due date');
      return;
    }

    setLoading(true);
    try {
      await addLoan({
        friend_name: friendName.trim(),
        amount: parsedAmount,
        due_date: dueDate,
        note: note.trim() || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>✕ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Loan</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Friend Name */}
        <Text style={styles.label}>Friend's Name</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>👤</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rahul Gupta"
            placeholderTextColor={Colors.textMuted}
            value={friendName}
            onChangeText={setFriendName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* Amount */}
        <Text style={styles.label}>Amount Lent (₹)</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>₹</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>

        {/* Due Date */}
        <Text style={styles.label}>Due Date</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>📅</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="numbers-and-punctuation"
            returnKeyType="next"
          />
        </View>

        {/* Quick date shortcuts */}
        <View style={styles.quickDates}>
          {[
            { label: '1 week', days: 7 },
            { label: '2 weeks', days: 14 },
            { label: '1 month', days: 30 },
            { label: '3 months', days: 90 },
          ].map(({ label, days }) => (
            <TouchableOpacity
              key={days}
              style={styles.quickDateChip}
              onPress={() => setDaysFromNow(days)}
            >
              <Text style={styles.quickDateText}>+{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <Text style={styles.label}>Note (optional)</Text>
        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What's it for?"
            placeholderTextColor={Colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Preview chip */}
        {friendName && amount ? (
          <View style={styles.preview}>
            <Text style={styles.previewText}>
              Lending{' '}
              <Text style={styles.previewHighlight}>
                ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
              </Text>{' '}
              to{' '}
              <Text style={styles.previewHighlight}>{friendName}</Text>
              {dueDate ? ` · due ${dueDate}` : ''}
            </Text>
          </View>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>💸 Add to Ledger</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
  },
  cancelText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  form: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingVertical: Spacing.md,
    fontWeight: '500',
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  textArea: {
    minHeight: 72,
  },
  quickDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  quickDateChip: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.borderFocus,
  },
  quickDateText: {
    color: Colors.accentLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  preview: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderFocus,
  },
  previewText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  previewHighlight: {
    color: Colors.accentLight,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.lg,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
