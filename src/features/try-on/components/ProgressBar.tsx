import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

type Props = { value: number };

export function ProgressBar({ value }: Props) {
  const width = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    Animated.timing(width, { toValue: value, duration: 600, useNativeDriver: false }).start();
  }, [value, width]);

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <Animated.View
        style={[
          styles.fill,
          { width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', height: 3, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.sm },
});
