import { Image, StyleSheet, Text, View } from 'react-native';

import { Mirror } from '@/components/ui';
import { spacing, typography } from '@/theme';
import type { LocalImage } from '@/types/image';
import { ShootingGuide } from './ShootingGuide';

type Props = {
  photo: LocalImage | null;
};

/** Fotoğraf kabin aynasının içinde; yoksa aynada ürüne göre kadraj rehberi. */
export function BodyPhotoPreview({ photo }: Props) {
  return (
    <Mirror style={styles.mirror}>
      {photo ? (
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="Seçilen fotoğrafın"
        />
      ) : (
        <View style={styles.empty}>
          <Text style={typography.subtitle}>Ne deneyeceksin?</Text>
          <ShootingGuide />
        </View>
      )}
    </Mirror>
  );
}

const styles = StyleSheet.create({
  mirror: { flex: 1 },
  image: { width: '100%', height: '100%' },
  empty: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.sm },
});
