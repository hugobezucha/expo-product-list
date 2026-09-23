import { Image } from 'expo-image';
import { Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Product } from '../../../api/products/types';
import { useBrand } from '../../../brands/BrandProvider';
import { Button } from '../../../components/Button';
import type { BrandTheme } from '../../../brands/types';
import { useThemedStyles } from '../../../theme/useThemedStyles';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { formatPrice } = useBrand();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'ios' ? 16 : insets.top + 16;

  return (
    <Modal
      visible={product !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {product !== null && (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset }]}>
            <Image source={{ uri: product.image }} style={styles.image} contentFit="contain" />
            <Text style={styles.category}>{product.category}</Text>
            <Text style={styles.title}>{product.title}</Text>
            <View style={styles.row}>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              <Text style={styles.rating}>
                {`★ ${product.rating.rate.toFixed(1)} (${product.rating.count})`}
              </Text>
            </View>
            <Text style={styles.description}>{product.description}</Text>
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <Button title="Zavřít" variant="secondary" onPress={onClose} />
          </View>
        </View>
      )}
    </Modal>
  );
}

const makeStyles = ({ colors, radius }: BrandTheme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { padding: 20, gap: 8 },
    image: {
      width: '100%',
      height: 260,
      borderRadius: radius,
      backgroundColor: colors.background,
      marginBottom: 12,
    },
    category: {
      fontSize: 13,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    title: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.text },
    row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    price: { fontSize: 22, fontWeight: '700', color: colors.primary },
    rating: { fontSize: 14, color: colors.textMuted },
    description: { fontSize: 15, lineHeight: 22, color: colors.text, marginTop: 8 },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
