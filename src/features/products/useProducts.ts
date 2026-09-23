import { useCallback, useEffect, useMemo, useReducer } from 'react';

import { isAbortError, toApiError } from '../../api/ApiError';
import { createProductsApi } from '../../api/products/client';
import type { ProductsApi } from '../../api/products/types';
import { useBrand } from '../../brands/BrandProvider';
import { createInitialState, productsReducer, type ProductsState } from './productsReducer';

export interface UseProductsResult {
  state: ProductsState;
  retry: () => void;
  refresh: () => void;
  loadMore: () => void;
  dismissRefreshError: () => void;
}

export function useProducts(api: ProductsApi): UseProductsResult {
  const [state, dispatch] = useReducer(productsReducer, api, createInitialState);

  // new API (brand switch) = start over, done during render so no frame mixes the two brands
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (state.api !== api) {
    dispatch({ type: 'reset', api });
  }

  const { api: activeApi, request } = state;

  useEffect(() => {
    if (request === null) return;

    const controller = new AbortController();
    const { mode, page } = request;

    activeApi.fetchPage(page, { signal: controller.signal }).then(
      (result) => {
        if (controller.signal.aborted) return;
        dispatch({ type: 'succeeded', mode, page: result });
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        dispatch({ type: 'failed', mode, error: toApiError(error) });
      },
    );

    // abort on unmount and whenever the request is replaced, so a stale page can't land
    return () => controller.abort();
  }, [activeApi, request]);

  const retry = useCallback(() => dispatch({ type: 'started', mode: 'initial' }), []);
  const refresh = useCallback(() => dispatch({ type: 'started', mode: 'refresh' }), []);
  const loadMore = useCallback(() => dispatch({ type: 'started', mode: 'more' }), []);
  const dismissRefreshError = useCallback(() => dispatch({ type: 'refreshErrorDismissed' }), []);

  return { state, retry, refresh, loadMore, dismissRefreshError };
}

export function useProductsApi(): ProductsApi {
  const { brand } = useBrand();
  return useMemo(() => createProductsApi(brand.api), [brand.api]);
}
