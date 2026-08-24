/**
 * @format
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StartScreen from './src/screens/StartScreen';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StartScreen />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
