import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { LocalImage } from '@/types/image';

type Props = {
  photo: LocalImage | null;
  onChange: () => void;
};

/** Kombin ekranının üstündeki boy fotoğrafı özeti ve *Değiştir* bağlantısı. */
export function BodyPhotoSummary({ photo, onChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.thumb}>
        {photo ? (
          <Image
            source={{ uri: photo.uri }}
            style={styles.image}
            resizeMode="cover"
            accessibilityLabel="Tam boy fotoğrafın"
          />
        ) : null}
      </View>
      <View style={styles.texts}>
        <Text style={typography.subtitle}>Boy fotoğrafın</Text>
        <Text style={typography.caption}>
          {photo ? 'Ürünler bu fotoğrafın üzerinde denenecek.' : 'Önce tam boy fotoğrafını eklemelisin.'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Boy fotoğrafı ekranına döner"
        onPress={onChange}
        hitSlop={spacing.sm}
        style={({ pressed }) => [styles.change, pressed && styles.pressed]}
      >
        <Text style={styles.changeText}>{photo ? 'Değiştir' : 'Ekle'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 54,
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  image: { width: '100%', height: '100%' },
  texts: { flex: 1, gap: spacing.xs },
  change: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  changeText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.6 },
});
