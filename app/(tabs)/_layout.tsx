import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, type ColorValue } from 'react-native';

import { needsConnect, needsLogin } from '@/src/domain/session';
import { useSession } from '@/src/session/SessionProvider';
import { color, font } from '@/src/theme/tokens';

const GLYPH: Record<string, string> = {
  team: '◉',
  chats: '◎',
  templates: '▦',
  you: '○',
};

function TabIcon({ name, color: tint }: { name: string; color: ColorValue }) {
  return (
    <Text style={[styles.icon, { color: tint }]} accessibilityElementsHidden>
      {GLYPH[name] ?? '•'}
    </Text>
  );
}

export default function TabsLayout() {
  const session = useSession();
  const hideTabBar = needsLogin(session) || needsConnect(session);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.greyDark,
        tabBarInactiveTintColor: color.greyMedium,
        tabBarLabelStyle: {
          fontFamily: font.familyMedium,
          fontSize: 11,
          marginBottom: Platform.OS === 'web' ? 6 : 2,
        },
        tabBarItemStyle: {
          paddingTop: 8,
        },
        tabBarStyle: hideTabBar
          ? { display: 'none' }
          : {
              backgroundColor: color.white,
              borderTopColor: color.greyLight,
              height: Platform.OS === 'web' ? 72 : 56,
              paddingBottom: Platform.OS === 'web' ? 8 : 4,
            },
      }}
    >
      <Tabs.Screen
        name="team"
        options={{
          title: 'Team',
          tabBarIcon: ({ color: tint }) => (
            <TabIcon name="team" color={tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color: tint }) => (
            <TabIcon name="chats" color={tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Templates',
          tabBarIcon: ({ color: tint }) => (
            <TabIcon name="templates" color={tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarIcon: ({ color: tint }) => (
            <TabIcon name="you" color={tint} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
});
