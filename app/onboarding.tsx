import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components/ui';
import { PhotoCollage } from '../src/components/PhotoCollage';
import { LogoMark } from '../src/components/Logo';
import { colors, font, spacing } from '../src/theme';

const { width } = Dimensions.get('window');

type Slide = {
  image: ReturnType<typeof require>;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    image: require('../assets/onboarding/slide1.png'),
    title: 'Uma rede social com hora para acabar',
    body:
      'Poste fotos e vídeos, curta, comente e compartilhe — como em qualquer rede. A diferença é que aqui o tempo importa.',
  },
  {
    image: require('../assets/onboarding/slide2.png'),
    title: 'Você tem 30 minutos por dia',
    body:
      'Navegue à vontade durante 30 minutos. Quando o tempo acabar, a rede social se esconde e volta só no dia seguinte.',
  },
  {
    image: require('../assets/onboarding/slide3.png'),
    title: 'Viva o resto do dia',
    body:
      'Monte seu perfil e receba sugestões de atividades. Ganhe pontos vivendo momentos reais: ler, cozinhar, correr, brincar com quem você ama.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const goNext = () => {
    if (isLast) finish();
    else listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const finish = async () => {
    await completeOnboarding();
    router.replace('/(auth)/register');
  };

  return (
    <LinearGradient colors={[colors.bg, colors.bgElevated]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <LogoMark size={28} showNumber={false} />
            <Text style={styles.brand}>
              30<Text style={{ color: colors.primary }}>minutes</Text>
            </Text>
          </View>
          {!isLast ? (
            <Pressable onPress={finish} hitSlop={12}>
              <Text style={styles.skip}>Pular</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(_, i) => `slide-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <PhotoCollage />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            label={isLast ? 'Começar agora' : 'Continuar'}
            onPress={goNext}
            icon={isLast ? 'arrow-forward' : undefined}
          />
          {isLast ? (
            <Pressable onPress={() => router.replace('/(auth)/login')} style={styles.loginLink}>
              <Text style={styles.loginText}>
                Já tenho conta · <Text style={{ color: colors.primary }}>Entrar</Text>
              </Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brand: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.black },
  skip: { color: colors.textMuted, fontSize: font.size.md, fontWeight: font.weight.medium },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.xl },
  illustration: {
    width: width * 0.74,
    height: width * 0.74,
    maxWidth: 320,
    maxHeight: 320,
  },
  title: {
    color: colors.text,
    fontSize: font.size.xxl,
    fontWeight: font.weight.black,
    textAlign: 'center',
    lineHeight: 34,
  },
  body: {
    color: colors.textMuted,
    fontSize: font.size.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.primary },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md },
  loginLink: { alignItems: 'center', paddingVertical: spacing.sm },
  loginText: { color: colors.textMuted, fontSize: font.size.sm },
});
