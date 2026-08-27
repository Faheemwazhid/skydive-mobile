import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { color, font, space } from '@/src/theme/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: true }} />
      <View style={styles.root}>
        <Text style={styles.body}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  body: {
    fontFamily: font.family,
    fontSize: font.size.body,
    color: color.greyDark,
  },
  link: { marginTop: space.md },
  linkText: {
    fontFamily: font.familyMedium,
    fontSize: font.size.body,
    color: color.accentBlue,
  },
});
