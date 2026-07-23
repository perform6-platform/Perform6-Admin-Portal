import type { Device } from './devices';

export interface DeviceMonitoringMetrics {
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  temperature: string;
  uptime: string;
}

export const deviceMonitoringFilterOptions = [
  { value: 'all', label: 'All Devices' },
  { value: 'online', label: 'Online Only' },
  { value: 'offline', label: 'Offline Only' },
] as const;

export function getDeviceMonitoringMetrics(device: Device): DeviceMonitoringMetrics {
  if (device.id === '1') {
    return {
      cpuUsage: 12,
      memoryUsage: 35,
      storageUsage: 58,
      temperature: '42°C',
      uptime: '5d 12h 32m',
    };
  }

  const index = Number.parseInt(device.id, 10) || 1;

  return {
    cpuUsage: 8 + (index % 20),
    memoryUsage: 22 + (index % 40),
    storageUsage: device.storageUsed,
    temperature: `${38 + (index % 10)}°C`,
    uptime: device.uptime,
  };
}
