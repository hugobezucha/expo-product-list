import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import type { BrandTheme } from '../brands/types';
import { useThemedStyles } from '../theme/useThemedStyles';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = 'primary', style }: ButtonProps) {
  const styles = useThemedStyles(makeStyles);
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelSecondary]}>
        {title}
      </Text>
    </Pressable>
  );
}

const makeStyles = ({ colors, radius }: BrandTheme) =>
  StyleSheet.create({
    base: {
      minHeight: 44,
      paddingHorizontal: 20,
      borderRadius: radius,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    pressed: { opacity: 0.7 },
    label: { fontSize: 16, fontWeight: '600' },
    labelPrimary: { color: colors.onPrimary },
    labelSecondary: { color: colors.text },
  });
