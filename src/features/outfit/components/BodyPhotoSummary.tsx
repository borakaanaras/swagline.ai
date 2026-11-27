import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '@/theme';
import type { LocalImage } from '@/types/image';

type Props = {
  photo: LocalImage | null;
  onChange: () => void;
};

const THUMB_WIDTH = 40;

/** Kombin ekranının üstündeki küçük ayna (fotoğrafın) ve "Değiştir". */
export function BodyPhotoSummary({ photo, onChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.thumbFrame}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.thumb} resizeMode="cover" accessibilityLabel="Fotoğrafın" />
        ) : (
          <View style={styles.thumb} />
        )}
      </View>
      <Text style={[typography.label, styles.title]}>{photo ? 'Fotoğrafın' : 'Fotoğraf yok'}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={photo ? 'Fotoğrafını değiştir' : 'Fotoğraf ekle'}
        onPress={onChange}
        hitSlop={8}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <Text style={styles.linkText}>{photo ? 'Değiştir' : 'Ekle'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumbFrame: {
    padding: 2,
    borderWidth: 1,
    borderColor: colors.frame,
    borderTopLeftRadius: THUMB_WIDTH / 2 + 3,
    borderTopRightRadius: THUMB_WIDTH / 2 + 3,
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
  },
  thumb: {
    width: THUMB_WIDTH,
    height: THUMB_WIDTH * 1.35,
    backgroundColor: colors.surface,
    borderTopLeftRadius: THUMB_WIDTH / 2,
    borderTopRightRadius: THUMB_WIDTH / 2,
    borderBottomLeftRadius: radius.sm - 2,
    borderBottomRightRadius: radius.sm - 2,
  },
  title: { flex: 1 },
  link: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.frame,
  },
  linkText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  pressed: { opacity: 0.6 },
});
