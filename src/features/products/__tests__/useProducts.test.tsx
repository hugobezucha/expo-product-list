import { act, renderHook } from '@testing-library/react-native';

import { ApiError } from '../../../api/ApiError';
import type { ProductsApi, ProductsPage } from '../../../api/products/types';
import { deferred, flushPromises, makeProducts, type Deferred } from '../../../test/helpers';
import { useProducts } from '../useProducts';

interface Call {
  page: number;
  signal: AbortSignal | undefined;
  result: Deferred<ProductsPage>;
}

/** A ProductsApi whose responses the test releases by hand. */
function createFakeApi(pageSize = 2) {
  const calls: Call[] = [];
  const api: ProductsApi = {
    pageSize,
    fetchPage: jest.fn((page: number, options?: { signal?: AbortSignal }) => {
      const result = deferred<ProductsPage>();
      calls.push({ page, signal: options?.signal, result });
      return result.promise;
    }),
  };
  const last = (): Call => {
    const call = calls[calls.length - 1];
    if (call === undefined) throw new Error('no call was made');
    return call;
  };
  return { api, calls, last };
}

const page = (index: number, pageSize = 2, hasMore = true): ProductsPage => ({
  page: index,
  items: makeProducts(index * pageSize + 1, (index + 1) * pageSize),
  hasMore,
});

async function settle(call: Call, value: ProductsPage) {
  await act(async () => {
    call.result.resolve(value);
    await flushPromises();
  });
}

async function fail(call: Call, error: unknown) {
  await act(async () => {
    call.result.reject(error);
    await flushPromises();
  });
}

function ids(result: { current: ReturnType<typeof useProducts> }): number[] {
  const { state } = result.current;
  return state.status === 'ready' ? state.items.map((p) => p.id) : [];
}

describe('useProducts', () => {
  it('loads the first page on mount', async () => {
    const { api, calls, last } = createFakeApi();
    const { result } = await renderHook(() => useProducts(api));

    expect(result.current.state.status).toBe('loading');
    expect(calls).toHaveLength(1);
    expect(last().page).toBe(0);

    await settle(last(), page(0));
    expect(result.current.state.status).toBe('ready');
    expect(ids(result)).toEqual([1, 2]);
  });

  it('loads the next page once per request and stops at the end', async () => {
    const { api, calls, last } = createFakeApi();
    const { result } = await renderHook(() => useProducts(api));
    await settle(last(), page(0));

    await act(() => result.current.loadMore());
    await act(() => result.current.loadMore()); // FlatList tends to fire onEndReached repeatedly
    expect(calls).toHaveLength(2);
    expect(last().page).toBe(1);

    await settle(last(), page(1, 2, false));
    expect(ids(result)).toEqual([1, 2, 3, 4]);

    await act(() => result.current.loadMore());
    expect(calls).toHaveLength(2);
  });

  it('refresh aborts a pending load-more and ignores its late result', async () => {
    const { api, calls } = createFakeApi();
    const { result } = await renderHook(() => useProducts(api));
    await settle(calls[0]!, page(0));

    await act(() => result.current.loadMore());
    const moreCall = calls[1]!;
    await act(() => result.current.refresh());
    const refreshCall = calls[2]!;

    expect(moreCall.signal?.aborted).toBe(true);
    expect(refreshCall.page).toBe(0);

    await settle(refreshCall, { page: 0, items: makeProducts(10, 11), hasMore: true });
    expect(ids(result)).toEqual([10, 11]);

    await settle(moreCall, page(1));
    expect(ids(result)).toEqual([10, 11]);
  });

  it('exposes the failure of the first load and retries on request', async () => {
    const { api, calls, last } = createFakeApi();
    const { result } = await renderHook(() => useProducts(api));

    await fail(last(), new ApiError('network', 'offline'));
    expect(result.current.state.status).toBe('error');

    await act(() => result.current.retry());
    expect(calls).toHaveLength(2);
    await settle(last(), page(0));
    expect(result.current.state.status).toBe('ready');
  });

  it('keeps the list when load more fails', async () => {
    const { api, calls, last } = createFakeApi();
    const { result } = await renderHook(() => useProducts(api));
    await settle(last(), page(0));

    await act(() => result.current.loadMore());
    await fail(last(), new ApiError('timeout', 'slow'));
    expect(result.current.state).toMatchObject({ status: 'ready', moreError: { kind: 'timeout' } });
    expect(ids(result)).toEqual([1, 2]);

    await act(() => result.current.loadMore());
    expect(calls).toHaveLength(3);
    expect(last().page).toBe(1);
  });

  it('starts over with a new api and ignores the old one', async () => {
    const first = createFakeApi();
    const second = createFakeApi(3);
    const { result, rerender } = await renderHook(
      ({ api }: { api: ProductsApi }) => useProducts(api),
      {
        initialProps: { api: first.api },
      },
    );

    await rerender({ api: second.api });

    expect(first.last().signal?.aborted).toBe(true);
    expect(second.calls).toHaveLength(1);
    expect(result.current.state.status).toBe('loading');

    await settle(first.last(), page(0));
    expect(result.current.state.status).toBe('loading');

    await settle(second.last(), page(0, 3));
    expect(ids(result)).toEqual([1, 2, 3]);
  });

  it('aborts the pending request on unmount', async () => {
    const { api, last } = createFakeApi();
    const { unmount } = await renderHook(() => useProducts(api));

    await unmount();
    expect(last().signal?.aborted).toBe(true);
  });

  it('returns the same callbacks across renders', async () => {
    const { api, last } = createFakeApi();
    const { result } = await renderHook(() => useProducts(api));
    const before = result.current;

    await settle(last(), page(0));
    expect(result.current.refresh).toBe(before.refresh);
    expect(result.current.loadMore).toBe(before.loadMore);
    expect(result.current.retry).toBe(before.retry);
  });
});
