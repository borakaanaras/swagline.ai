import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { colors } from '@/theme';

type Props = {
  /** true: sürekli yukarıdan aşağı tarar (AI çalışırken). false: bir kez geçer ve kaybolur. */
  loop?: boolean;
  /** Tek geçiş süresi (ms). */
  duration?: number;
  /** İlk geçişten önce bekleme (ms). */
  delay?: number;
};

const TRAIL_BANDS = [0.1, 0.07, 0.045, 0.025, 0.012];
const BAND_HEIGHT = 14;

/**
 * Aynanın camında ilerleyen cyan tarama çizgisi — AI'ın fotoğrafı "okuduğunu" gösterir.
 * Üstündeki alana mutlak konumlanır. "Hareketi azalt" açıksa çizgi sabit, hafif bir parıltı olarak kalır.
 */
export function ScanLine({ loop = false, duration = 2400, delay = 0 }: Props) {
  const [height, setHeight] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (height === 0 || reduceMotion) return;
    progress.setValue(0);
    const sweep = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    const animation = loop
      ? Animated.sequence([
          Animated.delay(delay),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.loop(Animated.sequence([sweep, Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true })])),
        ])
      : Animated.sequence([
          Animated.delay(delay),
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          sweep,
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]);
    animation.start();
    return () => animation.stop();
  }, [height, reduceMotion, loop, duration, delay, progress, opacity]);

  const onLayout = (e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height);
  const travel = height + BAND_HEIGHT * TRAIL_BANDS.length;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {reduceMotion ? (
        loop ? <View style={[styles.line, styles.staticLine]} /> : null
      ) : (
        <Animated.View
          style={[
            styles.beam,
            {
              opacity,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-BAND_HEIGHT * TRAIL_BANDS.length, travel],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Çizginin arkasında (yukarıda) sönen ışık izi */}
          {[...TRAIL_BANDS].reverse().map((alpha) => (
            <View key={alpha} style={[styles.band, { opacity: alpha * 6 }]} />
          ))}
          <View style={styles.line} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  beam: { position: 'absolute', left: 0, right: 0, top: 0 },
  band: { height: BAND_HEIGHT, backgroundColor: colors.accentTrail },
  line: {
    height: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  staticLine: { position: 'absolute', left: 0, right: 0, top: '50%', opacity: 0.6 },
});
