// utils/storage.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';

const isWeb = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const saveToken = async (token: string) => {
  try {
    if (isWeb) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('❌ Error saving token:', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      return localStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('❌ Error getting token:', error);
    return null;
  }
};

export const deleteToken = async () => {
  try {
    if (isWeb) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('❌ Error deleting token:', error);
  }
};