import { request } from '../http';
import { parseProducts } from './parse';
import type { ProductsApi, ProductsApiConfig, ProductsPage } from './types';

// Fake Store only supports `limit`, `offset`/`page` are ignored. Paging is emulated by asking
// for everything up to the end of the page and slicing. Still one request per page; with a
// real paginated API only this function changes.
export function createProductsApi(config: ProductsApiConfig): ProductsApi {
  const { baseUrl, pageSize, timeoutMs } = config;

  return {
    pageSize,
    async fetchPage(page, options = {}): Promise<ProductsPage> {
      const limit = (page + 1) * pageSize;
      const all = await request(`${baseUrl}/products?limit=${limit}`, {
        signal: options.signal,
        timeoutMs,
        parse: parseProducts,
      });
      return {
        page,
        items: all.slice(page * pageSize, limit),
        hasMore: all.length === limit,
      };
    },
  };
}
