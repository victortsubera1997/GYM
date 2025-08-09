// app/(tabs)/membership.tsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  Modal,
  Vibration,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import QRCode from 'react-native-qrcode-svg';

// =================== TYPES ===================
type ProfileUser = {
  membership?: { name: string; visits?: number } | null;
  membershipStart?: string | null;
  membershipEnd?: string | null;
  visitsRemaining?: number | null;
  checkinCode?: string | null;
};

type MembershipStatus = 'active' | 'expired' | 'pending' | 'none';

// =================== CONSTANTS ===================
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  bg: '#0A0B14',
  bgSecondary: '#12141F',
  surface: '#1A1D2E',
  primary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

// =================== ANIMATIONS ===================
const usePulseAnimation = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return pulseAnim;
};

// =================== UI COMPONENTS ===================
const PremiumCard: React.FC<{ children: React.ReactNode; gradient?: boolean }> = ({ children, gradient }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()}
      onPressOut={() =>
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start()
      }
    >
      <Animated.View style={[styles.premiumCard, gradient && styles.gradientCard, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

const StatusBadge: React.FC<{ status: MembershipStatus }> = ({ status }) => {
  const pulse = usePulseAnimation();
  const cfg = {
    active: { color: COLORS.success, text: '✓ Активний', glow: true },
    expired: { color: COLORS.danger, text: '✗ Прострочений', glow: false },
    pending: { color: COLORS.warning, text: '⏳ Очікується', glow: false },
    none: { color: COLORS.textMuted, text: '— Відсутній', glow: false },
  }[status];
  return (
    <Animated.View
      style={[
        styles.statusBadge,
        { backgroundColor: cfg.color + '20', borderColor: cfg.color },
        cfg.glow && { transform: [{ scale: pulse }] },
      ]}
    >
      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.text}</Text>
    </Animated.View>
  );
};

const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => {
  // Спрощене кільце (без SVG) — просто число з підписом
  return (
    <View style={styles.progressRingContainer}>
      <View style={styles.progressRingInner}>
        <Text style={styles.progressText}>{progress}%</Text>
        <Text style={styles.progressLabel}>використано</Text>
      </View>
    </View>
  );
};

const QRModal: React.FC<{ visible: boolean; onClose: () => void; code: string; userName?: string }> = ({
  visible,
  onClose,
  code,
  userName,
}) => {
  const slide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slide, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleShare = async () => {
    try {
      await Share.share({ message: `Мій код для входу в фітнес-клуб: ${code}`, title: 'Фітнес QR-код' });
    } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={{ opacity: fade }}>
          <View style={styles.modalBackdrop} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={[styles.modalContent, { transform: [{ translateY: slide }] }]}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Ваш QR-код</Text>
        <Text style={styles.modalSubtitle}>Покажіть на рецепції</Text>

        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <QRCode value={code} size={220} backgroundColor="white" color="black" />
          </View>
          {!!userName && <Text style={styles.qrUserName}>{userName}</Text>}
          <Text style={styles.qrCode}>{code}</Text>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.modalButton} onPress={handleShare}>
            <Text style={styles.modalButtonText}>📤 Поділитися</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={onClose}>
            <Text style={[styles.modalButtonText, { color: '#fff' }]}>Закрити</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

// =================== MAIN ===================
export default function MembershipScreen() {
  const { token, isAuthenticated } = useAuth();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(50)).current;

  const fetchUser = useCallback(
    async (showLoader = true) => {
      if (!token || !isAuthenticated) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (showLoader) setLoading(true);
      try {
        const res = await api.get('/api/auth/profile');
        setUser(res.data?.user ?? null);
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(slide, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
        ]).start();
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, isAuthenticated]
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const membershipData = useMemo(() => {
    if (!user?.membership) {
      return {
        status: 'none' as MembershipStatus,
        daysLeft: 0,
        totalDays: 0,
        progress: 0,
        startDate: null as Date | null,
        endDate: null as Date | null,
        visitsLeft: 0,
        visitsTotal: 0,
      };
    }
    const startDate = user.membershipStart ? new Date(user.membershipStart) : null;
    const endDate = user.membershipEnd ? new Date(user.membershipEnd) : null;
    const now = new Date();

    let status: MembershipStatus = 'none';
    if (startDate && endDate) {
      if (now < startDate) status = 'pending';
      else if (now > endDate) status = 'expired';
      else status = 'active';
    }

    const totalDays =
      startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const progress = totalDays > 0 ? Math.min(100, Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100))) : 0;

    const visitsTotal = user.membership.visits ?? 0;
    const visitsLeft = visitsTotal > 0 ? (user.visitsRemaining ?? visitsTotal) : Infinity;

    return { status, daysLeft, totalDays, progress, startDate, endDate, visitsLeft, visitsTotal };
  }, [user]);

  const formatDate = (date: Date | null) =>
    !date
      ? '—'
      : date.toLocaleDateString('uk-UA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

  const onRefresh = () => {
    setRefreshing(true);
    Vibration.vibrate(10);
    fetchUser(false);
  };

  // Loading
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Завантаження...</Text>
      </View>
    );
  }

  // No membership
  if (!user?.membership) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
      >
        <Animated.View style={[styles.header, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <Text style={styles.headerTitle}>Membership</Text>
          <Text style={styles.headerSubtitle}>Premium Fitness Experience</Text>
        </Animated.View>

        <PremiumCard gradient>
          <View style={styles.noMembershipCard}>
            <Text style={styles.noMembershipEmoji}>🎯</Text>
            <Text style={styles.noMembershipTitle}>Приєднуйтесь до клубу!</Text>
            <Text style={styles.noMembershipText}>Отримайте повний доступ до всіх можливостей фітнес-клубу</Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => Alert.alert('Контакти', 'Зверніться до адміністратора:\n📞 +380 XX XXX XX XX')}
            >
              <Text style={styles.ctaButtonText}>Оформити абонемент</Text>
            </TouchableOpacity>
          </View>
        </PremiumCard>
      </ScrollView>
    );
  }

  // Active membership (ОБРІЗАНО — нижче кнопки нічого)
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.header, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <Text style={styles.headerTitle}>Membership</Text>
        <StatusBadge status={membershipData.status} />
      </Animated.View>

      <PremiumCard gradient>
        <View>
          <View style={styles.mainCardHeader}>
            <View>
              <Text style={styles.membershipName}>{user.membership?.name}</Text>
              <Text style={styles.membershipPeriod}>{formatDate(membershipData.startDate)}</Text>
            </View>
            <ProgressRing progress={membershipData.progress} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{membershipData.daysLeft}</Text>
              <Text style={styles.statLabel}>Днів залишилось</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {membershipData.visitsLeft === Infinity ? '∞' : membershipData.visitsLeft}
              </Text>
              <Text style={styles.statLabel}>Відвідувань</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => {
              setQrModalVisible(true);
              Vibration.vibrate(10);
            }}
          >
            <Text style={styles.qrButtonText}>📱 Показати QR-код</Text>
          </TouchableOpacity>
        </View>
      </PremiumCard>

      {/* Тільки модалка нижче — контент після кнопки видалено */}
      <QRModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        code={user.checkinCode || 'NO_CODE'}
        userName="Fitness Member"
      />
    </ScrollView>
  );
}

// =================== STYLES ===================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 34, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  premiumCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  gradientCard: { backgroundColor: COLORS.primary, overflow: 'hidden' },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  progressRingContainer: { justifyContent: 'center', alignItems: 'center' },
  progressRingInner: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16 },
  progressText: { fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  progressLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },

  mainCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  membershipName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  membershipPeriod: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 16, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 20 },

  qrButton: { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center' },
  qrButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },

  // No-membership
  noMembershipCard: { alignItems: 'center', paddingVertical: 20 },
  noMembershipEmoji: { fontSize: 64, marginBottom: 16 },
  noMembershipTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  noMembershipText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },

  // Modal
  modalOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.textMuted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },

  qrContainer: { alignItems: 'center', marginBottom: 24 },
  qrWrapper: { padding: 20, backgroundColor: '#fff', borderRadius: 20, marginBottom: 16 },
  qrUserName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  qrCode: { fontSize: 14, color: COLORS.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 2 },

  modalActions: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: COLORS.bgSecondary },
  modalButtonPrimary: { backgroundColor: COLORS.primary },
  modalButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.text },
});