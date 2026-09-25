/**
 * @format
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  matchFont,
  notifyChange,
  Paint,
  Path,
  Picture,
  RadialGradient,
  Rect,
  RoundedRect,
  Skia,
  Text as SkiaText,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  Easing,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import RevealContent from './RevealContent';
import { addSparkle, buildFoilPicture, transparentOf } from './foilPattern';
import { SCRATCH_CARD_THEMES, ScratchCardTheme, ScratchCardVariant } from './themes';
import { useStarParticles } from './useStarParticles';

/** Space around the card for the outer glow and drop shadow. */
const GLOW_PAD = 44;
/** Space around the card that star particles can fly into. */
const PARTICLE_PAD = 120;
/** Resolution of the grid used to measure how much foil is gone. */
const GRID_CELL = 10;
const MAX_TILT_DEG = 4;
const TRAIL_SPACING = 9;

export type RewardOption = number | { value: number; weight: number };

export interface ScratchCardHandle {
  /** Re-cover the card with fresh foil and draw a new random reward. */
  reset: () => void;
  /** Instantly clear the foil and play the win celebration. */
  revealAll: () => void;
}

export interface ScratchCardProps {
  variant?: ScratchCardVariant;
  /** Override any theme color on top of the variant. Memoize it to avoid rebuilding the foil. */
  theme?: Partial<ScratchCardTheme>;
  width?: number;
  height?: number;
  borderRadius?: number;
  brushSize?: number;
  /** Share of foil (0-1) that must be scratched before the card auto-reveals. */
  revealThreshold?: number;
  /** Explicit reward table. Weighted entries make big prizes rarer. */
  rewards?: RewardOption[];
  /** Used when `rewards` is not set: random value in range, small values more likely. */
  minPoints?: number;
  maxPoints?: number;
  step?: number;
  title?: string;
  subtitle?: string;
  label?: string;
  caption?: string;
  disabled?: boolean;
  onScratchStart?: () => void;
  /** 0 -> 1, where 1 means the auto-reveal threshold was reached. */
  onProgress?: (progress: number) => void;
  onReveal?: (points: number) => void;
  /** Replace the default "YOU WON / 1,250 / POINTS" layout. */
  renderReveal?: (points: number) => React.ReactNode;
}

export const pickReward = (
  rewards: RewardOption[] | undefined,
  minPoints: number,
  maxPoints: number,
  step: number,
) => {
  if (rewards && rewards.length > 0) {
    const entries = rewards.map(r => (typeof r === 'number' ? { value: r, weight: 1 } : r));
    const total = entries.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry.value;
      }
    }
    return entries[entries.length - 1].value;
  }
  // Skewed toward the low end so big wins feel special.
  const raw = minPoints + (maxPoints - minPoints) * Math.pow(Math.random(), 2.2);
  const stepped = Math.round(raw / step) * step;
  return Math.min(maxPoints, Math.max(minPoints, stepped));
};

const ScratchCard = forwardRef<ScratchCardHandle, ScratchCardProps>(
  (
    {
      variant = 'gold',
      theme: themeOverride,
      width: widthProp,
      height: heightProp,
      borderRadius = 22,
      brushSize = 38,
      revealThreshold = 0.6,
      rewards,
      minPoints = 10,
      maxPoints = 5000,
      step = 5,
      title = 'SCRATCH HERE',
      subtitle = 'REVEAL YOUR REWARD',
      label = 'YOU WON',
      caption = 'POINTS',
      disabled = false,
      onScratchStart,
      onProgress,
      onReveal,
      renderReveal,
    },
    ref,
  ) => {
    const { width: screenWidth } = useWindowDimensions();
    const width = widthProp ?? Math.min(screenWidth - 48, 360);
    const height = heightProp ?? Math.round(width * 0.62);

    const theme = useMemo<ScratchCardTheme>(
      () => ({ ...SCRATCH_CARD_THEMES[variant], ...themeOverride }),
      [variant, themeOverride],
    );
    const iridescent = variant === 'holographic';

    const [points, setPoints] = useState(() => pickReward(rewards, minPoints, maxPoints, step));
    const pointsRef = useRef(points);

    // Keep latest callbacks without rebuilding the gesture.
    const callbacks = useRef({ onScratchStart, onProgress, onReveal });
    callbacks.current = { onScratchStart, onProgress, onReveal };

    const notifyStart = useCallback(() => callbacks.current.onScratchStart?.(), []);
    const notifyProgress = useCallback((p: number) => callbacks.current.onProgress?.(p), []);
    const notifyReveal = useCallback(() => callbacks.current.onReveal?.(pointsRef.current), []);
    const applyPoints = useCallback((next: number) => {
      pointsRef.current = next;
      setPoints(next);
    }, []);

    // ---------- Scratch tracking ----------
    const cols = Math.ceil(width / GRID_CELL);
    const rows = Math.ceil(height / GRID_CELL);
    const totalCells = cols * rows;

    const initialPath = useMemo(() => Skia.Path.Make(), []);
    const scratchPath = useSharedValue(initialPath);
    const grid = useSharedValue<number[]>(new Array(totalCells).fill(0));
    const cleared = useSharedValue(0);
    const lastBucket = useSharedValue(-1);
    const lastX = useSharedValue(0);
    const lastY = useSharedValue(0);
    const trail = useSharedValue(0);
    const touching = useSharedValue(false);
    const started = useSharedValue(false);
    const revealed = useSharedValue(false);

    // ---------- Animation drivers ----------
    const fingerX = useSharedValue(width / 2);
    const fingerY = useSharedValue(height / 2);
    const energy = useSharedValue(0);
    const coverOpacity = useSharedValue(1);
    const celebrate = useSharedValue(0);
    const prizeScale = useSharedValue(1);
    const flash = useSharedValue(0);
    const glowBoost = useSharedValue(0);
    const breath = useSharedValue(0);
    const shimmer = useSharedValue(0);
    const spin = useSharedValue(0);
    const tiltX = useSharedValue(0);
    const tiltY = useSharedValue(0);
    const cardScale = useSharedValue(0.9);
    const cardOpacity = useSharedValue(0);

    const { picture: starsPicture, emit, burst } = useStarParticles(
      theme.starColors,
      width + PARTICLE_PAD * 2,
      height + PARTICLE_PAD * 2,
    );

    useEffect(() => {
      cardOpacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
      cardScale.value = withSpring(1, { damping: 14, stiffness: 140 });
      breath.value = withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
      shimmer.value = withRepeat(
        withDelay(1200, withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.cubic) })),
        -1,
        false,
      );
      spin.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.linear }), -1, false);
    }, [breath, cardOpacity, cardScale, shimmer, spin]);

    const complete = () => {
      'worklet';
      if (revealed.value) {
        return;
      }
      revealed.value = true;
      touching.value = false;
      energy.value = withTiming(0, { duration: 500 });
      tiltX.value = withSpring(0);
      tiltY.value = withSpring(0);
      coverOpacity.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
      flash.value = withSequence(
        withTiming(0.55, { duration: 110 }),
        withTiming(0, { duration: 560, easing: Easing.out(Easing.quad) }),
      );
      celebrate.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
      prizeScale.value = withSequence(
        withTiming(1.24, { duration: 230, easing: Easing.out(Easing.back(2)) }),
        withSpring(1, { damping: 8, stiffness: 150 }),
      );
      glowBoost.value = withSequence(
        withTiming(1, { duration: 220 }),
        withTiming(0.35, { duration: 1500, easing: Easing.out(Easing.quad) }),
      );
      burst(PARTICLE_PAD + width / 2, PARTICLE_PAD + height / 2, 46);
      burst(PARTICLE_PAD + width * 0.25, PARTICLE_PAD + height / 2, 16);
      burst(PARTICLE_PAD + width * 0.75, PARTICLE_PAD + height / 2, 16);
      runOnJS(notifyProgress)(1);
      runOnJS(notifyReveal)();
    };

    const markSegment = (x0: number, y0: number, x1: number, y1: number) => {
      'worklet';
      const r = brushSize / 2;
      const r2 = r * r;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r * 0.5)));
      let added = 0;
      grid.modify(cells => {
        for (let s = 0; s <= steps; s++) {
          const px = x0 + (dx * s) / steps;
          const py = y0 + (dy * s) / steps;
          const c0 = Math.max(0, Math.floor((px - r) / GRID_CELL));
          const c1 = Math.min(cols - 1, Math.floor((px + r) / GRID_CELL));
          const r0 = Math.max(0, Math.floor((py - r) / GRID_CELL));
          const r1 = Math.min(rows - 1, Math.floor((py + r) / GRID_CELL));
          for (let row = r0; row <= r1; row++) {
            const cy = (row + 0.5) * GRID_CELL - py;
            for (let col = c0; col <= c1; col++) {
              const cx = (col + 0.5) * GRID_CELL - px;
              const idx = row * cols + col;
              if (cells[idx] === 0 && cx * cx + cy * cy <= r2) {
                cells[idx] = 1;
                added++;
              }
            }
          }
        }
        return cells;
      }, false);

      if (added === 0) {
        return;
      }
      cleared.value += added;
      const progress = Math.min(1, cleared.value / totalCells / revealThreshold);
      const bucket = Math.floor(progress * 50);
      if (bucket !== lastBucket.value && progress < 1) {
        lastBucket.value = bucket;
        runOnJS(notifyProgress)(progress);
      }
      if (progress >= 1) {
        complete();
      }
    };

    const updateTilt = (x: number, y: number) => {
      'worklet';
      const nx = Math.max(-1, Math.min(1, (x - width / 2) / (width / 2)));
      const ny = Math.max(-1, Math.min(1, (y - height / 2) / (height / 2)));
      tiltY.value = withTiming(nx * MAX_TILT_DEG, { duration: 140 });
      tiltX.value = withTiming(-ny * MAX_TILT_DEG, { duration: 140 });
    };

    const gesture = useMemo(
      () =>
        Gesture.Pan()
          .enabled(!disabled)
          .minDistance(0)
          .maxPointers(1)
          .shouldCancelWhenOutside(false)
          .onBegin(e => {
            if (revealed.value) {
              return;
            }
            touching.value = true;
            energy.value = withTiming(1, { duration: 180 });
            fingerX.value = e.x;
            fingerY.value = e.y;
            lastX.value = e.x;
            lastY.value = e.y;
            trail.value = 0;
            scratchPath.value.moveTo(e.x, e.y);
            scratchPath.value.lineTo(e.x + 0.01, e.y);
            notifyChange(scratchPath);
            updateTilt(e.x, e.y);
            emit(e.x + PARTICLE_PAD, e.y + PARTICLE_PAD, 4);
            if (!started.value) {
              started.value = true;
              runOnJS(notifyStart)();
            }
            markSegment(e.x, e.y, e.x, e.y);
          })
          .onUpdate(e => {
            if (revealed.value || !touching.value) {
              return;
            }
            fingerX.value = e.x;
            fingerY.value = e.y;
            const d = Math.hypot(e.x - lastX.value, e.y - lastY.value);
            if (d < 1.5) {
              return;
            }
            scratchPath.value.lineTo(e.x, e.y);
            notifyChange(scratchPath);
            updateTilt(e.x, e.y);

            trail.value += d;
            if (trail.value >= TRAIL_SPACING) {
              trail.value = 0;
              emit(e.x + PARTICLE_PAD, e.y + PARTICLE_PAD, Math.random() < 0.45 ? 2 : 1);
            }
            const x0 = lastX.value;
            const y0 = lastY.value;
            lastX.value = e.x;
            lastY.value = e.y;
            markSegment(x0, y0, e.x, e.y);
          })
          .onFinalize(() => {
            touching.value = false;
            energy.value = withTiming(0, { duration: 750, easing: Easing.out(Easing.quad) });
            tiltX.value = withSpring(0, { damping: 12, stiffness: 120 });
            tiltY.value = withSpring(0, { damping: 12, stiffness: 120 });
          }),
      // Shared values are stable; rebuild only when geometry/config changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [disabled, width, height, brushSize, revealThreshold, totalCells],
    );

    const resetOnUI = (next: number) => {
      'worklet';
      scratchPath.value = Skia.Path.Make();
      grid.value = new Array(totalCells).fill(0);
      cleared.value = 0;
      lastBucket.value = -1;
      revealed.value = false;
      started.value = false;
      touching.value = false;
      energy.value = withTiming(0, { duration: 200 });
      glowBoost.value = withTiming(0, { duration: 400 });
      cardScale.value = withSequence(
        withTiming(0.94, { duration: 140, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 10, stiffness: 170 }),
      );
      coverOpacity.value = withTiming(
        1,
        { duration: 420, easing: Easing.out(Easing.cubic) },
        finished => {
          if (finished) {
            // Swap the prize only while it is fully hidden.
            celebrate.value = 0;
            prizeScale.value = 1;
            runOnJS(applyPoints)(next);
          }
        },
      );
    };

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          runOnUI(resetOnUI)(pickReward(rewards, minPoints, maxPoints, step));
          callbacks.current.onProgress?.(0);
        },
        revealAll: () => runOnUI(complete)(),
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [rewards, minPoints, maxPoints, step, totalCells, width, height],
    );

    // ---------- Static drawing resources ----------
    const cardRRect = useMemo(
      () => Skia.RRectXY(Skia.XYWHRect(0, 0, width, height), borderRadius, borderRadius),
      [width, height, borderRadius],
    );
    const foilPicture = useMemo(
      () => buildFoilPicture(theme, 0, 0, width, height, borderRadius),
      [theme, width, height, borderRadius],
    );

    const titleSize = Math.max(18, Math.min(28, width * 0.075));
    const subtitleSize = Math.max(9, titleSize * 0.42);
    const fonts = useMemo(() => {
      const fontFamily = Platform.select({ ios: 'Helvetica Neue', default: 'sans-serif' });
      return {
        title: matchFont({ fontFamily, fontSize: titleSize, fontWeight: '800' }),
        subtitle: matchFont({ fontFamily, fontSize: subtitleSize, fontWeight: '700' }),
      };
    }, [titleSize, subtitleSize]);

    const textLayout = useMemo(() => {
      const titleWidth = fonts.title.measureText(title).width;
      const subtitleWidth = fonts.subtitle.measureText(subtitle).width;
      const gap = 8;
      const blockHeight = titleSize + gap + subtitleSize;
      const top = (height - blockHeight) / 2;
      const titleY = top + titleSize * 0.82;
      const titleX = (width - titleWidth) / 2;
      const sparkles = Skia.Path.Make();
      const sparkleR = titleSize * 0.32;
      const sparkleY = titleY - titleSize * 0.33;
      addSparkle(sparkles, titleX - sparkleR * 2, sparkleY, sparkleR);
      addSparkle(sparkles, titleX + titleWidth + sparkleR * 2, sparkleY, sparkleR);
      return {
        titleX,
        titleY,
        subtitleX: (width - subtitleWidth) / 2,
        subtitleY: titleY + gap + subtitleSize,
        sparkles,
      };
    }, [fonts, title, subtitle, width, height, titleSize, subtitleSize]);

    const colors = useMemo(
      () => ({
        shimmerClear: transparentOf(theme.shimmerColor),
        glowClear: transparentOf(theme.glowColor),
        glossTop: Skia.Color('rgba(255,255,255,0.22)'),
        glossClear: Skia.Color('rgba(255,255,255,0)'),
      }),
      [theme],
    );

    // ---------- Animated Skia values ----------
    const foilStart = useDerivedValue(() => {
      if (!iridescent) {
        return vec(0, 0);
      }
      const a = spin.value * Math.PI * 2;
      const r = Math.hypot(width, height) / 2;
      return vec(width / 2 - Math.cos(a) * r, height / 2 - Math.sin(a) * r);
    });
    const foilEnd = useDerivedValue(() => {
      if (!iridescent) {
        return vec(width, height);
      }
      const a = spin.value * Math.PI * 2;
      const r = Math.hypot(width, height) / 2;
      return vec(width / 2 + Math.cos(a) * r, height / 2 + Math.sin(a) * r);
    });
    const shimmerStart = useDerivedValue(() => {
      const x = -width * 0.7 + shimmer.value * width * 2.1;
      return vec(x, 0);
    });
    const shimmerEnd = useDerivedValue(() => {
      const x = -width * 0.7 + shimmer.value * width * 2.1;
      return vec(x + width * 0.45, height);
    });
    const rimOpacity = useDerivedValue(() => 0.4 + energy.value * 0.6);
    const auraCenter = useDerivedValue(() => vec(fingerX.value, fingerY.value));
    const auraOpacity = useDerivedValue(() => energy.value * 0.85);
    const outerGlowOpacity = useDerivedValue(() =>
      Math.min(1, 0.28 + breath.value * 0.22 + energy.value * 0.5 + glowBoost.value * 0.6),
    );
    const outerGlowBlur = useDerivedValue(
      () => 14 + breath.value * 4 + energy.value * 8 + glowBoost.value * 12,
    );

    const cardStyle = useAnimatedStyle(() => ({
      opacity: cardOpacity.value,
      transform: [
        { perspective: 900 },
        { rotateX: `${tiltX.value}deg` },
        { rotateY: `${tiltY.value}deg` },
        { scale: cardScale.value },
      ],
    }));

    const auraRadius = brushSize * 1.7;

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ width, height }, cardStyle]}>
          {/* Drop shadow + animated aura behind the card */}
          <Canvas
            pointerEvents="none"
            style={[
              styles.overflowCanvas,
              {
                left: -GLOW_PAD,
                top: -GLOW_PAD,
                width: width + GLOW_PAD * 2,
                height: height + GLOW_PAD * 2,
              },
            ]}
          >
            <RoundedRect
              x={GLOW_PAD + 6}
              y={GLOW_PAD + 14}
              width={width - 12}
              height={height - 8}
              r={borderRadius}
              color="rgba(0,0,0,0.55)"
            >
              <BlurMask blur={16} style="normal" />
            </RoundedRect>
            <RoundedRect
              x={GLOW_PAD}
              y={GLOW_PAD}
              width={width}
              height={height}
              r={borderRadius}
              color={theme.glowColor}
              opacity={outerGlowOpacity}
            >
              <BlurMask blur={outerGlowBlur} style="outer" />
            </RoundedRect>
          </Canvas>

          <RevealContent
            theme={theme}
            width={width}
            height={height}
            borderRadius={borderRadius}
            points={points}
            label={label}
            caption={caption}
            celebrate={celebrate}
            prizeScale={prizeScale}
          >
            {renderReveal?.(points)}
          </RevealContent>

          {/* Scratchable foil */}
          <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Group layer={<Paint opacity={coverOpacity} />}>
              <Group clip={cardRRect}>
                <Rect x={0} y={0} width={width} height={height}>
                  <LinearGradient start={foilStart} end={foilEnd} colors={theme.foilColors} />
                </Rect>
                <Picture picture={foilPicture} />
                <Rect x={0} y={0} width={width} height={height}>
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, height)}
                    positions={[0, 0.55]}
                    colors={[colors.glossTop, colors.glossClear]}
                  />
                </Rect>
                <Rect x={0} y={0} width={width} height={height}>
                  <LinearGradient
                    start={shimmerStart}
                    end={shimmerEnd}
                    positions={[0, 0.5, 1]}
                    colors={[colors.shimmerClear, theme.shimmerColor, colors.shimmerClear]}
                  />
                </Rect>

                <Path path={textLayout.sparkles} color={theme.foilTextColor} opacity={0.85} />
                <SkiaText
                  x={textLayout.titleX}
                  y={textLayout.titleY + 1.5}
                  text={title}
                  font={fonts.title}
                  color="rgba(0,0,0,0.22)"
                />
                <SkiaText
                  x={textLayout.titleX}
                  y={textLayout.titleY}
                  text={title}
                  font={fonts.title}
                  color={theme.foilTextColor}
                />
                <SkiaText
                  x={textLayout.subtitleX}
                  y={textLayout.subtitleY}
                  text={subtitle}
                  font={fonts.subtitle}
                  color={theme.foilTextColor}
                  opacity={0.75}
                />

                {/* Glowing rim along the scratched edges, then the actual erase */}
                <Path
                  path={scratchPath}
                  style="stroke"
                  strokeWidth={brushSize + 16}
                  strokeCap="round"
                  strokeJoin="round"
                  color={theme.glowColor}
                  opacity={rimOpacity}
                >
                  <BlurMask blur={7} style="normal" />
                </Path>
                <Path
                  path={scratchPath}
                  style="stroke"
                  strokeWidth={brushSize}
                  strokeCap="round"
                  strokeJoin="round"
                  blendMode="clear"
                />
              </Group>
            </Group>

            <RoundedRect
              x={0.5}
              y={0.5}
              width={width - 1}
              height={height - 1}
              r={borderRadius}
              style="stroke"
              strokeWidth={1}
              color="rgba(255,255,255,0.28)"
              opacity={coverOpacity}
            />

            {/* Light under the fingertip */}
            <Circle c={auraCenter} r={auraRadius} opacity={auraOpacity}>
              <RadialGradient
                c={auraCenter}
                r={auraRadius}
                colors={[theme.glowColor, colors.glowClear]}
              />
            </Circle>

            <RoundedRect
              x={0}
              y={0}
              width={width}
              height={height}
              r={borderRadius}
              color="#FFFFFF"
              opacity={flash}
            />
          </Canvas>

          {/* Star particles, allowed to fly past the card edges */}
          <Canvas
            pointerEvents="none"
            style={[
              styles.overflowCanvas,
              {
                left: -PARTICLE_PAD,
                top: -PARTICLE_PAD,
                width: width + PARTICLE_PAD * 2,
                height: height + PARTICLE_PAD * 2,
              },
            ]}
          >
            <Picture picture={starsPicture} />
          </Canvas>
        </Animated.View>
      </GestureDetector>
    );
  },
);

ScratchCard.displayName = 'ScratchCard';

const styles = StyleSheet.create({
  overflowCanvas: {
    position: 'absolute',
  },
});

export default ScratchCard;
