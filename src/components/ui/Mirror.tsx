import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const FRAME_GAP = 6;

/**
 * Kemerli butik kabin aynası — uygulamanın imza çerçevesi.
 * Üst kenar tam yarım daire (genişliğin yarısı), altı hafif yuvarlak. Dışta ince çerçeve,
 * içte camın parıltısını taklit eden ikinci bir halka var. İçerik (fotoğraf) camın içine kırpılır.
 */
export function Mirror({ children, style }: Props) {
  const [width, setWidth] = useState(0);
  const outerRadius = width / 2;
  const innerRadius = Math.max(outerRadius - FRAME_GAP, 0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.frame,
        { borderTopLeftRadius: outerRadius, borderTopRightRadius: outerRadius },
        style,
      ]}
    >
      <View
        style={[styles.glass, { borderTopLeftRadius: innerRadius, borderTopRightRadius: innerRadius }]}
      >
        {children}
        <View
          pointerEvents="none"
          style={[styles.sheen, { borderTopLeftRadius: innerRadius, borderTopRightRadius: innerRadius }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: FRAME_GAP,
    borderWidth: 1,
    borderColor: colors.frame,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    backgroundColor: colors.background,
  },
  glass: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.lg - FRAME_GAP,
    borderBottomRightRadius: radius.lg - FRAME_GAP,
  },
  sheen: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: colors.glass,
    borderBottomLeftRadius: radius.lg - FRAME_GAP,
    borderBottomRightRadius: radius.lg - FRAME_GAP,
  },
});
