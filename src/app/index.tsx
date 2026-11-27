import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Mirror, ScanLine } from '@/components/ui';
import { colors, fonts, spacing, typography } from '@/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.brand} accessibilityRole="header">
        <Text style={styles.spark}>✦ </Text>
        SwaglineAI
      </Text>

      <Mirror style={styles.mirror}>
        <View style={styles.figure} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.head} />
          <View style={styles.body} />
        </View>
        <ScanLine delay={350} duration={2200} />
      </Mirror>

      <View style={styles.copy}>
        <Text style={typography.display}>Almadan önce üzerinde gör.</Text>
        <Text style={[typography.body, styles.muted]}>
          Fotoğrafını ekle, ürünleri seç. AI hepsini aynı anda üzerine giydirsin.
        </Text>
      </View>

      <Button title="Kabine gir" onPress={() => router.push('/capture/body')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  brand: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, marginTop: spacing.sm, letterSpacing: -0.2 },
  spark: { color: colors.accent },
  mirror: { flex: 1, width: '72%', alignSelf: 'center' },
  figure: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingTop: '28%' },
  head: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.frame,
    marginBottom: spacing.sm,
  },
  body: {
    width: '46%',
    flex: 1,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderStyle: 'dashed',
    borderColor: colors.frame,
  },
  copy: { gap: spacing.sm },
  muted: { color: colors.textMuted },
});
