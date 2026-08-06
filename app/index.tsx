import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../src/theme';

/**
 * Entry route. The navigation gate in `_layout.tsx` immediately redirects to
 * onboarding, login, or the app based on state — so this just holds a spinner.
 */
export default function Index() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
