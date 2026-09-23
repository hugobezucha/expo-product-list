import { ApiError } from '../../ApiError';
import { abortError, fakeResponse, makeProducts } from '../../../test/helpers';
import { createProductsApi } from '../client';

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit | undefined]>();
const api = createProductsApi({ baseUrl: 'https://shop.example', pageSize: 6, timeoutMs: 1000 });

beforeEach(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('createProductsApi', () => {
  it('asks for everything up to the end of the page and keeps the tail', async () => {
    fetchMock.mockResolvedValueOnce(fakeResponse(makeProducts(1, 12)));

    const result = await api.fetchPage(1);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://shop.example/products?limit=12');
    expect(result.page).toBe(1);
    expect(result.items.map((p) => p.id)).toEqual([7, 8, 9, 10, 11, 12]);
    expect(result.hasMore).toBe(true);
  });

  it('reports the end when fewer items come back', async () => {
    fetchMock.mockResolvedValueOnce(fakeResponse(makeProducts(1, 20)));

    const result = await api.fetchPage(3);

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://shop.example/products?limit=24');
    expect(result.items.map((p) => p.id)).toEqual([19, 20]);
    expect(result.hasMore).toBe(false);
  });

  it('cannot tell the end when the catalogue is an exact multiple of the page size', async () => {
    fetchMock.mockResolvedValueOnce(fakeResponse(makeProducts(1, 24)));
    expect((await api.fetchPage(3)).hasMore).toBe(true);

    fetchMock.mockResolvedValueOnce(fakeResponse(makeProducts(1, 24)));
    const empty = await api.fetchPage(4);
    expect(empty.items).toEqual([]);
    expect(empty.hasMore).toBe(false);
  });

  it('passes the caller signal down to fetch', async () => {
    fetchMock.mockResolvedValueOnce(fakeResponse([]));
    const controller = new AbortController();

    await api.fetchPage(0, { signal: controller.signal });

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('classifies failures', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(api.fetchPage(0)).rejects.toMatchObject({ kind: 'network' });

    fetchMock.mockResolvedValueOnce(fakeResponse({ message: 'nope' }, 503));
    await expect(api.fetchPage(0)).rejects.toMatchObject({ kind: 'http', status: 503 });

    fetchMock.mockResolvedValueOnce(fakeResponse([{ id: 'one', title: 42 }]));
    await expect(api.fetchPage(0)).rejects.toMatchObject({ kind: 'parse' });
  });

  it('passes a cancellation through as AbortError', async () => {
    fetchMock.mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(abortError()));
        }),
    );
    const controller = new AbortController();
    const pending = api.fetchPage(0, { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('turns a request that outlives its timeout into a timeout error', async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockImplementationOnce(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(abortError()));
          }),
      );
      const pending = api.fetchPage(0);
      jest.advanceTimersByTime(1000);

      await expect(pending).rejects.toBeInstanceOf(ApiError);
      await expect(pending).rejects.toMatchObject({ kind: 'timeout' });
    } finally {
      jest.useRealTimers();
    }
  });
});
