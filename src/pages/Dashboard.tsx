import { Monitor, Wifi, WifiOff } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DonutChart } from '../components/dashboard/Charts';
import { quickActions } from '../constants/navigation';
import { useFleetStatus } from '../hooks/useMonitoring';
import { cn } from '../lib/cn';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MetricCard,
  PageShell,
  QuickActionButton,
  SectionLabel,
  StatusDot,
} from '../components/ui';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: fleetStatus } = useFleetStatus();

  const summary = fleetStatus?.summary;
  const total = summary?.total ?? 0;
  const active = summary?.active ?? 0;
  const offline = summary?.offline ?? 0;
  const pending = summary?.pending ?? 0;
  const onlinePct = total > 0 ? Math.round((active / total) * 100) : 0;
  const offlinePct = total > 0 ? Math.round((offline / total) * 100) : 0;

  const deviceStatusSegments = useMemo(
    () => [
      { label: 'Online', value: active, color: '#28C76F' },
      { label: 'Offline', value: offline, color: '#FF9F43' },
      { label: 'Pending', value: pending, color: '#1155CC' },
    ],
    [active, offline, pending],
  );

  const recentActivity = useMemo(() => {
    const devices = fleetStatus?.devices ?? [];
    return devices.slice(0, 5).map((device) => ({
      device: device.deviceName || device.serialNumber,
      action: device.activationStatus === 'ACTIVE' ? 'Device Online' : 'Device Offline',
      time: device.lastSeenAt
        ? new Date(device.lastSeenAt).toLocaleString()
        : '—',
      status:
        device.activationStatus === 'ACTIVE'
          ? ('success' as const)
          : ('warning' as const),
    }));
  }, [fleetStatus]);

  function handleQuickAction(label: string) {
    if (label === 'Upload New Content') {
      navigate('/content-library', { state: { openUpload: true } });
      return;
    }
    if (label === 'Create New Schedule') {
      navigate('/rotation');
      return;
    }
    if (label === 'Deploy to Devices') {
      navigate('/deployments');
    }
  }

  return (
    <PageShell title="Dashboard">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total Devices"
          value={String(total)}
          subtext="All BrightSign devices"
          icon={<Monitor className="h-5 w-5" />}
        />
        <MetricCard
          label="Online Devices"
          value={String(active)}
          subtext={`${onlinePct}% online`}
          accent="success"
          icon={<Wifi className="h-5 w-5" />}
        />
        <MetricCard
          label="Offline Devices"
          value={String(offline)}
          subtext={`${offlinePct}% offline`}
          accent="warning"
          icon={<WifiOff className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Device Status</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart segments={deviceStatusSegments} />
            </CardContent>
          </Card>

          <section>
            <SectionLabel className="mb-3 block">Quick Actions</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickActions.map(({ label, icon: Icon }) => (
                <QuickActionButton
                  key={label}
                  label={label}
                  icon={<Icon className="h-4 w-4" />}
                  onClick={() => handleQuickAction(label)}
                />
              ))}
            </div>
          </section>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="py-6 text-center text-body-sm text-content-muted">No recent activity</p>
            ) : (
              <ul className="activity-scroll max-h-[min(70vh,480px)] overflow-y-auto overscroll-contain pr-1">
                {recentActivity.map((item, index) => (
                  <li
                    key={`${item.device}-${item.time}`}
                    className={cn(
                      'flex items-center gap-3 py-3',
                      index < recentActivity.length - 1 && 'border-b border-surface-border',
                    )}
                  >
                    <StatusDot variant={item.status} />
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-medium text-content-primary">{item.device}</p>
                      <p className="text-caption text-content-secondary">{item.action}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-caption text-content-muted sm:text-caption">
                      {item.time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
