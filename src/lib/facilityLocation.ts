/** Display + timezone helpers for facility address (not GeoIP). */

export interface FacilityAddressParts {
  facilityAddress?: string | null;
  facilityCity?: string | null;
  facilityState?: string | null;
  facilityZip?: string | null;
  siteAddress?: string | null;
  geoLocation?: string | null;
}

/** Prefer City, ST ZIP → siteAddress → GeoIP → —. */
export function formatFacilityLocation(parts: FacilityAddressParts): string {
  const city = parts.facilityCity?.trim() ?? '';
  const state = parts.facilityState?.trim().toUpperCase() ?? '';
  const zip = parts.facilityZip?.trim() ?? '';
  if (city || state || zip) {
    const cityState = [city, state].filter(Boolean).join(', ');
    return [cityState, zip].filter(Boolean).join(' ').trim();
  }
  const site = parts.siteAddress?.trim();
  if (site) return site;
  const geo = parts.geoLocation?.trim();
  if (geo) return geo;
  return '—';
}

/** Compose a single address line for offline-alert emails / legacy siteAddress. */
export function composeSiteAddress(parts: {
  facilityAddress?: string | null;
  facilityCity?: string | null;
  facilityState?: string | null;
  facilityZip?: string | null;
}): string | null {
  const street = parts.facilityAddress?.trim() ?? '';
  const city = parts.facilityCity?.trim() ?? '';
  const state = parts.facilityState?.trim().toUpperCase() ?? '';
  const zip = parts.facilityZip?.trim() ?? '';
  const cityStateZip = [city, [state, zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const line = [street, cityStateZip].filter(Boolean).join(', ');
  return line || null;
}

/** True when street, city, state, and ZIP are all present. */
export function isFacilityAddressComplete(input: {
  facilityAddress?: string | null;
  facilityCity?: string | null;
  facilityState?: string | null;
  facilityZip?: string | null;
}): boolean {
  return (
    Boolean(input.facilityAddress?.trim()) &&
    Boolean(input.facilityCity?.trim()) &&
    Boolean(input.facilityState?.trim()) &&
    Boolean(input.facilityZip?.trim())
  );
}

/** US state → candidate IANA zones (instant local hint while lookup runs). */
const STATE_TIMEZONES: Record<string, string[]> = {
  AL: ['America/Chicago'],
  AK: ['America/Anchorage', 'America/Adak'],
  AZ: ['America/Phoenix'],
  AR: ['America/Chicago'],
  CA: ['America/Los_Angeles'],
  CO: ['America/Denver'],
  CT: ['America/New_York'],
  DE: ['America/New_York'],
  FL: ['America/New_York', 'America/Chicago'],
  GA: ['America/New_York'],
  HI: ['Pacific/Honolulu'],
  ID: ['America/Boise', 'America/Los_Angeles'],
  IL: ['America/Chicago'],
  IN: ['America/Indiana/Indianapolis', 'America/Chicago'],
  IA: ['America/Chicago'],
  KS: ['America/Chicago', 'America/Denver'],
  KY: ['America/New_York', 'America/Chicago'],
  LA: ['America/Chicago'],
  ME: ['America/New_York'],
  MD: ['America/New_York'],
  MA: ['America/New_York'],
  MI: ['America/Detroit', 'America/Chicago'],
  MN: ['America/Chicago'],
  MS: ['America/Chicago'],
  MO: ['America/Chicago'],
  MT: ['America/Denver'],
  NE: ['America/Chicago', 'America/Denver'],
  NV: ['America/Los_Angeles', 'America/Denver'],
  NH: ['America/New_York'],
  NJ: ['America/New_York'],
  NM: ['America/Denver'],
  NY: ['America/New_York'],
  NC: ['America/New_York'],
  ND: ['America/Chicago', 'America/Denver'],
  OH: ['America/New_York'],
  OK: ['America/Chicago'],
  OR: ['America/Los_Angeles', 'America/Denver'],
  PA: ['America/New_York'],
  RI: ['America/New_York'],
  SC: ['America/New_York'],
  SD: ['America/Chicago', 'America/Denver'],
  TN: ['America/Chicago', 'America/New_York'],
  TX: ['America/Chicago', 'America/Denver'],
  UT: ['America/Denver'],
  VT: ['America/New_York'],
  VA: ['America/New_York'],
  WA: ['America/Los_Angeles'],
  WV: ['America/New_York'],
  WI: ['America/Chicago'],
  WY: ['America/Denver'],
  DC: ['America/New_York'],
};

/** Instant local suggestion from a known US state code only — never a US default list. */
export function suggestTimezonesForFacility(input: {
  facilityState?: string | null;
  facilityZip?: string | null;
}): string[] {
  const state = (input.facilityState ?? '').trim().toUpperCase();
  const fromState = state ? STATE_TIMEZONES[state] : undefined;
  return fromState?.length ? [...fromState] : [];
}

type OpenMeteoSearchResult = {
  timezone?: string;
  name?: string;
  admin1?: string;
  country?: string;
  population?: number;
};

type OpenMeteoSearchResponse = {
  results?: OpenMeteoSearchResult[];
};

function buildGeocodeQuery(input: {
  facilityAddress?: string | null;
  facilityCity?: string | null;
  facilityState?: string | null;
  facilityZip?: string | null;
}): string {
  const city = input.facilityCity?.trim() ?? '';
  const state = input.facilityState?.trim() ?? '';
  const zip = input.facilityZip?.trim() ?? '';
  const street = input.facilityAddress?.trim() ?? '';
  // City + region + postal is enough for Open-Meteo; street adds noise for small towns.
  const primary = [city, state, zip].filter(Boolean).join(', ');
  if (primary) return primary;
  return street;
}

function uniqueZones(zones: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const zone of zones) {
    const value = zone.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    ordered.push(value);
  }
  return ordered;
}

/**
 * Resolve IANA zones for a completed facility address via Open-Meteo geocoding.
 * Falls back to US state map when the network lookup finds nothing.
 */
export async function fetchTimezonesForFacility(input: {
  facilityAddress?: string | null;
  facilityCity?: string | null;
  facilityState?: string | null;
  facilityZip?: string | null;
  signal?: AbortSignal;
}): Promise<string[]> {
  const query = buildGeocodeQuery(input);
  if (!query) return [];

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: input.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return suggestTimezonesForFacility(input);
    }
    const data = (await response.json()) as OpenMeteoSearchResponse;
    const results = Array.isArray(data.results) ? data.results : [];
    // Prefer higher-population matches first so "Kasur" beats obscure villages.
    const sorted = [...results].sort(
      (a, b) => (b.population ?? 0) - (a.population ?? 0),
    );
    const fromApi = uniqueZones(
      sorted.map((row) => row.timezone ?? '').filter(Boolean),
    );
    if (fromApi.length > 0) return fromApi;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    // Network failure → local US hint only when applicable.
  }

  return suggestTimezonesForFacility(input);
}

/** Build dropdown options from looked-up zones; optionally keep a saved value visible. */
export function timezoneSelectOptions(
  preferred: string[],
  preserveValue?: string | null,
): Array<{ value: string; label: string }> {
  const ordered = uniqueZones([
    ...preferred,
    ...(preserveValue?.trim() ? [preserveValue.trim()] : []),
  ]);
  return ordered.map((value) => ({ value, label: value }));
}

export function titleCaseEnumLabel(value: string | null | undefined): string {
  if (!value?.trim()) return '—';
  return value
    .trim()
    .toLowerCase()
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
