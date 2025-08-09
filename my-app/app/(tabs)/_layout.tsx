import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, Redirect } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '../../context/AuthContext';

function TabBarIcon(
  props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }
) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  if (!user) return <Redirect href="/auth/login" />;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
        headerTintColor: theme.text,
        headerStyle: { backgroundColor: theme.background },
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.icon,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
        sceneStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Головна',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          // без кнопок у хедері — чисто і темно :)
          headerRight: () => <Pressable disabled style={{ opacity: 0, width: 0 }} />,
        }}
      />

      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Мої тренування',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />

      <Tabs.Screen
        name="program"
        options={{
          // за нашим планом — це особистий щоденник
          title: 'Щоденник',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      />

      <Tabs.Screen
        name="membership"
        options={{
          title: 'Абонемент',
          tabBarIcon: ({ color }) => <TabBarIcon name="id-card" color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профіль',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}