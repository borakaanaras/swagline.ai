import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { LocalImage } from '@/types/image';

type Props = {
  photo: LocalImage | null;
};

/** Seçilen boy fotoğrafını 3:4 dikey çerçevede gösterir; yoksa kadraj silüeti gösterir. */
export function BodyPhotoPreview({ photo }: Props) {
  return (
    <View style={styles.frame}>
      {photo ? (
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="Seçilen tam boy fotoğraf"
        />
      ) : (
        <View style={styles.empty}>
          <View style={styles.guide} />
          <Text style={[typography.caption, styles.emptyText]}>
            Henüz fotoğraf yok. Tam boy fotoğrafını çek ya da galeriden seç.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: '100%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  guide: {
    width: '38%',
    height: '70%',
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
  },
  emptyText: { textAlign: 'center' },
});
