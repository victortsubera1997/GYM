import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date)) return '-';
  return date.toLocaleDateString('uk-UA');
};

export default function MembershipScreen() {
  const { token, isAuthenticated } = useAuth();
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      console.log('No token or not authenticated, skipping fetch');
      setMembershipData(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        console.log('Fetching profile with token:', token);
        const res = await api.get('/api/auth/profile');
        const user = res.data.user;

        console.log('MembershipScreen user data:', user);

        if (user.membership) {
          setMembershipData({
            type: user.membership.name || 'Абонемент',
            startDate: formatDate(user.membershipStart),
            endDate: formatDate(user.membershipEnd),
            remainingWorkouts: user.membership.visits ?? 0,
          });
          console.log('Membership data set:', {
            type: user.membership.name,
            startDate: user.membershipStart,
            endDate: user.membershipEnd,
            remainingWorkouts: user.membership.visits,
          });
        } else {
          console.log('User has no membership');
          setMembershipData(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMembershipData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, isAuthenticated]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!membershipData) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Мій абонемент</Text>
        <Text>Абонемент відсутній</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Мій абонемент</Text>

      <View style={styles.card}>
        <Text style={styles.title}>{membershipData.type}</Text>
        <Text>Початок: {membershipData.startDate}</Text>
        <Text>Кінець: {membershipData.endDate}</Text>
        <Text>Залишилось тренувань: {membershipData.remainingWorkouts}</Text>
      </View>

      {membershipData.remainingWorkouts <= 0 && (
        <Text style={styles.warning}>⚠️ Тренування закінчились. Оновіть абонемент.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    gap: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
  },
  card: {
    padding: 15,
    backgroundColor: '#f0fff0',
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  warning: {
    color: 'red',
    fontWeight: '500',
    marginTop: 10,
  },
});