import {
  Inter_400Regular,
  Inter_500Medium,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Gate } from '@/src/session/Gate';
import { SessionProvider } from '@/src/session/SessionProvider';
import { color } from '@/src/theme/tokens';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Gate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: color.offWhite },
          }}
        />
      </Gate>
    </SessionProvider>
  );
}
