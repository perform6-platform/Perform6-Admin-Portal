import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MEDIA_CATALOG_MAX_PAGES,
  loadMediaCatalogPages,
  mergeMediaCatalogPages,
} from './mediaCatalog.mjs';

test('merges every page in request order and drops a repeated asset id', () => {
  const merged = mergeMediaCatalogPages([
    {
      items: [{ id: 'new' }, { id: 'mid' }],
      meta: { total: 3, page: 1, limit: 2, totalPages: 2, hasNextPage: true },
    },
    {
      items: [{ id: 'mid' }, { id: 'old' }],
      meta: { total: 3, page: 2, limit: 2, totalPages: 2, hasNextPage: false },
    },
  ]);

  assert.deepEqual(
    merged.items.map((item) => item.id),
    ['new', 'mid', 'old'],
  );
  assert.equal(merged.meta.total, 3);
  assert.equal(merged.meta.hasNextPage, false);
  assert.equal(merged.meta.totalPages, 1);
});

test('follows hasNextPage until the catalog is complete', async () => {
  const requested = [];
  const result = await loadMediaCatalogPages(async (page) => {
    requested.push(page);
    if (page === 1) {
      return {
        items: [{ id: 'a' }],
        meta: { total: 2, page: 1, limit: 1, totalPages: 2, hasNextPage: true },
      };
    }
    return {
      items: [{ id: 'b' }],
      meta: { total: 2, page: 2, limit: 1, totalPages: 2, hasNextPage: false },
    };
  });

  assert.deepEqual(requested, [1, 2]);
  assert.deepEqual(
    result.items.map((item) => item.id),
    ['a', 'b'],
  );
});

test('stops when a later page is empty', async () => {
  const requested = [];
  const result = await loadMediaCatalogPages(async (page) => {
    requested.push(page);
    if (page === 1) {
      return {
        items: [{ id: 'a' }],
        meta: { total: 1, page: 1, limit: 100, totalPages: 3, hasNextPage: true },
      };
    }
    return {
      items: [],
      meta: { total: 1, page: page, limit: 100, totalPages: 3, hasNextPage: true },
    };
  });

  assert.deepEqual(requested, [1, 2]);
  assert.deepEqual(
    result.items.map((item) => item.id),
    ['a'],
  );
});

test('a stuck hasNextPage stops at the page cap', async () => {
  let calls = 0;
  const result = await loadMediaCatalogPages(async (page) => {
    calls += 1;
    return {
      items: [{ id: `asset-${page}` }],
      meta: { total: 9999, page, limit: 1, totalPages: 9999, hasNextPage: true },
    };
  });

  assert.equal(calls, MEDIA_CATALOG_MAX_PAGES);
  assert.equal(result.items.length, MEDIA_CATALOG_MAX_PAGES);
});

test('a response without meta stays on page 1', async () => {
  const requested = [];
  const result = await loadMediaCatalogPages(async (page) => {
    requested.push(page);
    return { items: [{ id: 'only' }] };
  });

  assert.deepEqual(requested, [1]);
  assert.equal(result.items.length, 1);
  assert.equal(result.meta.total, 1);
});
