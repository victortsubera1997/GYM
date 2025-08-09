// app/(tabs)/profile.tsx
import React, { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

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
      const res = await api.put('/api/auth/profile', {
        name,
        phone,
        password: password || undefined,
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

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={styles.heading}>Мій профіль</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Дані акаунта</Text>

            <View style={styles.group}>
              <Text style={styles.label}>Ім’я</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ім’я"
                placeholderTextColor="#8A93A3"
                autoCorrect={false}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Телефон</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Телефон"
                placeholderTextColor="#8A93A3"
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>Новий пароль</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Пароль (порожньо — без змін)"
                placeholderTextColor="#8A93A3"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.buttonPrimary, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.buttonText}>{saving ? 'Збереження…' : 'Зберегти'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.buttonDanger} onPress={handleLogout}>
            <Text style={styles.buttonText}>Вийти</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1117' },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '700', color: '#E6EDF3', marginBottom: 12 },

  card: {
    backgroundColor: '#0F1621',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1D2633',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#E6EDF3', marginBottom: 12 },

  group: { marginBottom: 12 },
  label: { color: '#8A93A3', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#0E141D',
    borderWidth: 1,
    borderColor: '#1D2633',
    color: '#E6EDF3',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },

  buttonPrimary: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDanger: {
    backgroundColor: '#D9534F',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});