/**
 * @format
 */

import React, { useCallback, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import HoldToStartButton from '../components/HoldToStartButton';

const IDLE_BACKGROUND = '#FAFAFC';

const StartScreen: React.FC = () => {
  const [barStyle, setBarStyle] = useState<'dark-content' | 'light-content'>('dark-content');

  const handleHoldSuccess = useCallback(() => {
    setBarStyle('light-content');
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar animated barStyle={barStyle} />
      <HoldToStartButton onHoldSuccess={handleHoldSuccess} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IDLE_BACKGROUND,
  },
});

export default StartScreen;
