import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Помилка', 'Будь ласка, введіть номер телефону і пароль');
      return;
    }

    try {
      const data = await login(phone, password);
      console.log('Login response:', data); // Логування відповіді login

      if (data?.token) {
        await AsyncStorage.setItem('token', data.token);
        console.log('Token saved to AsyncStorage:', data.token);
      }

      router.replace('/');
    } catch (error: any) {
      Alert.alert('Помилка', error.message || 'Щось пішло не так');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>🔐 Вхід</Text>

      <TextInput
        style={styles.input}
        placeholder="Телефон"
        keyboardType="phone-pad"
        autoCapitalize="none"
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button title="Увійти" onPress={handleLogin} />

      <TouchableOpacity onPress={() => router.push('/auth/register')}>
        <Text style={styles.link}>Ще не маєте акаунту? Зареєструватися</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 28, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 16 },
  link: { marginTop: 18, textAlign: 'center', color: '#007AFF', fontSize: 15 },
});