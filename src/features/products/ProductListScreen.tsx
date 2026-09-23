import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeApiError } from '../../api/ApiError';
import type { Product } from '../../api/products/types';
import { useBrand } from '../../brands/BrandProvider';
import { BrandSwitcher } from '../../components/BrandSwitcher';
import { InlineNotice } from '../../components/InlineNotice';
import type { BrandTheme } from '../../brands/types';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { UserProfileDemoModal } from '../user-profile/UserProfileDemoModal';
import { ListFooter } from './components/ListFooter';
import { CARD_GAP, CARD_HEIGHT, ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { EmptyView, ErrorView, LoadingView } from './components/StatusViews';
import { isLoadingMore, isRefreshing } from './productsReducer';
import { useProducts, useProductsApi } from './useProducts';

const ROW_HEIGHT = CARD_HEIGHT + CARD_GAP;

const keyExtractor = (item: Product) => String(item.id);
const getItemLayout = (_data: ArrayLike<Product> | null | undefined, index: number) => ({
  length: ROW_HEIGHT,
  offset: ROW_HEIGHT * index,
  index,
});
const Separator = () => <View style={separatorStyle.gap} />;
const separatorStyle = StyleSheet.create({ gap: { height: CARD_GAP } });

export function ProductListScreen() {
  const { brand, theme } = useBrand();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const api = useProductsApi();
  const { state, retry, refresh, loadMore, dismissRefreshError } = useProducts(api);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [demoVisible, setDemoVisible] = useState(false);

  const openProduct = useCallback((id: number) => setSelectedId(id), []);
  const closeProduct = useCallback(() => setSelectedId(null), []);
  const openDemo = useCallback(() => setDemoVisible(true), []);
  const closeDemo = useCallback(() => setDemoVisible(false), []);

  const renderItem = useCallback<ListRenderItem<Product>>(
    ({ item }) => <ProductCard product={item} onPress={openProduct} />,
    [openProduct],
  );

  const selectedProduct = useMemo(() => {
    if (state.status !== 'ready' || selectedId === null) return null;
    return state.items.find((product) => product.id === selectedId) ?? null;
  }, [state, selectedId]);

  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingBottom: insets.bottom + 24 }],
    [styles.listContent, insets.bottom],
  );

  let content: ReactNode = null;
  switch (state.status) {
    case 'loading':
      content = <LoadingView />;
      break;
    case 'error':
      content = <ErrorView error={state.error} onRetry={retry} />;
      break;
    case 'ready':
      content = (
        <FlatList
          data={state.items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={listContentStyle}
          ListEmptyComponent={EmptyView}
          ListFooterComponent={
            <ListFooter
              loadingMore={isLoadingMore(state)}
              error={state.moreError}
              hasMore={state.hasMore}
              itemCount={state.items.length}
              onRetry={loadMore}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing(state)}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      );
      break;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.brandName}>{brand.name}</Text>
          <BrandSwitcher />
        </View>
        <View style={styles.headerRow}>
          <Text
            style={styles.subtitle}
          >{`Katalog · ${brand.api.pageSize} položek na stránku`}</Text>
          <Pressable onPress={openDemo}>
            <Text style={styles.link}>Ukázka refactoringu</Text>
          </Pressable>
        </View>
      </View>
      {state.status === 'ready' && state.refreshError !== null && (
        <InlineNotice
          message={describeApiError(state.refreshError)}
          onDismiss={dismissRefreshError}
        />
      )}
      {content}
      <ProductDetailModal product={selectedProduct} onClose={closeProduct} />
      <UserProfileDemoModal visible={demoVisible} onClose={closeDemo} />
    </View>
  );
}

const makeStyles = ({ colors }: BrandTheme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    brandName: { fontSize: 22, fontWeight: '800', color: colors.primary, letterSpacing: -0.3 },
    subtitle: { fontSize: 13, color: colors.textMuted },
    link: { fontSize: 13, fontWeight: '600', color: colors.primary },
    listContent: { padding: 16 },
  });
