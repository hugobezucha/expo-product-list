import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { describeApiError, type ApiError } from '../../../api/ApiError';
import { useTheme } from '../../../brands/BrandProvider';
import { Button } from '../../../components/Button';
import type { BrandTheme } from '../../../brands/types';
import { useThemedStyles } from '../../../theme/useThemedStyles';

export function LoadingView() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>Načítám produkty...</Text>
    </View>
  );
}

interface ErrorViewProps {
  error: ApiError;
  onRetry: () => void;
}

export function ErrorView({ error, onRetry }: ErrorViewProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Produkty se nepodařilo načíst</Text>
      <Text style={styles.muted}>{describeApiError(error)}</Text>
      <Button title="Zkusit znovu" onPress={onRetry} style={styles.action} />
    </View>
  );
}

export function EmptyView() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Žádné produkty</Text>
      <Text style={styles.muted}>Katalog je zatím prázdný.</Text>
    </View>
  );
}

const makeStyles = ({ colors }: BrandTheme) =>
  StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
    title: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' },
    muted: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
    action: { marginTop: 12 },
  });
