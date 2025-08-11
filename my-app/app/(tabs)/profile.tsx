// app/(tabs)/profile.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

// === THEME (узгоджено зі стилем membership) ===
const COLORS = {
  bg: '#0A0B14',
  bgSecondary: '#12141F',
  surface: '#1A1D2E',
  primary: '#6366F1',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#20273A',
  danger: '#EF4444',
  success: '#22C55E',
};

export default function ProfileScreen() {
  const { user: authUser, logout, updateUser } = useAuth();

  const [name, setName] = useState(authUser?.name || '');
  const [phone, setPhone] = useState(authUser?.phone || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // опційно оновити профіль з бекенду
      // const res = await api.get('/api/auth/profile');
      // updateUser(res.data.user);
    } finally {
      setRefreshing(false);
    }
  };

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
    try {
      const res = await api.put('/api/auth/profile', { name, phone, password: password || undefined });
      updateUser(res.data?.user);
      setPassword('');
      Alert.alert('Готово', 'Профіль оновлено.');
    } catch (e: any) {
      Alert.alert('Помилка', e?.response?.data?.message || 'Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.screen]}>
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="automatic"
              style={{ flex: 1 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              {/* Header */}
              <Animated.View style={[styles.header, { opacity: fade, transform: [{ translateY: slide }] }]}>
                <Text style={styles.title}>Профіль</Text>
                <Text style={styles.subtitle}>Онови свої дані облікового запису</Text>
              </Animated.View>

              {/* Form */}
              <View style={styles.form}>
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
                    placeholder="Пароль (необов’язково)"
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
                  <Text style={styles.primaryBtnText}>{saving ? 'Збереження…' : 'Зберегти'}</Text>
                </TouchableOpacity>

                <View style={{ height: 12 }} />

                <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
                  <Text style={styles.dangerBtnText}>Вийти з акаунта</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
  },
  header: { marginTop: 14, marginBottom: 14 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: COLORS.textSecondary, marginTop: 6, fontSize: 14 },

  form: { gap: 14 },
  group: { gap: 8 },
  label: { color: COLORS.textSecondary, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },

  primaryBtn: {
    backgroundColor: COLORS.primary + '22',
    borderWidth: 1,
    borderColor: COLORS.primary,
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