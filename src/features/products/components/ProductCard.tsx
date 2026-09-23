import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Product } from '../../../api/products/types';
import { useBrand } from '../../../brands/BrandProvider';
import type { BrandTheme } from '../../../brands/types';
import { useThemedStyles } from '../../../theme/useThemedStyles';

// fixed height so the list can use getItemLayout
export const CARD_HEIGHT = 128;
export const CARD_GAP = 12;
const IMAGE_SIZE = CARD_HEIGHT - 24;

interface ProductCardProps {
  product: Product;
  onPress: (productId: number) => void;
}

export const ProductCard = memo(function ProductCard({ product, onPress }: ProductCardProps) {
  const { formatPrice } = useBrand();
  const styles = useThemedStyles(makeStyles);
  const handlePress = useCallback(() => onPress(product.id), [onPress, product.id]);
  const price = formatPrice(product.price);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image
        source={{ uri: product.image }}
        style={styles.image}
        contentFit="contain"
        transition={150}
        recyclingKey={String(product.id)}
      />
      <View style={styles.body}>
        <Text style={styles.category} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {product.category}
        </Text>
        <Text style={styles.title} numberOfLines={2} maxFontSizeMultiplier={1.2}>
          {product.title}
        </Text>
        <Text style={styles.price} maxFontSizeMultiplier={1.2}>
          {price}
        </Text>
      </View>
    </Pressable>
  );
});

const makeStyles = ({ colors, radius }: BrandTheme) =>
  StyleSheet.create({
    card: {
      height: CARD_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    cardPressed: { opacity: 0.8 },
    image: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: Math.max(radius - 6, 4),
      backgroundColor: colors.background,
    },
    body: { flex: 1, marginLeft: 14, justifyContent: 'center' },
    category: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    title: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.text },
    price: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: colors.primary, marginTop: 4 },
  });
