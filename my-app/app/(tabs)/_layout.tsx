// app/(tabs)/_layout.tsx
import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  bg: '#0A0B14',
  text: '#FFFFFF',
  icon: '#7C86A2',
  primary: '#6366F1',
  border: 'rgba(255,255,255,0.06)',
};

function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabsLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/auth/login" />;

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: true,
        headerTintColor: COLORS.text,
        headerStyle: { backgroundColor: COLORS.bg },
        tabBarShowLabel: false,                 // <- не буде накладань підписів
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.icon,
        tabBarStyle: {
          backgroundColor: COLORS.bg,
          borderTopColor: COLORS.border,
          height: 64,
        },
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Головна',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
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