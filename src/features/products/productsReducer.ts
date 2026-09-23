import type { ApiError } from '../../api/ApiError';
import type { Product, ProductsApi, ProductsPage } from '../../api/products/types';

export type LoadMode = 'initial' | 'refresh' | 'more';

export interface PendingRequest {
  mode: LoadMode;
  page: number;
}

interface StateBase {
  api: ProductsApi;
}

// `request` is the only thing in flight; loading flags are derived from it, not stored
export type ProductsState = StateBase &
  (
    | { status: 'loading'; request: PendingRequest }
    | { status: 'error'; request: null; error: ApiError }
    | {
        status: 'ready';
        request: PendingRequest | null;
        items: Product[];
        nextPage: number;
        hasMore: boolean;
        refreshError: ApiError | null;
        moreError: ApiError | null;
      }
  );

export type ProductsAction =
  | { type: 'reset'; api: ProductsApi }
  | { type: 'started'; mode: LoadMode }
  | { type: 'succeeded'; mode: LoadMode; page: ProductsPage }
  | { type: 'failed'; mode: LoadMode; error: ApiError }
  | { type: 'refreshErrorDismissed' };

export function createInitialState(api: ProductsApi): ProductsState {
  return { api, status: 'loading', request: { mode: 'initial', page: 0 } };
}

export function productsReducer(state: ProductsState, action: ProductsAction): ProductsState {
  switch (action.type) {
    case 'reset':
      return createInitialState(action.api);

    case 'started':
      return start(state, action.mode);

    case 'succeeded': {
      if (state.request?.mode !== action.mode) return state;
      const { page } = action;
      if (action.mode === 'more') {
        if (state.status !== 'ready') return state;
        return {
          ...state,
          request: null,
          items: mergeById(state.items, page.items),
          nextPage: page.page + 1,
          hasMore: page.hasMore,
          moreError: null,
        };
      }
      return {
        api: state.api,
        status: 'ready',
        request: null,
        items: page.items,
        nextPage: page.page + 1,
        hasMore: page.hasMore,
        refreshError: null,
        moreError: null,
      };
    }

    case 'failed': {
      if (state.request?.mode !== action.mode) return state;
      switch (action.mode) {
        case 'initial':
          return { api: state.api, status: 'error', request: null, error: action.error };
        case 'refresh':
          return state.status === 'ready'
            ? { ...state, request: null, refreshError: action.error }
            : state;
        case 'more':
          return state.status === 'ready'
            ? { ...state, request: null, moreError: action.error }
            : state;
      }
    }

    case 'refreshErrorDismissed':
      return state.status === 'ready' && state.refreshError !== null
        ? { ...state, refreshError: null }
        : state;
  }
}

function start(state: ProductsState, mode: LoadMode): ProductsState {
  switch (mode) {
    case 'initial':
      return state.status === 'error' ? createInitialState(state.api) : state;

    case 'refresh':
      if (state.status !== 'ready' || state.request?.mode === 'refresh') return state;
      // replaces a pending load-more, the effect aborts it
      return {
        ...state,
        request: { mode: 'refresh', page: 0 },
        refreshError: null,
        moreError: null,
      };

    case 'more':
      // onEndReached fires repeatedly, this is the guard
      if (state.status !== 'ready' || state.request !== null || !state.hasMore) return state;
      return { ...state, request: { mode: 'more', page: state.nextPage }, moreError: null };
  }
}

function mergeById(existing: Product[], incoming: Product[]): Product[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((product) => product.id));
  const fresh = incoming.filter((product) => !seen.has(product.id));
  return fresh.length === 0 ? existing : [...existing, ...fresh];
}

export function isRefreshing(state: ProductsState): boolean {
  return state.status === 'ready' && state.request?.mode === 'refresh';
}

export function isLoadingMore(state: ProductsState): boolean {
  return state.status === 'ready' && state.request?.mode === 'more';
}
