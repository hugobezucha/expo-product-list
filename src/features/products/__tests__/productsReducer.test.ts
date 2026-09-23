import { ApiError } from '../../../api/ApiError';
import type { ProductsApi, ProductsPage } from '../../../api/products/types';
import { makeProducts } from '../../../test/helpers';
import {
  createInitialState,
  isLoadingMore,
  isRefreshing,
  productsReducer,
  type ProductsState,
} from '../productsReducer';

const api: ProductsApi = { pageSize: 2, fetchPage: jest.fn() };
const page = (index: number, hasMore = true): ProductsPage => ({
  page: index,
  items: makeProducts(index * 2 + 1, index * 2 + 2),
  hasMore,
});
const networkError = new ApiError('network', 'offline');

function readyState(): ProductsState {
  return productsReducer(createInitialState(api), {
    type: 'succeeded',
    mode: 'initial',
    page: page(0),
  });
}

describe('productsReducer', () => {
  it('starts by requesting the first page', () => {
    expect(createInitialState(api)).toEqual({
      api,
      status: 'loading',
      request: { mode: 'initial', page: 0 },
    });
  });

  it('becomes ready with the first page and no pending request', () => {
    const state = readyState();
    expect(state.status).toBe('ready');
    if (state.status !== 'ready') return;
    expect(state.items.map((p) => p.id)).toEqual([1, 2]);
    expect(state.nextPage).toBe(1);
    expect(state.request).toBeNull();
  });

  it('ignores results that do not match the pending request', () => {
    const loading = createInitialState(api);
    expect(productsReducer(loading, { type: 'succeeded', mode: 'more', page: page(1) })).toBe(
      loading,
    );
    expect(productsReducer(loading, { type: 'failed', mode: 'refresh', error: networkError })).toBe(
      loading,
    );
  });

  it('failed first load goes to error and can retry', () => {
    const failed = productsReducer(createInitialState(api), {
      type: 'failed',
      mode: 'initial',
      error: networkError,
    });
    expect(failed).toMatchObject({ status: 'error', error: networkError, request: null });

    const retried = productsReducer(failed, { type: 'started', mode: 'initial' });
    expect(retried).toMatchObject({ status: 'loading', request: { mode: 'initial', page: 0 } });
  });

  it('does not load more while busy or at the end', () => {
    const loading = createInitialState(api);
    expect(productsReducer(loading, { type: 'started', mode: 'more' })).toBe(loading);

    const lastPage = productsReducer(createInitialState(api), {
      type: 'succeeded',
      mode: 'initial',
      page: page(0, false),
    });
    expect(productsReducer(lastPage, { type: 'started', mode: 'more' })).toBe(lastPage);

    const more = productsReducer(readyState(), { type: 'started', mode: 'more' });
    expect(isLoadingMore(more)).toBe(true);
    expect(productsReducer(more, { type: 'started', mode: 'more' })).toBe(more);
  });

  it('appends the next page without duplicates', () => {
    const more = productsReducer(readyState(), { type: 'started', mode: 'more' });
    const overlapping: ProductsPage = { page: 1, items: makeProducts(2, 4), hasMore: false };
    const state = productsReducer(more, { type: 'succeeded', mode: 'more', page: overlapping });
    expect(state).toMatchObject({ status: 'ready', hasMore: false, nextPage: 2, request: null });
    if (state.status !== 'ready') return;
    expect(state.items.map((p) => p.id)).toEqual([1, 2, 3, 4]);
  });

  it('takes an empty last page as the end without touching the list', () => {
    const more = productsReducer(readyState(), { type: 'started', mode: 'more' });
    const state = productsReducer(more, {
      type: 'succeeded',
      mode: 'more',
      page: { page: 1, items: [], hasMore: false },
    });
    expect(state).toMatchObject({ status: 'ready', hasMore: false, request: null });
    if (state.status !== 'ready') return;
    expect(state.items.map((p) => p.id)).toEqual([1, 2]);
    expect(productsReducer(state, { type: 'started', mode: 'more' })).toBe(state);
  });

  it('lets a refresh supersede a pending load-more', () => {
    const more = productsReducer(readyState(), { type: 'started', mode: 'more' });
    const refreshing = productsReducer(more, { type: 'started', mode: 'refresh' });
    expect(isRefreshing(refreshing)).toBe(true);
    expect(isLoadingMore(refreshing)).toBe(false);
    // the late "more" result is no longer wanted
    expect(productsReducer(refreshing, { type: 'succeeded', mode: 'more', page: page(1) })).toBe(
      refreshing,
    );
    expect(productsReducer(refreshing, { type: 'started', mode: 'refresh' })).toBe(refreshing);
  });

  it('keeps the current list when a refresh or load-more fails', () => {
    const refreshing = productsReducer(readyState(), { type: 'started', mode: 'refresh' });
    const afterRefresh = productsReducer(refreshing, {
      type: 'failed',
      mode: 'refresh',
      error: networkError,
    });
    expect(afterRefresh).toMatchObject({
      status: 'ready',
      refreshError: networkError,
      request: null,
    });
    if (afterRefresh.status !== 'ready') return;
    expect(afterRefresh.items).toHaveLength(2);

    const dismissed = productsReducer(afterRefresh, { type: 'refreshErrorDismissed' });
    expect(dismissed).toMatchObject({ refreshError: null });

    const more = productsReducer(dismissed, { type: 'started', mode: 'more' });
    const afterMore = productsReducer(more, { type: 'failed', mode: 'more', error: networkError });
    expect(afterMore).toMatchObject({ status: 'ready', moreError: networkError, request: null });
    // retrying is allowed again
    expect(productsReducer(afterMore, { type: 'started', mode: 'more' })).toMatchObject({
      request: { mode: 'more', page: 1 },
      moreError: null,
    });
  });

  it('starts over with a new API instance', () => {
    const other: ProductsApi = { pageSize: 5, fetchPage: jest.fn() };
    expect(productsReducer(readyState(), { type: 'reset', api: other })).toEqual(
      createInitialState(other),
    );
  });
});
