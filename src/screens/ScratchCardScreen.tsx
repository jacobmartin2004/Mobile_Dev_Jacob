/**
 * @format
 */

import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  SCRATCH_CARD_THEMES,
  SCRATCH_CARD_VARIANTS,
  ScratchCard,
  ScratchCardHandle,
  ScratchCardVariant,
} from '../components/strachcard';

const BACKGROUND = '#07060F';

const formatNumber = (value: number) =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const ScratchCardScreen: React.FC = () => {
  const cardRef = useRef<ScratchCardHandle>(null);
  const [variant, setVariant] = useState<ScratchCardVariant>('gold');
  const [total, setTotal] = useState(0);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const totalPop = useSharedValue(1);
  const totalStyle = useAnimatedStyle(() => ({ transform: [{ scale: totalPop.value }] }));

  const theme = SCRATCH_CARD_THEMES[variant];

  const handleReveal = useCallback(
    (points: number) => {
      setLastWin(points);
      setTotal(t => t + points);
      totalPop.value = withSequence(withTiming(1.18, { duration: 160 }), withSpring(1));
    },
    [totalPop],
  );

  const newCard = useCallback(() => {
    setLastWin(null);
    cardRef.current?.reset();
  }, []);

  const selectVariant = useCallback((v: ScratchCardVariant) => {
    setVariant(v);
    setLastWin(null);
    setProgress(0);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Scratch & Win</Text>
        <Animated.View style={[styles.totalPill, { borderColor: theme.glowColor }, totalStyle]}>
          <Text style={[styles.totalValue, { color: theme.labelColor }]}>
            {formatNumber(total)}
          </Text>
          <Text style={styles.totalLabel}>PTS</Text>
        </Animated.View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsScroll}
      >
        {SCRATCH_CARD_VARIANTS.map(v => {
          const active = v === variant;
          const t = SCRATCH_CARD_THEMES[v];
          return (
            <Pressable
              key={v}
              onPress={() => selectVariant(v)}
              style={[
                styles.chip,
                active && styles.chipActive,
                active && { borderColor: t.glowColor },
              ]}
            >
              <View style={[styles.chipDot, { backgroundColor: t.glowColor }]} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.stage}>
        <ScratchCard
          key={variant}
          ref={cardRef}
          variant={variant}
          onProgress={setProgress}
          onReveal={handleReveal}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.status}>
          {lastWin !== null
            ? `You won ${formatNumber(lastWin)} points!`
            : progress > 0
            ? 'Keep going…'
            : 'Scratch the card to reveal your reward'}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress * 100)}%`, backgroundColor: theme.glowColor },
            ]}
          />
        </View>

        <View style={styles.buttons}>
          <Pressable
            onPress={() => cardRef.current?.revealAll()}
            style={({ pressed }) => [styles.button, styles.ghostButton, pressed && styles.pressed]}
          >
            <Text style={styles.ghostText}>Reveal all</Text>
          </Pressable>
          <Pressable
            onPress={newCard}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.glowColor },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>New card</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingTop: 112,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  totalPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  chipsScroll: {
    flexGrow: 0,
    marginTop: 20,
  },
  chips: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  chipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  status: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#0B0B14',
    fontSize: 16,
    fontWeight: '800',
  },
  ghostText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ScratchCardScreen;
