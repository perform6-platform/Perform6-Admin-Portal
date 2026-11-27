export const MEDIA_CATALOG_PAGE_SIZE: number;
export const MEDIA_CATALOG_MAX_PAGES: number;

export interface MediaCatalogPage<T> {
  items: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export function loadMediaCatalogPages<T extends { id: string }>(
  fetchPage: (page: number) => Promise<MediaCatalogPage<T>>,
): Promise<MediaCatalogPage<T>>;

export function mergeMediaCatalogPages<T extends { id: string }>(
  pages: Array<MediaCatalogPage<T> | null | undefined>,
): MediaCatalogPage<T>;
