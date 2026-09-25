/**
 * @format
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SHOWCASE, ShowcaseItem } from './showcase';

const BACKGROUND = '#07060F';
const H_PADDING = 20;
const GAP = 14;

interface TileProps {
  item: ShowcaseItem;
  index: number;
  width: number;
  onPress: () => void;
}

const Tile: React.FC<TileProps> = ({ item, index, width, onPress }) => {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { Preview } = item;

  return (
    <Animated.View
      entering={FadeInDown.delay(120 + index * 90).springify().damping(16)}
      style={{ width }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 220 });
        }}
      >
        <Animated.View style={[styles.tile, pressStyle]}>
          <View style={[styles.previewBox, { height: width * 0.82 }]}>
            <Preview />
          </View>
          <View style={styles.tileBody}>
            <View style={styles.tileTitleRow}>
              <Text style={styles.tileTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <Text style={styles.tileDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.tileFooter}>
              <View style={[styles.tag, { borderColor: item.accent }]}>
                <View style={[styles.tagDot, { backgroundColor: item.accent }]} />
                <Text style={[styles.tagText, { color: item.accent }]}>{item.tag}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

interface HomeScreenProps {
  onOpen: (item: ShowcaseItem) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onOpen }) => {
  const { width } = useWindowDimensions();
  const tileWidth = (width - H_PADDING * 2 - GAP) / 2;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().damping(16)}>
          <Text style={styles.eyebrow}>COMPONENT LIBRARY by Jacobmartin.dev</Text>
          <Text style={styles.title}>Components</Text>
          <Text style={styles.subtitle}>
            {SHOWCASE.length} animated components · tap one to try it
          </Text>
        </Animated.View>

        <View style={styles.grid}>
          {SHOWCASE.map((item, index) => (
            <Tile
              key={item.id}
              item={item}
              index={index}
              width={tileWidth}
              onPress={() => onOpen(item)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    paddingTop: 72,
    paddingHorizontal: H_PADDING,
    paddingBottom: 48,
  },
  eyebrow: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    marginTop: 28,
  },
  tile: {
    borderRadius: 22,
    backgroundColor: '#12101F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  previewBox: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tileBody: {
    padding: 14,
  },
  tileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tileDescription: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    minHeight: 34,
  },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  arrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
