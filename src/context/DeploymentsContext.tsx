import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Deployment, DeploymentSubmitPayload } from '../constants/deployments';
import { formatDeploymentTimestamp } from '../lib/deploymentHelpers';

interface DeploymentsContextValue {
  deployments: Deployment[];
  addDeployment: (payload: DeploymentSubmitPayload) => Deployment;
}

const DeploymentsContext = createContext<DeploymentsContextValue | null>(null);

export function DeploymentsProvider({ children }: { children: ReactNode }) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);

  const addDeployment = useCallback((payload: DeploymentSubmitPayload) => {
    const startedAt = payload.startedAt || formatDeploymentTimestamp();
    const completedAt = payload.completedAt || formatDeploymentTimestamp();

    const deployment: Deployment = {
      id: `dep-${Date.now()}`,
      name: payload.name,
      targetDevices: payload.targetDevices,
      contentSchedule: payload.contentSchedule,
      status: 'completed',
      startedAt,
      completedAt,
      categoryId: payload.categoryId,
      deploymentMode: payload.deploymentMode,
      isBundleDeployment: payload.isBundleDeployment,
      usesRotation: payload.usesRotation,
      rotationDay: payload.rotationDay,
      scheduleEntries: payload.scheduleEntries,
      deviceId: payload.deviceId,
      deviceName: payload.deviceName,
      connectionStartDate: payload.connectionStartDate,
      brandingMode: payload.brandingMode ?? 'default',
      brandingLogoUrl: payload.brandingLogoUrl,
      companyName: payload.companyName,
    };

    setDeployments((current) => [deployment, ...current]);
    return deployment;
  }, []);

  const value = useMemo(
    () => ({
      deployments,
      addDeployment,
    }),
    [deployments, addDeployment],
  );

  return <DeploymentsContext.Provider value={value}>{children}</DeploymentsContext.Provider>;
}

export function useDeployments() {
  const context = useContext(DeploymentsContext);
  if (!context) {
    throw new Error('useDeployments must be used within DeploymentsProvider');
  }
  return context;
}
