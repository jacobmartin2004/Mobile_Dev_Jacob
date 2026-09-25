/**
 * @format
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  RadialGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { transparentOf } from './foilPattern';
import type { ScratchCardTheme } from './themes';

const RAY_COUNT = 16;
const RAY_ROTATION_MS = 26000;

export const formatPoints = (value: number) =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

interface RevealContentProps {
  theme: ScratchCardTheme;
  width: number;
  height: number;
  borderRadius: number;
  points: number;
  label: string;
  caption: string;
  /** 0 while covered, animates to 1 when fully revealed. */
  celebrate: SharedValue<number>;
  /** Pop scale for the prize. */
  prizeScale: SharedValue<number>;
  children?: React.ReactNode;
}

const RevealContent: React.FC<RevealContentProps> = ({
  theme,
  width,
  height,
  borderRadius,
  points,
  label,
  caption,
  celebrate,
  prizeScale,
  children,
}) => {
  const raySize = Math.ceil(Math.hypot(width, height) * 1.1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: RAY_ROTATION_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const raysPath = useMemo(() => {
    const c = raySize / 2;
    const r = raySize / 2;
    const half = Math.PI / RAY_COUNT / 2;
    const p = Skia.Path.Make();
    for (let i = 0; i < RAY_COUNT; i++) {
      const a = (i / RAY_COUNT) * Math.PI * 2;
      p.moveTo(c, c);
      p.lineTo(c + Math.cos(a - half) * r, c + Math.sin(a - half) * r);
      p.lineTo(c + Math.cos(a + half) * r, c + Math.sin(a + half) * r);
      p.close();
    }
    return p;
  }, [raySize]);

  const raysStyle = useAnimatedStyle(() => ({
    opacity: interpolate(celebrate.value, [0, 1], [0.55, 1]),
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: interpolate(celebrate.value, [0, 1], [1, 1.15]) },
    ],
  }));

  const prizeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: prizeScale.value }],
  }));

  const pointsText = formatPoints(points);
  const pointsSize = Math.min(height * 0.3, (width * 0.78) / Math.max(3, pointsText.length * 0.62));

  return (
    <View style={[styles.card, { width, height, borderRadius }]}>
      <LinearGradient
        colors={theme.revealColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.rays,
          {
            width: raySize,
            height: raySize,
            left: (width - raySize) / 2,
            top: (height - raySize) / 2,
          },
          raysStyle,
        ]}
      >
        <Canvas style={StyleSheet.absoluteFill}>
          <Path path={raysPath} color={theme.rayColor} />
          <Circle
            cx={raySize / 2}
            cy={raySize / 2}
            r={Math.min(width, height) * 0.55}
            opacity={0.35}
          >
            <RadialGradient
              c={vec(raySize / 2, raySize / 2)}
              r={Math.min(width, height) * 0.55}
              colors={[theme.pointsGlow, transparentOf(theme.pointsGlow)]}
            />
          </Circle>
        </Canvas>
      </Animated.View>

      <Animated.View style={[styles.content, prizeStyle]}>
        {children ?? (
          <>
            <Animated.Text style={[styles.label, { color: theme.labelColor }]}>
              {label}
            </Animated.Text>
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.points,
                {
                  color: theme.pointsColor,
                  fontSize: pointsSize,
                  lineHeight: pointsSize * 1.15,
                  textShadowColor: theme.pointsGlow,
                },
              ]}
            >
              {pointsText}
            </Animated.Text>
            <Animated.Text style={[styles.caption, { color: theme.captionColor }]}>
              {caption}
            </Animated.Text>
          </>
        )}
      </Animated.View>

      <View
        pointerEvents="none"
        style={[styles.innerBorder, { borderRadius, borderColor: theme.labelColor }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rays: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 2,
  },
  points: {
    fontWeight: '900',
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    fontVariant: ['tabular-nums'],
  },
  caption: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 6,
    marginTop: 2,
  },
  innerBorder: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    opacity: 0.2,
  },
});

export default RevealContent;
