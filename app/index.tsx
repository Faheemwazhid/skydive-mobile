import { StyleSheet, Text, View } from 'react-native';

import { color, font, space } from '@/src/theme/tokens';

export default function ShellScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>Skydive</Text>
      <Text style={styles.body}>Mobile client shell. Tabs land in later PRs.</Text>
    </View>
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
  kicker: {
    fontFamily: font.familyMedium,
    fontSize: font.size.display,
    color: color.greyDark,
  },
  body: {
    marginTop: space.sm,
    fontFamily: font.family,
    fontSize: font.size.body,
    color: color.greyMedium,
    textAlign: 'center',
  },
});
