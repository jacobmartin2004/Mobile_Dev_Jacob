/**
 * @format
 */

import React, { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const BUTTON_SIZE = 120;
const GLOW_SIZE = BUTTON_SIZE * 1.7;
const HOLD_DURATION_MS = 1800;
const MAX_MOVEMENT_TOLERANCE = 40;

const EXPANSION_DURATION_MS = 700;
const EXPANSION_EASING = Easing.bezier(0.22, 1, 0.36, 1);

const TEXT_FADE_DURATION_MS = 200;
const WELCOME_DELAY_MS = 420;
const WELCOME_DURATION_MS = 480;

// Corners must stay fully covered once the circle reaches its final size on any device.
const SAFETY_MULTIPLIER = 1.05;

const GRADIENT_COLORS = ['#7C3AED', '#9333EA', '#C084FC'] as const;
const IDLE_BACKGROUND = '#FAFAFC';
const IDLE_TEXT_COLOR = '#1F2937';
const FILLED_TEXT_COLOR = '#FFFFFF';

interface HoldToStartButtonProps {
  onHoldSuccess?: () => void;
}

const HoldToStartButton: React.FC<HoldToStartButtonProps> = ({ onHoldSuccess }) => {
  const { width, height } = useWindowDimensions();
  const [locked, setLocked] = useState(false);

  const { centerX, centerY, finalScale } = useMemo(() => {
    const cx = width / 2;
    const cy = height / 2;
    const initialRadius = BUTTON_SIZE / 2;
    const requiredRadius = Math.sqrt(cx * cx + cy * cy);

    return {
      centerX: cx,
      centerY: cy,
      finalScale: (requiredRadius / initialRadius) * SAFETY_MULTIPLIER,
    };
  }, [width, height]);

  const holdProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const expansionScale = useSharedValue(1);
  const startOpacity = useSharedValue(1);
  const startScale = useSharedValue(1);
  const welcomeOpacity = useSharedValue(0);
  const welcomeTranslateY = useSharedValue(20);
  const welcomeScale = useSharedValue(0.96);
  const completed = useSharedValue(false);

  const handleLocked = () => setLocked(true);

  const beginHold = () => {
    'worklet';
    if (completed.value) {
      return;
    }
    buttonScale.value = withTiming(0.96, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    });
    holdProgress.value = withTiming(1, {
      duration: HOLD_DURATION_MS,
      easing: Easing.linear,
    });
  };

  const resetToIdle = () => {
    'worklet';
    if (completed.value) {
      return;
    }
    const remaining = holdProgress.value;
    cancelAnimation(holdProgress);
    cancelAnimation(buttonScale);
    holdProgress.value = withTiming(0, {
      duration: Math.max(150, 300 * remaining),
      easing: Easing.out(Easing.cubic),
    });
    buttonScale.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
  };

  const handleSuccess = () => {
    'worklet';
    if (completed.value) {
      return;
    }
    completed.value = true;
    cancelAnimation(holdProgress);
    holdProgress.value = 1;

    buttonScale.value = withTiming(1, {
      duration: 120,
      easing: Easing.out(Easing.quad),
    });
    startOpacity.value = withTiming(0, {
      duration: TEXT_FADE_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    startScale.value = withTiming(0.85, {
      duration: TEXT_FADE_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    expansionScale.value = withTiming(finalScale, {
      duration: EXPANSION_DURATION_MS,
      easing: EXPANSION_EASING,
    });

    welcomeOpacity.value = withDelay(
      WELCOME_DELAY_MS,
      withTiming(1, { duration: WELCOME_DURATION_MS, easing: Easing.out(Easing.cubic) }),
    );
    welcomeTranslateY.value = withDelay(
      WELCOME_DELAY_MS,
      withTiming(0, { duration: WELCOME_DURATION_MS, easing: Easing.out(Easing.cubic) }),
    );
    welcomeScale.value = withDelay(
      WELCOME_DELAY_MS,
      withTiming(1, { duration: WELCOME_DURATION_MS, easing: Easing.out(Easing.cubic) }),
    );

    runOnJS(handleLocked)();
    if (onHoldSuccess) {
      runOnJS(onHoldSuccess)();
    }
  };

  const gesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(HOLD_DURATION_MS)
        .maxDistance(MAX_MOVEMENT_TOLERANCE)
        .onBegin(() => {
          beginHold();
        })
        .onStart(() => {
          handleSuccess();
        })
        .onFinalize((_event, success) => {
          if (!success) {
            resetToIdle();
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finalScale],
  );

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value * expansionScale.value }],
  }));

  const idleLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(holdProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: holdProgress.value * 0.55 * startOpacity.value,
    transform: [
      {
        scale: interpolate(holdProgress.value, [0, 1], [0.75, 1.08], Extrapolation.CLAMP),
      },
    ],
  }));

  const fillAnimatedStyle = useAnimatedStyle(() => {
    // Scale by sqrt(progress) so that visible *area* (not radius) tracks
    // holdProgress linearly - this is what makes 0.5 progress read as "half filled".
    const radiusScale = Math.sqrt(holdProgress.value);
    return { transform: [{ scale: radiusScale }] };
  });

  const startTextAnimatedStyle = useAnimatedStyle(() => ({
    opacity: startOpacity.value,
    color: interpolateColor(holdProgress.value, [0, 1], [IDLE_TEXT_COLOR, FILLED_TEXT_COLOR]),
    transform: [{ scale: startScale.value }],
  }));

  const welcomeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
    transform: [
      { translateY: welcomeTranslateY.value },
      { scale: welcomeScale.value },
    ],
  }));

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            left: centerX - GLOW_SIZE / 2,
            top: centerY - GLOW_SIZE / 2,
          },
          glowStyle,
        ]}
      />

      <GestureDetector gesture={gesture}>
        <Animated.View
          pointerEvents={locked ? 'none' : 'auto'}
          style={[
            styles.shadowWrapper,
            {
              left: centerX - BUTTON_SIZE / 2,
              top: centerY - BUTTON_SIZE / 2,
            },
            circleAnimatedStyle,
          ]}
        >
          <Animated.View style={styles.clip}>
            <Animated.View style={[styles.idleLayer, idleLayerStyle]} />

            <Animated.View style={styles.fillWrapper}>
              <Animated.View style={[styles.fillInner, fillAnimatedStyle]}>
                <LinearGradient
                  colors={[...GRADIENT_COLORS]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Animated.View>

            <Animated.Text style={[styles.startText, startTextAnimatedStyle]}>
              Start
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <Animated.View pointerEvents="none" style={[styles.welcomeContainer, welcomeAnimatedStyle]}>
        <Animated.Text style={styles.welcomeText}>Welcome User</Animated.Text>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: IDLE_BACKGROUND,
    elevation: 6,
  },
  clip: {
    flex: 1,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: IDLE_BACKGROUND,
  },
  fillWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillInner: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
  },
  startText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: '#9333EA',
  },
  welcomeContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default HoldToStartButton;
