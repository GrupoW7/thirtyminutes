import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, radius } from '../theme';

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&q=60`;

// Real lifestyle moments — reading, nature, cooking, running, coffee.
const PHOTOS = [
  U('1512820790803-83ca734da794'), // books
  U('1441974231531-c6227db76b6e'), // forest
  U('1504674900247-0877df9cc836'), // food
  U('1476480862126-209bfaa8edc8'), // running
  U('1495474472287-4d71bcdd2085'), // coffee
];

const CANVAS = Math.min(Dimensions.get('window').width - 48, 330);
const SCALE = CANVAS / 330;
const s = (n: number) => Math.round(n * SCALE);

// Scattered, slightly-rotated cards (davi-style collage).
const TILES = [
  { l: 8, t: 6, w: 120, h: 150, r: '-6deg' },
  { l: 152, t: 0, w: 120, h: 118, r: '5deg' },
  { l: 0, t: 156, w: 112, h: 122, r: '4deg' },
  { l: 210, t: 128, w: 112, h: 150, r: '-5deg' },
  { l: 92, t: 116, w: 140, h: 150, r: '-2deg' }, // center, on top
];

export function PhotoCollage() {
  return (
    <View style={[styles.canvas, { width: CANVAS, height: s(300) }]}>
      {TILES.map((t, i) => (
        <Image
          key={i}
          source={{ uri: PHOTOS[i] }}
          style={[
            styles.tile,
            { left: s(t.l), top: s(t.t), width: s(t.w), height: s(t.h), transform: [{ rotate: t.r }] },
          ]}
          contentFit="cover"
          transition={250}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { alignSelf: 'center', position: 'relative' },
  tile: {
    position: 'absolute',
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.surfaceAlt,
  },
});
