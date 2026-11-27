import type { ComponentRef, Ref } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { BrandWatermark } from './BrandWatermark';

type Props = {
  uri: string;
  width: number;
  height: number;
  watermark: boolean;
  accessibilityLabel: string;
  ref?: Ref<ComponentRef<typeof View>>;
};

/** Görsel + (isteğe bağlı) logo filigranı. Hem ekranda hem dışa aktarmada aynı bileşen kullanılır. */
export function WatermarkedImage({ uri, width, height, watermark, accessibilityLabel, ref }: Props) {
  return (
    <View ref={ref} collapsable={false} style={{ width, height }}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" accessibilityLabel={accessibilityLabel} />
      {watermark ? <BrandWatermark imageWidth={width} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});
