import type { Product } from '../api/products/types';

export interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
}

export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function abortError(): Error {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

export function fakeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : `Status ${status}`,
    json: async () => body,
  } as unknown as Response;
}

export function makeProduct(id: number, overrides: Partial<Product> = {}): Product {
  return {
    id,
    title: `Product ${id}`,
    price: id * 10,
    description: `Description of product ${id}`,
    category: 'category',
    image: `https://example.com/${id}.png`,
    rating: { rate: 4, count: 10 },
    ...overrides,
  };
}

export function makeProducts(from: number, to: number): Product[] {
  const products: Product[] = [];
  for (let id = from; id <= to; id += 1) products.push(makeProduct(id));
  return products;
}

export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
