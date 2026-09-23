import { useCallback, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../brands/BrandProvider';
import { Button } from '../../components/Button';
import UserProfile, { type User } from '../../refactoring/refactored';
import type { BrandTheme } from '../../brands/types';
import { useThemedStyles } from '../../theme/useThemedStyles';

interface UserProfileDemoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function UserProfileDemoModal({ visible, onClose }: UserProfileDemoModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [userId, setUserId] = useState(1);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const onUserFetched = useCallback((user: User) => {
    setLastFetched(`#${user.id} ${user.firstName} ${user.lastName}`);
  }, []);
  const previous = useCallback(() => setUserId((id) => Math.max(1, id - 1)), []);
  const next = useCallback(() => setUserId((id) => id + 1), []);
  const missing = useCallback(() => setUserId(9999), []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 20 }]}
      >
        <Text style={styles.title}>UserProfile po refactoringu</Text>
        <Text style={styles.hint}>
          Přepínej rychle, starší požadavky se ruší a callback dostane jen ten poslední.
        </Text>

        <View style={styles.row}>
          <Button title="‹ Předchozí" variant="secondary" onPress={previous} />
          <Text style={styles.userId}>{`userId ${userId}`}</Text>
          <Button title="Další ›" variant="secondary" onPress={next} />
        </View>
        <Button title="Neexistující uživatel (404)" variant="secondary" onPress={missing} />

        <View style={styles.card}>
          <UserProfile userId={userId} onUserFetched={onUserFetched} accentColor={colors.primary} />
        </View>

        <Text
          style={styles.callback}
        >{`Poslední onUserFetched: ${lastFetched ?? 'zatím nic'}`}</Text>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button title="Zavřít" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = ({ colors, radius }: BrandTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 20, gap: 14 },
    title: { fontSize: 20, fontWeight: '700', color: colors.text },
    hint: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    userId: { fontSize: 16, fontWeight: '600', color: colors.text },
    card: {
      borderRadius: radius,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    callback: { fontSize: 13, color: colors.textMuted },
    footer: { marginTop: 'auto' },
  });
