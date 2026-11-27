/** API rejects limit above 100. The catalog walks every page instead of raising that cap. */
export const MEDIA_CATALOG_PAGE_SIZE = 100;

/** Stops a stuck hasNextPage from requesting forever. 50 pages is 5,000 assets. */
export const MEDIA_CATALOG_MAX_PAGES = 50;

/**
 * Load every /media page in order and merge by asset id.
 * fetchPage receives the 1-based page number.
 */
export async function loadMediaCatalogPages(fetchPage) {
  const first = normalizePage(await fetchPage(1));
  const pages = [first];
  let hasNext = Boolean(first.meta?.hasNextPage);
  let page = 1;

  while (hasNext && page < MEDIA_CATALOG_MAX_PAGES) {
    page += 1;
    const next = normalizePage(await fetchPage(page));
    pages.push(next);
    if (next.items.length === 0) break;
    hasNext = Boolean(next.meta?.hasNextPage);
  }

  return mergeMediaCatalogPages(pages);
}

export function mergeMediaCatalogPages(pages) {
  const items = [];
  const seen = new Set();

  for (const page of pages) {
    for (const asset of page?.items ?? []) {
      if (!asset?.id || seen.has(asset.id)) continue;
      seen.add(asset.id);
      items.push(asset);
    }
  }

  const firstMeta = pages[0]?.meta;
  return {
    items,
    meta: {
      page: 1,
      limit: items.length,
      total: firstMeta?.total ?? items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

function normalizePage(page) {
  return {
    items: Array.isArray(page?.items) ? page.items : [],
    meta: page?.meta,
  };
}
