import { useEffect, useMemo, useState } from 'react';
import {
  fetchTimezonesForFacility,
  isFacilityAddressComplete,
  timezoneSelectOptions,
} from '../lib/facilityLocation';

export interface FacilityTimezoneLookupInput {
  facilityAddress: string;
  facilityCity: string;
  facilityState: string;
  facilityZip: string;
  /** When false, skip network lookup (e.g. modal closed). */
  enabled?: boolean;
  /** Existing saved zone to keep visible while editing. */
  currentTimezone?: string;
}

export interface FacilityTimezoneLookupResult {
  addressComplete: boolean;
  timezoneOptions: Array<{ value: string; label: string }>;
  suggestedZones: string[];
  isLookingUp: boolean;
  lookupError: string | null;
}

const LOOKUP_DEBOUNCE_MS = 450;

/**
 * Disable timezone until address/city/state/ZIP are filled, then fetch
 * region IANA zones for that address (not a hard-coded US list).
 */
export function useFacilityTimezoneLookup(
  input: FacilityTimezoneLookupInput,
): FacilityTimezoneLookupResult {
  const enabled = input.enabled !== false;
  const addressComplete = isFacilityAddressComplete(input);
  const [suggestedZones, setSuggestedZones] = useState<string[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const queryKey = useMemo(
    () =>
      [
        input.facilityAddress.trim(),
        input.facilityCity.trim(),
        input.facilityState.trim(),
        input.facilityZip.trim(),
      ].join('|'),
    [
      input.facilityAddress,
      input.facilityCity,
      input.facilityState,
      input.facilityZip,
    ],
  );

  useEffect(() => {
    if (!enabled || !addressComplete) {
      setSuggestedZones([]);
      setIsLookingUp(false);
      setLookupError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLookingUp(true);
      setLookupError(null);
      void fetchTimezonesForFacility({
        facilityAddress: input.facilityAddress,
        facilityCity: input.facilityCity,
        facilityState: input.facilityState,
        facilityZip: input.facilityZip,
        signal: controller.signal,
      })
        .then((zones) => {
          setSuggestedZones(zones);
          if (zones.length === 0) {
            setLookupError(
              'No timezone found for this address. Check city, state/province, and ZIP.',
            );
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          setSuggestedZones([]);
          setLookupError('Could not look up timezone for this address.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLookingUp(false);
        });
    }, LOOKUP_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKey captures address fields
  }, [enabled, addressComplete, queryKey]);

  const timezoneOptions = useMemo(
    () =>
      timezoneSelectOptions(
        suggestedZones,
        addressComplete ? input.currentTimezone : null,
      ),
    [suggestedZones, addressComplete, input.currentTimezone],
  );

  return {
    addressComplete,
    timezoneOptions,
    suggestedZones,
    isLookingUp,
    lookupError,
  };
}
