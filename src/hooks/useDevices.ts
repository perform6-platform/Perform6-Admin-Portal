import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import {
  attachDevice,
  claimPairingRequest,
  disableDevice,
  disconnectDevice,
  getClaimedPairings,
  getDeviceById,
  getDevices,
  getPairingById,
  getPairingHistory,
  getPendingPairings,
  pairDeviceRequest,
  queueDeviceRemoteCommand,
} from '../services/devices.api';
import type {
  ClaimPairingPayload,
  DeviceInventoryQuery,
  PairDevicePayload,
} from '../types/devices';
import type { QueueDeviceRemoteCommandPayload } from '../types/monitoring';

function invalidateDeviceQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['devices'] });
  void queryClient.invalidateQueries({ queryKey: ['deployments'] });
}

/** GET /devices?state=&hardwareProfile=&search=&page=&limit= */
export function useDevices(query: DeviceInventoryQuery = {}) {
  return useQuery({
    queryKey: queryKeys.devices.inventory(query),
    queryFn: () => getDevices(query),
  });
}

/** Convenience: all devices (fleet). */
export function useFleetOverview(params: Omit<DeviceInventoryQuery, 'state'> = {}) {
  return useDevices({ state: 'all', limit: 100, ...params });
}

export function useClaimedDevices(
  params: Omit<DeviceInventoryQuery, 'state'> = {},
) {
  return useDevices({ state: 'claimed', limit: 100, ...params });
}

export function usePendingDevices(
  params: Omit<DeviceInventoryQuery, 'state'> = {},
) {
  return useDevices({ state: 'pending', limit: 100, ...params });
}

export function useRegisteredDevices(
  params: Omit<DeviceInventoryQuery, 'state'> = {},
) {
  return useDevices({ state: 'registered', limit: 100, ...params });
}

export function useDevice(id: string | null) {
  return useQuery({
    queryKey: queryKeys.devices.detail(id ?? ''),
    queryFn: () => getDeviceById(id as string),
    enabled: Boolean(id),
  });
}

export function usePendingPairings() {
  return useQuery({
    queryKey: queryKeys.devices.pairingsPending,
    queryFn: getPendingPairings,
  });
}

export function useClaimedPairings() {
  return useQuery({
    queryKey: queryKeys.devices.pairingsClaimed,
    queryFn: getClaimedPairings,
  });
}

export function usePairingHistory() {
  return useQuery({
    queryKey: queryKeys.devices.pairingsHistory,
    queryFn: getPairingHistory,
  });
}

export function usePairing(id: string | null) {
  return useQuery({
    queryKey: queryKeys.devices.pairing(id ?? ''),
    queryFn: () => getPairingById(id as string),
    enabled: Boolean(id),
  });
}

export function usePairDevice() {
  return useMutation({
    mutationFn: (payload: PairDevicePayload) => pairDeviceRequest(payload),
  });
}

export function useClaimPairing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClaimPairingPayload) => claimPairingRequest(payload),
    onSuccess: () => {
      invalidateDeviceQueries(queryClient);
    },
  });
}

export function useDisconnectDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => disconnectDevice(deviceId),
    onSuccess: () => invalidateDeviceQueries(queryClient),
  });
}

export function useDisableDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => disableDevice(deviceId),
    onSuccess: () => invalidateDeviceQueries(queryClient),
  });
}

export function useAttachDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { deviceId: string; deploymentId: string }) =>
      attachDevice(vars.deviceId, vars.deploymentId),
    onSuccess: () => invalidateDeviceQueries(queryClient),
  });
}

export function useQueueDeviceRemoteCommand() {
  return useMutation({
    mutationFn: (vars: { deviceId: string; payload: QueueDeviceRemoteCommandPayload }) =>
      queueDeviceRemoteCommand(vars.deviceId, vars.payload),
  });
}
