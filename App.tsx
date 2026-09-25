/**
 * @format
 */

import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import HomeScreen from './src/screens/HomeScreen';
import type { ShowcaseItem } from './src/screens/showcase';

function App(): React.JSX.Element {
  const [active, setActive] = useState<ShowcaseItem | null>(null);

  const goHome = useCallback(() => setActive(null), []);

  useEffect(() => {
    if (!active) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goHome();
      return true;
    });
    return () => sub.remove();
  }, [active, goHome]);

  const ActiveScreen = active?.Screen;

  return (
    <GestureHandlerRootView style={styles.root}>
      {active && ActiveScreen ? (
        <Animated.View
          key={active.id}
          style={styles.root}
          entering={FadeIn.duration(260)}
          exiting={FadeOut.duration(180)}
        >
          <ActiveScreen />
          <Pressable
            onPress={goHome}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,
              active.backButtonTone === 'light' ? styles.backLight : styles.backDark,
              pressed && styles.backPressed,
            ]}
          >
            <Text
              style={[
                styles.backText,
                active.backButtonTone === 'light' ? styles.backTextLight : styles.backTextDark,
              ]}
            >
              ‹  Back
            </Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View
          key="home"
          style={styles.root}
          entering={FadeIn.duration(260)}
          exiting={FadeOut.duration(180)}
        >
          <HomeScreen onOpen={setActive} />
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 20,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
    borderWidth: 1,
  },
  backLight: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: 'rgba(124, 58, 237, 0.18)',
  },
  backDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  backPressed: {
    opacity: 0.7,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
  },
  backTextLight: {
    color: '#4C1D95',
  },
  backTextDark: {
    color: '#FFFFFF',
  },
});

export default App;
