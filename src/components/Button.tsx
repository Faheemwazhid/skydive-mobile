import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/src/components/AppText';
import { color, radius, space } from '@/src/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  style?: ViewStyle;
};

export function Button({
  label,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      {...rest}
    >
      <AppText
        variant="body"
        tone={variant === 'primary' ? 'inverse' : 'primary'}
        style={styles.label}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: color.greyDark,
  },
  secondary: {
    backgroundColor: color.white,
    borderWidth: 1,
    borderColor: color.greyLight,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: 'Inter-Medium',
  },
});
