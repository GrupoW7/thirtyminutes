import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LogoMark, logoColors } from './Logo';
import { font, spacing } from '../theme';

/** Full brand lockup: the logo mark + "30minutes" wordmark + slogan. */
export function BrandLogo({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <LogoMark size={92} showNumber={false} />
      <View style={styles.words}>
        <Text style={styles.brand}>
          <Text style={{ color: logoColors.navy }}>30</Text>
          <Text style={{ color: logoColors.blue }}>minutes</Text>
        </Text>
        <Text style={styles.slogan}>MAKE TIME COUNT</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md },
  words: { alignItems: 'center', gap: 4 },
  brand: { fontSize: font.size.xxl, fontWeight: font.weight.black, letterSpacing: -0.5 },
  slogan: {
    fontSize: 11,
    fontWeight: font.weight.bold,
    letterSpacing: 4,
    color: '#F9A94D',
  },
  subtitle: { color: '#424753', fontSize: font.size.lg, marginTop: spacing.sm },
});
