import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { describeApiError, type ApiError } from '../../../api/ApiError';
import { useTheme } from '../../../brands/BrandProvider';
import { Button } from '../../../components/Button';
import type { BrandTheme } from '../../../brands/types';
import { useThemedStyles } from '../../../theme/useThemedStyles';

interface ListFooterProps {
  loadingMore: boolean;
  error: ApiError | null;
  hasMore: boolean;
  itemCount: number;
  onRetry: () => void;
}

export function ListFooter({ loadingMore, error, hasMore, itemCount, onRetry }: ListFooterProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (loadingMore) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (error !== null) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{describeApiError(error)}</Text>
        <Button title="Načíst další" variant="secondary" onPress={onRetry} />
      </View>
    );
  }
  if (!hasMore && itemCount > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.end}>To je celá nabídka.</Text>
      </View>
    );
  }
  return null;
}

const makeStyles = ({ colors }: BrandTheme) =>
  StyleSheet.create({
    container: { paddingVertical: 20, alignItems: 'center', gap: 12 },
    error: { fontSize: 14, color: colors.danger, textAlign: 'center' },
    end: { fontSize: 13, color: colors.textMuted },
  });
