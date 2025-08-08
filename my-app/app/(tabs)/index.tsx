import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [membership, setMembership] = useState<{ name: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/auth/profile');
        const userData = res.data.user;

        if (userData.membership) {
          setMembership({
            name: userData.membership.name || 'Абонемент',
            expiresAt: userData.membershipEnd ? new Date(userData.membershipEnd).toLocaleDateString('uk-UA') : '-',
          });
        } else {
          setMembership(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMembership(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.greeting}>Будь ласка, увійдіть у систему</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Привіт, {user?.name || user?.phone}! 👋</Text>

      {membership ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Твій абонемент:</Text>
          <Text>{membership.name}</Text>
          <Text>До: {membership.expiresAt}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Абонемент відсутній</Text>
          <Text>Будь ласка, оформіть абонемент</Text>
        </View>
      )}

      <Pressable style={styles.button} onPress={() => router.push('/schedule')}>
        <Text style={styles.buttonText}>📅 Перейти до розкладу</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#3478f6',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});