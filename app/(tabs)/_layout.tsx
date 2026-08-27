import { Tabs } from 'expo-router';

import { color, font } from '@/src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.greyDark,
        tabBarInactiveTintColor: color.greyMedium,
        tabBarLabelStyle: { fontFamily: font.familyMedium, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: color.white,
          borderTopColor: color.greyLight,
        },
      }}
    >
      <Tabs.Screen name="team" options={{ title: 'Team' }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
      <Tabs.Screen name="templates" options={{ title: 'Templates' }} />
      <Tabs.Screen name="you" options={{ title: 'You' }} />
    </Tabs>
  );
}
