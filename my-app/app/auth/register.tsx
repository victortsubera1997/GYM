// app/auth/register.tsx (або де у тебе файл)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  useColorScheme,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import axios from 'axios';

export default function RegisterScreen() {
  const { setAuthData } = useAuth();  // беремо setAuthData з контексту
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const textColor = isDark ? '#fff' : '#000';
  const bgColor = isDark ? '#000' : '#fff';
  const inputBg = isDark ? '#111' : '#fff';

  const BACKEND_URL = 'http://192.168.100.103:5050';

  const handleRegister = async () => {
    if (!name || !phone || !password) {
      Alert.alert('Помилка', 'Заповніть всі поля');
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        name,
        phone,
        password,
      });

      const { token, user } = response.data;

      // Використовуємо setAuthData, щоб одразу зберегти токен і користувача
      await setAuthData(token, user);

      router.replace('/');
    } catch (error: any) {
      Alert.alert('Помилка', error.response?.data?.message || 'Не вдалося зареєструватися');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={[styles.title, { color: textColor }]}>🆕 Реєстрація</Text>

      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder="Ім’я"
        placeholderTextColor={isDark ? '#888' : '#999'}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder="Телефон"
        placeholderTextColor={isDark ? '#888' : '#999'}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
        placeholder="Пароль"
        placeholderTextColor={isDark ? '#888' : '#999'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Зареєструватися" onPress={handleRegister} />
      <View style={{ marginTop: 10 }}>
        <Button title="Назад до входу" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 24, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
});