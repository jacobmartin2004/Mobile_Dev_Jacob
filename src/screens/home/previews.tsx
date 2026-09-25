/**
 * @format
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

/** Looping "press and hold" demo: the button fills, glows, then resets. */
export const HoldToStartPreview: React.FC = () => {
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.linear }),
        withDelay(500, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) })),
        withTiming(0, { duration: 500 }),
      ),
      -1,
      false,
    );
  }, [fill]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: fill.value * 0.5,
    transform: [{ scale: interpolate(fill.value, [0, 1], [0.7, 1.1]) }],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.sqrt(fill.value) }],
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(fill.value, [0, 0.1, 1], [1, 0.96, 0.96]) }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: fill.value > 0.5 ? '#FFFFFF' : '#1F2937',
  }));

  return (
    <View style={[styles.preview, styles.holdBackground]}>
      <Animated.View style={[styles.holdGlow, glowStyle]} />
      <Animated.View style={[styles.holdButton, buttonStyle]}>
        <Animated.View style={[styles.holdFill, fillStyle]}>
          <LinearGradient
            colors={['#7C3AED', '#9333EA', '#C084FC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.Text style={[styles.holdText, textStyle]}>Start</Animated.Text>
      </Animated.View>
    </View>
  );
};

const Twinkle: React.FC<{ delay: number; style: object; size: number }> = ({
  delay,
  style,
  size,
}) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, t]);
  const animated = useAnimatedStyle(() => ({
    opacity: 0.25 + t.value * 0.75,
    transform: [{ scale: 0.7 + t.value * 0.5 }, { rotate: `${t.value * 45}deg` }],
  }));
  return (
    <Animated.Text style={[styles.twinkle, { fontSize: size }, style, animated]}>✦</Animated.Text>
  );
};

/** Mini gold ticket with a scratched window showing points, plus twinkling stars. */
export const ScratchCardPreview: React.FC = () => {
  const shine = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    shine.value = withRepeat(
      withDelay(900, withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.cubic) })),
      -1,
      false,
    );
    pop.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pop, shine]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shine.value, [0, 1], [-120, 160]) }, { rotate: '20deg' }],
  }));
  const windowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pop.value * 0.06 }],
    shadowOpacity: 0.4 + pop.value * 0.5,
  }));

  return (
    <View style={[styles.preview, styles.scratchBackground]}>
      <View style={styles.ticket}>
        <LinearGradient
          colors={['#8A5A12', '#E9B949', '#FFF1B8', '#D19A2A', '#7A4A0C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.shine, shineStyle]} />
        <View style={styles.ticketBorder} />
        <Animated.View style={[styles.window, windowStyle]}>
          <Text style={styles.windowLabel}>YOU WON</Text>
          <Text style={styles.windowPoints}>+250</Text>
        </Animated.View>
      </View>
      <Twinkle delay={0} size={14} style={styles.star1} />
      <Twinkle delay={300} size={10} style={styles.star2} />
      <Twinkle delay={600} size={12} style={styles.star3} />
      <Twinkle delay={450} size={9} style={styles.star4} />
    </View>
  );
};

const styles = StyleSheet.create({
  preview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  holdBackground: {
    backgroundColor: '#FAFAFC',
  },
  holdGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#9333EA',
  },
  holdButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.16)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  holdFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 31,
    overflow: 'hidden',
  },
  holdText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scratchBackground: {
    backgroundColor: '#120C04',
  },
  ticket: {
    width: 118,
    height: 74,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shine: {
    position: 'absolute',
    top: -30,
    width: 26,
    height: 140,
    backgroundColor: 'rgba(255, 252, 235, 0.55)',
  },
  ticketBorder: {
    ...StyleSheet.absoluteFill,
    margin: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(74, 44, 5, 0.35)',
  },
  window: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#2A1703',
    alignItems: 'center',
    shadowColor: '#FFC53D',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  windowLabel: {
    color: '#FFD76A',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 2,
  },
  windowPoints: {
    color: '#FFF4C2',
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: '#FFB020',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  twinkle: {
    position: 'absolute',
    color: '#FFD76A',
    textShadowColor: '#FFB020',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  star1: { top: 16, left: 18 },
  star2: { top: 22, right: 20 },
  star3: { bottom: 14, right: 26 },
  star4: { bottom: 20, left: 24 },
});
