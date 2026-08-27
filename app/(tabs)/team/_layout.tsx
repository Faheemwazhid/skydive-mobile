import { Stack } from 'expo-router';

import { color } from '@/src/theme/tokens';

export default function TeamStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color.offWhite },
      }}
    />
  );
}
