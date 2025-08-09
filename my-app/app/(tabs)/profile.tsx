// app/(tabs)/profile.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Vibration,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

// === THEME (узгоджено зі стилем membership) ===
const COLORS = {
  bg: '#0A0B14',
  bgSecondary: '#12141F',
  surface: '#1A1D2E',
  surfaceLight: '#252A40',
  primary: '#6366F1',
  success: '#10B981',
  danger: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

// ===== Premium Card =====
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
      <Animated.View style={[styles.card, gradient && styles.cardGradient, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { user: authUser, logout, updateUser } = useAuth();

  const [name, setName] = useState(authUser?.name || '');
  const [phone, setPhone] = useState(authUser?.phone || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // анімація появи
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogout = () => {
    Alert.alert('Вихід', 'Ви впевнені, що хочете вийти?', [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Вийти',
        style: 'destructive',
        onPress: () => {
          Vibration.vibrate(10);
          logout();
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Помилка', 'Ім’я і телефон є обов’язковими полями.');
      return;
    }
    setSaving(true);
    Vibration.vibrate(5);
    try {
      const res = await api.put('/api/auth/profile', {
        name: name.trim(),
        phone: phone.trim(),
        password: password ? password : undefined,
      });
      updateUser(res.data.user);
      setPassword('');
      Alert.alert('Успіх', 'Профіль оновлено');
    } catch (error: any) {
      Alert.alert('Помилка', error?.response?.data?.message || 'Не вдалося оновити профіль');
    } finally {
      setSaving(false);
    }
  };

  const reloadFromServer = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/auth/profile');
      const u = res.data?.user;
      if (u) {
        setName(u.name || '');
        setPhone(u.phone || '');
      }
    } catch {
      Alert.alert('Помилка', 'Не вдалося завантажити дані профілю');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1 }}
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fade, transform: [{ translateY: slide }] }]}>
            <Text style={styles.headerTitle}>Профіль</Text>
            <TouchableOpacity onPress={reloadFromServer} style={styles.reloadBtn}>
              {loading ? <ActivityIndicator size="small" color={COLORS.text} /> : <Text style={styles.reloadText}>↻</Text>}
            </TouchableOpacity>
          </Animated.View>

          {/* Форма */}
          <PremiumCard>
            <Text style={styles.sectionTitle}>Дані акаунта</Text>

            <View style={styles.group}>
              <Text style={styles.label}>Ім’я</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ім’я"
                placeholderTextColor={COLORS.textMuted}
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Телефон</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Телефон"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Новий пароль</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Пароль (порожньо — без змін)"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                returnKeyType="done"
              />
              {!!password && <Text style={styles.hint}>Пароль зміниться після збереження</Text>}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Зберегти</Text>}
            </TouchableOpacity>
          </PremiumCard>

          {/* Danger zone */}
          <PremiumCard>
            <Text style={styles.sectionTitle}>Небезпечна зона</Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
              <Text style={styles.dangerBtnText}>Вийти з акаунта</Text>
            </TouchableOpacity>
          </PremiumCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { color: COLORS.text, fontSize: 34, fontWeight: '800', letterSpacing: -1, flex: 1 },
  reloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F2433',
  },
  reloadText: { color: COLORS.text, fontSize: 18, fontWeight: '800' },

  card: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#20273A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardGradient: { backgroundColor: COLORS.primary },

  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 12 },

  group: { marginBottom: 12 },
  label: { color: COLORS.textSecondary, marginBottom: 6, fontWeight: '600', fontSize: 13 },
  input: {
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: '#1E2636',
    color: COLORS.text,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  hint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6 },

  primaryBtn: {
    backgroundColor: COLORS.text, // біла кнопка як у membership QR
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },

  dangerBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});