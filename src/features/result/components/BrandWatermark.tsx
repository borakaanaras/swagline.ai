import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

type Props = {
  /** Görselin genişliği (dp); filigran buna orantılı ölçeklenir. */
  imageWidth: number;
};

/**
 * Sonuç görselinin sol altındaki yarı saydam marka filigranı.
 * Gerçek logo dosyası gelince burada `Image` ile değiştirilir.
 */
export function BrandWatermark({ imageWidth }: Props) {
  const fontSize = Math.max(10, imageWidth * 0.05);
  const inset = imageWidth * 0.04;

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { left: inset, bottom: inset }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.text, { fontSize }]}>
        <Text style={styles.spark}>✦ </Text>
        SwaglineAI
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', opacity: 0.7 },
  text: {
    color: colors.text,
    fontFamily: fonts.extrabold,
    letterSpacing: 0.5,
    textShadowColor: colors.overlay,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spark: { color: colors.accent },
});
