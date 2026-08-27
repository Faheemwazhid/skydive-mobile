import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { needsConnect, needsLogin } from '@/src/domain/session';
import { useSession } from '@/src/session/SessionProvider';
import { color, font } from '@/src/theme/tokens';

type IoniconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { on: IoniconName; off: IoniconName }> = {
  agents: { on: 'people', off: 'people-outline' },
  chats: { on: 'chatbubble', off: 'chatbubble-outline' },
  templates: { on: 'grid', off: 'grid-outline' },
  you: { on: 'person-circle', off: 'person-circle-outline' },
};

const BAR_CONTENT_HEIGHT = 64;
const MIN_BOTTOM_PAD = 12;

function icon(name: string) {
  return function TabBarIcon({
    color: tint,
    focused,
  }: {
    color: ColorValue;
    focused: boolean;
  }) {
    const set = ICONS[name];
    return (
      <Ionicons
        name={focused ? set.on : set.off}
        size={22}
        color={tint as string}
      />
    );
  };
}

export default function TabsLayout() {
  const session = useSession();
  const insets = useSafeAreaInsets();
  const hideTabBar = needsLogin(session) || needsConnect(session);
  const bottomPad = Math.max(insets.bottom, MIN_BOTTOM_PAD);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.greyDark,
        tabBarInactiveTintColor: color.greyMedium,
        tabBarLabelStyle: {
          fontFamily: font.familyMedium,
          fontSize: 11,
          lineHeight: 14,
          marginTop: 4,
          marginBottom: 0,
        },
        tabBarIconStyle: { height: 24, marginTop: 0 },
        tabBarItemStyle: { paddingTop: 10, paddingBottom: 0 },
        tabBarStyle: {
          display: hideTabBar ? 'none' : 'flex',
          backgroundColor: color.white,
          borderTopColor: color.greyLight,
          borderTopWidth: 1,
          height: BAR_CONTENT_HEIGHT + bottomPad,
          paddingBottom: bottomPad,
        },
      }}
    >
      <Tabs.Screen
        name="agents"
        options={{ title: 'Agents', tabBarIcon: icon('agents') }}
      />
      <Tabs.Screen
        name="chats"
        options={{ title: 'Chats', tabBarIcon: icon('chats') }}
      />
      <Tabs.Screen
        name="templates"
        options={{ title: 'Templates', tabBarIcon: icon('templates') }}
      />
      <Tabs.Screen
        name="you"
        options={{ title: 'You', tabBarIcon: icon('you') }}
      />
    </Tabs>
  );
}
