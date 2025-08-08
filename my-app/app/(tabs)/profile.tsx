import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import QRCode from 'react-native-qrcode-svg';

const BACKEND_URL = 'http://192.168.100.103:5050';

type ProfileDTO = {
  _id: string;
  id?: string;
  name: string;
  phone: string;
  membership?: { name: string; visits?: number } | null;
  membershipStart?: string | null;
  membershipEnd?: string | null;
  visitsLeft?: number | null;        // якщо /me так повертає
  visitsRemaining?: number | null;   // якщо /profile так повертає
  checkinCode?: string;
};

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState<ProfileDTO | null>(null);
  const [now, setNow] = useState<Date>(new Date());

  // ❗️ Фікс типу таймера для RN/TS
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ===== Helpers =====
  const getToken = async () => (await import('../../utils/storage')).getToken();

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const token = await getToken();

      // Спроба №1: /me
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (res.data?.user ?? res.data) as ProfileDTO;
        setProfileData(data);
      } catch {
        // Спроба №2: /profile
        const res2 = await axios.get(`${BACKEND_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfileData(res2.data?.user as ProfileDTO);
      }
    } catch (err) {
      console.error('Помилка отримання профілю:', err);
      Alert.alert('Помилка', 'Не вдалося отримати дані профілю');
    } finally {
      setLoadingProfile(false);
    }
  };

  // автооновлення часу (для лічильника днів)
  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.phone]);

  const handleLogout = () => {
    Alert.alert('Вихід', 'Ви вийшли з акаунту.');
    logout();
  };

  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert('Помилка', 'Ім’я і телефон є обов’язковими полями');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const response = await axios.put(
        `${BACKEND_URL}/api/auth/profile`,
        { name, phone, password: password || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Успіх', 'Профіль оновлено');
      updateUser(response.data.user);
      setPassword('');
      fetchProfile();
    } catch (error: any) {
      Alert.alert('Помилка', error?.response?.data?.message || 'Не вдалося оновити профіль');
    } finally {
      setSaving(false);
    }
  };

  // ===== Derived values =====
  const startDate = useMemo(
    () => (profileData?.membershipStart ? new Date(profileData.membershipStart) : null),
    [profileData?.membershipStart]
  );
  const endDate = useMemo(
    () => (profileData?.membershipEnd ? new Date(profileData.membershipEnd) : null),
    [profileData?.membershipEnd]
  );

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const diff = endDate.getTime() - startDate.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const daysLeft = useMemo(() => {
    if (!endDate) return null;
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [endDate, now]);

  const percentLeft = useMemo(() => {
    if (!totalDays || totalDays === 0 || daysLeft === null) return 0;
    const used = totalDays - daysLeft;
    const p = (used / totalDays) * 100;
    return Math.min(100, Math.max(0, Math.round(p)));
  }, [totalDays, daysLeft]);

  const visitsTotal = profileData?.membership?.visits ?? 0; // 0 — безліміт
  const visitsRem = profileData?.visitsLeft ?? profileData?.visitsRemaining ?? null;
  const visitsLabel = visitsTotal > 0 ? (visitsRem ?? visitsTotal) : '∞';

  const status = useMemo(() => {
    if (!profileData?.membership || !startDate || !endDate) {
      return { text: 'Без абонемента', color: '#7a7a7a' };
    }
    if (now < startDate) return { text: 'Ще не активний', color: '#f0ad4e' };
    if (now > endDate) return { text: 'Прострочений', color: '#d9534f' };
    return { text: 'Активний', color: '#34c759' };
  }, [profileData?.membership, startDate, endDate, now]);

  // ===== UI =====
  if (loadingProfile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.heading}>Мій профіль</Text>

        {/* Статус + прогрес */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>Статус: </Text>
            <Text style={[styles.statusBadge, { color: status.color }]}>{status.text}</Text>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${percentLeft}%` }]} />
            </View>
            <View style={styles.progressMeta}>
              <Text style={styles.progressText}>
                {startDate ? startDate.toLocaleDateString() : '-'} — {endDate ? endDate.toLocaleDateString() : '-'}
              </Text>
              <Text style={styles.progressTextRight}>
                {daysLeft !== null ? `Залишилось: ${daysLeft} дн.` : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Картка абонемента */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Абонемент</Text>
          <Text style={styles.cardValue}>{profileData?.membership ? profileData.membership.name : 'Немає'}</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.cardLabel}>Початок</Text>
              <Text style={styles.cardValueSm}>{startDate ? startDate.toLocaleDateString() : '-'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.cardLabel}>Кінець</Text>
              <Text style={styles.cardValueSm}>{endDate ? endDate.toLocaleDateString() : '-'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.cardLabel}>Відвідування</Text>
              <Text style={styles.cardValueSm}>{visitsLabel}</Text>
            </View>
          </View>
        </View>

        {/* Профіль (редагування) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Дані акаунта</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ім’я</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ім’я" />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Телефон</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Телефон"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Новий пароль</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Пароль (порожньо — без змін)"
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={[styles.button, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Збереження...' : 'Зберегти'}</Text>
          </TouchableOpacity>
        </View>

        {/* QR-код */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ваш QR для входу</Text>
          <View style={styles.qrWrap}>
            {!profileData?.checkinCode ? (
              <View style={styles.qrLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.qrHint}>Генеруємо QR…</Text>
              </View>
            ) : (
              <>
                <QRCode value={profileData.checkinCode} size={200} backgroundColor="white" color="black" />
                <Text style={styles.qrHint}>Покажіть цей код при вході</Text>
              </>
            )}
          </View>
        </View>

        {/* Вихід */}
        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Вийти</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f7' },
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '700', marginBottom: 12, color: '#1d1d1f' },

  // статус + прогрес
  statusCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusText: { fontSize: 16, color: '#444' },
  statusBadge: { fontSize: 16, fontWeight: '700' },
  progressWrap: { marginTop: 4 },
  progressBarBg: { height: 10, backgroundColor: '#e5e5ea', borderRadius: 8, overflow: 'hidden' },
  progressBarFill: { height: 10, backgroundColor: '#007AFF' },
  progressMeta: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 12, color: '#6e6e73' },
  progressTextRight: { fontSize: 12, color: '#6e6e73', textAlign: 'right' },

  // картки
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#1d1d1f' },
  cardLabel: { fontSize: 12, color: '#6e6e73' },
  cardValue: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  cardValueSm: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 2 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  // форма
  formGroup: { marginBottom: 12 },
  label: { fontSize: 14, color: '#555', marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1, borderColor: '#d1d1d6', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff',
  },

  // кнопки
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  buttonText: { textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 16 },
  logoutButton: { backgroundColor: '#d9534f' },

  // QR
  qrWrap: { alignItems: 'center', justifyContent: 'center' },
  qrHint: { marginTop: 8, fontSize: 12, color: '#6e6e73' },
  qrLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
});
