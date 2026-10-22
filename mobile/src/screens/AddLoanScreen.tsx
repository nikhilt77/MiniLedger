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

  const setDaysFromNow = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async () => {
    if (!friendName.trim()) {
      Alert.alert('Name required', "Enter your friend's name");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive number');
      return;
    }
    if (!dueDate) {
      Alert.alert('Due date required', 'Pick a due date or use the shortcuts below');
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
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Sheet handle + header */}
      <View style={styles.header}>
        <View style={styles.sheetHandle} />
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>New loan</Text>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Friend */}
        <Text style={styles.label}>Who did you lend to?</Text>
        <TextInput
          style={styles.input}
          placeholder="Friend's name"
          placeholderTextColor={Colors.textMuted}
          value={friendName}
          onChangeText={setFriendName}
          autoCapitalize="words"
          returnKeyType="next"
          autoFocus
        />

        {/* Amount */}
        <Text style={styles.label}>How much?</Text>
        <View style={styles.amountRow}>
          <View style={styles.currencyPrefix}>
            <Text style={styles.currencySymbol}>₹</Text>
          </View>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>

        {/* Due date */}
        <Text style={styles.label}>Due date</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textMuted}
          value={dueDate}
          onChangeText={setDueDate}
          keyboardType="numbers-and-punctuation"
          returnKeyType="next"
        />

        <View style={styles.quickDates}>
          {[
            { label: '1 wk', days: 7 },
            { label: '2 wks', days: 14 },
            { label: '1 mo', days: 30 },
            { label: '3 mo', days: 90 },
          ].map(({ label, days }) => (
            <TouchableOpacity
              key={days}
              style={[styles.quickChip, dueDate === new Date(Date.now() + days * 86400000).toISOString().split('T')[0] && styles.quickChipActive]}
              onPress={() => setDaysFromNow(days)}
            >
              <Text style={styles.quickChipText}>+{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        <Text style={styles.label}>Note <Text style={styles.optional}>(optional)</Text></Text>
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

        {/* Preview */}
        {friendName && amount ? (
          <View style={styles.preview}>
            <Text style={styles.previewText}>
              Lending{' '}
              <Text style={styles.previewHighlight}>
                ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
              </Text>
              {' '}to{' '}
              <Text style={styles.previewHighlight}>{friendName}</Text>
              {dueDate ? `, due ${dueDate}` : ''}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Add loan</Text>
          }
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  cancelText: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  form: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  optional: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
  input: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  currencyPrefix: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: Colors.border,
    borderTopLeftRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  currencySymbol: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  amountInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  quickDates: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  quickChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  quickChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  preview: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  previewHighlight: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
