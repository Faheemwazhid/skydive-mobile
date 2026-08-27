import { Text, type TextProps, StyleSheet } from 'react-native';

import { color, font } from '@/src/theme/tokens';

type Variant = 'display' | 'title' | 'body' | 'caption';

type AppTextProps = TextProps & {
  variant?: Variant;
  tone?: 'primary' | 'muted' | 'inverse';
};

export function AppText({
  variant = 'body',
  tone = 'primary',
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[styles.base, styles[variant], styles[tone], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: font.family,
    color: color.greyDark,
  },
  display: {
    fontFamily: font.familyMedium,
    fontSize: font.size.display,
    lineHeight: 38,
  },
  title: {
    fontFamily: font.familyMedium,
    fontSize: font.size.title,
    lineHeight: 28,
  },
  body: {
    fontSize: font.size.body,
    lineHeight: 24,
  },
  caption: {
    fontSize: font.size.caption,
    lineHeight: 18,
  },
  primary: { color: color.greyDark },
  muted: { color: color.greyMedium },
  inverse: { color: color.white },
});
