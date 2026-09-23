import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BrandTheme } from '../brands/types';
import { useThemedStyles } from '../theme/useThemedStyles';

interface InlineNoticeProps {
  message: string;
  onDismiss: () => void;
}

export function InlineNotice({ message, onDismiss }: InlineNoticeProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onDismiss}>
        <Text style={styles.dismiss}>Zavřít</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = ({ colors, radius }: BrandTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: radius,
      borderWidth: 1,
      borderColor: colors.danger,
      backgroundColor: colors.surface,
    },
    message: { flex: 1, fontSize: 14, color: colors.text },
    dismiss: { fontSize: 14, fontWeight: '600', color: colors.danger },
  });
