import { StyleSheet, Text } from 'react-native';

import { Screen } from './Screen';
import { typography } from '@/theme';

type Props = {
  title: string;
  description: string;
};

/** Henüz uygulanmamış adımlar için geçici ekran. */
export function PlaceholderScreen({ title, description }: Props) {
  return (
    <Screen>
      <Text style={typography.subtitle}>{title}</Text>
      <Text style={[typography.body, styles.muted]}>{description}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { opacity: 0.7 },
});
