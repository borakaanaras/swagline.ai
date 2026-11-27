import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.brand}>SwaglineAI</Text>
        <Text style={typography.title}>Sanal kabinine hoş geldin</Text>
        <Text style={[typography.body, styles.muted]}>
          Tam boy fotoğrafını ekle, beğendiğin kıyafetin fotoğrafını seç, üzerinde nasıl durduğunu gör.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button title="Başla" onPress={() => router.push('/capture/body')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  hero: { flex: 1, justifyContent: 'center', gap: spacing.md },
  brand: { color: colors.primary, fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  muted: { opacity: 0.75, lineHeight: 22 },
  footer: { paddingBottom: spacing.md },
});
