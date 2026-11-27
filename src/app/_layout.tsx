import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TryOnSessionProvider } from '@/store/TryOnSessionContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <TryOnSessionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="capture/body" options={{ title: 'Boy fotoğrafı' }} />
          <Stack.Screen name="capture/garment" options={{ title: 'Ürün seç' }} />
          <Stack.Screen
            name="processing"
            options={{ title: 'Hazırlanıyor', headerBackVisible: false, gestureEnabled: false }}
          />
          <Stack.Screen name="result" options={{ title: 'Sonuç' }} />
        </Stack>
      </TryOnSessionProvider>
    </SafeAreaProvider>
  );
}
