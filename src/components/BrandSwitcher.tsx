import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useBrand } from '../brands/BrandProvider';
import { BRANDS } from '../brands/registry';
import { BRAND_IDS } from '../brands/types';
import type { BrandTheme } from '../brands/types';
import { useThemedStyles } from '../theme/useThemedStyles';

export function BrandSwitcher() {
  const { brand, setBrandId } = useBrand();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      {BRAND_IDS.map((id) => {
        const selected = id === brand.id;
        return (
          <Pressable
            key={id}
            onPress={() => setBrandId(id)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{BRANDS[id].name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = ({ colors, radius }: BrandTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: radius,
      padding: 3,
    },
    option: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: Math.max(radius - 3, 2),
    },
    optionSelected: { backgroundColor: colors.primary },
    label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
    labelSelected: { color: colors.onPrimary },
  });
