import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { sendOtp, verifyOtp, saveToken } from '../api/client';
import { Colors, FontSize, Radius, Spacing } from '../theme';

interface LoginScreenProps {
  onLogin: () => void;
}

type Step = 'phone' | 'otp';

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (step === 'otp') {
      Animated.spring(dotScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [step]);

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      Alert.alert('Phone required', 'Please enter your phone number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone.trim());
      setStep('otp');
      Alert.alert(
        '📱 OTP Sent!',
        'Check the backend server logs for your 6-digit OTP code.',
        [{ text: 'Got it' }]
      );
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 4) {
      Alert.alert('OTP required', 'Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(phone.trim(), otp.trim());
      onLogin();
    } catch (err: unknown) {
      Alert.alert('Invalid OTP', err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Background gradient orbs */}
      <Animated.View style={[styles.orb1, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.orb2, { opacity: glowAnim }]} />

      <Animated.View
        style={[
          styles.inner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Logo / Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💸</Text>
          </View>
          <Text style={styles.appName}>MiniLedger</Text>
          <Text style={styles.tagline}>Track money lent to friends</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {step === 'phone' ? 'Enter your number' : 'Verify OTP'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {step === 'phone'
              ? "We'll send you a one-time password"
              : `Sent to ${phone} · check server logs`}
          </Text>

          {step === 'phone' ? (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>📞</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 9876543210"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSendOtp}
                />
              </View>
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Send OTP →</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Animated.View
                style={[
                  styles.inputWrapper,
                  { transform: [{ scale: dotScale }] },
                ]}
              >
                <Text style={styles.inputPrefix}>🔐</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  placeholderTextColor={Colors.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                />
              </Animated.View>

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Verify & Login →</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  setStep('phone');
                  setOtp('');
                }}
              >
                <Text style={styles.backBtnText}>← Change number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.disclaimer}>
          🔒 Mock auth — OTP appears in server logs
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
  },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.accent,
    top: -100,
    right: -100,
    filter: [{ blur: 80 }] as unknown as undefined,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.success,
    bottom: 50,
    left: -80,
    filter: [{ blur: 60 }] as unknown as undefined,
  },
  inner: {
    paddingHorizontal: Spacing.lg,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentDim,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputPrefix: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    paddingVertical: Spacing.md,
    fontWeight: '500',
  },
  btn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backBtn: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  backBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  disclaimer: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.lg,
  },
});
