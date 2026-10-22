import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Automatically resolve host IP when running on physical device or simulator
const getDevBaseUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) return `http://${ip}:3000`;
  }
  return 'http://192.168.31.82:3000';
};

const BASE_URL = __DEV__
  ? getDevBaseUrl()
  : 'https://your-production-api.com';

const TOKEN_KEY = 'miniledger_token';

// ─── Token Helpers ─────────────────────────────────────────────────────────────
export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ─── Base Fetch ───────────────────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data as T;
}

// ─── Auth APIs ────────────────────────────────────────────────────────────────
export async function sendOtp(phone: string) {
  return apiFetch<{ message: string; phone: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, otp: string) {
  const data = await apiFetch<{
    message: string;
    token: string;
    user: { id: number; phone: string };
  }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
  await saveToken(data.token);
  return data;
}

// ─── Loan Types ───────────────────────────────────────────────────────────────
export interface Loan {
  id: number;
  friend_name: string;
  amount: string;
  due_date: string;
  note: string | null;
  is_repaid: boolean;
  repaid_at: string | null;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
}

export interface Summary {
  totalLoans: number;
  totalLent: number;
  totalRepaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  overdueCount: number;
  pendingCount: number;
}

// ─── Loan APIs ────────────────────────────────────────────────────────────────
export async function getLoans() {
  return apiFetch<{ loans: Loan[] }>('/loans');
}

export async function getSummary() {
  return apiFetch<{ summary: Summary }>('/loans/summary');
}

export async function addLoan(data: {
  friend_name: string;
  amount: number;
  due_date: string;
  note?: string;
}) {
  return apiFetch<{ loan: Loan }>('/loans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function markRepaid(loanId: number) {
  return apiFetch<{ loan: Loan }>(`/loans/${loanId}/repay`, {
    method: 'PATCH',
  });
}

export async function deleteLoan(loanId: number) {
  return apiFetch<{ message: string }>(`/loans/${loanId}`, {
    method: 'DELETE',
  });
}
