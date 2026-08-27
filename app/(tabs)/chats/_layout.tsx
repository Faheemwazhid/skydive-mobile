import { Stack } from 'expo-router';

import { color } from '@/src/theme/tokens';

export default function ChatsStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color.offWhite },
      }}
    />
  );
}
