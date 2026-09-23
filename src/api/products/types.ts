export interface ProductRating {
  rate: number;
  count: number;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: ProductRating;
}

export interface ProductsPage {
  page: number;
  items: Product[];
  hasMore: boolean;
}

export interface ProductsApi {
  pageSize: number;
  fetchPage(page: number, options?: { signal?: AbortSignal }): Promise<ProductsPage>;
}

export interface ProductsApiConfig {
  baseUrl: string;
  pageSize: number;
  timeoutMs: number;
}
