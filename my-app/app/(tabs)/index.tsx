// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.screen}>
      <Text style={styles.greeting}>Привіт, {user?.name || user?.phone}! 👋</Text>
      <Text style={styles.sub}>Що робимо сьогодні?</Text>

      <View style={styles.grid}>
        <Pressable style={styles.tile} onPress={() => router.push('/membership')}>
          <Text style={styles.tileTitle}>Абонемент</Text>
          <Text style={styles.tileSub}>Статус та QR</Text>
        </Pressable>

        <Pressable style={styles.tile} onPress={() => router.push('/program')}>
          <Text style={styles.tileTitle}>Щоденник</Text>
          <Text style={styles.tileSub}>Записи тренувань</Text>
        </Pressable>

        <Pressable style={styles.tile} onPress={() => router.push('/schedule')}>
          <Text style={styles.tileTitle}>Розклад</Text>
          <Text style={styles.tileSub}>Мої тренування</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1117', padding: 20, justifyContent: 'center' },
  greeting: { fontSize: 24, fontWeight: '800', color: '#E6EDF3' },
  sub: { color: '#8A93A3', marginTop: 6, marginBottom: 18 },

  grid: { gap: 12 },
  tile: {
    backgroundColor: '#0F1621',
    borderWidth: 1,
    borderColor: '#1D2633',
    borderRadius: 14,
    padding: 18,
  },
  tileTitle: { color: '#E6EDF3', fontWeight: '800', fontSize: 16 },
  tileSub: { color: '#B7C2D0', marginTop: 6 },
});