import { Outlet } from 'react-router-dom';
import { ContentProvider } from '../context/ContentContext';
import { DeploymentsProvider } from '../context/DeploymentsContext';
import { RotationScheduleProvider } from '../context/RotationScheduleContext';

/**
 * Data providers for authenticated routes only.
 * Keeps /login free of /media and /rotation prefetch.
 */
export default function AuthenticatedProviders() {
  return (
    <ContentProvider>
      <RotationScheduleProvider>
        <DeploymentsProvider>
          <Outlet />
        </DeploymentsProvider>
      </RotationScheduleProvider>
    </ContentProvider>
  );
}
