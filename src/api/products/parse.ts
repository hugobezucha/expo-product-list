import type { Product, ProductRating } from './types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new TypeError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseRating(value: unknown): ProductRating {
  assert(isRecord(value), 'rating must be an object');
  assert(isFiniteNumber(value.rate), 'rating.rate must be a number');
  assert(isFiniteNumber(value.count), 'rating.count must be a number');
  return { rate: value.rate, count: value.count };
}

export function parseProduct(value: unknown): Product {
  assert(isRecord(value), 'product must be an object');
  const { id, title, price, description, category, image, rating } = value;
  assert(isFiniteNumber(id), 'product.id must be a number');
  assert(typeof title === 'string', 'product.title must be a string');
  assert(isFiniteNumber(price), 'product.price must be a number');
  assert(typeof description === 'string', 'product.description must be a string');
  assert(typeof category === 'string', 'product.category must be a string');
  assert(typeof image === 'string', 'product.image must be a string');
  return { id, title, price, description, category, image, rating: parseRating(rating) };
}

export function parseProducts(value: unknown): Product[] {
  assert(Array.isArray(value), 'expected an array of products');
  return value.map(parseProduct);
}
