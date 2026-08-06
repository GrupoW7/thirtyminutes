import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../src/theme';
import { useTimer } from '../../src/context/TimerContext';

export default function AppTabsLayout() {
  const { isLocked } = useTimer();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Início',
          // When the 30-min budget is spent the social feed is hidden from the bar.
          href: isLocked ? null : '/(app)/feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Publicar',
          href: isLocked ? null : '/(app)/create',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.createBtn, focused && styles.createBtnActive]}>
              <Ionicons name="add" size={26} color={colors.bg} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Viver',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="rocket-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Detail routes kept out of the tab bar */}
      <Tabs.Screen name="post/[id]" options={{ href: null }} />
      <Tabs.Screen name="activity-profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  createBtnActive: { backgroundColor: colors.primaryDark },
});
