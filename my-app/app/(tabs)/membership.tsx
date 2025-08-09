import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import QRCode from 'react-native-qrcode-svg';

type ProfileUser = {
  membership?: { name: string; visits?: number } | null;
  membershipStart?: string | null;
  membershipEnd?: string | null;
  visitsRemaining?: number | null; // залишок (null — безліміт)
  checkinCode?: string | null;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('uk-UA');
};

export default function MembershipScreen() {
  const { token, isAuthenticated } = useAuth();

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ===== fetch profile =====
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!token || !isAuthenticated) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/api/auth/profile');
        if (!isMounted) return;
        setUser(res.data?.user ?? null);
      } catch (e) {
        console.log('Membership fetch error:', e);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated]);

  // ===== derived values =====
  const startDate = useMemo(
    () => (user?.membershipStart ? new Date(user.membershipStart) : null),
    [user?.membershipStart]
  );
  const endDate = useMemo(
    () => (user?.membershipEnd ? new Date(user.membershipEnd) : null),
    [user?.membershipEnd]
  );

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const diff = endDate.getTime() - startDate.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const daysLeft = useMemo(() => {
    if (!endDate) return null;
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [endDate]);

  const percentUsed = useMemo(() => {
    if (!totalDays || totalDays === 0 || daysLeft === null) return 0;
    const used = totalDays - daysLeft;
    return Math.min(100, Math.max(0, Math.round((used / totalDays) * 100)));
  }, [totalDays, daysLeft]);

  const status = useMemo(() => {
    if (!user?.membership || !startDate || !endDate) {
      return { text: 'Без абонемента', color: '#9AA4B2' };
    }
    const now = new Date();
    if (now < startDate) return { text: 'Ще не активний', color: '#F5A524' };
    if (now > endDate) return { text: 'Прострочений', color: '#F04438' };
    return { text: 'Активний', color: '#34C759' };
  }, [user?.membership, startDate, endDate]);

  const visitsTotal = user?.membership?.visits ?? 0; // 0 — безліміт
  const visitsLeft =
    visitsTotal > 0
      ? user?.visitsRemaining ?? visitsTotal
      : '∞';

  // ===== UI =====
  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user?.membership) {
    return (
      <View style={styles.screen}>
        <Text style={styles.heading}>Мій абонемент</Text>
        <View style={styles.card}>
          <Text style={styles.empty}>Абонемент відсутній</Text>
          <Text style={styles.muted}>Зверніться до адміністратора, щоб оформити.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.heading}>Мій абонемент</Text>

      {/* Статус + прогрес */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Статус</Text>
          <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${percentUsed}%` }]} />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>
              {formatDate(user.membershipStart)} — {formatDate(user.membershipEnd)}
            </Text>
            <Text style={styles.muted}>
              {daysLeft !== null ? `Залишилось: ${daysLeft} дн.` : '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Деталі абонемента */}
      <View style={styles.card}>
        <Text style={styles.title}>{user.membership?.name || 'Абонемент'}</Text>
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Початок</Text>
            <Text style={styles.value}>{formatDate(user.membershipStart)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Кінець</Text>
            <Text style={styles.value}>{formatDate(user.membershipEnd)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Відвідування</Text>
            <Text style={styles.value}>{visitsLeft}</Text>
          </View>
        </View>
      </View>

      {/* QR-код */}
      <View style={styles.card}>
        <Text style={styles.title}>Ваш QR для входу</Text>
        <View style={[styles.center, { paddingVertical: 8 }]}>
          {!user.checkinCode ? (
            <>
              <ActivityIndicator />
              <Text style={styles.muted}>Генеруємо QR…</Text>
            </>
          ) : (
            <>
              <QRCode value={String(user.checkinCode)} size={200} backgroundColor="white" color="black" />
              <Text style={[styles.muted, { marginTop: 8 }]}>Покажіть цей код при вході</Text>
            </>
          )}
        </View>
      </View>

      {visitsTotal > 0 && Number(visitsLeft) <= 0 && (
        <Text style={styles.warn}>⚠️ Тренування закінчились. Оновіть абонемент.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Dark-friendly
  screen: {
    flex: 1,
    backgroundColor: '#0E141D',
    padding: 16,
  },
  center: { justifyContent: 'center', alignItems: 'center' },

  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E6EAF2',
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#131A26',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  title: { color: '#E6EAF2', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  label: { color: '#9AA4B2', fontSize: 13, marginBottom: 4 },
  value: { color: '#E6EAF2', fontSize: 16, fontWeight: '600' },
  muted: { color: '#9AA4B2', fontSize: 12 },
  empty: { color: '#E6EAF2', fontSize: 16, marginBottom: 6 },
  warn: { color: '#F04438', marginTop: 8 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  progressWrap: { marginTop: 8, gap: 6 },
  progressBg: {
    height: 10,
    backgroundColor: '#1F2937',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    backgroundColor: '#3B82F6',
  },

  status: { fontSize: 14, fontWeight: '700' },

  grid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  col: { flex: 1 },
});