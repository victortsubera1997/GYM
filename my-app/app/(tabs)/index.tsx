// app/(tabs)/index.tsx
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  bg: '#0A0B14',
  surface: '#1A1D2E',
  primary: '#6366F1',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#20273A',
};

const Tile = ({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={[styles.tile, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileSub}>{sub}</Text>
      </Animated.View>
    </Pressable>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.greeting}>Привіт, {user?.name || user?.phone}! 👋</Text>
        <Text style={styles.sub}>Що робимо сьогодні?</Text>

        <View style={styles.grid}>
          <Tile title="Абонемент" sub="Статус та QR" onPress={() => router.push('/membership')} />
          {/* Профіль є у таб-барі, але можна додати швидкий перехід */}
          <Tile title="Профіль" sub="Дані акаунта" onPress={() => router.push('/profile')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 30 },
  greeting: { fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  sub: { color: COLORS.textSecondary, marginTop: 6, marginBottom: 20, fontSize: 15 },
  grid: { gap: 14 },
  tile: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tileTitle: { color: COLORS.text, fontWeight: '800', fontSize: 17 },
  tileSub: { color: COLORS.textMuted, marginTop: 6, fontSize: 14 },
});