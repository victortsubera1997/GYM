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
  Platform,
  Share,
  Alert,
  Easing,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import QRCode from 'react-native-qrcode-svg';
import * as Brightness from 'expo-brightness';
import { useFocusEffect } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';

// =================== TYPES ===================
type ProfileUser = {
  membership?: { name: string; visits?: number } | null;
  membershipStart?: string | null;
  membershipEnd?: string | null;
  visitsRemaining?: number | null;
  checkinCode?: string | null;
};
type MembershipStatus = 'active' | 'expired' | 'pending' | 'none';

// =================== CONSTANTС ===================
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIDE_PADDING = 5;
const CARD_ASPECT = 1.586;
const CARD_WIDTH = SCREEN_WIDTH - CARD_SIDE_PADDING * 2;
const CARD_HEIGHT = Math.round(CARD_WIDTH / CARD_ASPECT);

const CARD_INNER_PADDING = 12;
const BUTTON_COL_WIDTH = 56;
const CONTENT_GAP = 12;

// ---- НАЛАШТУВАННЯ QR ----
const QR_SIZE = 190;   // розмір QR у картці
const QR_OFFSET_X = 25; // + вправо / - вліво
const QR_OFFSET_Y = 8;  // + вниз  / - вгору
// -------------------------

const COLORS = {
  bg: '#0A0B14',
  bgSecondary: '#12141F',
  surface: '#101425',
  surfaceElev: '#1A1D2E',
  primary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#AAB2C8',
  textMuted: '#6B7280',
  divider: 'rgba(255,255,255,0.12)',
};

// =================== SMALL ANIMS ===================
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

// ЗЕЛЕНИЙ індикатор
const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => (
  <View style={styles.progressRingContainer}>
    <View style={styles.progressRingInner}>
      <Text style={styles.progressText}>{progress}%</Text>
      <Text style={styles.progressLabel}>використано</Text>
    </View>
  </View>
);

// ========= FULLSCREEN QR MODAL (з підсвіткою) =============
const QRBrightModal: React.FC<{
  visible: boolean;
  code: string;
  baseSize: number;
  onRequestClose: () => void;
}> = ({ visible, code, baseSize, onRequestClose }) => {
  useKeepAwake();
  const original = useRef<number | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  // керування яскравістю
  useEffect(() => {
    let mounted = true;
    const up = async () => {
      try {
        if (original.current === null) original.current = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(1);
      } catch {}
    };
    const down = async () => {
      try {
        if (original.current !== null) await Brightness.setBrightnessAsync(original.current);
      } catch {} finally {
        original.current = null;
      }
    };

    if (visible) {
      up();
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }),
      ]).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      down();
    }
    return () => { if (mounted) down(); mounted = false; };
  }, [visible, opacity, scale]);

  const bigSize = Math.min(baseSize * 1.6, 340);

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
      presentationStyle="overFullScreen"
    >
      <Animated.View style={[styles.modalBackdrop, { opacity }]}/>
      <View style={styles.modalRoot}>
        <TouchableOpacity activeOpacity={1} onPress={onRequestClose} style={styles.modalTapArea}>
          <Animated.View style={[styles.modalQRBoxWrap, { transform: [{ scale }] }]}>
            <View style={styles.qrWhiteBoxBig}>
              <QRCode value={code || 'NO_CODE'} size={bigSize} backgroundColor="#fff" color="black" />
            </View>
            <Text style={styles.modalHint}>Торкніться, щоб закрити</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
// ==========================================================

// =================== MAIN ===================
export default function MembershipScreen() {
  const { token, isAuthenticated } = useAuth();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // -------- FLIP КАРТКИ --------
  const flip = useRef(new Animated.Value(0)).current; // 0 = фронт, 1 = бек
  const [isBack, setIsBack] = useState(false);
  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate  = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const flipTo = (back: boolean) => {
    setIsBack(back);
    Animated.timing(flip, {
      toValue: back ? 1 : 0,
      duration: 450,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    // якщо закриваємо спину — на всяк випадок закриємо і модал (поверне яскравість)
    if (!back) setQrModalVisible(false);
  };
  // ------------------------------------

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
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, isAuthenticated]
  );

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const membershipData = useMemo(() => {
    if (!user?.membership) {
      return { status: 'none' as MembershipStatus, daysLeft: 0, totalDays: 0, progress: 0, startDate: null, endDate: null, visitsLeft: 0, visitsTotal: 0 };
    }
    const startDate = user.membershipStart ? new Date(user.membershipStart) : null;
    const endDate   = user.membershipEnd ? new Date(user.membershipEnd) : null;
    const now = new Date();
    let status: MembershipStatus = 'none';
    if (startDate && endDate) {
      if (now < startDate) status = 'pending';
      else if (now > endDate) status = 'expired';
      else status = 'active';
    }
    const totalDays = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) : 0;
    const daysLeft  = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000)) : 0;
    const progress  = totalDays > 0 ? Math.min(100, Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100))) : 0;
    const visitsTotal = user.membership.visits ?? 0;
    const visitsLeft  = visitsTotal > 0 ? (user.visitsRemaining ?? visitsTotal) : Infinity;
    return { status, daysLeft, totalDays, progress, startDate, endDate, visitsLeft, visitsTotal };
  }, [user]);

  const formatDate = (date: Date | null) =>
    !date ? '—' : date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });

  const onRefresh = () => { setRefreshing(true); flipTo(false); fetchUser(false); };

  // авто-закриття модала при виході зі сторінки
  useFocusEffect(
    useCallback(() => {
      return () => setQrModalVisible(false);
    }, [])
  );

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

        <View style={styles.padH}>
          <View style={styles.cardShadow}>
            <View style={[styles.cardFaceCommon, styles.cardFrontStatic]}>
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
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Active membership — фліп + модал
  return (
    <>
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

        <View style={styles.padH}>
          <View style={styles.cardShadow}>
            <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
              {/* FRONT */}
              <Animated.View
                style={[
                  styles.cardFaceCommon,
                  { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
                  { zIndex: isBack ? 0 : 1 },
                ]}
                pointerEvents={isBack ? 'none' : 'auto'}
              >
                <View style={styles.cardAccent} />
                <View style={styles.faceInner}>
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

                  <View style={styles.daysProgressTrack}>
                    <View style={[styles.daysProgressFill, { width: `${membershipData.progress}%` }]} />
                  </View>

                  <TouchableOpacity style={styles.qrButton} onPress={() => flipTo(true)}>
                    <Text style={styles.qrButtonText}>📱 Показати QR-код</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* BACK */}
              <Animated.View
                style={[
                  styles.cardFaceCommon,
                  { transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
                  { zIndex: isBack ? 1 : 0 },
                ]}
                pointerEvents={isBack ? 'auto' : 'none'}
              >
                <View style={styles.cardAccent} />
                <View style={[styles.faceInner, { paddingBottom: CARD_INNER_PADDING }]}>
                  <View style={styles.qrRow}>
                    <View
                      style={[
                        styles.qrCenterWrap,
                        {
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: [{ translateX: QR_OFFSET_X }, { translateY: QR_OFFSET_Y }],
                        },
                      ]}
                    >
                      {/* Тап -> повноекранний QR + 100% яскравість */}
                      <TouchableOpacity activeOpacity={0.9} onPress={() => setQrModalVisible(true)}>
                        <View style={styles.qrWhiteBox}>
                          <QRCode
                            value={user.checkinCode || 'NO_CODE'}
                            size={QR_SIZE}
                            backgroundColor="#fff"
                            color="black"
                          />
                        </View>
                      </TouchableOpacity>
                      <Text style={styles.backCode}>{user.checkinCode || 'NO_CODE'}</Text>
                    </View>

                    <View style={styles.btnCol}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() =>
                          Share.share({
                            message: `Мій код для входу в фітнес-клуб: ${user.checkinCode || 'NO_CODE'}`,
                            title: 'Фітнес QR-код',
                          }).catch(() => {})
                        }
                      >
                        <Ionicons name="share-outline" size={24} color={COLORS.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.iconBtn} onPress={() => flipTo(false)}>
                        <MaterialIcons name="flip-camera-ios" size={24} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Деталі */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Деталі абонемента</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Початок</Text>
            <Text style={styles.detailValue}>{formatDate(membershipData.startDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Закінчення</Text>
            <Text style={styles.detailValue}>{formatDate(membershipData.endDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Днів всього</Text>
            <Text style={styles.detailValue}>{membershipData.totalDays || '—'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* FULLSCREEN QR + BRIGHTNESS */}
      <QRBrightModal
        visible={qrModalVisible}
        code={user.checkinCode || 'NO_CODE'}
        baseSize={QR_SIZE}
        onRequestClose={() => setQrModalVisible(false)}
      />
    </>
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
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: COLORS.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  padH: { paddingHorizontal: CARD_SIDE_PADDING },

  // Card + flip
  cardShadow: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  cardFaceCommon: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surfaceElev,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  cardFrontStatic: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surfaceElev,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
  },

  faceInner: {
    flex: 1,
    paddingHorizontal: CARD_INNER_PADDING,
    paddingTop: CARD_INNER_PADDING + 6,
    paddingBottom: CARD_INNER_PADDING,
    justifyContent: 'space-between',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 6,
    width: '100%',
    backgroundColor: COLORS.primary,
    opacity: 0.7,
  },

  // FRONT
  mainCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  membershipName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  membershipPeriod: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: COLORS.divider },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  statDivider: { width: 1, backgroundColor: COLORS.divider, marginHorizontal: 12, borderRadius: 1 },

  daysProgressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.divider, marginBottom: 8 },
  daysProgressFill: { height: '100%', backgroundColor: COLORS.primary },

  // GREEN ProgressRing
  progressRingContainer: { justifyContent: 'center', alignItems: 'center' },
  progressRingInner: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
    minWidth: 72,
    alignItems: 'center',
  },
  progressText: { fontSize: 18, fontWeight: '800', color: COLORS.success, textAlign: 'center' },
  progressLabel: { fontSize: 10, fontWeight: '700', color: COLORS.success, marginTop: 2, textAlign: 'center' },

  qrButton: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)' },
  qrButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // BACK — QR + кнопки
  qrRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: CONTENT_GAP,
  },
  qrCenterWrap: {
    flex: 1,
  },
  qrWhiteBox: {
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 12,
  },
  backCode: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.5,
  },
  btnCol: {
    width: BUTTON_COL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // No-membership
  noMembershipCard: { alignItems: 'center', justifyContent: 'center', flex: 1, padding: 16 },
  noMembershipEmoji: { fontSize: 48, marginBottom: 8 },
  noMembershipTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 6, textAlign: 'center' },
  noMembershipText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 16, paddingHorizontal: 8 },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // Details card
  detailsCard: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  detailsTitle: { color: COLORS.text, fontWeight: '800', fontSize: 16, marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { color: COLORS.text, fontSize: 13 },
  detailValue: { color: COLORS.text, fontSize: 13, fontWeight: '600' },

  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '700' },

  // MODAL styles
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.6,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTapArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalQRBoxWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWhiteBoxBig: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 16,
  },
  modalHint: {
    marginTop: 12,
    color: '#cbd5e1',
    fontSize: 12,
  },
});